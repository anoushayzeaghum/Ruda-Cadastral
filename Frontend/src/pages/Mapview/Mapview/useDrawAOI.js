import { useCallback, useEffect, useRef } from "react";
import * as turf from "@turf/turf";
import { analyseAOI } from "./aoiAnalysis.js";

const SOURCE_ID = "cadastral-drawn-aoi-source";
const FILL_ID = "cadastral-drawn-aoi-fill";
const LINE_ID = "cadastral-drawn-aoi-line";
const VERTEX_ID = "cadastral-drawn-aoi-vertices";
const SNAP_ID = "cadastral-drawn-aoi-snap";
const SNAP_TOLERANCE_PX = 14;
const COORDINATE_EPSILON = 1e-10;

const emptyCollection = () => ({ type: "FeatureCollection", features: [] });
const isPolygonGeometry = (geometry) =>
  ["Polygon", "MultiPolygon"].includes(geometry?.type);

const preventMapEventDefault = (event) => {
  event?.preventDefault?.();
  event?.originalEvent?.preventDefault?.();
  event?.originalEvent?.stopPropagation?.();
};

const getCanvasSafely = (map) => {
  try {
    return map?.getCanvas?.() || null;
  } catch {
    return null;
  }
};

const walkCoordinates = (coordinates, callback) => {
  if (!Array.isArray(coordinates)) return;

  if (
    coordinates.length >= 2 &&
    Number.isFinite(Number(coordinates[0])) &&
    Number.isFinite(Number(coordinates[1]))
  ) {
    callback([Number(coordinates[0]), Number(coordinates[1])]);
    return;
  }

  coordinates.forEach((coordinate) =>
    walkCoordinates(coordinate, callback),
  );
};

const coordinatesEqual = (a, b) =>
  Array.isArray(a) &&
  Array.isArray(b) &&
  Math.abs(Number(a[0]) - Number(b[0])) <= COORDINATE_EPSILON &&
  Math.abs(Number(a[1]) - Number(b[1])) <= COORDINATE_EPSILON;

const removeConsecutiveDuplicates = (coordinates = []) =>
  coordinates.filter(
    (coordinate, index) =>
      index === 0 || !coordinatesEqual(coordinate, coordinates[index - 1]),
  );

const ensureLayers = (map) => {
  if (!map || !map.isStyleLoaded?.()) return false;

  if (!map.getSource(SOURCE_ID)) {
    map.addSource(SOURCE_ID, {
      type: "geojson",
      data: emptyCollection(),
    });
  }

  // AOI layers are deliberately added without a beforeId. This keeps the
  // draft visible above cadastral polygons while drawing.
  if (!map.getLayer(FILL_ID)) {
    map.addLayer({
      id: FILL_ID,
      type: "fill",
      source: SOURCE_ID,
      filter: ["==", ["geometry-type"], "Polygon"],
      paint: {
        "fill-color": "#22c55e",
        "fill-opacity": 0.22,
      },
    });
  }

  if (!map.getLayer(LINE_ID)) {
    map.addLayer({
      id: LINE_ID,
      type: "line",
      source: SOURCE_ID,
      filter: [
        "in",
        ["geometry-type"],
        ["literal", ["LineString", "Polygon"]],
      ],
      paint: {
        "line-color": "#0f3d2e",
        "line-width": 3,
        "line-dasharray": [2, 1],
      },
    });
  }

  if (!map.getLayer(VERTEX_ID)) {
    map.addLayer({
      id: VERTEX_ID,
      type: "circle",
      source: SOURCE_ID,
      filter: ["==", ["get", "_vertex"], true],
      paint: {
        "circle-radius": 5,
        "circle-color": "#ffffff",
        "circle-stroke-color": "#0f3d2e",
        "circle-stroke-width": 2,
      },
    });
  }

  if (!map.getLayer(SNAP_ID)) {
    map.addLayer({
      id: SNAP_ID,
      type: "circle",
      source: SOURCE_ID,
      filter: ["==", ["get", "_snap"], true],
      paint: {
        "circle-radius": 7,
        "circle-color": "#facc15",
        "circle-stroke-color": "#111827",
        "circle-stroke-width": 2,
      },
    });
  }

  return true;
};

export default function useDrawAOI({
  mapRef,
  isMapReady,
  enabled,
  currentGeojsonRef,
  onComplete,
  onDraftChange,
  clearSignal = 0,
  finishSignal = 0,
}) {
  const coordinatesRef = useRef([]);
  const snapCoordinateRef = useRef(null);
  const completedFeatureRef = useRef(null);
  const finishRef = useRef(() => {});
  const enabledRef = useRef(enabled);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const clearDrawing = useCallback(() => {
    const map = mapRef.current;

    coordinatesRef.current = [];
    completedFeatureRef.current = null;
    snapCoordinateRef.current = null;

    try {
      map?.getSource?.(SOURCE_ID)?.setData(emptyCollection());
    } catch {
      // The map or style may have been removed/reloaded.
    }

    onDraftChange?.({ vertexCount: 0, canFinish: false });
  }, [mapRef, onDraftChange]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return undefined;

    const initialise = () => {
      try {
        ensureLayers(map);
      } catch (error) {
        console.warn("Could not initialise AOI drawing layers", error);
      }
    };

    initialise();
    map.on("style.load", initialise);

    const updateSource = (previewCoordinate = null) => {
      if (!mapRef.current) return;

      try {
        if (!ensureLayers(map)) return;

        const coordinates = coordinatesRef.current;
        const features = coordinates.map((coordinate) =>
          turf.point(coordinate, { _vertex: true }),
        );

        const lineCoordinates = previewCoordinate
          ? [...coordinates, previewCoordinate]
          : coordinates;

        if (lineCoordinates.length >= 2) {
          features.push(turf.lineString(lineCoordinates));
        }

        if (completedFeatureRef.current) {
          features.push(completedFeatureRef.current);
        }

        if (snapCoordinateRef.current) {
          features.push(
            turf.point(snapCoordinateRef.current, { _snap: true }),
          );
        }

        map.getSource(SOURCE_ID)?.setData(turf.featureCollection(features));
        onDraftChange?.({
          vertexCount: coordinates.length,
          canFinish: coordinates.length >= 3,
        });
      } catch (error) {
        console.warn("Could not update AOI drawing", error);
      }
    };

    const findSnapCoordinate = (point) => {
      if (!point) return null;

      let rendered = [];
      try {
        rendered = map.queryRenderedFeatures([
          [point.x - SNAP_TOLERANCE_PX, point.y - SNAP_TOLERANCE_PX],
          [point.x + SNAP_TOLERANCE_PX, point.y + SNAP_TOLERANCE_PX],
        ]);
      } catch {
        return null;
      }

      let best = null;
      let bestDistance = SNAP_TOLERANCE_PX + 1;

      rendered.forEach((feature) => {
        // Never snap to the AOI's own draft layers.
        if (
          [SOURCE_ID, FILL_ID, LINE_ID, VERTEX_ID, SNAP_ID].includes(
            feature?.source,
          )
        ) {
          return;
        }

        if (!isPolygonGeometry(feature.geometry)) return;

        walkCoordinates(feature.geometry.coordinates, (coordinate) => {
          const screen = map.project(coordinate);
          const distance = Math.hypot(
            screen.x - point.x,
            screen.y - point.y,
          );

          if (distance < bestDistance) {
            bestDistance = distance;
            best = coordinate;
          }
        });
      });

      return best;
    };

    const finish = () => {
      const cleanedCoordinates = removeConsecutiveDuplicates(
        coordinatesRef.current,
      );

      if (cleanedCoordinates.length < 3) return;

      const ring = [...cleanedCoordinates, cleanedCoordinates[0]];
      const polygon = turf.polygon([ring], {
        name: "Drawn AOI",
        created_at: new Date().toISOString(),
      });

      completedFeatureRef.current = polygon;
      coordinatesRef.current = [];
      snapCoordinateRef.current = null;
      updateSource();

      const current = currentGeojsonRef?.current || {};
      const analysis = analyseAOI({
        aoi: polygon,
        khasras: current.khasra || current.khasras || emptyCollection(),
        thematicLayers: {
          possessionLand:
            current.possessionLand ||
            current["possession-land"] ||
            emptyCollection(),
          awardedLand:
            current.awardedLand ||
            current["awarded-land"] ||
            emptyCollection(),
          stateLand:
            current.stateLand ||
            current["state-land"] ||
            emptyCollection(),
        },
      });

      onComplete?.({ feature: polygon, analysis });
    };

    finishRef.current = finish;

    const handleClick = (event) => {
      if (!enabledRef.current) return;

      preventMapEventDefault(event);

      const fallbackCoordinate = event?.lngLat
        ? [event.lngLat.lng, event.lngLat.lat]
        : null;
      const coordinate = snapCoordinateRef.current || fallbackCoordinate;
      if (!coordinate) return;

      const currentCoordinates = coordinatesRef.current;
      const previous = currentCoordinates[currentCoordinates.length - 1];

      // Double-click generates click events too. Avoid duplicate vertices at
      // the same location before the dblclick handler completes the polygon.
      if (previous && coordinatesEqual(previous, coordinate)) return;

      coordinatesRef.current = [...currentCoordinates, coordinate];
      updateSource();
    };

    const handleMove = (event) => {
      if (!enabledRef.current) return;

      snapCoordinateRef.current = findSnapCoordinate(event?.point);
      const preview =
        snapCoordinateRef.current ||
        (event?.lngLat ? [event.lngLat.lng, event.lngLat.lat] : null);

      updateSource(preview);
    };

    const handleDoubleClick = (event) => {
      if (!enabledRef.current) return;
      preventMapEventDefault(event);
      finish();
    };

    const handleKeyDown = (event) => {
      if (!enabledRef.current) return;

      if (event.key === "Enter") {
        event.preventDefault();
        finish();
      }

      if (event.key === "Escape") {
        event.preventDefault();
        coordinatesRef.current = [];
        snapCoordinateRef.current = null;
        updateSource();
      }
    };

    if (enabled) {
      try {
        map.doubleClickZoom.disable();
      } catch {}

      const canvas = getCanvasSafely(map);
      if (canvas) canvas.style.cursor = "crosshair";

      map.on("click", handleClick);
      map.on("mousemove", handleMove);
      map.on("dblclick", handleDoubleClick);
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      map.off("style.load", initialise);
      map.off("click", handleClick);
      map.off("mousemove", handleMove);
      map.off("dblclick", handleDoubleClick);
      window.removeEventListener("keydown", handleKeyDown);

      try {
        if (enabled) map.doubleClickZoom.enable();
      } catch {}

      const canvas = getCanvasSafely(map);
      if (canvas) canvas.style.cursor = "";
    };
  }, [
    enabled,
    isMapReady,
    mapRef,
    currentGeojsonRef,
    onComplete,
    onDraftChange,
  ]);

  useEffect(() => {
    clearDrawing();
  }, [clearSignal, clearDrawing]);

  useEffect(() => {
    if (!finishSignal) return;
    finishRef.current?.();
  }, [finishSignal]);
}

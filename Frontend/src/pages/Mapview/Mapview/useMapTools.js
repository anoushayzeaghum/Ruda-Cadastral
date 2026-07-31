import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import * as turf from "@turf/turf";

import {
  MEASURE_SOURCE,
  MEASURE_AREA_SOURCE,
  MEASURE_AREA_FILL_LAYER,
  MEASURE_AREA_LINE_LAYER,
  MEASURE_AREA_POINTS_LAYER,
  MEASURE_AREA_LABEL_LAYER,
  BEARING_SOURCE,
  BEARING_LINE_LAYER,
  BEARING_POINTS_LAYER,
  BEARING_LABEL_LAYER,
  BUFFER_SOURCE,
  BUFFER_FILL_LAYER,
  BUFFER_LINE_LAYER,
  BUFFER_CENTER_LAYER,
  emptyFeatureCollection,
  ensureMeasureLayerStyles,
  ensureMeasureAreaLayerStyles,
  ensureBearingLayerStyles,
  BUFFER_RADIUS_M,
  addBufferLayerStyles,
} from "../LayerManager/index.js";

const isToolVisible = (layers, key) => {
  const value = layers?.[key];
  return typeof value === "object" ? !!value.visible : !!value;
};

const setMapCursor = (map, cursor = "") => {
  const canvas = map?.getCanvas?.();
  if (canvas) canvas.style.cursor = cursor;
};

export default function useMapTools({
  mapRef,
  isMapReady,
  layers,
  buildPopupHtml,
  interactionLocked = false,
}) {
  const measureCoordsRef = useRef([]);
  const measureAreaCoordsRef = useRef([]);
  const bearingCoordsRef = useRef([]);
  const coordinatePopupRef = useRef(null);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return undefined;

    const measureVisible = !interactionLocked && isToolVisible(layers, "measure");

    const updateMeasureSource = () => {
      const coordinates = measureCoordsRef.current;
      const features = coordinates.map((coordinate) => turf.point(coordinate));

      if (coordinates.length > 1) {
        const line = turf.lineString(coordinates);
        features.push(line);

        const distance = turf.length(line, { units: "kilometers" });
        features.push(
          turf.point(coordinates[coordinates.length - 1], {
            distance: `${distance.toFixed(2)} km`,
          }),
        );
      }

      map
        .getSource(MEASURE_SOURCE)
        ?.setData(turf.featureCollection(features));
    };

    const handleClick = (event) => {
      measureCoordsRef.current.push([event.lngLat.lng, event.lngLat.lat]);
      updateMeasureSource();
    };

    const handleRightClick = (event) => {
      event.preventDefault();
      measureCoordsRef.current = [];
      updateMeasureSource();
    };

    if (measureVisible) {
      setMapCursor(map, "crosshair");
      ensureMeasureLayerStyles({ map, emptyGeojson: emptyFeatureCollection() });
      map.on("click", handleClick);
      map.on("contextmenu", handleRightClick);
      updateMeasureSource();
    } else {
      measureCoordsRef.current = [];
      map.getSource(MEASURE_SOURCE)?.setData(emptyFeatureCollection());
    }

    return () => {
      map.off("click", handleClick);
      map.off("contextmenu", handleRightClick);
      setMapCursor(map);
    };
  }, [layers?.measure, isMapReady, mapRef, interactionLocked]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return undefined;

    const areaVisible = !interactionLocked && isToolVisible(layers, "measureArea");

    const clearAreaLayers = () => {
      try {
        [
          MEASURE_AREA_LABEL_LAYER,
          MEASURE_AREA_FILL_LAYER,
          MEASURE_AREA_LINE_LAYER,
          MEASURE_AREA_POINTS_LAYER,
        ].forEach((layerId) => {
          if (map.getLayer(layerId)) map.removeLayer(layerId);
        });
        if (map.getSource(MEASURE_AREA_SOURCE)) {
          map.removeSource(MEASURE_AREA_SOURCE);
        }
      } catch {
        // Layer/source may already have been removed by a style change.
      }
    };

    const updateAreaSource = (closed = false) => {
      const coordinates = measureAreaCoordsRef.current;
      const features = coordinates.map((coordinate) => turf.point(coordinate));

      if (coordinates.length >= 2) {
        const lineCoordinates = closed
          ? [...coordinates, coordinates[0]]
          : coordinates;
        features.push(turf.lineString(lineCoordinates));
      }

      if (closed && coordinates.length >= 3) {
        const polygon = turf.polygon([[...coordinates, coordinates[0]]]);
        features.push(polygon);

        const areaSquareMetres = turf.area(polygon);
        const areaAcres = areaSquareMetres / 4046.8564224;
        const areaKanal = areaAcres * 8;
        const centroid = turf.centroid(polygon);
        centroid.properties = {
          areaLabel: `${areaSquareMetres.toFixed(0)} m²  |  ${areaAcres.toFixed(3)} ac  |  ${areaKanal.toFixed(2)} kanal`,
        };
        features.push(centroid);
      }

      map
        .getSource(MEASURE_AREA_SOURCE)
        ?.setData(turf.featureCollection(features));
    };

    const handleClick = (event) => {
      measureAreaCoordsRef.current.push([event.lngLat.lng, event.lngLat.lat]);
      updateAreaSource(false);
    };

    const handleRightClick = (event) => {
      event.preventDefault();
      if (measureAreaCoordsRef.current.length >= 3) {
        updateAreaSource(true);
      } else {
        measureAreaCoordsRef.current = [];
        updateAreaSource(false);
      }
    };

    if (areaVisible) {
      setMapCursor(map, "crosshair");
      ensureMeasureAreaLayerStyles({
        map,
        emptyGeojson: turf.featureCollection([]),
      });
      map.on("click", handleClick);
      map.on("contextmenu", handleRightClick);
    } else {
      measureAreaCoordsRef.current = [];
      clearAreaLayers();
    }

    return () => {
      map.off("click", handleClick);
      map.off("contextmenu", handleRightClick);
      setMapCursor(map);
    };
  }, [layers?.measureArea, isMapReady, mapRef, interactionLocked]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return undefined;

    const bearingVisible = !interactionLocked && isToolVisible(layers, "measureBearing");

    const clearBearingLayers = () => {
      try {
        [BEARING_LABEL_LAYER, BEARING_LINE_LAYER, BEARING_POINTS_LAYER].forEach(
          (layerId) => {
            if (map.getLayer(layerId)) map.removeLayer(layerId);
          },
        );
        if (map.getSource(BEARING_SOURCE)) map.removeSource(BEARING_SOURCE);
      } catch {
        // Layer/source may already have been removed by a style change.
      }
    };

    const updateBearingSource = () => {
      const coordinates = bearingCoordsRef.current;
      const features = coordinates.map((coordinate) => turf.point(coordinate));

      if (coordinates.length === 2) {
        features.push(turf.lineString(coordinates));
        const start = turf.point(coordinates[0]);
        const end = turf.point(coordinates[1]);
        const bearing = turf.bearing(start, end);
        const distance = turf.distance(start, end, { units: "meters" });
        const midpoint = turf.midpoint(start, end);
        midpoint.properties = {
          bearingLabel: `${bearing.toFixed(1)}°  ·  ${distance.toFixed(1)} m`,
        };
        features.push(midpoint);
      }

      map
        .getSource(BEARING_SOURCE)
        ?.setData(turf.featureCollection(features));
    };

    const handleClick = (event) => {
      const coordinate = [event.lngLat.lng, event.lngLat.lat];
      bearingCoordsRef.current =
        bearingCoordsRef.current.length >= 2
          ? [coordinate]
          : [...bearingCoordsRef.current, coordinate];
      updateBearingSource();
    };

    const handleRightClick = (event) => {
      event.preventDefault();
      bearingCoordsRef.current = [];
      updateBearingSource();
    };

    if (bearingVisible) {
      setMapCursor(map, "crosshair");
      ensureBearingLayerStyles({
        map,
        emptyGeojson: turf.featureCollection([]),
      });
      map.on("click", handleClick);
      map.on("contextmenu", handleRightClick);
    } else {
      bearingCoordsRef.current = [];
      clearBearingLayers();
    }

    return () => {
      map.off("click", handleClick);
      map.off("contextmenu", handleRightClick);
      setMapCursor(map);
    };
  }, [layers?.measureBearing, isMapReady, mapRef, interactionLocked]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return undefined;

    const coordinatePickerVisible = !interactionLocked && isToolVisible(layers, "coordPicker");

    const closeCoordinatePopup = () => {
      coordinatePopupRef.current?.remove();
      coordinatePopupRef.current = null;
    };

    const handleClick = (event) => {
      const { lng, lat } = event.lngLat;
      const longitude = lng.toFixed(6);
      const latitude = lat.toFixed(6);

      closeCoordinatePopup();
      navigator.clipboard
        ?.writeText(`${latitude}, ${longitude}`)
        .catch(() => {});

      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 15,
        maxWidth: "none",
        className: "mapview-unified-popup",
      })
        .setLngLat([lng, lat])
        .setHTML(
          buildPopupHtml("Coordinates", [
            ["Latitude", latitude],
            ["Longitude", longitude],
            ["Copied", "✓ Copied to clipboard"],
          ]),
        )
        .addTo(map);

      const element = popup.getElement();
      const content = element?.querySelector(".mapboxgl-popup-content");
      if (content) {
        content.style.cssText =
          "padding:0;background:transparent;box-shadow:none;border-radius:10px;";
      }
      const tip = element?.querySelector(".mapboxgl-popup-tip");
      if (tip) tip.style.borderTopColor = "#111827";
      element
        ?.querySelector("[data-mapview-popup-close]")
        ?.addEventListener("click", closeCoordinatePopup);

      coordinatePopupRef.current = popup;
      popup.on("close", () => {
        if (coordinatePopupRef.current === popup) {
          coordinatePopupRef.current = null;
        }
      });
    };

    if (coordinatePickerVisible) {
      setMapCursor(map, "crosshair");
      map.on("click", handleClick);
    } else {
      closeCoordinatePopup();
    }

    return () => {
      map.off("click", handleClick);
      closeCoordinatePopup();
      setMapCursor(map);
    };
  }, [layers?.coordPicker, isMapReady, mapRef, buildPopupHtml, interactionLocked]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return undefined;

    const bufferVisible = !interactionLocked && isToolVisible(layers, "measureBuffer");

    const clearBufferLayers = () => {
      try {
        [BUFFER_CENTER_LAYER, BUFFER_FILL_LAYER, BUFFER_LINE_LAYER].forEach(
          (layerId) => {
            if (map.getLayer(layerId)) map.removeLayer(layerId);
          },
        );
        if (map.getSource(BUFFER_SOURCE)) map.removeSource(BUFFER_SOURCE);
      } catch {
        // Layer/source may already have been removed by a style change.
      }
    };

    const handleClick = (event) => {
      const point = turf.point([event.lngLat.lng, event.lngLat.lat]);
      const buffered = turf.buffer(point, BUFFER_RADIUS_M, { units: "meters" });
      const featureCollection = turf.featureCollection([point, buffered]);

      if (!map.getSource(BUFFER_SOURCE)) {
        addBufferLayerStyles({ map, featureCollection });
      } else {
        map.getSource(BUFFER_SOURCE).setData(featureCollection);
      }
    };

    const handleRightClick = (event) => {
      event.preventDefault();
      clearBufferLayers();
    };

    if (bufferVisible) {
      setMapCursor(map, "crosshair");
      map.on("click", handleClick);
      map.on("contextmenu", handleRightClick);
    } else {
      clearBufferLayers();
    }

    return () => {
      map.off("click", handleClick);
      map.off("contextmenu", handleRightClick);
      setMapCursor(map);
    };
  }, [layers?.measureBuffer, isMapReady, mapRef, interactionLocked]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady || !isToolVisible(layers, "printMap")) return;

    try {
      const link = document.createElement("a");
      link.download = `map-export-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = map.getCanvas().toDataURL("image/png");
      link.click();
    } catch (error) {
      console.warn(
        "Map export failed — ensure preserveDrawingBuffer is true",
        error,
      );
    }
  }, [layers?.printMap, isMapReady, mapRef, interactionLocked]);
}

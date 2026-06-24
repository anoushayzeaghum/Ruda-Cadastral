import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import * as turf from "@turf/turf";

import Header from "./Header";
import MapControls from "./MapControls";

import {
  getDistrictBoundary,
  getTehsilBoundary,
  getMauzaBoundary,
  getKhasras,
  getMurabbas,
  getSquares,
  getAcres,
  getFieldPoints,
  getRudaGeoJSON,
  getRudaProposedRoadsGeoJSON,
  getGeodeticNetworkGeoJSON,
  getTrijunctionPoints,
} from "../../services/api";

import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  KHASRA_SOURCE,
  KHASRA_FILL,
  KHASRA_LINE,
  KHASRA_LABEL,
  MURABBA_SOURCE,
  MURABBA_FILL,
  MURABBA_LINE,
  MURABBA_LABEL,
  SQUARE_LEVEL,
  ACRE_LEVEL,
  SELECTED_SOURCE,
  SELECTED_CORNER_LAYER,
  SELECTED_CORNER_BOX_LAYER,
  SELECTED_CORNER_TEXT_LAYER,
  CONTROL_POINTS_SOURCE,
  CONTROL_POINTS_LAYER,
  TRI_JUNCTION_POINTS_SOURCE,
  TRI_JUNCTION_POINTS_LAYER,
  TRI_JUNCTION_POINTS_LABEL,
  TRI_JUNCTION_BURJI_LAYER,
  TRI_JUNCTION_BURJI_LABEL,
  FIELD_POINTS_SOURCE,
  FIELD_POINTS_LAYER,
  FIELD_POINTS_LABEL,
  GEODETIC_NETWORK_SOURCE,
  GEODETIC_NETWORK_LAYER,
  GEODETIC_NETWORK_LABEL,
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
  VECTOR_LAYER_THEME,
  clampOpacity,
  getPointLabelLayerId,
  VECTOR_LABEL_FIELDS,
  prepareRudaGeojsonForDisplay,
  normalizeRoadLayerName,
  emptyFeatureCollection,
  mergeFeatureCollections,
  computeArea,
  BASEMAP_STYLES,
  getKhasraNumber,
  getMurabbaNumber,
  getLayerVisible,
  getLayerOpacity,
  getLayerForceLoad,
  boundaryLevelToLayerKey,
  getSelectedMauzaId,
  featureMatchesSelectedMauza,
  explodePointGeoJSON,
  pointBelongsToMauza,
  filterPointGeoJSONByArea,
  keepValidPointFeaturesForMap,
  getBoundaryIds,
  removeBoundaryLevelLayers,
  addBoundaryLevelLayers,
  addKhasraLayerStyles,
  addMurabbaLayerStyles,
  addPointLayerStyles,
  addTriJunctionLayerStyles,
  ensureSelectedLayerStyles,
  buildCornerMarkerFeatureCollection,
  addCornerMarkerLayerStyles,
  HANDU_GUJRAN_BOUNDS,
  restoreHanduGujranOrthoLayer,
  ensureMeasureLayerStyles,
  ensureMeasureAreaLayerStyles,
  ensureBearingLayerStyles,
  BUFFER_RADIUS_M,
  addBufferLayerStyles,
} from "./LayerManager/index.js";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const getSquareNumberFromProps = (props = {}, feature = null) => {
  return (
    props.sq ??
    props.SQ ??
    props.square ??
    props.square_no ??
    props.square_id ??
    props.s ??
    props.S ??
    feature?.id ??
    null
  );
};

const getAcreNumberFromProps = (props = {}, feature = null) => {
  return (
    props.acre ??
    props.acre_no ??
    props.ac ??
    props.AC ??
    props.name ??
    props.gid ??
    feature?.id ??
    null
  );
};

export default function MapView({
  selectedDistrict,
  selectedTehsil,
  selectedMauza,
  viewBy,
  demarcationMode = false,
  onParcelSelect,
  layers = {},
  selectedFilterLayers = [],
  selectedRudaPhaseIds = [],
  selectedProposedRoadIds = [],
  basemap = "Streets",
  selectedFeatureNumber,
  onFeaturesLoaded,
  onMapReady,
}) {
  const mapWrapperRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const currentGeojson = useRef({});
  const activePopupRef = useRef(null);
  const popupTimeoutRef = useRef(null);
  const lastSyncedSelectionRef = useRef("");
  const prevHanduGujranOrthoVisible = useRef(false);
  const measureCoordsRef = useRef([]);
  const measureAreaCoordsRef = useRef([]);
  const bearingCoordsRef = useRef([]);
  const coordPickerPopupRef = useRef(null);

  const [isMapReady, setIsMapReady] = useState(false);
  const [featureCount, setFeatureCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const proposedRoadsVisible = getLayerVisible(layers, "proposedRoads", false);
  const proposedRoadsOpacity = getLayerOpacity(layers, "proposedRoads", 100);
  const rudaBoundaryVisible = getLayerVisible(layers, "rudaBoundary", false);
  const rudaBoundaryOpacity = getLayerOpacity(layers, "rudaBoundary", 70);
  const geodeticNetworkVisible = getLayerVisible(
    layers,
    "geodeticNetwork",
    false,
  );
  const geodeticNetworkOpacity = getLayerOpacity(
    layers,
    "geodeticNetwork",
    100,
  );
  const districtBoundaryVisible = getLayerVisible(
    layers,
    "districtBoundary",
    true,
  );
  const districtBoundaryOpacity = getLayerOpacity(
    layers,
    "districtBoundary",
    100,
  );
  const tehsilBoundaryVisible = getLayerVisible(layers, "tehsilBoundary", true);
  const tehsilBoundaryOpacity = getLayerOpacity(layers, "tehsilBoundary", 100);
  const mauzaBoundaryVisible = getLayerVisible(layers, "mauzaBoundary", true);
  const mauzaBoundaryOpacity = getLayerOpacity(layers, "mauzaBoundary", 100);
  const squareLayerVisible = getLayerVisible(layers, "squareLayer", false);
  const squareLayerOpacity = getLayerOpacity(layers, "squareLayer", 35);
  const acreLayerVisible = getLayerVisible(layers, "acreLayer", false);
  const acreLayerOpacity = getLayerOpacity(layers, "acreLayer", 35);
  const khasraLayerVisible = getLayerVisible(layers, "khasraLayer", false);
  const khasraLayerOpacity = getLayerOpacity(layers, "khasraLayer", 25);
  const khasraLayerForceLoad = getLayerForceLoad(layers, "khasraLayer");
  const murabbaLayerVisible = getLayerVisible(layers, "murabbaLayer", false);
  const murabbaLayerOpacity = getLayerOpacity(layers, "murabbaLayer", 25);
  const murabbaLayerForceLoad = getLayerForceLoad(layers, "murabbaLayer");
  const triJunctionPointsVisible = getLayerVisible(
    layers,
    "triJunctionPoints",
    false,
  );
  const triJunctionPointsOpacity = getLayerOpacity(
    layers,
    "triJunctionPoints",
    100,
  );
  const fieldPointsVisible = getLayerVisible(layers, "fieldPoints", false);
  const fieldPointsOpacity = getLayerOpacity(layers, "fieldPoints", 100);
  const getLayerColorValue = (layerKey, fallback) => {
    const value = layers?.[layerKey];
    return typeof value === "object" && value.color ? value.color : fallback;
  };

  const rudaBoundaryColor = getLayerColorValue("rudaBoundary", "#22c55e");
  const proposedRoadsColor = getLayerColorValue("proposedRoads", "#ef4444");
  const geodeticNetworkColor = getLayerColorValue(
    "geodeticNetwork",
    VECTOR_LAYER_THEME.geodeticNetwork.circle,
  );
  const districtBoundaryColor = getLayerColorValue(
    "districtBoundary",
    "#f59e0b",
  );
  const tehsilBoundaryColor = getLayerColorValue("tehsilBoundary", "#06b6d4");
  const mauzaBoundaryColor = getLayerColorValue("mauzaBoundary", "#a3e635");
  const squareLayerColor = getLayerColorValue("squareLayer", "#8b5cf6");
  const acreLayerColor = getLayerColorValue("acreLayer", "#14b8a6");
  const khasraLayerColor = getLayerColorValue("khasraLayer", "#f97316");
  const murabbaLayerColor = getLayerColorValue("murabbaLayer", "#facc15");
  const triJunctionPointsColor = getLayerColorValue(
    "triJunctionPoints",
    "#e11d48",
  );
  const fieldPointsColor = getLayerColorValue(
    "fieldPoints",
    VECTOR_LAYER_THEME.fieldPoints.circle,
  );
  const controlPointsVisible = getLayerVisible(layers, "controlPoints", false);
  const handuGujranOrthoVisible =
    typeof layers?.handuGujranOrtho === "object"
      ? layers.handuGujranOrtho.visible
      : !!layers?.handuGujranOrtho;
  const handuGujranOrthoOpacity =
    typeof layers?.handuGujranOrtho === "object" &&
    Number.isFinite(Number(layers.handuGujranOrtho.opacity))
      ? Number(layers.handuGujranOrtho.opacity) / 100
      : 1.0;

  const clearProposedRoads = () => {
    try {
      Object.keys(currentGeojson.current || {})
        .filter((key) => key.startsWith("proposed-road"))
        .forEach((level) => {
          clearBoundaryLevel(level);
          delete currentGeojson.current[level];
        });
    } catch (e) {}
  };

  const movePointLayersToTop = () => {
    const map = mapInstance.current;
    if (!map) return;

    [
      CONTROL_POINTS_LAYER,
      getPointLabelLayerId(CONTROL_POINTS_LAYER),
      TRI_JUNCTION_BURJI_LAYER,
      TRI_JUNCTION_BURJI_LABEL,
      TRI_JUNCTION_POINTS_LAYER,
      TRI_JUNCTION_POINTS_LABEL,
      FIELD_POINTS_LAYER,
      FIELD_POINTS_LABEL,
      GEODETIC_NETWORK_LAYER,
      GEODETIC_NETWORK_LABEL,
      SELECTED_CORNER_LAYER,
      SELECTED_CORNER_BOX_LAYER,
      SELECTED_CORNER_TEXT_LAYER,
    ].forEach((layerId) => {
      try {
        if (map.getLayer(layerId)) {
          map.moveLayer(layerId);
        }
      } catch (e) {}
    });
  };

  const getOpenAreaGeoJSON = () => {
    const selectedArea = currentGeojson.current?.["selected-area"];
    if (selectedArea?.features?.length) return selectedArea;

    const mauzaArea = currentGeojson.current?.mauza;
    if (mauzaArea?.features?.length) return mauzaArea;

    const khasraArea = currentGeojson.current?.khasra;
    if (khasraArea?.features?.length) return khasraArea;

    const murabbaArea = currentGeojson.current?.murabba;
    if (murabbaArea?.features?.length) return murabbaArea;

    return null;
  };

  const resolveOpenAreaGeoJSON = async () => {
    const currentArea = getOpenAreaGeoJSON();
    if (currentArea?.features?.length) return currentArea;

    if (!selectedMauza) return null;

    try {
      const mauzaId = getSelectedMauzaId(selectedMauza);
      const mauzaGeojson = await getMauzaBoundary(mauzaId);

      if (mauzaGeojson?.features?.length) {
        currentGeojson.current.mauza = mauzaGeojson;
        return mauzaGeojson;
      }
    } catch (e) {
      console.warn("Could not resolve open area for point filtering", e);
    }

    return null;
  };

  const closeActivePopup = () => {
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
      popupTimeoutRef.current = null;
    }

    if (activePopupRef.current) {
      activePopupRef.current.remove();
      activePopupRef.current = null;
    }
  };

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    try {
      const map = new mapboxgl.Map({
        container: mapRef.current,
        style: BASEMAP_STYLES.Streets,
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        preserveDrawingBuffer: true,
      });

      // Add standard GIS controls
      map.addControl(new mapboxgl.NavigationControl(), "top-right");
      map.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserHeading: true,
        }),
        "top-right",
      );
      map.addControl(new mapboxgl.FullscreenControl(), "top-right");
      map.addControl(
        new mapboxgl.ScaleControl({ maxWidth: 200, unit: "metric" }),
        "bottom-right",
      );
      map.on("load", () => {
        setIsMapReady(true);
        if (typeof onMapReady === "function") onMapReady(map);
      });

      // Whenever a style is (re)loaded — whether via the UI control or
      // programmatic `setStyle` — restore any application layers/sources
      // that we keep in `currentGeojson.current`.
      map.on("style.load", () => {
        try {
          Object.keys(currentGeojson.current || {}).forEach((key) => {
            const g = currentGeojson.current[key];
            if (!g) return;

            if (key === "khasra") {
              drawKhasras(g);
            } else if (key === "murabba") {
              drawMurabbas(g);
            } else if (key === "control-points") {
              drawPointLayer({
                sourceId: CONTROL_POINTS_SOURCE,
                layerId: CONTROL_POINTS_LAYER,
                geojson: g,
                color: VECTOR_LAYER_THEME.controlPoints.circle,
                strokeColor: VECTOR_LAYER_THEME.controlPoints.stroke,
                radius: 5,
              });
            } else if (key === "tri-junction-points") {
              drawTriJunctionLayer({
                sourceId: TRI_JUNCTION_POINTS_SOURCE,
                layerId: TRI_JUNCTION_POINTS_LAYER,
                geojson: g,
              });
            } else if (key === "field-points") {
              drawPointLayer({
                sourceId: FIELD_POINTS_SOURCE,
                layerId: FIELD_POINTS_LAYER,
                geojson: g,
                color: fieldPointsColor,
                strokeColor: fieldPointsColor,
                radius: 4.5,
                opacity: fieldPointsOpacity / 100,
                labelLayerId: FIELD_POINTS_LABEL,
                labelExpression: VECTOR_LABEL_FIELDS.fieldPoints,
                labelColor: VECTOR_LAYER_THEME.fieldPoints.label,
                labelMinZoom: 15,
              });
            } else if (key === "geodetic-network") {
              drawPointLayer({
                sourceId: GEODETIC_NETWORK_SOURCE,
                layerId: GEODETIC_NETWORK_LAYER,
                geojson: g,
                color: geodeticNetworkColor,
                strokeColor: geodeticNetworkColor,
                radius: 6,
                opacity: geodeticNetworkOpacity / 100,
                labelLayerId: GEODETIC_NETWORK_LABEL,
                labelExpression: VECTOR_LABEL_FIELDS.geodeticNetwork,
                labelColor: VECTOR_LAYER_THEME.geodeticNetwork.label,
                labelMinZoom: 13,
              });
            } else {
              const layerKey = boundaryLevelToLayerKey(key);
              if (!layerKey || getLayerVisible(layers, layerKey, true)) {
                drawBoundaryLevel(
                  key,
                  g,
                  layerKey ? getLayerOpacity(layers, layerKey, 100) : null,
                );
              }
            }
          });
        } catch (e) {
          console.warn("Error restoring layers after style change", e);
        }
      });

      map.on("error", (e) => {
        console.error("Map error:", e);
        setError("Error initializing map");
      });

      mapInstance.current = map;

      return () => {
        closeActivePopup();

        if (mapInstance.current) {
          mapInstance.current.remove();
          mapInstance.current = null;
        }
      };
    } catch (e) {
      console.error("Map initialization error:", e);
      setError("Failed to initialize map");
    }
  }, []);

  useEffect(() => {
    if (!isMapReady) return;

    const loadProposedRoads = async () => {
      const map = mapInstance.current;
      if (!map) return;

      if (!proposedRoadsVisible) {
        clearProposedRoads();
        return;
      }

      clearProposedRoads();

      if (!selectedProposedRoadIds?.length) return;

      try {
        setIsLoading(true);

        const allRoadsGeojson = await getRudaProposedRoadsGeoJSON();
        const selectedIds = new Set(
          selectedProposedRoadIds.map((id) => String(id)),
        );

        const filteredGeojson = {
          type: "FeatureCollection",
          features: (allRoadsGeojson.features || [])
            .filter((feature) => {
              const props = feature?.properties || {};
              const featureId =
                props.gid ?? feature?.id ?? props.id ?? props.oid ?? props.fid;

              return selectedIds.has(String(featureId));
            })
            .map((feature) => ({
              ...feature,
              properties: {
                ...(feature?.properties || {}),
                layer: normalizeRoadLayerName(feature?.properties?.layer),
              },
            })),
        };

        if (!filteredGeojson.features.length) return;

        drawBoundaryLevel(
          "proposed-roads",
          filteredGeojson,
          proposedRoadsOpacity,
        );

        currentGeojson.current["proposed-roads"] = filteredGeojson;
        zoomToGeoJSON(filteredGeojson, { padding: 70, duration: 500 });
        movePointLayersToTop();
      } catch (e) {
        console.error("Proposed roads layer load error", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadProposedRoads();
  }, [isMapReady, proposedRoadsVisible, selectedProposedRoadIds]);

  const zoomToGeoJSON = (geojson, options = {}) => {
    const map = mapInstance.current;
    if (!map || !geojson?.features?.length) return;

    const bounds = new mapboxgl.LngLatBounds();

    geojson.features.forEach((feature) => {
      const coords = feature.geometry?.coordinates;
      if (!coords) return;

      const traverse = (c) => {
        if (typeof c[0] === "number") {
          bounds.extend(c);
        } else {
          c.forEach(traverse);
        }
      };

      traverse(coords);
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: options.padding ?? 40,
        duration: options.duration ?? 350,
        essential: true,
      });
    }
  };

  const reportLoadedFeatures = (geojson) => {
    try {
      if (typeof onFeaturesLoaded === "function") onFeaturesLoaded(geojson);
    } catch (e) {
      console.warn("onFeaturesLoaded callback failed", e);
    }
  };

  const clearBoundaryLevel = (level) => {
    const map = mapInstance.current;
    if (!map) return;

    const ids = getBoundaryIds(level);

    try {
      removeBoundaryLevelLayers(map, ids);
    } catch (e) {
      console.warn(`Error clearing boundary level ${level}`, e);
    }
  };

  const drawBoundaryLevel = (level, geojson, opacityOverride = null) => {
    const map = mapInstance.current;
    if (!map) return;

    const ids = getBoundaryIds(level);
    clearBoundaryLevel(level);

    const isRudaLayer = level.startsWith("ruda");
    const isProposedRoadLayer = level.startsWith("proposed-road");

    const layerOpacity = clampOpacity(
      opacityOverride !== null && opacityOverride !== undefined
        ? opacityOverride
        : isRudaLayer
          ? rudaBoundaryOpacity
          : 100,
    );

    const sourceGeojson = isRudaLayer
      ? prepareRudaGeojsonForDisplay(level, geojson)
      : geojson || emptyFeatureCollection();

    try {
      addBoundaryLevelLayers({
        map,
        ids,
        level,
        sourceGeojson,
        layerOpacity,
      });

      currentGeojson.current[level] = sourceGeojson;
      applyColorToBoundaryLevel(level, boundaryLevelColor(level));
      movePointLayersToTop();

      // ── Click popup for polygon / line boundary layers ─────────────────
      // Determine which layer ID to listen on and which popup type to show.
      const popupLayerId = isProposedRoadLayer
        ? ids.line // proposed roads are lines only
        : ids.fill; // all other boundaries have a fill layer

      if (map.getLayer(popupLayerId)) {
        // Determine popup type from level name
        const popupType = isRudaLayer
          ? "ruda"
          : level === "district"
            ? "district"
            : level === "tehsil"
              ? "tehsil"
              : level === "mauza"
                ? "mauza"
                : level === SQUARE_LEVEL
                  ? "square"
                  : level === ACRE_LEVEL
                    ? "acre"
                    : level;

        map.on("mouseenter", popupLayerId, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", popupLayerId, () => {
          map.getCanvas().style.cursor = "";
        });
        map.on("click", popupLayerId, (e) => {
          const feature = e.features?.[0];
          if (!feature) return;
          showPolygonPopup(popupType, feature.properties || {}, e.lngLat);
        });
      }
    } catch (e) {
      console.error("drawBoundaryLevel error", e);
    }
  };

  const applyOpacityToMapLayer = (layerId, opacityValue) => {
    const map = mapInstance.current;
    if (!map || !layerId || !map.getLayer(layerId)) return;

    const layer = map.getLayer(layerId);
    const opacity = clampOpacity(opacityValue);

    try {
      if (layer.type === "fill") {
        map.setPaintProperty(layerId, "fill-opacity", opacity);
      } else if (layer.type === "line") {
        map.setPaintProperty(layerId, "line-opacity", opacity);
      } else if (layer.type === "circle") {
        map.setPaintProperty(layerId, "circle-opacity", opacity);
        map.setPaintProperty(layerId, "circle-stroke-opacity", opacity);
      } else if (layer.type === "symbol") {
        map.setPaintProperty(layerId, "text-opacity", opacity);
        map.setPaintProperty(layerId, "icon-opacity", opacity);
      } else if (layer.type === "raster") {
        map.setPaintProperty(layerId, "raster-opacity", opacity);
      } else if (layer.type === "fill-extrusion") {
        map.setPaintProperty(layerId, "fill-extrusion-opacity", opacity);
      }
    } catch (e) {
      console.warn(`Could not update opacity for ${layerId}`, e);
    }
  };

  const applyOpacityToBoundaryLevel = (level, opacityValue) => {
    const ids = getBoundaryIds(level);

    Object.values(ids || {})
      .flat()
      .forEach((layerId) => applyOpacityToMapLayer(layerId, opacityValue));
  };

  const boundaryLevelColor = (level) => {
    if (String(level).startsWith("ruda")) return rudaBoundaryColor;
    if (String(level).startsWith("proposed-road")) return proposedRoadsColor;
    if (level === "district") return districtBoundaryColor;
    if (level === "tehsil") return tehsilBoundaryColor;
    if (level === "mauza") return mauzaBoundaryColor;
    if (level === SQUARE_LEVEL) return squareLayerColor;
    if (level === ACRE_LEVEL) return acreLayerColor;
    return null;
  };

  const applyColorToMapLayer = (layerId, colorValue) => {
    const map = mapInstance.current;
    if (!map || !layerId || !map.getLayer(layerId) || !colorValue) return;

    const layer = map.getLayer(layerId);

    try {
      if (layer.type === "fill") {
        map.setPaintProperty(layerId, "fill-color", colorValue);
      } else if (layer.type === "line") {
        map.setPaintProperty(layerId, "line-color", colorValue);
      } else if (layer.type === "circle") {
        map.setPaintProperty(layerId, "circle-color", colorValue);
        map.setPaintProperty(layerId, "circle-stroke-color", colorValue);
      } else if (layer.type === "symbol") {
        map.setPaintProperty(layerId, "text-color", colorValue);
      }
    } catch (e) {
      console.warn(`Could not update color for ${layerId}`, e);
    }
  };

  const applyColorToBoundaryLevel = (level, colorValue) => {
    const ids = getBoundaryIds(level);
    Object.values(ids || {})
      .flat()
      .forEach((layerId) => applyColorToMapLayer(layerId, colorValue));
  };

  const clearLayerAndSource = (fillId, lineId, sourceId) => {
    const map = mapInstance.current;
    if (!map) return;

    try {
      if (fillId && map.getLayer(fillId)) map.removeLayer(fillId);
      if (lineId && map.getLayer(lineId)) map.removeLayer(lineId);
      if (sourceId && map.getSource(sourceId)) map.removeSource(sourceId);
    } catch (e) {
      console.warn(`Error clearing ${sourceId}`, e);
    }
  };

  const clearPointLayer = (
    sourceId,
    layerId,
    labelLayerId = getPointLabelLayerId(layerId),
  ) => {
    const map = mapInstance.current;
    if (!map) return;

    try {
      closeActivePopup();

      if (labelLayerId && map.getLayer(labelLayerId)) {
        map.removeLayer(labelLayerId);
      }

      if (map.getLayer(layerId)) {
        map.off("click", layerId, handlePointClick);
        map.off("mouseenter", layerId, handlePointMouseEnter);
        map.off("mouseleave", layerId, handlePointMouseLeave);
        map.removeLayer(layerId);
      }

      const attachedLayers = (map.getStyle()?.layers || [])
        .filter((layer) => layer.source === sourceId)
        .map((layer) => layer.id)
        .reverse();

      attachedLayers.forEach((attachedLayerId) => {
        if (map.getLayer(attachedLayerId)) {
          map.removeLayer(attachedLayerId);
        }
      });

      if (map.getSource(sourceId)) map.removeSource(sourceId);
    } catch (e) {
      console.warn(`Error clearing point layer ${layerId}`, e);
    }
  };

  const clearCornerMarkers = () => {
    // Corner marker functionality has been removed.
    // Keep this as a safe no-op because existing layer cleanup flows still call it.
  };

  const clearKhasraLayers = () => {
    const map = mapInstance.current;
    try {
      if (map?.getLayer(KHASRA_LABEL)) map.removeLayer(KHASRA_LABEL);
    } catch (e) {}
    clearLayerAndSource(KHASRA_FILL, KHASRA_LINE, KHASRA_SOURCE);
    clearCornerMarkers();
  };

  const clearMurabbaLayers = () => {
    const map = mapInstance.current;
    try {
      if (map?.getLayer(MURABBA_LABEL)) map.removeLayer(MURABBA_LABEL);
    } catch (e) {}
    clearLayerAndSource(MURABBA_FILL, MURABBA_LINE, MURABBA_SOURCE);
    clearCornerMarkers();
  };

  const getFeatureLatLng = (feature, clickLngLat) => {
    const lngFromClick = clickLngLat?.lng;
    const latFromClick = clickLngLat?.lat;

    if (
      lngFromClick !== undefined &&
      lngFromClick !== null &&
      latFromClick !== undefined &&
      latFromClick !== null &&
      !Number.isNaN(Number(lngFromClick)) &&
      !Number.isNaN(Number(latFromClick))
    ) {
      return {
        lat: Number(latFromClick),
        lng: Number(lngFromClick),
      };
    }

    const geometry = feature?.geometry;
    const coords = geometry?.coordinates;

    if (
      geometry?.type === "Point" &&
      Array.isArray(coords) &&
      coords.length >= 2 &&
      !Number.isNaN(Number(coords[0])) &&
      !Number.isNaN(Number(coords[1]))
    ) {
      return {
        lat: Number(coords[1]),
        lng: Number(coords[0]),
      };
    }

    return { lat: null, lng: null };
  };

  const formatCoordinate = (value) => {
    const num = Number(value);
    if (value === null || value === undefined || Number.isNaN(num)) return "-";
    return num.toFixed(6);
  };

  // ── Unified popup builder — matches GISMetaverse PlotPopup design ──────────
  const buildUnifiedPopupHtml = (title, rows = []) => {
    const esc = (v) =>
      v == null
        ? ""
        : String(v)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

    const filteredRows = rows.filter(
      ([, v]) =>
        v != null && String(v).trim() !== "" && String(v).trim() !== "-",
    );

    const rowsHtml = filteredRows
      .map(
        ([label, value]) => `
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;border-bottom:1px solid rgba(0,0,0,0.05);padding:7px 0;box-sizing:border-box;">
          <span style="min-width:90px;flex-shrink:0;font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:0.4px;color:#6b7280;">${esc(label)}:</span>
          <span style="word-break:break-word;text-align:right;font-size:12px;font-weight:500;line-height:1.4;color:#111827;">${esc(value)}</span>
        </div>`,
      )
      .join("");

    return `
      <div style="width:280px;overflow:hidden;border-radius:10px;background:#fff;color:#111827;box-shadow:0 20px 60px rgba(0,0,0,0.25);outline:1px solid rgba(0,0,0,0.08);">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;border-radius:10px 10px 0 0;background:#111827;padding:12px 16px;">
          <div style="font-size:15px;font-weight:700;letter-spacing:0.3px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${esc(title)}
          </div>
          <button type="button" data-mapview-popup-close="true" aria-label="Close"
            style="display:flex;flex-shrink:0;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,0.1);font-size:18px;line-height:1;color:#fff;border:none;cursor:pointer;">×</button>
        </div>
        <div style="max-height:272px;overflow-y:auto;padding:10px 14px;scrollbar-width:none;">
          ${
            rowsHtml ||
            `<div style="padding:16px 0;text-align:center;font-size:11px;font-weight:500;color:#9ca3af;">No additional details available.</div>`
          }
        </div>
      </div>`;
  };

  // Resolve rows for each layer type
  const buildPopupRowsForType = (layerType, props = {}, coordinates = null) => {
    const coordRows =
      coordinates?.lat != null
        ? [
            ["Latitude", formatCoordinate(coordinates.lat)],
            ["Longitude", formatCoordinate(coordinates.lng)],
          ]
        : [];

    switch (layerType) {
      case "khasra":
        return [
          [
            "Khasra No",
            props.kh ??
              props.KH ??
              props.k ??
              props.K ??
              props.khasra_no ??
              props.khasra_id,
          ],
          ["Mauza", props.mauza ?? props.Mauza ?? props.moza],
          ["Murabba No", props.m ?? props.M ?? props.mn ?? props.murabba_no],
          ["Land Type", props.type ?? props.land_type],
          [
            "Area",
            props._area_acres != null
              ? `${Number(props._area_acres).toFixed(3)} Acres`
              : null,
          ],
          ["DC Rate", props.dc_rate],
          ["Remarks", props.remarks],
        ];
      case "murabba":
        return [
          [
            "Murabba No",
            props.m ??
              props.M ??
              props.mn ??
              props.murabba_no ??
              props.murabba_id,
          ],
          ["Mauza", props.mauza ?? props.Mauza ?? props.moza],
          ["Land Type", props.type ?? props.land_type],
          [
            "Area",
            props._area_acres != null
              ? `${Number(props._area_acres).toFixed(3)} Acres`
              : null,
          ],
          ["Remarks", props.remarks],
        ];
      case "mauza":
        return [
          ["Mauza", props.mauza ?? props.Mauza ?? props.moza ?? props.name],
          ["Tehsil", props.tehsil ?? props.Tehsil],
          ["District", props.district ?? props.District],
        ];
      case "tehsil":
        return [
          ["Tehsil", props.tehsil ?? props.name ?? props.tehsil_name],
          ["District", props.district ?? props.District],
        ];
      case "district":
        return [
          ["District", props.district ?? props.name ?? props.district_name],
          ["Division", props.division ?? props.Division],
        ];
      case "square":
        return [
          [
            "Square No",
            props.sq ?? props.SQ ?? props.square ?? props.square_no,
          ],
          ["Mauza", props.mauza ?? props.Mauza ?? props.moza],
          ["Tehsil", props.tehsil ?? props.Tehsil],
          ["District", props.district ?? props.District],
        ];
      case "acre":
        return [
          ["Acre No", props.acre ?? props.acre_no ?? props.ac ?? props.name],
          ["Mauza", props.mauza ?? props.Mauza ?? props.moza],
        ];
      case "ruda":
        return [
          ["Phase", props._ruda_phase_label ?? props.phase ?? props.name],
          ["Name", props.name],
        ];
      case "geodetic":
        return [
          ["Name", props.name],
          ["Code", props.code],
          ["Elevation (m)", props.elevation],
          ...coordRows,
        ];
      case "fieldPoint":
        return [
          ["Name", props.name],
          ["Code", props.code],
          ["Type", props.gm_type],
          ["Elevation (m)", props.elevation],
          ...coordRows,
        ];
      case "trijunction":
        return [
          ["Mauza 1", props.m1],
          ["Mauza 2", props.m2],
          ["Mauza 3", props.m3],
          ...coordRows,
        ];
      case "controlPoint":
        return [["Type", "Burji"], ...coordRows];
      default:
        return [...coordRows];
    }
  };

  const POPUP_TITLES = {
    khasra: "Khasra",
    murabba: "Murabba",
    mauza: "Mauza",
    tehsil: "Tehsil",
    district: "District",
    square: "Square",
    acre: "Acre",
    ruda: "RUDA Phase",
    geodetic: "Geodetic Point",
    fieldPoint: "Field Point",
    trijunction: "Tri-junction Point",
    controlPoint: "Control Point",
  };

  // Single show-popup helper used by all layers
  const showMapviewPopup = (layerType, props, lngLat, coordinates = null) => {
    const map = mapInstance.current;
    if (!map) return;

    closeActivePopup();

    const title = POPUP_TITLES[layerType] ?? layerType;
    const rows = buildPopupRowsForType(layerType, props, coordinates);
    const html = buildUnifiedPopupHtml(title, rows);

    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 15,
      maxWidth: "none",
      className: "mapview-unified-popup",
    })
      .setLngLat(lngLat)
      .setHTML(html)
      .addTo(map);

    // Match GISMetaverse popup shell styling
    const el = popup.getElement();
    const content = el?.querySelector(".mapboxgl-popup-content");
    if (content) {
      content.style.cssText =
        "padding:0;background:transparent;box-shadow:none;border-radius:10px;";
    }
    const tip = el?.querySelector(".mapboxgl-popup-tip");
    if (tip) tip.style.borderTopColor = "#111827";

    const closeBtn = el?.querySelector("[data-mapview-popup-close]");
    if (closeBtn) {
      closeBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        closeActivePopup();
      });
    }

    activePopupRef.current = popup;

    popupTimeoutRef.current = setTimeout(() => {
      if (activePopupRef.current === popup) {
        popup.remove();
        activePopupRef.current = null;
      }
      popupTimeoutRef.current = null;
    }, 8000);

    popup.on("close", () => {
      if (activePopupRef.current === popup) activePopupRef.current = null;
      if (popupTimeoutRef.current) {
        clearTimeout(popupTimeoutRef.current);
        popupTimeoutRef.current = null;
      }
    });
  };

  // Keep showPolygonPopup as a thin wrapper so existing call-sites don't break
  const showPolygonPopup = (layerType, props, lngLat) => {
    showMapviewPopup(layerType, props, lngLat);
  };

  function handlePointMouseEnter() {
    const map = mapInstance.current;
    if (!map) return;
    map.getCanvas().style.cursor = "pointer";
  }

  function handlePointMouseLeave() {
    const map = mapInstance.current;
    if (!map) return;
    map.getCanvas().style.cursor = "";
  }

  function handlePointClick(e) {
    const map = mapInstance.current;
    if (!map) return;

    const feature = e.features?.[0];
    if (!feature) return;

    const props = feature.properties || {};
    const coordinates = getFeatureLatLng(feature, e.lngLat);

    // Determine which unified popup type to use
    const isGeodetic = props._layerType === "geodeticNetwork";
    const isFieldPoint = props._layerType === "fieldPoints";
    const isTriJunction = String(props.type ?? "").toUpperCase() === "TJ";
    const isControlPoint = String(props.type ?? "").toUpperCase() === "B";

    const layerType = isGeodetic
      ? "geodetic"
      : isFieldPoint
        ? "fieldPoint"
        : isTriJunction
          ? "trijunction"
          : isControlPoint
            ? "controlPoint"
            : "controlPoint";

    const lngLat =
      e.lngLat ||
      (coordinates.lng != null && coordinates.lat != null
        ? [coordinates.lng, coordinates.lat]
        : DEFAULT_CENTER);

    showMapviewPopup(layerType, props, lngLat, coordinates);
  }

  const drawPointLayer = ({
    sourceId,
    layerId,
    geojson,
    color,
    strokeColor,
    radius,
    opacity = 0.95,
    labelLayerId = getPointLabelLayerId(layerId),
    labelExpression = null,
    labelColor = "#1f2937",
    labelMinZoom = 15,
    labelSize = ["interpolate", ["linear"], ["zoom"], 14, 10, 17, 12],
    labelOffset = [0, 1.15],
  }) => {
    const map = mapInstance.current;
    if (!map) return;

    clearPointLayer(sourceId, layerId, labelLayerId);

    if (!geojson?.features || !Array.isArray(geojson.features)) return;

    try {
      addPointLayerStyles({
        map,
        sourceId,
        layerId,
        geojson,
        color,
        strokeColor,
        radius,
        opacity,
        labelLayerId,
        labelExpression,
        labelColor,
        labelMinZoom,
        labelSize,
        labelOffset,
      });

      map.on("mouseenter", layerId, handlePointMouseEnter);
      map.on("mouseleave", layerId, handlePointMouseLeave);
      map.on("click", layerId, handlePointClick);

      movePointLayersToTop();
    } catch (e) {
      console.error(`Failed to draw ${layerId}`, e);
    }
  };

  const clearTriJunctionLayer = () => {
    const map = mapInstance.current;
    if (!map) return;

    try {
      closeActivePopup();

      [
        TRI_JUNCTION_POINTS_LABEL,
        TRI_JUNCTION_BURJI_LABEL,
        TRI_JUNCTION_POINTS_LAYER,
        TRI_JUNCTION_BURJI_LAYER,
      ].forEach((layerId) => {
        if (!map.getLayer(layerId)) return;

        if (
          layerId === TRI_JUNCTION_POINTS_LAYER ||
          layerId === TRI_JUNCTION_BURJI_LAYER
        ) {
          map.off("click", layerId, handlePointClick);
          map.off("mouseenter", layerId, handlePointMouseEnter);
          map.off("mouseleave", layerId, handlePointMouseLeave);
        }

        map.removeLayer(layerId);
      });

      if (map.getSource(TRI_JUNCTION_POINTS_SOURCE)) {
        map.removeSource(TRI_JUNCTION_POINTS_SOURCE);
      }
    } catch (e) {
      console.warn("Error clearing tri-junction / burji layer", e);
    }
  };

  const bringTriJunctionToTop = () => {
    const map = mapInstance.current;
    if (!map) return;

    try {
      [
        TRI_JUNCTION_BURJI_LAYER,
        TRI_JUNCTION_BURJI_LABEL,
        TRI_JUNCTION_POINTS_LAYER,
        TRI_JUNCTION_POINTS_LABEL,
      ].forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.moveLayer(layerId);
        }
      });
    } catch (e) {
      console.warn("Could not move tri-junction / burji layers to top", e);
    }
  };

  const drawTriJunctionLayer = ({ sourceId, layerId, geojson }) => {
    const map = mapInstance.current;
    if (!map) return;

    clearTriJunctionLayer();

    if (!geojson?.features || !Array.isArray(geojson.features)) return;

    const pointGeojson = keepValidPointFeaturesForMap(geojson);
    if (!pointGeojson.features.length) {
      console.warn(
        "Tri Junction / Burji points were fetched but have no valid EPSG:4326 point coordinates.",
      );
      return;
    }

    try {
      addTriJunctionLayerStyles({
        map,
        sourceId,
        layerId,
        pointGeojson,
        opacity: triJunctionPointsOpacity / 100,
      });

      [TRI_JUNCTION_BURJI_LAYER, layerId].forEach((clickLayerId) => {
        map.on("mouseenter", clickLayerId, handlePointMouseEnter);
        map.on("mouseleave", clickLayerId, handlePointMouseLeave);
        map.on("click", clickLayerId, handlePointClick);
      });

      currentGeojson.current["tri-junction-points"] = pointGeojson;
      [
        TRI_JUNCTION_POINTS_LAYER,
        TRI_JUNCTION_POINTS_LABEL,
        TRI_JUNCTION_BURJI_LAYER,
        TRI_JUNCTION_BURJI_LABEL,
      ].forEach((layerId) =>
        applyColorToMapLayer(layerId, triJunctionPointsColor),
      );
      bringTriJunctionToTop();
      movePointLayersToTop();
    } catch (e) {
      console.error(`Failed to draw ${layerId}`, e);
    }
  };

  const addCornerMarkers = (map, feature) => {
    try {
      clearCornerMarkers();

      const cornerFc = buildCornerMarkerFeatureCollection(feature);

      addCornerMarkerLayerStyles({
        map,
        cornerFeatureCollection: cornerFc,
        demarcationMode,
      });

      function cornerClickHandler(e) {
        const lngLat = e.lngLat;
        showMapviewPopup(
          "controlPoint",
          { type: "B" },
          [lngLat.lng, lngLat.lat],
          { lat: lngLat.lat, lng: lngLat.lng },
        );
      }

      const activeCornerLayer = demarcationMode
        ? SELECTED_CORNER_TEXT_LAYER
        : SELECTED_CORNER_LAYER;

      map.on("click", activeCornerLayer, cornerClickHandler);
      map.on("mouseenter", activeCornerLayer, handlePointMouseEnter);
      map.on("mouseleave", activeCornerLayer, handlePointMouseLeave);
    } catch (e) {
      console.warn("Failed to add corner markers", e);
    }
  };

  const ensureSelectedLayers = (map) => {
    ensureSelectedLayerStyles({
      map,
      emptyGeojson: emptyFeatureCollection(),
    });
  };

  const drawKhasras = (geojson) => {
    const map = mapInstance.current;
    if (!map) return;

    try {
      clearKhasraLayers();

      try {
        const sel = map.getSource(SELECTED_SOURCE);
        if (sel) sel.setData(emptyFeatureCollection());
      } catch (err) {}

      if (!geojson?.features || !Array.isArray(geojson.features)) {
        setFeatureCount(0);
        return;
      }

      const khasraOpacity = clampOpacity(khasraLayerOpacity);

      addKhasraLayerStyles({
        map,
        geojson,
        opacity: khasraOpacity,
      });

      currentGeojson.current.khasra = geojson;

      ensureSelectedLayers(map);

      map.off("click", KHASRA_FILL);
      map.off("mouseenter", KHASRA_FILL);
      map.off("mouseleave", KHASRA_FILL);

      map.on("click", KHASRA_FILL, (e) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          const area_m2 = computeArea(feature);
          const area_acres = area_m2 / 4046.8564224;

          const selectedGeo = {
            type: "FeatureCollection",
            features: [feature],
          };

          currentGeojson.current["selected-area"] = selectedGeo;

          try {
            const src = map.getSource(SELECTED_SOURCE);
            if (src) src.setData(selectedGeo);
          } catch (err) {
            console.warn("Could not set selected feature", err);
          }

          // Show popup with computed area
          const propsWithArea = {
            ...(feature.properties || {}),
            _area_acres: area_acres,
          };
          showPolygonPopup("khasra", propsWithArea, e.lngLat);

          if (typeof onParcelSelect === "function") {
            const cloned = JSON.parse(JSON.stringify(feature));
            cloned.properties = cloned.properties || {};
            cloned.properties._area_m2 = area_m2;
            cloned.properties._area_acres = area_acres;
            cloned.properties._layerType = "khasra";
            onParcelSelect(cloned);
          }
        }
      });

      map.on("mouseenter", KHASRA_FILL, () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", KHASRA_FILL, () => {
        map.getCanvas().style.cursor = "";
      });

      zoomToGeoJSON(geojson);
      movePointLayersToTop();
      setFeatureCount(geojson.features.length);
      reportLoadedFeatures(geojson);
    } catch (e) {
      console.error("Khasra drawing error:", e);
      setError("Failed to display Khasras");
    }
  };

  const drawMurabbas = (geojson) => {
    const map = mapInstance.current;
    if (!map) return;

    try {
      clearMurabbaLayers();

      try {
        const sel = map.getSource(SELECTED_SOURCE);
        if (sel) sel.setData(emptyFeatureCollection());
      } catch (err) {}

      if (!geojson?.features || !Array.isArray(geojson.features)) {
        setFeatureCount(0);
        return;
      }

      const murabbaOpacity = clampOpacity(murabbaLayerOpacity);

      addMurabbaLayerStyles({
        map,
        geojson,
        opacity: murabbaOpacity,
      });

      currentGeojson.current.murabba = geojson;

      ensureSelectedLayers(map);

      map.off("click", MURABBA_FILL);
      map.off("mouseenter", MURABBA_FILL);
      map.off("mouseleave", MURABBA_FILL);

      map.on("click", MURABBA_FILL, (e) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          const area_m2 = computeArea(feature);
          const area_acres = area_m2 / 4046.8564224;

          const selectedGeo = {
            type: "FeatureCollection",
            features: [feature],
          };

          currentGeojson.current["selected-area"] = selectedGeo;

          try {
            const src = map.getSource(SELECTED_SOURCE);
            if (src) src.setData(selectedGeo);
          } catch (err) {
            console.warn("Could not set selected feature", err);
          }

          // Show popup with computed area
          const propsWithArea = {
            ...(feature.properties || {}),
            _area_acres: area_acres,
          };
          showPolygonPopup("murabba", propsWithArea, e.lngLat);

          if (typeof onParcelSelect === "function") {
            const cloned = JSON.parse(JSON.stringify(feature));
            cloned.properties = cloned.properties || {};
            cloned.properties._area_m2 = area_m2;
            cloned.properties._area_acres = area_acres;
            cloned.properties._layerType = "murabba";
            onParcelSelect(cloned);
          }
        }
      });

      map.on("mouseenter", MURABBA_FILL, () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", MURABBA_FILL, () => {
        map.getCanvas().style.cursor = "";
      });

      zoomToGeoJSON(geojson);
      movePointLayersToTop();
      setFeatureCount(geojson.features.length);
      reportLoadedFeatures(geojson);
    } catch (e) {
      console.error("Murabba drawing error:", e);
      setError("Failed to display Murabbas");
    }
  };

  useEffect(() => {
    if (!isMapReady) return;
    applyOpacityToBoundaryLevel("proposed-roads", proposedRoadsOpacity);
  }, [isMapReady, proposedRoadsOpacity]);

  useEffect(() => {
    if (!isMapReady) return;
    Object.keys(currentGeojson.current || {})
      .filter((key) => key.startsWith("ruda-"))
      .forEach((level) =>
        applyOpacityToBoundaryLevel(level, rudaBoundaryOpacity),
      );
  }, [isMapReady, rudaBoundaryOpacity]);

  useEffect(() => {
    if (!isMapReady) return;
    applyOpacityToBoundaryLevel("district", districtBoundaryOpacity);
  }, [isMapReady, districtBoundaryOpacity]);

  useEffect(() => {
    if (!isMapReady) return;
    applyOpacityToBoundaryLevel("tehsil", tehsilBoundaryOpacity);
  }, [isMapReady, tehsilBoundaryOpacity]);

  useEffect(() => {
    if (!isMapReady) return;
    applyOpacityToBoundaryLevel("mauza", mauzaBoundaryOpacity);
  }, [isMapReady, mauzaBoundaryOpacity]);

  useEffect(() => {
    if (!isMapReady) return;
    applyOpacityToBoundaryLevel(SQUARE_LEVEL, squareLayerOpacity);
  }, [isMapReady, squareLayerOpacity]);

  useEffect(() => {
    if (!isMapReady) return;
    applyOpacityToBoundaryLevel(ACRE_LEVEL, acreLayerOpacity);
  }, [isMapReady, acreLayerOpacity]);

  useEffect(() => {
    if (!isMapReady) return;
    [KHASRA_FILL, KHASRA_LINE, KHASRA_LABEL].forEach((layerId) =>
      applyOpacityToMapLayer(layerId, khasraLayerOpacity),
    );
  }, [isMapReady, khasraLayerOpacity]);

  useEffect(() => {
    if (!isMapReady) return;
    [MURABBA_FILL, MURABBA_LINE, MURABBA_LABEL].forEach((layerId) =>
      applyOpacityToMapLayer(layerId, murabbaLayerOpacity),
    );
  }, [isMapReady, murabbaLayerOpacity]);

  useEffect(() => {
    if (!isMapReady) return;
    [GEODETIC_NETWORK_LAYER, GEODETIC_NETWORK_LABEL].forEach((layerId) =>
      applyOpacityToMapLayer(layerId, geodeticNetworkOpacity),
    );
  }, [isMapReady, geodeticNetworkOpacity]);

  useEffect(() => {
    if (!isMapReady) return;
    [
      TRI_JUNCTION_POINTS_LAYER,
      TRI_JUNCTION_POINTS_LABEL,
      TRI_JUNCTION_BURJI_LAYER,
      TRI_JUNCTION_BURJI_LABEL,
    ].forEach((layerId) =>
      applyOpacityToMapLayer(layerId, triJunctionPointsOpacity),
    );
  }, [isMapReady, triJunctionPointsOpacity]);

  useEffect(() => {
    if (!isMapReady) return;
    [FIELD_POINTS_LAYER, FIELD_POINTS_LABEL].forEach((layerId) =>
      applyOpacityToMapLayer(layerId, fieldPointsOpacity),
    );
  }, [isMapReady, fieldPointsOpacity]);

  useEffect(() => {
    if (!isMapReady) return;
    Object.keys(currentGeojson.current || {})
      .filter((key) => key.startsWith("ruda-"))
      .forEach((level) => applyColorToBoundaryLevel(level, rudaBoundaryColor));
  }, [isMapReady, rudaBoundaryColor]);

  useEffect(() => {
    if (!isMapReady) return;
    applyColorToBoundaryLevel("proposed-roads", proposedRoadsColor);
  }, [isMapReady, proposedRoadsColor]);

  useEffect(() => {
    if (!isMapReady) return;
    applyColorToBoundaryLevel("district", districtBoundaryColor);
  }, [isMapReady, districtBoundaryColor]);

  useEffect(() => {
    if (!isMapReady) return;
    applyColorToBoundaryLevel("tehsil", tehsilBoundaryColor);
  }, [isMapReady, tehsilBoundaryColor]);

  useEffect(() => {
    if (!isMapReady) return;
    applyColorToBoundaryLevel("mauza", mauzaBoundaryColor);
  }, [isMapReady, mauzaBoundaryColor]);

  useEffect(() => {
    if (!isMapReady) return;
    applyColorToBoundaryLevel(SQUARE_LEVEL, squareLayerColor);
  }, [isMapReady, squareLayerColor]);

  useEffect(() => {
    if (!isMapReady) return;
    applyColorToBoundaryLevel(ACRE_LEVEL, acreLayerColor);
  }, [isMapReady, acreLayerColor]);

  useEffect(() => {
    if (!isMapReady) return;
    [KHASRA_FILL, KHASRA_LINE, KHASRA_LABEL].forEach((layerId) =>
      applyColorToMapLayer(layerId, khasraLayerColor),
    );
  }, [isMapReady, khasraLayerColor]);

  useEffect(() => {
    if (!isMapReady) return;
    [MURABBA_FILL, MURABBA_LINE, MURABBA_LABEL].forEach((layerId) =>
      applyColorToMapLayer(layerId, murabbaLayerColor),
    );
  }, [isMapReady, murabbaLayerColor]);

  useEffect(() => {
    if (!isMapReady) return;
    [GEODETIC_NETWORK_LAYER, GEODETIC_NETWORK_LABEL].forEach((layerId) =>
      applyColorToMapLayer(layerId, geodeticNetworkColor),
    );
  }, [isMapReady, geodeticNetworkColor]);

  useEffect(() => {
    if (!isMapReady) return;
    [
      TRI_JUNCTION_POINTS_LAYER,
      TRI_JUNCTION_POINTS_LABEL,
      TRI_JUNCTION_BURJI_LAYER,
      TRI_JUNCTION_BURJI_LABEL,
    ].forEach((layerId) =>
      applyColorToMapLayer(layerId, triJunctionPointsColor),
    );
  }, [isMapReady, triJunctionPointsColor]);

  useEffect(() => {
    if (!isMapReady) return;
    [FIELD_POINTS_LAYER, FIELD_POINTS_LABEL].forEach((layerId) =>
      applyColorToMapLayer(layerId, fieldPointsColor),
    );
  }, [isMapReady, fieldPointsColor]);

  useEffect(() => {
    if (!isMapReady) return;

    let cancelled = false;

    const loadBoundary = async () => {
      try {
        setIsLoading(true);
        setError("");

        ["district", "tehsil", "mauza"].forEach((lvl) =>
          clearBoundaryLevel(lvl),
        );

        setFeatureCount(0);

        const loadedGeojsons = [];

        if (selectedDistrict?.length) {
          const geojsons = await Promise.all(
            selectedDistrict.map((d) => getDistrictBoundary(d.id || d)),
          );
          if (cancelled) return;

          const merged = mergeFeatureCollections(geojsons);
          if (merged?.features?.length) {
            currentGeojson.current.district = merged;
            loadedGeojsons.push(merged);

            if (districtBoundaryVisible) {
              drawBoundaryLevel("district", merged, districtBoundaryOpacity);
            }
          }
        }

        if (selectedTehsil?.length) {
          const geojsons = await Promise.all(
            selectedTehsil.map((t) => getTehsilBoundary(t.id || t)),
          );
          if (cancelled) return;

          const merged = mergeFeatureCollections(geojsons);
          if (merged?.features?.length) {
            currentGeojson.current.tehsil = merged;
            loadedGeojsons.push(merged);

            if (tehsilBoundaryVisible) {
              drawBoundaryLevel("tehsil", merged, tehsilBoundaryOpacity);
            }
          }
        }

        if (selectedMauza) {
          const mauzaId = getSelectedMauzaId(selectedMauza);

          const geojson = await getMauzaBoundary(mauzaId);
          if (cancelled) return;

          if (geojson?.features?.length) {
            currentGeojson.current.mauza = geojson;
            loadedGeojsons.push(geojson);

            if (mauzaBoundaryVisible) {
              drawBoundaryLevel("mauza", geojson, mauzaBoundaryOpacity);
            }
          }
        }

        const zoomTarget = loadedGeojsons[loadedGeojsons.length - 1];
        if (zoomTarget?.features?.length) {
          zoomToGeoJSON(zoomTarget);
          setFeatureCount(zoomTarget.features.length);
        }
      } catch (e) {
        if (!cancelled) {
          console.error("Boundary load error:", e);
          setError("Failed to load boundary");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadBoundary();

    return () => {
      cancelled = true;
    };
  }, [
    selectedDistrict,
    selectedTehsil,
    selectedMauza,
    isMapReady,
    districtBoundaryVisible,
    tehsilBoundaryVisible,
    mauzaBoundaryVisible,
  ]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !isMapReady) return;

    const styleUrl = BASEMAP_STYLES[basemap] || basemap;
    if (!styleUrl) return;

    try {
      map.setStyle(styleUrl);

      map.once("style.load", () => {
        try {
          Object.keys(currentGeojson.current || {}).forEach((key) => {
            const g = currentGeojson.current[key];
            if (!g) return;

            if (key === "khasra") {
              drawKhasras(g);
            } else if (key === "murabba") {
              drawMurabbas(g);
            } else if (key === "control-points") {
              drawPointLayer({
                sourceId: CONTROL_POINTS_SOURCE,
                layerId: CONTROL_POINTS_LAYER,
                geojson: g,
                color: VECTOR_LAYER_THEME.controlPoints.circle,
                strokeColor: VECTOR_LAYER_THEME.controlPoints.stroke,
                radius: 5,
              });
            } else if (key === "tri-junction-points") {
              drawTriJunctionLayer({
                sourceId: TRI_JUNCTION_POINTS_SOURCE,
                layerId: TRI_JUNCTION_POINTS_LAYER,
                geojson: g,
              });
            } else if (key === "field-points") {
              drawPointLayer({
                sourceId: FIELD_POINTS_SOURCE,
                layerId: FIELD_POINTS_LAYER,
                geojson: g,
                color: fieldPointsColor,
                strokeColor: fieldPointsColor,
                radius: 4.5,
                opacity: fieldPointsOpacity / 100,
                labelLayerId: FIELD_POINTS_LABEL,
                labelExpression: VECTOR_LABEL_FIELDS.fieldPoints,
                labelColor: VECTOR_LAYER_THEME.fieldPoints.label,
                labelMinZoom: 15,
              });
            } else if (key === "geodetic-network") {
              drawPointLayer({
                sourceId: GEODETIC_NETWORK_SOURCE,
                layerId: GEODETIC_NETWORK_LAYER,
                geojson: g,
                color: geodeticNetworkColor,
                strokeColor: geodeticNetworkColor,
                radius: 6,
                opacity: geodeticNetworkOpacity / 100,
                labelLayerId: GEODETIC_NETWORK_LABEL,
                labelExpression: VECTOR_LABEL_FIELDS.geodeticNetwork,
                labelColor: VECTOR_LAYER_THEME.geodeticNetwork.label,
                labelMinZoom: 13,
              });
            } else {
              const layerKey = boundaryLevelToLayerKey(key);
              if (!layerKey || getLayerVisible(layers, layerKey, true)) {
                drawBoundaryLevel(
                  key,
                  g,
                  layerKey ? getLayerOpacity(layers, layerKey, 100) : null,
                );
              }
            }
          });
        } catch (e) {
          console.warn("Error restoring layers after style change", e);
        }
      });
    } catch (e) {
      console.error("Failed to change basemap style", e);
    }
  }, [basemap, isMapReady]);

  useEffect(() => {
    lastSyncedSelectionRef.current = "";
    delete currentGeojson.current["selected-area"];
  }, [selectedMauza, viewBy]);

  useEffect(() => {
    if (!isMapReady) return;

    const map = mapInstance.current;
    if (!map) return;

    if (!selectedFeatureNumber) {
      lastSyncedSelectionRef.current = "";
      delete currentGeojson.current["selected-area"];

      try {
        ensureSelectedLayers(map);
        const src = map.getSource(SELECTED_SOURCE);
        if (src) src.setData(emptyFeatureCollection());
      } catch (e) {
        console.warn("Could not clear selected parcel", e);
      }

      clearCornerMarkers();
      return;
    }

    const selectionKey =
      typeof selectedFeatureNumber === "object"
        ? JSON.stringify(selectedFeatureNumber)
        : String(selectedFeatureNumber);

    if (lastSyncedSelectionRef.current === selectionKey) return;

    const current =
      viewBy === "khasra"
        ? currentGeojson.current.khasra
        : viewBy === "murabba"
          ? currentGeojson.current.murabba
          : viewBy === "square"
            ? currentGeojson.current[SQUARE_LEVEL]
            : viewBy === "acre"
              ? currentGeojson.current[ACRE_LEVEL]
              : currentGeojson.current.khasra ||
                currentGeojson.current.murabba ||
                currentGeojson.current[SQUARE_LEVEL] ||
                currentGeojson.current[ACRE_LEVEL] ||
                {};

    const features = Array.isArray(current?.features) ? current.features : [];

    const matched = features.find((feat) => {
      const p = feat?.properties || {};

      if (
        viewBy === "khasra" &&
        typeof selectedFeatureNumber === "object" &&
        selectedFeatureNumber !== null
      ) {
        const murabba = getMurabbaNumber(p);
        const khasra = getKhasraNumber(p);

        return (
          String(murabba) === String(selectedFeatureNumber.murabbaNo) &&
          String(khasra) === String(selectedFeatureNumber.khasraNo)
        );
      }

      const cand =
        viewBy === "khasra"
          ? getKhasraNumber(p)
          : viewBy === "murabba"
            ? getMurabbaNumber(p)
            : viewBy === "square"
              ? getSquareNumberFromProps(p, feat)
              : viewBy === "acre"
                ? getAcreNumberFromProps(p, feat)
                : feat?.id;

      return String(cand) === String(selectedFeatureNumber);
    });

    if (matched) {
      const selectedGeo = { type: "FeatureCollection", features: [matched] };

      try {
        currentGeojson.current["selected-area"] = selectedGeo;
        ensureSelectedLayers(map);
        map.getSource(SELECTED_SOURCE).setData(selectedGeo);
        zoomToGeoJSON(selectedGeo, { padding: 80, duration: 450 });
        lastSyncedSelectionRef.current = selectionKey;
      } catch (e) {
        console.warn("Could not highlight selected parcel", e);
      }
    }
  }, [selectedFeatureNumber, viewBy, isMapReady, featureCount]);

  useEffect(() => {
    if (!isMapReady) return;

    const loadRuda = async () => {
      const clearRudaLevels = () => {
        try {
          Object.keys(currentGeojson.current || {})
            .filter((key) => key.startsWith("ruda-"))
            .forEach((level) => {
              clearBoundaryLevel(level);
              delete currentGeojson.current[level];
            });
        } catch (e) {}
      };

      if (!rudaBoundaryVisible) {
        clearRudaLevels();
        return;
      }

      clearRudaLevels();

      if (!selectedRudaPhaseIds?.length) return;

      try {
        setIsLoading(true);

        const results = await Promise.all(
          selectedRudaPhaseIds.map((gid) =>
            getRudaGeoJSON(gid)
              .then((geojson) => ({ gid, geojson }))
              .catch((e) => {
                console.error("RUDA geojson error", e);
                return null;
              }),
          ),
        );

        const loadedRudaGeojsons = results
          .filter(Boolean)
          .map((item) => item.geojson)
          .filter((geojson) => geojson?.features?.length);

        results.filter(Boolean).forEach((item) => {
          drawBoundaryLevel(
            `ruda-${item.gid}`,
            item.geojson,
            rudaBoundaryOpacity,
          );
          currentGeojson.current[`ruda-${item.gid}`] = item.geojson;
        });

        if (loadedRudaGeojsons.length) {
          zoomToGeoJSON(mergeFeatureCollections(loadedRudaGeojsons), {
            padding: 70,
            duration: 500,
          });
        }

        movePointLayersToTop();
      } finally {
        setIsLoading(false);
      }
    };

    loadRuda();
  }, [isMapReady, rudaBoundaryVisible, selectedRudaPhaseIds]);

  useEffect(() => {
    if (!isMapReady) return;

    const loadGeodeticNetwork = async () => {
      if (!geodeticNetworkVisible) {
        clearPointLayer(GEODETIC_NETWORK_SOURCE, GEODETIC_NETWORK_LAYER);
        delete currentGeojson.current["geodetic-network"];
        return;
      }

      try {
        setIsLoading(true);
        const geojson = await getGeodeticNetworkGeoJSON();
        const preparedGeojson = {
          type: "FeatureCollection",
          features: (geojson?.features || []).map((feature) => ({
            ...feature,
            properties: {
              ...(feature?.properties || {}),
              _layerType: "geodeticNetwork",
            },
          })),
        };

        if (preparedGeojson.features.length) {
          drawPointLayer({
            sourceId: GEODETIC_NETWORK_SOURCE,
            layerId: GEODETIC_NETWORK_LAYER,
            geojson: preparedGeojson,
            color: geodeticNetworkColor,
            strokeColor: geodeticNetworkColor,
            radius: 6,
            opacity: geodeticNetworkOpacity / 100,
            labelLayerId: GEODETIC_NETWORK_LABEL,
            labelExpression: VECTOR_LABEL_FIELDS.geodeticNetwork,
            labelColor: VECTOR_LAYER_THEME.geodeticNetwork.label,
            labelMinZoom: 13,
          });
          currentGeojson.current["geodetic-network"] = preparedGeojson;
          zoomToGeoJSON(preparedGeojson, { padding: 70, duration: 500 });
          movePointLayersToTop();
        } else {
          clearPointLayer(GEODETIC_NETWORK_SOURCE, GEODETIC_NETWORK_LAYER);
          delete currentGeojson.current["geodetic-network"];
        }
      } catch (e) {
        console.error("Geodetic network load error:", e);
        setError("Failed to load Geodetic Network");
      } finally {
        setIsLoading(false);
      }
    };

    loadGeodeticNetwork();
  }, [isMapReady, geodeticNetworkVisible]);

  useEffect(() => {
    if (!selectedMauza || !isMapReady || !squareLayerVisible) {
      clearBoundaryLevel(SQUARE_LEVEL);
      delete currentGeojson.current[SQUARE_LEVEL];
      return;
    }

    const loadSquares = async () => {
      try {
        setIsLoading(true);
        const mauzaId = getSelectedMauzaId(selectedMauza);
        const geojson = await getSquares(mauzaId);

        if (geojson?.features?.length) {
          drawBoundaryLevel(SQUARE_LEVEL, geojson, squareLayerOpacity);
          currentGeojson.current[SQUARE_LEVEL] = geojson;
          setFeatureCount(geojson.features.length);
          reportLoadedFeatures(geojson);
          zoomToGeoJSON(geojson, { padding: 70, duration: 500 });
        } else {
          clearBoundaryLevel(SQUARE_LEVEL);
          delete currentGeojson.current[SQUARE_LEVEL];
          setFeatureCount(0);
          reportLoadedFeatures(emptyFeatureCollection());
        }
      } catch (e) {
        console.error("Square boundary load error:", e);
        setError("Failed to load Square Boundary");
      } finally {
        setIsLoading(false);
      }
    };

    loadSquares();
  }, [selectedMauza, isMapReady, squareLayerVisible]);

  useEffect(() => {
    if (!selectedMauza || !isMapReady || !acreLayerVisible) {
      clearBoundaryLevel(ACRE_LEVEL);
      delete currentGeojson.current[ACRE_LEVEL];
      return;
    }

    const loadAcres = async () => {
      try {
        setIsLoading(true);
        const mauzaId = getSelectedMauzaId(selectedMauza);
        const geojson = await getAcres(mauzaId);

        if (geojson?.features?.length) {
          drawBoundaryLevel(ACRE_LEVEL, geojson, acreLayerOpacity);
          currentGeojson.current[ACRE_LEVEL] = geojson;
          setFeatureCount(geojson.features.length);
          reportLoadedFeatures(geojson);
          zoomToGeoJSON(geojson, { padding: 70, duration: 500 });
        } else {
          clearBoundaryLevel(ACRE_LEVEL);
          delete currentGeojson.current[ACRE_LEVEL];
          setFeatureCount(0);
          reportLoadedFeatures(emptyFeatureCollection());
        }
      } catch (e) {
        console.error("Acre boundary load error:", e);
        setError("Failed to load Acre Boundary");
      } finally {
        setIsLoading(false);
      }
    };

    loadAcres();
  }, [selectedMauza, isMapReady, acreLayerVisible]);

  useEffect(() => {
    if (!isMapReady) return;

    let cancelled = false;

    const loadAreaBasedPoints = async () => {
      try {
        const areaGeojson = await resolveOpenAreaGeoJSON();
        const hasArea = !!areaGeojson?.features?.length;

        if (triJunctionPointsVisible && hasArea) {
          const mauzaId = getSelectedMauzaId(selectedMauza);
          const trijunctionGeojson = await getTrijunctionPoints(
            mauzaId ? { mauza_id: mauzaId } : {},
          );
          if (cancelled) return;

          let filteredTriJunctionGeojson = filterPointGeoJSONByArea(
            trijunctionGeojson,
            areaGeojson,
          );

          if (!filteredTriJunctionGeojson.features.length && selectedMauza) {
            filteredTriJunctionGeojson = {
              type: "FeatureCollection",
              features: explodePointGeoJSON(trijunctionGeojson).features.filter(
                (feature) => pointBelongsToMauza(feature, selectedMauza),
              ),
            };
          }

          filteredTriJunctionGeojson = {
            type: "FeatureCollection",
            features: filteredTriJunctionGeojson.features.map((feature) => ({
              ...feature,
              properties: {
                ...(feature?.properties || {}),
                _layerType: "triJunctionPoints",
              },
            })),
          };

          if (filteredTriJunctionGeojson.features.length) {
            drawTriJunctionLayer({
              sourceId: TRI_JUNCTION_POINTS_SOURCE,
              layerId: TRI_JUNCTION_POINTS_LAYER,
              geojson: filteredTriJunctionGeojson,
            });
            currentGeojson.current["tri-junction-points"] =
              filteredTriJunctionGeojson;
            movePointLayersToTop();
          } else {
            clearTriJunctionLayer();
            delete currentGeojson.current["tri-junction-points"];
          }
        } else {
          clearTriJunctionLayer();
          delete currentGeojson.current["tri-junction-points"];
        }

        if (fieldPointsVisible && hasArea) {
          const mauzaId = getSelectedMauzaId(selectedMauza);
          const fieldPointsGeojson = await getFieldPoints(mauzaId);
          if (cancelled) return;

          const validFieldPointsGeojson =
            keepValidPointFeaturesForMap(fieldPointsGeojson);

          if (
            (fieldPointsGeojson?.features || []).length &&
            !validFieldPointsGeojson.features.length
          ) {
            console.warn(
              "Field Points were fetched but their geom coordinates are not valid EPSG:4326 lon/lat. Fix the fieldpoints.geom SRID/coordinates in PostGIS.",
              fieldPointsGeojson,
            );
          }

          let filteredFieldPointsGeojson = filterPointGeoJSONByArea(
            validFieldPointsGeojson,
            areaGeojson,
          );

          if (!filteredFieldPointsGeojson.features.length && selectedMauza) {
            filteredFieldPointsGeojson = {
              type: "FeatureCollection",
              features: validFieldPointsGeojson.features.filter((feature) =>
                featureMatchesSelectedMauza(feature, selectedMauza),
              ),
            };
          }

          const preparedFieldPointsGeojson = {
            type: "FeatureCollection",
            features: filteredFieldPointsGeojson.features.map((feature) => ({
              ...feature,
              properties: {
                ...(feature?.properties || {}),
                _layerType: "fieldPoints",
              },
            })),
          };

          if (preparedFieldPointsGeojson.features.length) {
            drawPointLayer({
              sourceId: FIELD_POINTS_SOURCE,
              layerId: FIELD_POINTS_LAYER,
              geojson: preparedFieldPointsGeojson,
              color: fieldPointsColor,
              strokeColor: fieldPointsColor,
              radius: 4.5,
              opacity: fieldPointsOpacity / 100,
              labelLayerId: FIELD_POINTS_LABEL,
              labelExpression: VECTOR_LABEL_FIELDS.fieldPoints,
              labelColor: VECTOR_LAYER_THEME.fieldPoints.label,
              labelMinZoom: 15,
            });
            currentGeojson.current["field-points"] = preparedFieldPointsGeojson;
            movePointLayersToTop();
          } else {
            clearPointLayer(FIELD_POINTS_SOURCE, FIELD_POINTS_LAYER);
            delete currentGeojson.current["field-points"];
          }
        } else {
          clearPointLayer(FIELD_POINTS_SOURCE, FIELD_POINTS_LAYER);
          delete currentGeojson.current["field-points"];
        }
      } catch (e) {
        if (!cancelled) {
          console.error("Area based points load error:", e);
          setError("Failed to load area based points");
        }
      }
    };

    loadAreaBasedPoints();

    return () => {
      cancelled = true;
    };
  }, [
    isMapReady,
    selectedMauza,
    selectedFeatureNumber,
    triJunctionPointsVisible,
    fieldPointsVisible,
  ]);

  useEffect(() => {
    const shouldShowKhasra =
      !!selectedMauza &&
      isMapReady &&
      khasraLayerVisible &&
      (viewBy === "khasra" || khasraLayerForceLoad);

    if (!shouldShowKhasra) {
      clearKhasraLayers();
      delete currentGeojson.current.khasra;
      return;
    }

    const loadKhasras = async () => {
      try {
        setIsLoading(true);
        setError("");

        const mauzaId = getSelectedMauzaId(selectedMauza);

        const geojson = await getKhasras(mauzaId);

        if (geojson?.features?.length) {
          drawKhasras(geojson);
        } else {
          clearKhasraLayers();
          delete currentGeojson.current.khasra;
          setFeatureCount(0);
        }
      } catch (e) {
        console.error("Khasra load error:", e);
        setError("Failed to load Khasras");
      } finally {
        setIsLoading(false);
      }
    };

    loadKhasras();
  }, [
    selectedMauza,
    isMapReady,
    viewBy,
    khasraLayerVisible,
    khasraLayerForceLoad,
  ]);

  useEffect(() => {
    const shouldShowMurabba =
      !!selectedMauza &&
      isMapReady &&
      murabbaLayerVisible &&
      (viewBy === "murabba" || murabbaLayerForceLoad);

    if (!shouldShowMurabba) {
      clearMurabbaLayers();
      delete currentGeojson.current.murabba;
      return;
    }

    const loadMurabbas = async () => {
      try {
        setIsLoading(true);
        setError("");

        const mauzaId = getSelectedMauzaId(selectedMauza);

        const geojson = await getMurabbas(mauzaId);

        if (geojson?.features?.length) {
          drawMurabbas(geojson);
        } else {
          clearMurabbaLayers();
          delete currentGeojson.current.murabba;
          setFeatureCount(0);
        }
      } catch (e) {
        console.error("Murabba load error:", e);
        setError("Failed to load Murabbas");
      } finally {
        setIsLoading(false);
      }
    };

    loadMurabbas();
  }, [
    selectedMauza,
    isMapReady,
    viewBy,
    murabbaLayerVisible,
    murabbaLayerForceLoad,
  ]);

  useEffect(() => {
    if (!isMapReady) return;

    const mauzaName =
      typeof selectedMauza === "object"
        ? selectedMauza?.mauza?.trim?.() || ""
        : "";

    const loadPoints = async () => {
      try {
        const normalizedMauza = (mauzaName || "").trim().toLowerCase();

        if (controlPointsVisible && normalizedMauza) {
          const controlGeojson = await getTrijunctionPoints({
            mauza: mauzaName,
            type: "B",
          });

          const filteredControlGeojson = {
            type: "FeatureCollection",
            features: (controlGeojson?.features || []).filter((feature) => {
              const m3Value = String(feature?.properties?.m3 || "")
                .trim()
                .toLowerCase();
              return m3Value === normalizedMauza;
            }),
          };

          if (filteredControlGeojson.features.length) {
            drawPointLayer({
              sourceId: CONTROL_POINTS_SOURCE,
              layerId: CONTROL_POINTS_LAYER,
              geojson: filteredControlGeojson,
              color: "#f59e0b",
              strokeColor: "#78350f",
              radius: 5,
            });
            currentGeojson.current["control-points"] = filteredControlGeojson;
          } else {
            clearPointLayer(CONTROL_POINTS_SOURCE, CONTROL_POINTS_LAYER);
            delete currentGeojson.current["control-points"];
          }
        } else {
          clearPointLayer(CONTROL_POINTS_SOURCE, CONTROL_POINTS_LAYER);
          delete currentGeojson.current["control-points"];
        }

        // Tri Junction Points are loaded by the area-based point loader above.
        // Keeping that logic in one place prevents the styled TJ/Burji layer
        // from being overwritten by this older m3-only loader.
      } catch (e) {
        console.error("Failed to load trijunction points:", e);
        setError("Failed to load control / tri-junction points");
      }
    };

    loadPoints();
  }, [isMapReady, selectedMauza, controlPointsVisible]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !isMapReady) return;

    const restoreHanduGujranOrtho = () => {
      restoreHanduGujranOrthoLayer({
        map,
        visible: handuGujranOrthoVisible,
        opacity: handuGujranOrthoOpacity,
      });

      if (handuGujranOrthoVisible && !prevHanduGujranOrthoVisible.current) {
        map.fitBounds(HANDU_GUJRAN_BOUNDS, {
          padding: 50,
          duration: 1500,
        });
      }

      prevHanduGujranOrthoVisible.current = handuGujranOrthoVisible;
    };

    restoreHanduGujranOrtho();

    map.on("style.load", restoreHanduGujranOrtho);

    return () => {
      map.off("style.load", restoreHanduGujranOrtho);
    };
  }, [handuGujranOrthoVisible, handuGujranOrthoOpacity, isMapReady]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !isMapReady) return;

    const measureVisible =
      typeof layers?.measure === "object"
        ? layers.measure.visible
        : !!layers?.measure;

    const updateMeasureSource = () => {
      const coords = measureCoordsRef.current;
      const features = [];

      if (coords.length > 0) {
        coords.forEach((coord) => {
          features.push(turf.point(coord));
        });
      }

      if (coords.length > 1) {
        const line = turf.lineString(coords);
        features.push(line);

        const distance = turf.length(line, { units: "kilometers" });
        // Add a label point at the end
        const lastPoint = turf.point(coords[coords.length - 1], {
          distance: `${distance.toFixed(2)} km`,
        });
        features.push(lastPoint);
      }

      if (map.getSource(MEASURE_SOURCE)) {
        map.getSource(MEASURE_SOURCE).setData(turf.featureCollection(features));
      }
    };

    const handleMapClick = (e) => {
      measureCoordsRef.current.push([e.lngLat.lng, e.lngLat.lat]);
      updateMeasureSource();
    };

    const handleMapRightClick = (e) => {
      e.preventDefault();
      // clear measure on right click
      measureCoordsRef.current = [];
      updateMeasureSource();
    };

    if (measureVisible) {
      map.getCanvas().style.cursor = "crosshair";

      ensureMeasureLayerStyles({
        map,
        emptyGeojson: emptyFeatureCollection(),
      });

      map.on("click", handleMapClick);
      map.on("contextmenu", handleMapRightClick);

      updateMeasureSource();
    } else {
      map.getCanvas().style.cursor = "";
      measureCoordsRef.current = [];

      if (map.getSource(MEASURE_SOURCE)) {
        map.getSource(MEASURE_SOURCE).setData(emptyFeatureCollection());
      }

      map.off("click", handleMapClick);
      map.off("contextmenu", handleMapRightClick);
    }

    return () => {
      map.off("click", handleMapClick);
      map.off("contextmenu", handleMapRightClick);
      if (map.getCanvas()) {
        map.getCanvas().style.cursor = "";
      }
    };
  }, [layers?.measure, isMapReady]);

  // ── Area Measure Tool ──────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !isMapReady) return;

    const areaVisible =
      typeof layers?.measureArea === "object"
        ? layers.measureArea.visible
        : !!layers?.measureArea;

    const clearAreaLayers = () => {
      try {
        if (map.getLayer(MEASURE_AREA_LABEL_LAYER))
          map.removeLayer(MEASURE_AREA_LABEL_LAYER);
        if (map.getLayer(MEASURE_AREA_FILL_LAYER))
          map.removeLayer(MEASURE_AREA_FILL_LAYER);
        if (map.getLayer(MEASURE_AREA_LINE_LAYER))
          map.removeLayer(MEASURE_AREA_LINE_LAYER);
        if (map.getLayer(MEASURE_AREA_POINTS_LAYER))
          map.removeLayer(MEASURE_AREA_POINTS_LAYER);
        if (map.getSource(MEASURE_AREA_SOURCE))
          map.removeSource(MEASURE_AREA_SOURCE);
      } catch (e) {
        /* ignore */
      }
    };

    const updateAreaSource = (closed = false) => {
      const coords = measureAreaCoordsRef.current;
      const features = [];

      coords.forEach((c) => features.push(turf.point(c)));

      if (coords.length >= 2) {
        const lineCoords = closed ? [...coords, coords[0]] : coords;
        features.push(turf.lineString(lineCoords));
      }

      if (closed && coords.length >= 3) {
        const poly = turf.polygon([[...coords, coords[0]]]);
        features.push(poly);
        const areaSqM = turf.area(poly);
        const areaAcres = areaSqM / 4046.8564224;
        const areaKanal = areaAcres * 8;
        const centroid = turf.centroid(poly);
        centroid.properties = {
          areaLabel: `${areaSqM.toFixed(0)} m²  |  ${areaAcres.toFixed(3)} ac  |  ${areaKanal.toFixed(2)} kanal`,
        };
        features.push(centroid);
      }

      if (map.getSource(MEASURE_AREA_SOURCE)) {
        map
          .getSource(MEASURE_AREA_SOURCE)
          .setData(turf.featureCollection(features));
      }
    };

    const handleClick = (e) => {
      measureAreaCoordsRef.current.push([e.lngLat.lng, e.lngLat.lat]);
      updateAreaSource(false);
    };

    const handleRightClick = (e) => {
      e.preventDefault();
      if (measureAreaCoordsRef.current.length >= 3) {
        updateAreaSource(true);
      } else {
        measureAreaCoordsRef.current = [];
        updateAreaSource(false);
      }
    };

    if (areaVisible) {
      map.getCanvas().style.cursor = "crosshair";

      ensureMeasureAreaLayerStyles({
        map,
        emptyGeojson: turf.featureCollection([]),
      });

      map.on("click", handleClick);
      map.on("contextmenu", handleRightClick);
    } else {
      map.getCanvas().style.cursor = "";
      measureAreaCoordsRef.current = [];
      clearAreaLayers();
      map.off("click", handleClick);
      map.off("contextmenu", handleRightClick);
    }

    return () => {
      map.off("click", handleClick);
      map.off("contextmenu", handleRightClick);
      if (map.getCanvas()) map.getCanvas().style.cursor = "";
    };
  }, [layers?.measureArea, isMapReady]);

  // ── Bearing Tool ──────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !isMapReady) return;

    const bearingVisible =
      typeof layers?.measureBearing === "object"
        ? layers.measureBearing.visible
        : !!layers?.measureBearing;

    const clearBearingLayers = () => {
      try {
        if (map.getLayer(BEARING_LABEL_LAYER))
          map.removeLayer(BEARING_LABEL_LAYER);
        if (map.getLayer(BEARING_LINE_LAYER))
          map.removeLayer(BEARING_LINE_LAYER);
        if (map.getLayer(BEARING_POINTS_LAYER))
          map.removeLayer(BEARING_POINTS_LAYER);
        if (map.getSource(BEARING_SOURCE)) map.removeSource(BEARING_SOURCE);
      } catch (e) {
        /* ignore */
      }
    };

    const updateBearingSource = () => {
      const coords = bearingCoordsRef.current;
      const features = [];

      coords.forEach((c) => features.push(turf.point(c)));

      if (coords.length === 2) {
        features.push(turf.lineString(coords));
        const bearing = turf.bearing(
          turf.point(coords[0]),
          turf.point(coords[1]),
        );
        const dist = turf.distance(
          turf.point(coords[0]),
          turf.point(coords[1]),
          { units: "meters" },
        );
        const midpoint = turf.midpoint(
          turf.point(coords[0]),
          turf.point(coords[1]),
        );
        midpoint.properties = {
          bearingLabel: `${bearing.toFixed(1)}°  ·  ${dist.toFixed(1)} m`,
        };
        features.push(midpoint);
      }

      if (map.getSource(BEARING_SOURCE)) {
        map.getSource(BEARING_SOURCE).setData(turf.featureCollection(features));
      }
    };

    const handleClick = (e) => {
      if (bearingCoordsRef.current.length >= 2) {
        bearingCoordsRef.current = [[e.lngLat.lng, e.lngLat.lat]];
      } else {
        bearingCoordsRef.current.push([e.lngLat.lng, e.lngLat.lat]);
      }
      updateBearingSource();
    };

    const handleRightClick = (e) => {
      e.preventDefault();
      bearingCoordsRef.current = [];
      updateBearingSource();
    };

    if (bearingVisible) {
      map.getCanvas().style.cursor = "crosshair";

      ensureBearingLayerStyles({
        map,
        emptyGeojson: turf.featureCollection([]),
      });

      map.on("click", handleClick);
      map.on("contextmenu", handleRightClick);
    } else {
      map.getCanvas().style.cursor = "";
      bearingCoordsRef.current = [];
      clearBearingLayers();
      map.off("click", handleClick);
      map.off("contextmenu", handleRightClick);
    }

    return () => {
      map.off("click", handleClick);
      map.off("contextmenu", handleRightClick);
      if (map.getCanvas()) map.getCanvas().style.cursor = "";
    };
  }, [layers?.measureBearing, isMapReady]);

  // ── Coordinate Picker ────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !isMapReady) return;

    const coordVisible =
      typeof layers?.coordPicker === "object"
        ? layers.coordPicker.visible
        : !!layers?.coordPicker;

    const handleClick = (e) => {
      const { lng, lat } = e.lngLat;
      const lngStr = lng.toFixed(6);
      const latStr = lat.toFixed(6);

      if (coordPickerPopupRef.current) {
        coordPickerPopupRef.current.remove();
        coordPickerPopupRef.current = null;
      }

      navigator.clipboard?.writeText(`${latStr}, ${lngStr}`).catch(() => {});

      const html = buildUnifiedPopupHtml("Coordinates", [
        ["Latitude", latStr],
        ["Longitude", lngStr],
        ["Copied", "✓ Copied to clipboard"],
      ]);

      if (coordPickerPopupRef.current) {
        coordPickerPopupRef.current.remove();
        coordPickerPopupRef.current = null;
      }

      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 15,
        maxWidth: "none",
        className: "mapview-unified-popup",
      })
        .setLngLat([lng, lat])
        .setHTML(html)
        .addTo(map);

      // Apply GISMetaverse shell styling
      const el = popup.getElement();
      const content = el?.querySelector(".mapboxgl-popup-content");
      if (content)
        content.style.cssText =
          "padding:0;background:transparent;box-shadow:none;border-radius:10px;";
      const tip = el?.querySelector(".mapboxgl-popup-tip");
      if (tip) tip.style.borderTopColor = "#111827";
      const closeBtn = el?.querySelector("[data-mapview-popup-close]");
      if (closeBtn)
        closeBtn.addEventListener("click", () => {
          popup.remove();
          coordPickerPopupRef.current = null;
        });

      coordPickerPopupRef.current = popup;
      popup.on("close", () => {
        coordPickerPopupRef.current = null;
      });
    };

    if (coordVisible) {
      map.getCanvas().style.cursor = "crosshair";
      map.on("click", handleClick);
    } else {
      map.getCanvas().style.cursor = "";
      if (coordPickerPopupRef.current) {
        coordPickerPopupRef.current.remove();
        coordPickerPopupRef.current = null;
      }
      map.off("click", handleClick);
    }

    return () => {
      map.off("click", handleClick);
      if (map.getCanvas()) map.getCanvas().style.cursor = "";
    };
  }, [layers?.coordPicker, isMapReady]);

  // ── Buffer Tool ───────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !isMapReady) return;

    const bufferVisible =
      typeof layers?.measureBuffer === "object"
        ? layers.measureBuffer.visible
        : !!layers?.measureBuffer;

    const clearBufferLayers = () => {
      try {
        if (map.getLayer(BUFFER_CENTER_LAYER))
          map.removeLayer(BUFFER_CENTER_LAYER);
        if (map.getLayer(BUFFER_FILL_LAYER)) map.removeLayer(BUFFER_FILL_LAYER);
        if (map.getLayer(BUFFER_LINE_LAYER)) map.removeLayer(BUFFER_LINE_LAYER);
        if (map.getSource(BUFFER_SOURCE)) map.removeSource(BUFFER_SOURCE);
      } catch (e) {
        /* ignore */
      }
    };

    const handleClick = (e) => {
      const { lng, lat } = e.lngLat;
      const pt = turf.point([lng, lat]);
      const buffered = turf.buffer(pt, BUFFER_RADIUS_M, { units: "meters" });
      const features = [pt, buffered];

      if (!map.getSource(BUFFER_SOURCE)) {
        addBufferLayerStyles({
          map,
          featureCollection: turf.featureCollection(features),
        });
      } else {
        map.getSource(BUFFER_SOURCE).setData(turf.featureCollection(features));
      }
    };

    const handleRightClick = (e) => {
      e.preventDefault();
      clearBufferLayers();
    };

    if (bufferVisible) {
      map.getCanvas().style.cursor = "crosshair";
      map.on("click", handleClick);
      map.on("contextmenu", handleRightClick);
    } else {
      map.getCanvas().style.cursor = "";
      clearBufferLayers();
      map.off("click", handleClick);
      map.off("contextmenu", handleRightClick);
    }

    return () => {
      map.off("click", handleClick);
      map.off("contextmenu", handleRightClick);
      if (map.getCanvas()) map.getCanvas().style.cursor = "";
    };
  }, [layers?.measureBuffer, isMapReady]);

  // ── Print / Export Map ────────────────────────────────────────────────────
  // Exposed via ref so parent can trigger it without toggling layer state
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !isMapReady) return;

    const printVisible =
      typeof layers?.printMap === "object"
        ? layers.printMap.visible
        : !!layers?.printMap;

    if (!printVisible) return;

    try {
      const canvas = map.getCanvas();
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `map-export-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.warn(
        "Map export failed — ensure preserveDrawingBuffer is true",
        e,
      );
    }

    // Notify parent to reset the flag so it doesn't re-trigger
    if (typeof onMapReady === "function") {
      // We reuse onMapReady only for the map instance; export reset is handled by MapPage
    }
  }, [layers?.printMap, isMapReady]);

  return (
    <div
      ref={mapWrapperRef}
      className="absolute inset-0 w-full h-full bg-white"
    >
      <div
        ref={mapRef}
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: "auto" }}
      />

      {/* <MapControls
        map={isMapReady ? mapInstance.current : null}
        fullscreenTargetRef={mapWrapperRef}
      /> */}

      {error && (
        <div className="absolute top-5 left-5 bg-red-500 text-white px-4 py-2 rounded shadow">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="absolute top-5 right-24 z-50 bg-blue-500 text-white px-4 py-2 rounded shadow">
          Loading...
        </div>
      )}
    </div>
  );
}

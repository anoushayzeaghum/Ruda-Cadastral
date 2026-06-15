import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import * as turf from "@turf/turf";

import {
  getDistrictBoundary,
  getTehsilBoundary,
  getMauzaBoundary,
  getSocietyGeoJSON,
  getSocietyBoundaryGeoJSONBySocietyId,
  getMasterPlanGeoJSON,
  getSpotLevelGeoJSON,
  getContourGeoJSON,
} from "../../services/api";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const DEFAULT_CENTER = [69.3451, 30.3753];
const DEFAULT_ZOOM = 5;

const BASEMAP_STYLES = {
  Satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  Streets: "mapbox://styles/mapbox/streets-v12",
  Light: "mapbox://styles/mapbox/light-v11",
  Dark: "mapbox://styles/mapbox/dark-v11",
  Outdoors: "mapbox://styles/mapbox/outdoors-v12",
};

const SELECTED_SOURCE = "selected-source";
const SELECTED_FILL = "selected-fill";
const SELECTED_LINE = "selected-line";

const DSM_SOURCE = "local-dsm-source";
const DSM_LAYER = "local-dsm-layer";
const DTM_SOURCE = "local-dtm-source";
const DTM_LAYER = "local-dtm-layer";
const ORTHO_SOURCE = "local-ortho-source";
const ORTHO_LAYER = "local-ortho-layer";

const MEASURE_SOURCE = "measure-source";
const MEASURE_LINE_LAYER = "measure-line-layer";
const MEASURE_POINTS_LAYER = "measure-points-layer";
const MEASURE_LABELS_LAYER = "measure-labels-layer";

const MEASURE_AREA_SOURCE = "measure-area-source";
const MEASURE_AREA_FILL_LAYER = "measure-area-fill-layer";
const MEASURE_AREA_LINE_LAYER = "measure-area-line-layer";
const MEASURE_AREA_POINTS_LAYER = "measure-area-points-layer";
const MEASURE_AREA_LABEL_LAYER = "measure-area-label-layer";

const BEARING_SOURCE = "bearing-source";
const BEARING_LINE_LAYER = "bearing-line-layer";
const BEARING_POINTS_LAYER = "bearing-points-layer";
const BEARING_LABEL_LAYER = "bearing-label-layer";

const BUFFER_SOURCE = "buffer-source";
const BUFFER_FILL_LAYER = "buffer-fill-layer";
const BUFFER_LINE_LAYER = "buffer-line-layer";
const BUFFER_CENTER_LAYER = "buffer-center-layer";

const SNAP_SOURCE = "snap-source";
const SNAP_LAYER = "snap-layer";
const SNAP_LINE_LAYER = "snap-line-layer";
const SNAP_LABEL_LAYER = "snap-label-layer";

const emptyFeatureCollection = () => ({
  type: "FeatureCollection",
  features: [],
});

const mergeFeatureCollections = (collections) => ({
  type: "FeatureCollection",
  features: collections.flatMap((collection) =>
    Array.isArray(collection?.features) ? collection.features : [],
  ),
});

const getLayerVisible = (layers = {}, key, fallback = true) => {
  const value = layers?.[key];
  if (typeof value === "object") return value.visible !== false;
  if (typeof value === "boolean") return value;
  return fallback;
};

const getLayerOpacity = (layers = {}, key, fallback = 100) => {
  const value = layers?.[key];
  if (typeof value === "object" && Number.isFinite(Number(value.opacity))) {
    return Number(value.opacity);
  }
  return fallback;
};

const getSocietyBoundaryId = (society) =>
  society?.gid ?? society?.id ?? society?.objectid;

const getSocietyDataId = (society) =>
  society?.society_id ??
  society?.properties?.society_id ??
  getSocietyBoundaryId(society);

const getMauzaBoundaryId = (selectedMauza, selectedMauzaId) =>
  selectedMauza?.mauza_id ??
  selectedMauza?.properties?.mauza_id ??
  selectedMauza?.id ??
  selectedMauza?.gid ??
  selectedMauzaId ??
  selectedMauza;

function ringArea(coords) {
  let area = 0;
  if (!coords?.length) return 0;

  for (let i = 0, len = coords.length; i < len; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % len];
    const lon1 = (p1[0] * Math.PI) / 180;
    const lat1 = (p1[1] * Math.PI) / 180;
    const lon2 = (p2[0] * Math.PI) / 180;
    const lat2 = (p2[1] * Math.PI) / 180;
    area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  return (Math.abs(area) * 6378137 * 6378137) / 2.0;
}

function computeArea(feature) {
  if (!feature?.geometry) return 0;

  const geom = feature.geometry;
  let total = 0;

  if (geom.type === "Polygon") {
    geom.coordinates.forEach((ring) => {
      total += ringArea(ring);
    });
  } else if (geom.type === "MultiPolygon") {
    geom.coordinates.forEach((poly) => {
      poly.forEach((ring) => {
        total += ringArea(ring);
      });
    });
  }

  return Math.abs(total);
}

export default function MapView({
  selectedDistrict,
  selectedTehsil,
  selectedMauza,
  selectedMauzaId,
  selectedSociety,
  onParcelSelect,
  layers = {},
  basemap = "Streets",
  clearSelectionSignal = 0,
}) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const currentGeojson = useRef({});

  const prevDemVisible = useRef(false);
  const prevDtmVisible = useRef(false);
  const prevOrthoVisible = useRef(false);

  const measureCoordsRef = useRef([]);
  const measureAreaCoordsRef = useRef([]);
  const bearingCoordsRef = useRef([]);
  const coordPickerPopupRef = useRef(null);
  const locationMarkerRef = useRef(null);

  const [isMapReady, setIsMapReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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

      map.on("load", () => setIsMapReady(true));
      map.on("style.load", () => restoreLayers());
      map.on("error", (e) => {
        console.error("Map error:", e);
        setError("Error initializing map");
      });

      mapInstance.current = map;

      return () => {
        map.remove();
        mapInstance.current = null;
      };
    } catch (e) {
      console.error("Map initialization error:", e);
      setError("Failed to initialize map");
    }
  }, []);

  const getIds = (key) => ({
    source: `${key}-source`,
    fill: `${key}-fill`,
    line: `${key}-line`,
    circle: `${key}-circle`,
  });

  const clearLayer = (key) => {
    const map = mapInstance.current;
    if (!map) return;

    const ids = getIds(key);
    try {
      [ids.fill, ids.line, ids.circle].forEach((id) => {
        if (map.getLayer(id)) map.removeLayer(id);
      });
      if (map.getSource(ids.source)) map.removeSource(ids.source);
    } catch (e) {
      console.warn(`Error clearing ${key}`, e);
    }
  };

  const zoomToGeoJSON = (geojson, options = {}) => {
    const map = mapInstance.current;
    if (!map || !geojson?.features?.length) return;

    const bounds = new mapboxgl.LngLatBounds();

    geojson.features.forEach((feature) => {
      const coords = feature.geometry?.coordinates;
      if (!coords) return;

      const traverse = (c) => {
        if (typeof c?.[0] === "number") bounds.extend(c);
        else if (Array.isArray(c)) c.forEach(traverse);
      };

      traverse(coords);
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: options.padding ?? 45,
        duration: options.duration ?? 350,
        essential: true,
      });
    }
  };

  const ensureSelectedLayers = () => {
    const map = mapInstance.current;
    if (!map) return;

    if (!map.getSource(SELECTED_SOURCE)) {
      map.addSource(SELECTED_SOURCE, {
        type: "geojson",
        data: emptyFeatureCollection(),
      });
    }

    if (!map.getLayer(SELECTED_FILL)) {
      map.addLayer({
        id: SELECTED_FILL,
        type: "fill",
        source: SELECTED_SOURCE,
        paint: { "fill-color": "#FFD54F", "fill-opacity": 0.65 },
      });
    }

    if (!map.getLayer(SELECTED_LINE)) {
      map.addLayer({
        id: SELECTED_LINE,
        type: "line",
        source: SELECTED_SOURCE,
        paint: { "line-color": "#b38f00", "line-width": 2.5 },
      });
    }
  };

  const clearSelectedFeature = () => {
    const map = mapInstance.current;
    if (!map) return;

    try {
      map.getSource(SELECTED_SOURCE)?.setData(emptyFeatureCollection());
    } catch (e) {
      console.warn("Could not clear selected feature", e);
    }
  };

  const drawPolygonLayer = ({
    key,
    geojson,
    fillColor,
    lineColor,
    opacity,
    clickable,
  }) => {
    const map = mapInstance.current;
    if (!map) return;

    clearLayer(key);
    if (!geojson?.features || !Array.isArray(geojson.features)) return;

    const ids = getIds(key);

    map.addSource(ids.source, { type: "geojson", data: geojson });
    map.addLayer({
      id: ids.fill,
      type: "fill",
      source: ids.source,
      paint: {
        "fill-color": fillColor,
        "fill-opacity": opacity,
      },
    });
    map.addLayer({
      id: ids.line,
      type: "line",
      source: ids.source,
      paint: {
        "line-color": lineColor,
        "line-width": 2,
      },
    });

    if (clickable) {
      ensureSelectedLayers();
      map.on("click", ids.fill, (e) => {
        if (!e.features?.length) return;

        const feature = e.features[0];
        const area_m2 = computeArea(feature);
        const area_acres = area_m2 / 4046.8564224;
        const selectedGeo = { type: "FeatureCollection", features: [feature] };

        try {
          map.getSource(SELECTED_SOURCE)?.setData(selectedGeo);
        } catch (err) {
          console.warn("Could not set selected society", err);
        }

        if (typeof onParcelSelect === "function") {
          const cloned = JSON.parse(JSON.stringify(feature));
          cloned.properties = cloned.properties || {};
          cloned.properties._area_m2 = area_m2;
          cloned.properties._area_acres = area_acres;
          cloned.properties._layerType = "society";
          onParcelSelect(cloned);
        }
      });

      map.on("mouseenter", ids.fill, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", ids.fill, () => {
        map.getCanvas().style.cursor = "";
      });
    }

    currentGeojson.current[key] = geojson;
  };

  const drawLineLayer = ({ key, geojson, color, opacity }) => {
    const map = mapInstance.current;
    if (!map) return;

    clearLayer(key);
    if (!geojson?.features || !Array.isArray(geojson.features)) return;

    const ids = getIds(key);
    map.addSource(ids.source, { type: "geojson", data: geojson });
    map.addLayer({
      id: ids.line,
      type: "line",
      source: ids.source,
      paint: {
        "line-color": color,
        "line-width": 1.5,
        "line-opacity": opacity,
      },
    });

    currentGeojson.current[key] = geojson;
  };

  const drawPointLayer = ({ key, geojson, color, opacity }) => {
    const map = mapInstance.current;
    if (!map) return;

    clearLayer(key);
    if (!geojson?.features || !Array.isArray(geojson.features)) return;

    const ids = getIds(key);
    map.addSource(ids.source, { type: "geojson", data: geojson });
    map.addLayer({
      id: ids.circle,
      type: "circle",
      source: ids.source,
      paint: {
        "circle-radius": 4,
        "circle-color": color,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#ffffff",
        "circle-opacity": opacity,
      },
    });

    currentGeojson.current[key] = geojson;
  };

  const restoreLayers = () => {
    const saved = { ...currentGeojson.current };
    currentGeojson.current = {};

    Object.entries(saved).forEach(([key, geojson]) => {
      if (key === "district") {
        if (getLayerVisible(layers, "districtBoundary", true)) {
          drawPolygonLayer({
            key,
            geojson,
            fillColor: "#0b6a2e",
            lineColor: "#194c8e",
            opacity: getLayerOpacity(layers, "districtBoundary", 0) / 100,
          });
        }
      } else if (key === "tehsil") {
        if (getLayerVisible(layers, "tehsilBoundary", true)) {
          drawPolygonLayer({
            key,
            geojson,
            fillColor: "#0b6a2e",
            lineColor: "#194c8e",
            opacity: getLayerOpacity(layers, "tehsilBoundary", 0) / 100,
          });
        }
      } else if (key === "mauza") {
        if (getLayerVisible(layers, "mauzaBoundary", true)) {
          drawPolygonLayer({
            key,
            geojson,
            fillColor: "#0b6a2e",
            lineColor: "#194c8e",
            opacity: getLayerOpacity(layers, "mauzaBoundary", 0) / 100,
          });
        }
      } else if (key === "societyBoundary") {
        if (getLayerVisible(layers, "societyBoundary", true)) {
          drawPolygonLayer({
            key,
            geojson,
            fillColor: "#158033",
            lineColor: "#0f3d2e",
            opacity: getLayerOpacity(layers, "societyBoundary", 25) / 100,
            clickable: true,
          });
        }
      } else if (key === "masterPlan") {
        drawPolygonLayer({
          key,
          geojson,
          fillColor: "#7c3aed",
          lineColor: "#4c1d95",
          opacity: getLayerOpacity(layers, "masterPlan", 70) / 100,
        });
      } else if (key === "spotLevel") {
        drawPointLayer({
          key,
          geojson,
          color: "#dc2626",
          opacity: getLayerOpacity(layers, "spotLevel", 100) / 100,
        });
      } else if (key === "contours") {
        drawLineLayer({
          key,
          geojson,
          color: "#92400e",
          opacity: getLayerOpacity(layers, "contours", 100) / 100,
        });
      }
    });
  };

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !isMapReady) return;

    const styleUrl = BASEMAP_STYLES[basemap] || basemap;
    if (!styleUrl) return;

    try {
      map.setStyle(styleUrl);
    } catch (e) {
      console.error("Failed to change basemap style", e);
    }
  }, [basemap, isMapReady]);

  useEffect(() => {
    if (!isMapReady) return;
    clearSelectedFeature();
  }, [clearSelectionSignal, isMapReady]);

  useEffect(() => {
    if (!isMapReady) return;

    let cancelled = false;

    const loadBoundary = async () => {
      try {
        setIsLoading(true);
        setError("");

        ["district", "tehsil", "mauza"].forEach((key) => {
          clearLayer(key);
          delete currentGeojson.current[key];
        });

        const loadedGeojsons = [];

        if (selectedDistrict?.length) {
          const geojsons = await Promise.all(
            selectedDistrict.map((d) => getDistrictBoundary(d.id || d)),
          );
          if (cancelled) return;
          const merged = mergeFeatureCollections(geojsons);
          if (merged.features.length) {
            loadedGeojsons.push(merged);
            if (getLayerVisible(layers, "districtBoundary", true)) {
              drawPolygonLayer({
                key: "district",
                geojson: merged,
                fillColor: "#0b6a2e",
                lineColor: "#194c8e",
                opacity: getLayerOpacity(layers, "districtBoundary", 0) / 100,
              });
            } else {
              currentGeojson.current.district = merged;
            }
          }
        }

        if (selectedTehsil?.length) {
          const geojsons = await Promise.all(
            selectedTehsil.map((t) => getTehsilBoundary(t.id || t)),
          );
          if (cancelled) return;
          const merged = mergeFeatureCollections(geojsons);
          if (merged.features.length) {
            loadedGeojsons.push(merged);
            if (getLayerVisible(layers, "tehsilBoundary", true)) {
              drawPolygonLayer({
                key: "tehsil",
                geojson: merged,
                fillColor: "#0b6a2e",
                lineColor: "#194c8e",
                opacity: getLayerOpacity(layers, "tehsilBoundary", 0) / 100,
              });
            } else {
              currentGeojson.current.tehsil = merged;
            }
          }
        }

        const mauzaId = getMauzaBoundaryId(selectedMauza, selectedMauzaId);

        if (mauzaId) {
          const geojson = await getMauzaBoundary(mauzaId);
          if (cancelled) return;
          if (geojson?.features?.length) {
            loadedGeojsons.push(geojson);
            if (getLayerVisible(layers, "mauzaBoundary", true)) {
              drawPolygonLayer({
                key: "mauza",
                geojson,
                fillColor: "#0b6a2e",
                lineColor: "#194c8e",
                opacity: getLayerOpacity(layers, "mauzaBoundary", 0) / 100,
              });
            } else {
              currentGeojson.current.mauza = geojson;
            }
          }
        }

        const zoomTarget = loadedGeojsons[loadedGeojsons.length - 1];
        if (zoomTarget?.features?.length) zoomToGeoJSON(zoomTarget);
      } catch (e) {
        if (!cancelled) {
          console.error("Boundary load error:", e);
          setError("Failed to load boundary");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
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
    selectedMauzaId,
    isMapReady,
    layers?.districtBoundary,
    layers?.tehsilBoundary,
    layers?.mauzaBoundary,
  ]);

  useEffect(() => {
    if (!isMapReady) return;

    let cancelled = false;

    const loadSocietyBoundary = async () => {
      clearLayer("societyBoundary");
      delete currentGeojson.current.societyBoundary;
      try {
        mapInstance.current
          ?.getSource(SELECTED_SOURCE)
          ?.setData(emptyFeatureCollection());
      } catch (e) {}

      if (!selectedSociety || !getLayerVisible(layers, "societyBoundary", true))
        return;

      try {
        setIsLoading(true);
        setError("");

        const societyDataId = getSocietyDataId(selectedSociety);
        let geojson = null;

        // Prefer fetching by society_id if available (required behavior)
        if (societyDataId) {
          geojson = await getSocietyBoundaryGeoJSONBySocietyId(societyDataId);
        } else {
          const societyGid = getSocietyBoundaryId(selectedSociety);
          geojson = await getSocietyGeoJSON(societyGid);
        }
        if (cancelled) return;

        if (geojson?.features?.length) {
          drawPolygonLayer({
            key: "societyBoundary",
            geojson,
            fillColor: "#158033",
            lineColor: "#0f3d2e",
            opacity: getLayerOpacity(layers, "societyBoundary", 25) / 100,
            clickable: true,
          });
          zoomToGeoJSON(geojson, { padding: 70, duration: 450 });
        }
      } catch (e) {
        if (!cancelled) {
          console.error("Society boundary load error:", e);
          setError("Failed to load society boundary");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadSocietyBoundary();

    return () => {
      cancelled = true;
    };
  }, [selectedSociety, isMapReady, layers?.societyBoundary]);

  useEffect(() => {
    if (!isMapReady) return;

    let cancelled = false;

    const societyDataId = getSocietyDataId(selectedSociety);
    const params = { society_id: societyDataId };

    const loadOptionalLayers = async () => {
      ["masterPlan", "spotLevel", "contours"].forEach((key) => {
        clearLayer(key);
        delete currentGeojson.current[key];
      });

      if (!selectedSociety || !societyDataId) {
        return;
      }

      try {
        if (getLayerVisible(layers, "masterPlan", false)) {
          const geojson = await getMasterPlanGeoJSON(params);
          if (!cancelled && geojson?.features?.length) {
            drawPolygonLayer({
              key: "masterPlan",
              geojson,
              fillColor: "#7c3aed",
              lineColor: "#4c1d95",
              opacity: getLayerOpacity(layers, "masterPlan", 70) / 100,
            });
          }
        } else {
          clearLayer("masterPlan");
          delete currentGeojson.current.masterPlan;
        }

        if (getLayerVisible(layers, "spotLevel", false)) {
          const geojson = await getSpotLevelGeoJSON(params);
          if (!cancelled && geojson?.features?.length) {
            drawPointLayer({
              key: "spotLevel",
              geojson,
              color: "#dc2626",
              opacity: getLayerOpacity(layers, "spotLevel", 100) / 100,
            });
          }
        } else {
          clearLayer("spotLevel");
          delete currentGeojson.current.spotLevel;
        }

        if (getLayerVisible(layers, "contours", false)) {
          const geojson = await getContourGeoJSON(params);
          if (!cancelled && geojson?.features?.length) {
            drawLineLayer({
              key: "contours",
              geojson,
              color: "#92400e",
              opacity: getLayerOpacity(layers, "contours", 100) / 100,
            });
          }
        } else {
          clearLayer("contours");
          delete currentGeojson.current.contours;
        }
      } catch (e) {
        if (!cancelled) {
          console.error("Society layer load error:", e);
          setError("Failed to load society layer");
        }
      }
    };

    loadOptionalLayers();

    return () => {
      cancelled = true;
    };
  }, [
    selectedSociety,
    selectedMauza,
    selectedMauzaId,
    isMapReady,
    layers?.masterPlan,
    layers?.spotLevel,
    layers?.contours,
  ]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !isMapReady) return;

    const demVisible = getLayerVisible(layers, "dem", false);
    const dtmVisible = getLayerVisible(layers, "dtm", false);
    const orthoVisible = getLayerVisible(layers, "orthoImage", false);

    const shouldFlyTo =
      (orthoVisible && !prevOrthoVisible.current) ||
      (demVisible && !prevDemVisible.current) ||
      (dtmVisible && !prevDtmVisible.current);

    if (shouldFlyTo) {
      const bounds = [
        [74.42562653088396, 31.60509230706726],
        [74.43545280361002, 31.6112165411359],
      ];
      map.fitBounds(bounds, { padding: 50, duration: 1500 });
    }

    prevDemVisible.current = demVisible;
    prevDtmVisible.current = dtmVisible;
    prevOrthoVisible.current = orthoVisible;

    const restoreRasters = () => {
      // Ortho Layer
      const orthoOpacity = getLayerOpacity(layers, "orthoImage", 100) / 100;

      if (orthoVisible) {
        if (!map.getSource(ORTHO_SOURCE)) {
          map.addSource(ORTHO_SOURCE, {
            type: "raster",
            tiles: [
              "http://localhost:8081/data/Chaharbagh_Ortho/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
          });
        }
        if (!map.getLayer(ORTHO_LAYER)) {
          map.addLayer({
            id: ORTHO_LAYER,
            type: "raster",
            source: ORTHO_SOURCE,
            paint: { "raster-opacity": orthoOpacity },
            layout: { visibility: "visible" },
          });
        } else {
          map.setLayoutProperty(ORTHO_LAYER, "visibility", "visible");
          map.setPaintProperty(ORTHO_LAYER, "raster-opacity", orthoOpacity);
        }
      } else {
        if (map.getLayer(ORTHO_LAYER)) {
          map.setLayoutProperty(ORTHO_LAYER, "visibility", "none");
        }
      }

      // DSM (DEM) Layer
      const dsmOpacity = getLayerOpacity(layers, "dem", 85) / 100;

      if (demVisible) {
        if (!map.getSource(DSM_SOURCE)) {
          map.addSource(DSM_SOURCE, {
            type: "raster",
            tiles: [
              "http://localhost:8081/data/Chaharbagh_DSM/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
          });
        }
        if (!map.getLayer(DSM_LAYER)) {
          map.addLayer({
            id: DSM_LAYER,
            type: "raster",
            source: DSM_SOURCE,
            paint: { "raster-opacity": dsmOpacity },
            layout: { visibility: "visible" },
          });
        } else {
          map.setLayoutProperty(DSM_LAYER, "visibility", "visible");
          map.setPaintProperty(DSM_LAYER, "raster-opacity", dsmOpacity);
        }
      } else {
        if (map.getLayer(DSM_LAYER)) {
          map.setLayoutProperty(DSM_LAYER, "visibility", "none");
        }
      }

      // DTM Layer
      const dtmOpacity = getLayerOpacity(layers, "dtm", 85) / 100;

      if (dtmVisible) {
        if (!map.getSource(DTM_SOURCE)) {
          map.addSource(DTM_SOURCE, {
            type: "raster",
            tiles: [
              "http://localhost:8081/data/Chaharbagh_DTM/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
          });
        }
        if (!map.getLayer(DTM_LAYER)) {
          map.addLayer({
            id: DTM_LAYER,
            type: "raster",
            source: DTM_SOURCE,
            paint: { "raster-opacity": dtmOpacity },
            layout: { visibility: "visible" },
          });
        } else {
          map.setLayoutProperty(DTM_LAYER, "visibility", "visible");
          map.setPaintProperty(DTM_LAYER, "raster-opacity", dtmOpacity);
        }
      } else {
        if (map.getLayer(DTM_LAYER)) {
          map.setLayoutProperty(DTM_LAYER, "visibility", "none");
        }
      }
    };

    restoreRasters();

    // Attempt to restore if style changes
    map.on("style.load", restoreRasters);
    return () => {
      map.off("style.load", restoreRasters);
    };
  }, [layers?.dem, layers?.dtm, layers?.orthoImage, isMapReady]);

  // ── Distance Measure Tool ─────────────────────────────────────────────────
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
      coords.forEach((coord) => features.push(turf.point(coord)));
      if (coords.length > 1) {
        const line = turf.lineString(coords);
        features.push(line);
        const distance = turf.length(line, { units: "kilometers" });
        const lastPt = turf.point(coords[coords.length - 1], {
          distance: `${distance.toFixed(2)} km`,
        });
        features.push(lastPt);
      }
      if (map.getSource(MEASURE_SOURCE)) {
        map.getSource(MEASURE_SOURCE).setData(turf.featureCollection(features));
      }
    };

    const handleClick = (e) => {
      measureCoordsRef.current.push([e.lngLat.lng, e.lngLat.lat]);
      updateMeasureSource();
    };
    const handleRightClick = (e) => {
      e.preventDefault();
      measureCoordsRef.current = [];
      updateMeasureSource();
    };

    if (measureVisible) {
      map.getCanvas().style.cursor = "crosshair";
      if (!map.getSource(MEASURE_SOURCE)) {
        map.addSource(MEASURE_SOURCE, {
          type: "geojson",
          data: turf.featureCollection([]),
        });
      }
      if (!map.getLayer(MEASURE_LINE_LAYER)) {
        map.addLayer({
          id: MEASURE_LINE_LAYER,
          type: "line",
          source: MEASURE_SOURCE,
          filter: ["==", "$type", "LineString"],
          paint: {
            "line-color": "#ff0000",
            "line-width": 3,
            "line-dasharray": [2, 2],
          },
        });
      }
      if (!map.getLayer(MEASURE_POINTS_LAYER)) {
        map.addLayer({
          id: MEASURE_POINTS_LAYER,
          type: "circle",
          source: MEASURE_SOURCE,
          filter: ["==", "$type", "Point"],
          paint: {
            "circle-radius": 5,
            "circle-color": "#ffffff",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ff0000",
          },
        });
      }
      if (!map.getLayer(MEASURE_LABELS_LAYER)) {
        map.addLayer({
          id: MEASURE_LABELS_LAYER,
          type: "symbol",
          source: MEASURE_SOURCE,
          filter: ["has", "distance"],
          layout: {
            "text-field": ["get", "distance"],
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
            "text-size": 14,
            "text-anchor": "bottom",
            "text-offset": [0, -1],
          },
          paint: {
            "text-color": "#ff0000",
            "text-halo-color": "#ffffff",
            "text-halo-width": 2,
          },
        });
      }
      map.on("click", handleClick);
      map.on("contextmenu", handleRightClick);
      updateMeasureSource();
    } else {
      map.getCanvas().style.cursor = "";
      measureCoordsRef.current = [];
      try {
        if (map.getLayer(MEASURE_LABELS_LAYER))
          map.removeLayer(MEASURE_LABELS_LAYER);
        if (map.getLayer(MEASURE_POINTS_LAYER))
          map.removeLayer(MEASURE_POINTS_LAYER);
        if (map.getLayer(MEASURE_LINE_LAYER))
          map.removeLayer(MEASURE_LINE_LAYER);
        if (map.getSource(MEASURE_SOURCE)) map.removeSource(MEASURE_SOURCE);
      } catch (e) {
        /* ignore */
      }
      map.off("click", handleClick);
      map.off("contextmenu", handleRightClick);
    }

    return () => {
      map.off("click", handleClick);
      map.off("contextmenu", handleRightClick);
      if (map.getCanvas()) map.getCanvas().style.cursor = "";
    };
  }, [layers?.measure, isMapReady]);

  // ── Area Measure Tool ─────────────────────────────────────────────────────
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
        features.push(
          turf.lineString(closed ? [...coords, coords[0]] : coords),
        );
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
      if (!map.getSource(MEASURE_AREA_SOURCE)) {
        map.addSource(MEASURE_AREA_SOURCE, {
          type: "geojson",
          data: turf.featureCollection([]),
        });
      }
      if (!map.getLayer(MEASURE_AREA_FILL_LAYER)) {
        map.addLayer({
          id: MEASURE_AREA_FILL_LAYER,
          type: "fill",
          source: MEASURE_AREA_SOURCE,
          filter: ["==", "$type", "Polygon"],
          paint: { "fill-color": "#0066ff", "fill-opacity": 0.15 },
        });
      }
      if (!map.getLayer(MEASURE_AREA_LINE_LAYER)) {
        map.addLayer({
          id: MEASURE_AREA_LINE_LAYER,
          type: "line",
          source: MEASURE_AREA_SOURCE,
          filter: [
            "any",
            ["==", "$type", "LineString"],
            ["==", "$type", "Polygon"],
          ],
          paint: {
            "line-color": "#0066ff",
            "line-width": 2,
            "line-dasharray": [2, 2],
          },
        });
      }
      if (!map.getLayer(MEASURE_AREA_POINTS_LAYER)) {
        map.addLayer({
          id: MEASURE_AREA_POINTS_LAYER,
          type: "circle",
          source: MEASURE_AREA_SOURCE,
          filter: ["==", "$type", "Point"],
          paint: {
            "circle-radius": 5,
            "circle-color": "#ffffff",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#0066ff",
          },
        });
      }
      if (!map.getLayer(MEASURE_AREA_LABEL_LAYER)) {
        map.addLayer({
          id: MEASURE_AREA_LABEL_LAYER,
          type: "symbol",
          source: MEASURE_AREA_SOURCE,
          filter: ["has", "areaLabel"],
          layout: {
            "text-field": ["get", "areaLabel"],
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
            "text-size": 12,
            "text-anchor": "center",
          },
          paint: {
            "text-color": "#003399",
            "text-halo-color": "#ffffff",
            "text-halo-width": 2,
          },
        });
      }
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
      if (!map.getSource(BEARING_SOURCE)) {
        map.addSource(BEARING_SOURCE, {
          type: "geojson",
          data: turf.featureCollection([]),
        });
      }
      if (!map.getLayer(BEARING_LINE_LAYER)) {
        map.addLayer({
          id: BEARING_LINE_LAYER,
          type: "line",
          source: BEARING_SOURCE,
          filter: ["==", "$type", "LineString"],
          paint: { "line-color": "#e67e00", "line-width": 2 },
        });
      }
      if (!map.getLayer(BEARING_POINTS_LAYER)) {
        map.addLayer({
          id: BEARING_POINTS_LAYER,
          type: "circle",
          source: BEARING_SOURCE,
          filter: ["==", "$type", "Point"],
          paint: {
            "circle-radius": 6,
            "circle-color": "#ffffff",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#e67e00",
          },
        });
      }
      if (!map.getLayer(BEARING_LABEL_LAYER)) {
        map.addLayer({
          id: BEARING_LABEL_LAYER,
          type: "symbol",
          source: BEARING_SOURCE,
          filter: ["has", "bearingLabel"],
          layout: {
            "text-field": ["get", "bearingLabel"],
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
            "text-size": 13,
            "text-anchor": "bottom",
            "text-offset": [0, -1],
          },
          paint: {
            "text-color": "#b35000",
            "text-halo-color": "#ffffff",
            "text-halo-width": 2,
          },
        });
      }
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

  // ── Coordinate Picker ─────────────────────────────────────────────────────
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
      const popup = new mapboxgl.Popup({
        offset: 10,
        closeButton: true,
        closeOnClick: false,
        maxWidth: "260px",
      })
        .setLngLat([lng, lat])
        .setHTML(
          `
          <div style="font-family:Arial,sans-serif;font-size:12px;line-height:1.6;color:#1f2937;min-width:190px">
            <div style="font-weight:700;color:#0f3d2e;margin-bottom:6px;font-size:13px;">📍 Coordinates</div>
            <div><span style="font-weight:600">Latitude:</span> ${latStr}</div>
            <div><span style="font-weight:600">Longitude:</span> ${lngStr}</div>
            <div style="margin-top:8px;padding:4px 8px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:4px;font-size:11px;color:#166534">
              ✓ Copied to clipboard
            </div>
          </div>
        `,
        )
        .addTo(map);
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

  // ── My Location ───────────────────────────────────────────────────────────
  // One-shot geolocation: fires as soon as the tool is toggled on, pins the
  // user's GPS position with a pulsing marker and auto-deactivates.
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !isMapReady) return;

    const locationVisible =
      typeof layers?.myLocation === "object"
        ? layers.myLocation.visible
        : !!layers?.myLocation;

    if (!locationVisible) return;

    if (!navigator.geolocation) {
      const center = map.getCenter();
      new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: false,
        maxWidth: "240px",
      })
        .setLngLat([center.lng, center.lat])
        .setHTML(
          `<div style="font-family:Arial,sans-serif;font-size:12px;color:#b91c1c">
          Geolocation is not supported by your browser.
        </div>`,
        )
        .addTo(map);
      return;
    }

    // Build a pulsing "you are here" dot element
    const buildPulseEl = () => {
      const wrapper = document.createElement("div");
      wrapper.style.cssText = "position:relative;width:20px;height:20px;";

      const pulse = document.createElement("div");
      pulse.style.cssText = `
        position:absolute;inset:0;border-radius:50%;
        background:rgba(14,165,233,0.3);
        animation:gps-pulse 1.6s ease-out infinite;
      `;

      const dot = document.createElement("div");
      dot.style.cssText = `
        position:absolute;top:50%;left:50%;
        transform:translate(-50%,-50%);
        width:12px;height:12px;border-radius:50%;
        background:#0ea5e9;border:2.5px solid #fff;
        box-shadow:0 0 0 2px #0369a1;
      `;

      // Inject keyframes once
      if (!document.getElementById("gps-pulse-style")) {
        const style = document.createElement("style");
        style.id = "gps-pulse-style";
        style.textContent = `
          @keyframes gps-pulse {
            0%   { transform:scale(1);   opacity:0.8; }
            100% { transform:scale(2.8); opacity:0;   }
          }
        `;
        document.head.appendChild(style);
      }

      wrapper.appendChild(pulse);
      wrapper.appendChild(dot);
      return wrapper;
    };

    // Remove any existing marker before placing a new one
    if (locationMarkerRef.current) {
      locationMarkerRef.current.remove();
      locationMarkerRef.current = null;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { longitude: lng, latitude: lat } = pos.coords;

        // Guard: remove again in case of a race between two rapid toggles
        if (locationMarkerRef.current) {
          locationMarkerRef.current.remove();
          locationMarkerRef.current = null;
        }

        locationMarkerRef.current = new mapboxgl.Marker({
          element: buildPulseEl(),
          anchor: "center",
        })
          .setLngLat([lng, lat])
          .addTo(map);

        map.flyTo({
          center: [lng, lat],
          zoom: Math.max(map.getZoom(), 14),
          duration: 1200,
          essential: true,
        });

        navigator.clipboard
          ?.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
          .catch(() => {});
      },
      (err) => {
        console.warn("Geolocation error:", err.message);
        const center = map.getCenter();
        new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: false,
          maxWidth: "260px",
        })
          .setLngLat([center.lng, center.lat])
          .setHTML(
            `<div style="font-family:Arial,sans-serif;font-size:12px;color:#b91c1c;padding:2px">
            ⚠️ Could not get your location.<br/>
            <span style="color:#6b7280;font-size:11px">${err.message}</span>
          </div>`,
          )
          .addTo(map);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, [layers?.myLocation, isMapReady]);

  // ── Snap to Feature ───────────────────────────────────────────────────────

  // Click anywhere on the map → finds the nearest vertex from any loaded
  // GeoJSON layer and places a snapped marker at that exact coordinate.
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !isMapReady) return;

    const snapVisible =
      typeof layers?.snapToFeature === "object"
        ? layers.snapToFeature.visible
        : !!layers?.snapToFeature;

    const clearSnapLayers = () => {
      try {
        if (map.getLayer(SNAP_LABEL_LAYER)) map.removeLayer(SNAP_LABEL_LAYER);
        if (map.getLayer(SNAP_LINE_LAYER)) map.removeLayer(SNAP_LINE_LAYER);
        if (map.getLayer(SNAP_LAYER)) map.removeLayer(SNAP_LAYER);
        if (map.getSource(SNAP_SOURCE)) map.removeSource(SNAP_SOURCE);
      } catch (e) {
        /* ignore */
      }
    };

    // Collect all vertices from every loaded GeoJSON layer
    const getAllVertices = () => {
      const vertices = [];
      const saved = currentGeojson.current;

      Object.values(saved).forEach((fc) => {
        if (!Array.isArray(fc?.features)) return;
        fc.features.forEach((feature) => {
          const geom = feature?.geometry;
          if (!geom) return;

          const extractCoords = (coords) => {
            if (!Array.isArray(coords)) return;
            if (typeof coords[0] === "number") {
              vertices.push(turf.point(coords));
            } else {
              coords.forEach(extractCoords);
            }
          };
          extractCoords(geom.coordinates);
        });
      });

      return vertices;
    };

    const handleClick = (e) => {
      const { lng, lat } = e.lngLat;
      const clickPt = turf.point([lng, lat]);

      const vertices = getAllVertices();
      if (!vertices.length) {
        // No loaded layers to snap to — show info popup
        const popup = new mapboxgl.Popup({
          offset: 10,
          closeButton: true,
          closeOnClick: true,
          maxWidth: "240px",
        })
          .setLngLat([lng, lat])
          .setHTML(
            `<div style="font-family:Arial,sans-serif;font-size:12px;color:#92400e;padding:4px">
            🧲 No loaded layers to snap to.<br/>Load a boundary or society layer first.
          </div>`,
          )
          .addTo(map);
        return;
      }

      // Find nearest vertex using turf.nearestPoint
      const vertexCollection = turf.featureCollection(vertices);
      const nearest = turf.nearestPoint(clickPt, vertexCollection);
      const [snapLng, snapLat] = nearest.geometry.coordinates;

      const distM = turf.distance(clickPt, nearest, { units: "meters" });

      const snapFeatures = [
        turf.point([snapLng, snapLat], {
          snapLabel: `${snapLat.toFixed(6)}, ${snapLng.toFixed(6)}\n↔ ${distM.toFixed(1)} m`,
        }),
        // Dashed line from click to snap point
        turf.lineString([
          [lng, lat],
          [snapLng, snapLat],
        ]),
      ];

      if (!map.getSource(SNAP_SOURCE)) {
        map.addSource(SNAP_SOURCE, {
          type: "geojson",
          data: turf.featureCollection(snapFeatures),
        });

        map.addLayer({
          id: SNAP_LINE_LAYER,
          type: "line",
          source: SNAP_SOURCE,
          filter: ["==", "$type", "LineString"],
          paint: {
            "line-color": "#0ea5e9",
            "line-width": 1.5,
            "line-dasharray": [2, 2],
          },
        });

        map.addLayer({
          id: SNAP_LAYER,
          type: "circle",
          source: SNAP_SOURCE,
          filter: ["==", "$type", "Point"],
          paint: {
            "circle-radius": 7,
            "circle-color": "#0ea5e9",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });

        map.addLayer({
          id: SNAP_LABEL_LAYER,
          type: "symbol",
          source: SNAP_SOURCE,
          filter: ["has", "snapLabel"],
          layout: {
            "text-field": ["get", "snapLabel"],
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
            "text-size": 11,
            "text-anchor": "bottom",
            "text-offset": [0, -1.2],
          },
          paint: {
            "text-color": "#0369a1",
            "text-halo-color": "#ffffff",
            "text-halo-width": 2,
          },
        });
      } else {
        map
          .getSource(SNAP_SOURCE)
          .setData(turf.featureCollection(snapFeatures));
      }

      // Copy snapped coords to clipboard
      navigator.clipboard
        ?.writeText(`${snapLat.toFixed(6)}, ${snapLng.toFixed(6)}`)
        .catch(() => {});
    };

    const handleRightClick = (e) => {
      e.preventDefault();
      clearSnapLayers();
    };

    if (snapVisible) {
      map.getCanvas().style.cursor = "crosshair";
      map.on("click", handleClick);
      map.on("contextmenu", handleRightClick);
    } else {
      map.getCanvas().style.cursor = "";
      clearSnapLayers();
      map.off("click", handleClick);
      map.off("contextmenu", handleRightClick);
    }

    return () => {
      map.off("click", handleClick);
      map.off("contextmenu", handleRightClick);
      if (map.getCanvas()) map.getCanvas().style.cursor = "";
    };
  }, [layers?.snapToFeature, isMapReady]);

  return (
    <div className="absolute inset-0 h-full w-full z-0">
      <div ref={mapRef} className="absolute inset-0 h-full w-full" />

      {error && (
        <div className="absolute left-5 top-5 rounded bg-red-500 px-4 py-2 text-white shadow">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="absolute right-5 top-5 rounded bg-blue-500 px-4 py-2 text-white shadow">
          Loading...
        </div>
      )}
    </div>
  );
}

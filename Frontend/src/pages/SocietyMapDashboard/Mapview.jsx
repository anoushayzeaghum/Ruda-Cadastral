import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

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

    const shouldFlyTo = (orthoVisible && !prevOrthoVisible.current) || (demVisible && !prevDemVisible.current) || (dtmVisible && !prevDtmVisible.current);

    if (shouldFlyTo) {
      const bounds = [
        [74.42562653088396, 31.60509230706726],
        [74.43545280361002, 31.61121654113590]
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
              type: 'raster',
              tiles: ['http://localhost:8080/data/Chaharbagh_Ortho/{z}/{x}/{y}.png'],
              tileSize: 256
          });
        }
        if (!map.getLayer(ORTHO_LAYER)) {
          map.addLayer({
              id: ORTHO_LAYER,
              type: 'raster',
              source: ORTHO_SOURCE,
              paint: { 'raster-opacity': orthoOpacity },
              layout: { 'visibility': 'visible' }
          });
        } else {
          map.setLayoutProperty(ORTHO_LAYER, 'visibility', 'visible');
          map.setPaintProperty(ORTHO_LAYER, 'raster-opacity', orthoOpacity);
        }
      } else {
        if (map.getLayer(ORTHO_LAYER)) {
          map.setLayoutProperty(ORTHO_LAYER, 'visibility', 'none');
        }
      }

      // DSM (DEM) Layer
      const dsmOpacity = getLayerOpacity(layers, "dem", 85) / 100;

      if (demVisible) {
        if (!map.getSource(DSM_SOURCE)) {
          map.addSource(DSM_SOURCE, {
              type: 'raster',
              tiles: ['http://localhost:8080/data/Chaharbagh_DSM/{z}/{x}/{y}.png'],
              tileSize: 256
          });
        }
        if (!map.getLayer(DSM_LAYER)) {
          map.addLayer({
              id: DSM_LAYER,
              type: 'raster',
              source: DSM_SOURCE,
              paint: { 'raster-opacity': dsmOpacity },
              layout: { 'visibility': 'visible' }
          });
        } else {
          map.setLayoutProperty(DSM_LAYER, 'visibility', 'visible');
          map.setPaintProperty(DSM_LAYER, 'raster-opacity', dsmOpacity);
        }
      } else {
        if (map.getLayer(DSM_LAYER)) {
          map.setLayoutProperty(DSM_LAYER, 'visibility', 'none');
        }
      }

      // DTM Layer
      const dtmOpacity = getLayerOpacity(layers, "dtm", 85) / 100;

      if (dtmVisible) {
        if (!map.getSource(DTM_SOURCE)) {
          map.addSource(DTM_SOURCE, {
              type: 'raster',
              tiles: ['http://localhost:8080/data/Chaharbagh_DTM/{z}/{x}/{y}.png'],
              tileSize: 256
          });
        }
        if (!map.getLayer(DTM_LAYER)) {
          map.addLayer({
              id: DTM_LAYER,
              type: 'raster',
              source: DTM_SOURCE,
              paint: { 'raster-opacity': dtmOpacity },
              layout: { 'visibility': 'visible' }
          });
        } else {
          map.setLayoutProperty(DTM_LAYER, 'visibility', 'visible');
          map.setPaintProperty(DTM_LAYER, 'raster-opacity', dtmOpacity);
        }
      } else {
        if (map.getLayer(DTM_LAYER)) {
          map.setLayoutProperty(DTM_LAYER, 'visibility', 'none');
        }
      }
    };

    restoreRasters();
    
    // Attempt to restore if style changes
    map.on('style.load', restoreRasters);
    return () => {
      map.off('style.load', restoreRasters);
    };
  }, [layers?.dem, layers?.dtm, layers?.orthoImage, isMapReady]);

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

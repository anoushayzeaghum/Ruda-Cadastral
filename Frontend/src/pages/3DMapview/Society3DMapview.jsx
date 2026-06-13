import { useEffect, useMemo, useRef, useState } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { Expand, Home, Layers, LocateFixed, Minus, Plus, RotateCcw } from "lucide-react";

import {
  addGeoJSONLayer,
  applyBasemap,
  DEFAULT_VIEW,
  emptyFeatureCollection,
  flyToGeoJSON,
  getFeatureId,
  setEntityHighlighted,
} from "./cesiumHelpers";
import {
  getBuildingGeoJSON,
  getContourGeoJSON,
  getDistrictBoundary,
  getGreenSpaceGeoJSON,
  getMasterPlanGeoJSON,
  getMauzaBoundary,
  getPlotGeoJSON,
  getRoadGeoJSON,
  getSocietyBoundaryGeoJSON,
  getSocietyId,
  getSpotLevelGeoJSON,
  getTehsilBoundary,
} from "./api";

if (import.meta.env.VITE_CESIUM_TOKEN) {
  Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_TOKEN;
}

const ADMIN_LAYER_CONFIG = {
  district: {
    name: "District Boundary",
    fillColor: "#14532d",
    outlineColor: "#2563eb",
    opacity: 0.05,
  },
  tehsil: {
    name: "Tehsil Boundary",
    fillColor: "#166534",
    outlineColor: "#1d4ed8",
    opacity: 0.05,
  },
  mauza: {
    name: "Mauza Boundary",
    fillColor: "#15803d",
    outlineColor: "#1e40af",
    opacity: 0.08,
  },
};

const SOCIETY_LAYER_CONFIG = {
  societyBoundary: {
    name: "Society Boundary",
    fillColor: "#16a34a",
    outlineColor: "#064e3b",
    opacity: 0.25,
  },
  masterPlan: {
    name: "Master Plan",
    fillColor: "#7c3aed",
    outlineColor: "#4c1d95",
    opacity: 0.7,
  },
  plots3d: {
    name: "3D Plots / Parcels",
    fillColor: "#22d3ee",
    outlineColor: "#0e7490",
    opacity: 0.75,
    extrude: true,
  },
  buildings3d: {
    name: "3D Buildings",
    fillColor: "#facc15",
    outlineColor: "#713f12",
    opacity: 0.85,
    extrude: true,
  },
  roads: {
    name: "Roads",
    lineColor: "#ef4444",
    outlineColor: "#ef4444",
    opacity: 1,
    width: 4,
  },
  greenSpaces: {
    name: "Green Spaces",
    fillColor: "#16a34a",
    outlineColor: "#166534",
    opacity: 0.55,
  },
  spotLevel: {
    name: "Spot Level",
    pointColor: "#ef4444",
    opacity: 1,
  },
  contours: {
    name: "Contours",
    lineColor: "#92400e",
    outlineColor: "#92400e",
    opacity: 1,
    width: 2,
  },
};

function layerVisible(layers, key) {
  return layers?.[key]?.visible === true;
}

function layerOpacity(layers, key, fallback = 100) {
  return Number(layers?.[key]?.opacity ?? fallback) / 100;
}

function cloneFeatureWithLayer(feature, layerKey) {
  if (!feature) return null;
  return {
    ...feature,
    properties: {
      ...(feature.properties || {}),
      _layerKey: layerKey,
    },
    _layerKey: layerKey,
  };
}

export default function Society3DMapview({
  selectedDistrict,
  selectedTehsil,
  selectedMauza,
  selectedSociety,
  layers,
  basemap,
  extrusion,
  appliedExtrusions,
  onFeatureSelect,
  clearSelectionSignal,
}) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const handlerRef = useRef(null);
  const layerEntitiesRef = useRef({});
  const selectedEntityRef = useRef(null);
  const dataCacheRef = useRef({});
  const flyDoneRef = useRef({});

  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mapError, setMapError] = useState("");

  const selectedSocietyId = useMemo(() => getSocietyId(selectedSociety), [selectedSociety]);

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    const viewer = new Cesium.Viewer(containerRef.current, {
      animation: false,
      timeline: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      baseLayerPicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      shouldAnimate: true,
      terrainProvider: new Cesium.EllipsoidTerrainProvider(),
    });

    viewer.scene.globe.depthTestAgainstTerrain = false;
    viewer.scene.skyAtmosphere.show = true;
    viewer.scene.screenSpaceCameraController.enableCollisionDetection = true;
    viewer.scene.globe.enableLighting = false;

    applyBasemap(viewer, basemap || "Satellite");
    resetCamera(viewer);

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((movement) => {
      const picked = viewer.scene.pick(movement.position);
      const entity = picked?.id;

      if (!entity?.featureData) return;

      if (selectedEntityRef.current && selectedEntityRef.current !== entity) {
        setEntityHighlighted(selectedEntityRef.current, false);
      }

      selectedEntityRef.current = entity;
      setEntityHighlighted(entity, true);

      const selectedFeature = cloneFeatureWithLayer(entity.featureData, entity.layerKey);
      onFeatureSelect?.(selectedFeature);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    viewerRef.current = viewer;
    handlerRef.current = handler;
    setIsReady(true);

    return () => {
      handler.destroy();
      viewer.destroy();
      handlerRef.current = null;
      viewerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!viewerRef.current || !isReady) return;
    applyBasemap(viewerRef.current, basemap);
  }, [basemap, isReady]);

  useEffect(() => {
    if (!isReady) return;
    clearSelection();
  }, [clearSelectionSignal, isReady]);

  useEffect(() => {
    if (!viewerRef.current || !isReady) return;

    let cancelled = false;

    const loadAdminLayers = async () => {
      setMapError("");
      clearLayers(["district", "tehsil", "mauza"]);

      try {
        const tasks = [];

        if (selectedDistrict) {
          tasks.push({ key: "district", promise: getDistrictBoundary(selectedDistrict) });
        }
        if (selectedTehsil) {
          tasks.push({ key: "tehsil", promise: getTehsilBoundary(selectedTehsil) });
        }
        if (selectedMauza) {
          tasks.push({ key: "mauza", promise: getMauzaBoundary(selectedMauza) });
        }

        if (!tasks.length) return;
        setIsLoading(true);

        let lastGeoJSON = null;
        for (const task of tasks) {
          const geojson = await task.promise;
          if (cancelled) return;

          lastGeoJSON = geojson?.features?.length ? geojson : lastGeoJSON;
          drawLayer(task.key, geojson || emptyFeatureCollection(), ADMIN_LAYER_CONFIG[task.key]);
        }

        if (lastGeoJSON?.features?.length && !selectedSocietyId) {
          flyToGeoJSON(viewerRef.current, lastGeoJSON, { pitch: -50 });
        }
      } catch (error) {
        if (!cancelled) {
          console.error("3D admin layer error", error);
          setMapError("Failed to load administrative boundary layers.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadAdminLayers();

    return () => {
      cancelled = true;
    };
  }, [selectedDistrict, selectedTehsil, selectedMauza, selectedSocietyId, isReady]);

  useEffect(() => {
    if (!viewerRef.current || !isReady) return;

    let cancelled = false;

    const loadSocietyLayers = async () => {
      clearLayers(Object.keys(SOCIETY_LAYER_CONFIG));
      clearSelection();

      if (!selectedSocietyId) return;

      try {
        setIsLoading(true);
        setMapError("");

        const loaders = {
          societyBoundary: () => getSocietyBoundaryGeoJSON(selectedSocietyId),
          masterPlan: () => getMasterPlanGeoJSON(selectedSocietyId),
          plots3d: () => getPlotGeoJSON(selectedSocietyId),
          buildings3d: () => getBuildingGeoJSON(selectedSocietyId),
          roads: () => getRoadGeoJSON(selectedSocietyId),
          greenSpaces: () => getGreenSpaceGeoJSON(selectedSocietyId),
          spotLevel: () => getSpotLevelGeoJSON(selectedSocietyId),
          contours: () => getContourGeoJSON(selectedSocietyId),
        };

        let flyTarget = null;

        for (const key of Object.keys(SOCIETY_LAYER_CONFIG)) {
          if (!layerVisible(layers, key)) continue;

          const cacheKey = `${selectedSocietyId}:${key}`;
          let geojson = dataCacheRef.current[cacheKey];

          if (!geojson) {
            try {
              geojson = await loaders[key]();
              dataCacheRef.current[cacheKey] = geojson;
            } catch (error) {
              console.warn(`Could not load ${key}`, error);
              geojson = emptyFeatureCollection();
            }
          }

          if (cancelled) return;

          if (!flyTarget && key === "societyBoundary" && geojson?.features?.length) {
            flyTarget = geojson;
          }

          drawLayer(key, geojson, {
            ...SOCIETY_LAYER_CONFIG[key],
            opacity: layerOpacity(layers, key, SOCIETY_LAYER_CONFIG[key].opacity * 100),
            defaultHeightFeet: extrusion.heightFeet,
            extrusionOverrides: appliedExtrusions,
          });
        }

        const flyKey = `society-${selectedSocietyId}`;
        if (flyTarget?.features?.length && !flyDoneRef.current[flyKey]) {
          flyDoneRef.current[flyKey] = true;
          flyToGeoJSON(viewerRef.current, flyTarget, { pitch: -42, duration: 1.4 });
        }
      } catch (error) {
        if (!cancelled) {
          console.error("3D society layer error", error);
          setMapError("Failed to load society 3D layers.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadSocietyLayers();

    return () => {
      cancelled = true;
    };
  }, [selectedSocietyId, layers, isReady, extrusion.heightFeet, appliedExtrusions]);

  const drawLayer = (key, geojson, config) => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    clearLayer(key);

    const entities = addGeoJSONLayer(viewer, geojson, {
      key,
      name: config.name,
      fillColor: config.fillColor || "#38bdf8",
      outlineColor: config.outlineColor || config.lineColor || "#0f172a",
      lineColor: config.lineColor,
      pointColor: config.pointColor,
      opacity: config.opacity,
      width: config.width,
      extrude: config.extrude,
      defaultHeightFeet: config.defaultHeightFeet,
      extrusionOverrides: config.extrusionOverrides,
    });

    layerEntitiesRef.current[key] = entities;
  };

  const clearLayer = (key) => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    (layerEntitiesRef.current[key] || []).forEach((entity) => {
      try {
        viewer.entities.remove(entity);
      } catch (error) {
        console.warn(`Could not remove entity from ${key}`, error);
      }
    });

    layerEntitiesRef.current[key] = [];
  };

  const clearLayers = (keys) => keys.forEach((key) => clearLayer(key));

  const clearSelection = () => {
    if (selectedEntityRef.current) {
      setEntityHighlighted(selectedEntityRef.current, false);
      selectedEntityRef.current = null;
    }
    onFeatureSelect?.(null);
  };

  const zoomBy = (amount) => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const height = viewer.camera.positionCartographic.height;
    const distance = Math.max(height * amount, 150);
    if (amount < 0) viewer.camera.zoomIn(Math.abs(distance));
    else viewer.camera.zoomOut(distance);
  };

  const flyToSelectedSociety = () => {
    const viewer = viewerRef.current;
    if (!viewer || !selectedSocietyId) return;

    const geojson = dataCacheRef.current[`${selectedSocietyId}:societyBoundary`];
    if (geojson?.features?.length) flyToGeoJSON(viewer, geojson, { pitch: -42 });
  };

  const toggleFullscreen = async () => {
    const element = containerRef.current?.parentElement;
    if (!element) return;

    if (!document.fullscreenElement) {
      await element.requestFullscreen?.();
    } else {
      await document.exitFullscreen?.();
    }
  };

  return (
    <div className="absolute inset-0 bg-slate-900">
      <div ref={containerRef} className="h-full w-full" />

      <div className="absolute right-4 top-24 z-20 flex flex-col gap-2">
        <MapTool title="Layer Manager" icon={<Layers size={17} />} />
        <MapTool title="Reset Camera" onClick={() => resetCamera(viewerRef.current)} icon={<Home size={17} />} />
        <MapTool title="Fly to Society" onClick={flyToSelectedSociety} icon={<LocateFixed size={17} />} />
        <MapTool title="Zoom In" onClick={() => zoomBy(-0.35)} icon={<Plus size={19} />} />
        <MapTool title="Zoom Out" onClick={() => zoomBy(0.35)} icon={<Minus size={19} />} />
        <MapTool title="Fullscreen" onClick={toggleFullscreen} icon={<Expand size={17} />} />
        <MapTool title="Clear Selection" onClick={clearSelection} icon={<RotateCcw size={17} />} />
      </div>

      <div className="absolute bottom-4 right-4 z-20 rounded-lg bg-slate-950/80 px-3 py-2 text-[11px] font-semibold text-white shadow">
        <CameraReadout viewer={viewerRef.current} isReady={isReady} />
      </div>

      {isLoading && (
        <div className="absolute left-1/2 top-24 z-30 -translate-x-1/2 rounded-full bg-slate-950/80 px-4 py-2 text-xs font-semibold text-white shadow">
          Loading 3D layers...
        </div>
      )}

      {mapError && (
        <div className="absolute left-1/2 top-36 z-30 max-w-md -translate-x-1/2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700 shadow">
          {mapError}
        </div>
      )}
    </div>
  );
}

function resetCamera(viewer) {
  if (!viewer) return;
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(DEFAULT_VIEW.lon, DEFAULT_VIEW.lat, DEFAULT_VIEW.height),
    duration: 0.9,
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-55),
      roll: 0,
    },
  });
}

function MapTool({ title, icon, onClick }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-slate-900/90 text-white shadow-lg transition hover:bg-green-700"
    >
      {icon}
    </button>
  );
}

function CameraReadout({ viewer, isReady }) {
  const [text, setText] = useState("3D View Ready");

  useEffect(() => {
    if (!viewer || !isReady) return;

    const interval = window.setInterval(() => {
      const cartographic = viewer.camera.positionCartographic;
      const lon = Cesium.Math.toDegrees(cartographic.longitude).toFixed(5);
      const lat = Cesium.Math.toDegrees(cartographic.latitude).toFixed(5);
      const height = Math.round(cartographic.height).toLocaleString();
      setText(`${lon}, ${lat} | Height: ${height} m`);
    }, 600);

    return () => window.clearInterval(interval);
  }, [viewer, isReady]);

  return <span>{text}</span>;
}

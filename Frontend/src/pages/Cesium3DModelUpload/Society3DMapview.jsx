import { useEffect, useMemo, useRef, useState } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { Expand, LocateFixed, Minus, Plus, RotateCcw } from "lucide-react";

import {
  addGeoJSONLayer,
  applyBasemap,
  DEFAULT_VIEW,
  emptyFeatureCollection,
  flyToBounds,
  flyToGeoJSON,
  setEntityHighlighted,
} from "./cesiumHelpers";
import {
  getMasterPlanGeoJSON,
  getProjectBoundaryGeoJSON,
  getProjectId,
} from "./api";
import { getChaharBaghBimConfig, loadIonBimTileset } from "./cesiumBimHelpers";

if (import.meta.env.VITE_CESIUM_TOKEN) {
  Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_TOKEN;
}

const PROJECT_LAYER_CONFIG = {
  projectBoundary: {
    name: "Project Boundary",
    fillColor: "#16a34a",
    outlineColor: "#064e3b",
    opacity: 0.25,
  },
  masterPlan: {
    name: "Master Plan",
    fillColor: "#7c3aed",
    outlineColor: "#4c1d95",
    opacity: 0.35,
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

function parsePossibleGeometry(value) {
  if (!value) return null;
  if (typeof value !== "string") return value;

  try {
    const parsed = JSON.parse(value);
    return parsed?.type ? parsed : null;
  } catch (error) {
    return null;
  }
}

function projectToFeatureCollection(project) {
  if (!project) return emptyFeatureCollection();

  const payload = project?.data?.data ?? project?.data ?? project;

  if (payload?.type === "FeatureCollection") return payload;

  if (payload?.type === "Feature") {
    return {
      type: "FeatureCollection",
      features: [payload],
    };
  }

  const geometry = parsePossibleGeometry(
    payload?.geometry ||
      payload?.geom ||
      payload?.the_geom ||
      payload?.boundary ||
      payload?.project_boundary ||
      payload?.properties?.geometry ||
      payload?.properties?.geom ||
      null,
  );

  if (!geometry) return emptyFeatureCollection();

  const properties = { ...(payload.properties || payload) };
  delete properties.geometry;
  delete properties.geom;
  delete properties.the_geom;
  delete properties.boundary;
  delete properties.project_boundary;

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id: payload.gid ?? payload.id ?? payload.project_id,
        geometry,
        properties,
      },
    ],
  };
}

function isValidGeoJSON(geojson) {
  return Boolean(geojson?.features?.length);
}

function getBestZoomTarget(loadedGeoJSONByKey = {}, fallbackGeoJSON = emptyFeatureCollection()) {
  // Prefer the optional master-plan overlay, then use the project boundary.
  const priority = ["masterPlan", "projectBoundary"];

  for (const key of priority) {
    if (isValidGeoJSON(loadedGeoJSONByKey[key])) return loadedGeoJSONByKey[key];
  }

  return isValidGeoJSON(fallbackGeoJSON) ? fallbackGeoJSON : emptyFeatureCollection();
}

export default function Society3DMapview({
  selectedProject,
  layers,
  basemap,
  onFeatureSelect,
  clearSelectionSignal,
  uploadedModel,
  captureMapCenterSignal,
  flyToModelSignal,
  onMapCenterCaptured,
  onUploadedModelError,
  bimLayers,
}) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const handlerRef = useRef(null);
  const layerEntitiesRef = useRef({});
  const selectedEntityRef = useRef(null);
  const dataCacheRef = useRef({});
  const lastFlyKeyRef = useRef("");
  const uploadedModelPrimitiveRef = useRef(null);
  const ionBimTilesetRef = useRef(null);

  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mapError, setMapError] = useState("");

  const selectedProjectId = useMemo(() => getProjectId(selectedProject), [selectedProject]);

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

    applyBasemap(viewer, basemap || "Streets");
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

    const loadProjectLayers = async () => {
      clearLayers(Object.keys(PROJECT_LAYER_CONFIG));
      clearSelection();

      if (!selectedProjectId) {
        lastFlyKeyRef.current = "default-pakistan";
        resetCamera(viewerRef.current);
        return;
      }

      try {
        setIsLoading(true);
        setMapError("");

        const selectedProjectGeoJSON = projectToFeatureCollection(selectedProject);

        const loaders = {
          projectBoundary: async () => {
            if (selectedProjectGeoJSON.features.length) return selectedProjectGeoJSON;
            return getProjectBoundaryGeoJSON(selectedProjectId);
          },
          masterPlan: () => getMasterPlanGeoJSON(selectedProjectId),
        };

        const boundaryCacheKey = `${selectedProjectId}:projectBoundary`;
        let flyTarget = selectedProjectGeoJSON.features.length
          ? selectedProjectGeoJSON
          : dataCacheRef.current[boundaryCacheKey];

        if (!flyTarget) {
          try {
            flyTarget = await loaders.projectBoundary();
            dataCacheRef.current[boundaryCacheKey] = flyTarget;
          } catch (error) {
            console.warn("Could not load project boundary for zoom", error);
            flyTarget = emptyFeatureCollection();
          }
        }

        if (cancelled) return;

        const loadedGeoJSONByKey = {};

        for (const key of Object.keys(PROJECT_LAYER_CONFIG)) {
          if (!layerVisible(layers, key)) continue;

          const cacheKey = `${selectedProjectId}:${key}`;
          let geojson = key === "projectBoundary" && selectedProjectGeoJSON.features.length
            ? selectedProjectGeoJSON
            : dataCacheRef.current[cacheKey];

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

          loadedGeoJSONByKey[key] = geojson;

          drawLayer(key, geojson, {
            ...PROJECT_LAYER_CONFIG[key],
            opacity: layerOpacity(layers, key, PROJECT_LAYER_CONFIG[key].opacity * 100),
          });
        }

        const zoomTarget = getBestZoomTarget(loadedGeoJSONByKey, flyTarget);
        const flyKey = `project-${selectedProjectId}`;
        if (zoomTarget?.features?.length && lastFlyKeyRef.current !== flyKey) {
          lastFlyKeyRef.current = flyKey;
          flyToGeoJSON(viewerRef.current, zoomTarget, {
            pitch: -38,
            duration: 1.4,
            padding: 0.12,
          });
        }
      } catch (error) {
        if (!cancelled) {
          console.error("3D project layer error", error);
          setMapError("Failed to load project map layers.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadProjectLayers();

    return () => {
      cancelled = true;
    };
  }, [selectedProjectId, selectedProject, layers, isReady]);

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

  const flyToSelectedProject = async () => {
    const viewer = viewerRef.current;
    if (!viewer || !selectedProjectId) return;

    const cachedTargets = {
      masterPlan: dataCacheRef.current[`${selectedProjectId}:masterPlan`],
      projectBoundary: dataCacheRef.current[`${selectedProjectId}:projectBoundary`],
    };

    let zoomTarget = getBestZoomTarget(cachedTargets, projectToFeatureCollection(selectedProject));

    if (!zoomTarget?.features?.length) {
      try {
        zoomTarget = await getProjectBoundaryGeoJSON(selectedProjectId);
        dataCacheRef.current[`${selectedProjectId}:projectBoundary`] = zoomTarget;
      } catch (error) {
        console.warn("Could not zoom to selected project", error);
        return;
      }
    }

    if (zoomTarget?.features?.length) {
      flyToGeoJSON(viewer, zoomTarget, { pitch: -38, padding: 0.12 });
    }
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


  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !isReady) return;

    let cancelled = false;
    const config = getChaharBaghBimConfig();

    const removeTileset = () => {
      const current = ionBimTilesetRef.current;
      if (!current) return;
      try {
        viewer.scene.primitives.remove(current);
      } catch (error) {
        console.warn("Could not remove Cesium ion BIM tileset", error);
      }
      ionBimTilesetRef.current = null;
    };

    removeTileset();

    if (!bimLayers?.chaharBaghBim) return removeTileset;

    const loadTileset = async () => {
      try {
        setMapError("");
        const tileset = await loadIonBimTileset(viewer, config);

        if (cancelled) {
          viewer.scene.primitives.remove(tileset);
          return;
        }

        ionBimTilesetRef.current = tileset;
        await viewer.zoomTo(tileset, new Cesium.HeadingPitchRange(
          Cesium.Math.toRadians(0),
          Cesium.Math.toRadians(-30),
          0,
        ));
      } catch (error) {
        console.error("Cesium ion BIM tileset could not be loaded", error);
        if (!cancelled) {
          setMapError(
            error?.message ||
              "The Cesium ion BIM model could not be loaded. Check the asset ID, token permissions, and placement settings.",
          );
        }
      }
    };

    loadTileset();

    return () => {
      cancelled = true;
      removeTileset();
    };
  }, [isReady, bimLayers?.chaharBaghBim]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !isReady) return;

    let cancelled = false;

    const removeCurrentModel = () => {
      const current = uploadedModelPrimitiveRef.current;
      if (!current) return;
      try {
        viewer.scene.primitives.remove(current);
      } catch (error) {
        console.warn("Could not remove uploaded model", error);
      }
      uploadedModelPrimitiveRef.current = null;
    };

    removeCurrentModel();

    if (!uploadedModel?.url) return removeCurrentModel;

    const settings = uploadedModel.settings || {};
    const longitude = Number(settings.longitude);
    const latitude = Number(settings.latitude);
    const height = Number(settings.height || 0);

    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      onUploadedModelError?.("Enter valid longitude and latitude values.");
      return removeCurrentModel;
    }

    const loadUploadedModel = async () => {
      try {
        const position = Cesium.Cartesian3.fromDegrees(longitude, latitude, height);
        const hpr = new Cesium.HeadingPitchRoll(
          Cesium.Math.toRadians(Number(settings.heading || 0)),
          Cesium.Math.toRadians(Number(settings.pitch || 0)),
          Cesium.Math.toRadians(Number(settings.roll || 0)),
        );
        const modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(position, hpr);

        const model = await Cesium.Model.fromGltfAsync({
          url: uploadedModel.url,
          modelMatrix,
          scale: Math.max(Number(settings.scale || 1), 0.01),
          minimumPixelSize: 48,
          maximumScale: 20000,
          allowPicking: true,
        });

        if (cancelled) {
          model.destroy();
          return;
        }

        model.show = settings.visible !== false;
        viewer.scene.primitives.add(model);
        uploadedModelPrimitiveRef.current = model;
        onUploadedModelError?.("");
      } catch (error) {
        console.error("Uploaded 3D model could not be loaded", error);
        onUploadedModelError?.(
          "The model could not be loaded. Use a GLB file, or a self-contained glTF with embedded resources.",
        );
      }
    };

    loadUploadedModel();

    return () => {
      cancelled = true;
      removeCurrentModel();
    };
  }, [
    uploadedModel?.url,
    uploadedModel?.settings?.longitude,
    uploadedModel?.settings?.latitude,
    uploadedModel?.settings?.height,
    uploadedModel?.settings?.heading,
    uploadedModel?.settings?.pitch,
    uploadedModel?.settings?.roll,
    uploadedModel?.settings?.scale,
    uploadedModel?.settings?.visible,
    isReady,
  ]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !isReady || !captureMapCenterSignal) return;

    const canvas = viewer.scene.canvas;
    const center = new Cesium.Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2);
    const ray = viewer.camera.getPickRay(center);
    const picked = ray ? viewer.scene.globe.pick(ray, viewer.scene) : null;

    if (!picked) {
      onUploadedModelError?.("The map center could not be projected onto the globe.");
      return;
    }

    const cartographic = Cesium.Cartographic.fromCartesian(picked);
    onMapCenterCaptured?.({
      longitude: Number(Cesium.Math.toDegrees(cartographic.longitude).toFixed(7)),
      latitude: Number(Cesium.Math.toDegrees(cartographic.latitude).toFixed(7)),
      height: Number((cartographic.height || 0).toFixed(2)),
    });
  }, [captureMapCenterSignal, isReady]);

  useEffect(() => {
    const viewer = viewerRef.current;
    const model = uploadedModelPrimitiveRef.current;
    if (!viewer || !model || !flyToModelSignal) return;

    const sphere = model.boundingSphere;
    viewer.camera.flyToBoundingSphere(sphere, {
      duration: 1.2,
      offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-28), Math.max(sphere.radius * 3, 80)),
    });
  }, [flyToModelSignal]);

  return (
    <div className="absolute inset-0 bg-slate-900">
      <div ref={containerRef} className="h-full w-full" />

      <div className="absolute left-2 top-[100px] z-30 flex flex-col gap-1">
        <MapTool title="Fly to Project" onClick={flyToSelectedProject} icon={<LocateFixed size={20} strokeWidth={2.2} />} />
        <MapTool title="Zoom In" onClick={() => zoomBy(-0.35)} icon={<Plus size={20} strokeWidth={2.2} />} />
        <MapTool title="Zoom Out" onClick={() => zoomBy(0.35)} icon={<Minus size={20} strokeWidth={2.2} />} />
        <MapTool title="Fullscreen" onClick={toggleFullscreen} icon={<Expand size={20} strokeWidth={2.2} />} />
        <MapTool title="Clear Selection" onClick={clearSelection} icon={<RotateCcw size={20} strokeWidth={2.2} />} />
      </div>

      <div className="absolute bottom-4 right-4 z-20 rounded-lg bg-slate-950/80 px-3 py-2 text-[11px] font-semibold text-white shadow">
        <CameraReadout viewer={viewerRef.current} isReady={isReady} />
      </div>

      {isLoading && (
        <div className="absolute left-1/2 top-24 z-30 -translate-x-1/2 rounded-full bg-slate-950/80 px-4 py-2 text-xs font-semibold text-white shadow">
          Loading project layers...
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

  if (DEFAULT_VIEW.bounds) {
    flyToBounds(viewer, DEFAULT_VIEW.bounds, {
      duration: 0.9,
      pitch: -55,
      padding: 0.04,
    });
    return;
  }

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

function MapTool({ title, icon, onClick, isActive = false }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-md border text-white shadow-md transition ${
        isActive
          ? "border-[#9be37b] bg-[#0a3327]"
          : "border-[#0c3d2d] bg-[#06291f] hover:bg-[#0a3327]"
      }`}
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

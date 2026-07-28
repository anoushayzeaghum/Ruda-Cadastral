import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { setupVectorClickPopups } from "./PlotPopup";
import {
  getBlocksGeoJSON,
  getContourGeoJSON,
  getPlotsGeoJSON,
  getProjectGeoJSON,
  getRoadsGeoJSON,
  getSpotLevelGeoJSON,
  getWaterSupplyPointsGeoJSON,
  getWaterSupplyLinesGeoJSON,
  getSewagePointsGeoJSON,
  getCameraLocationsGeoJSON,
  getRudaGeoJSON,
  getRudaNotifiedPhasesBoundaryGeoJSON,
  getRudaProposedRoadsGeoJSON,
  getGeodeticNetworkGeoJSON,
} from "../../services/metaverseApi";
import {
  SOURCES,
  LAYERS,
  INTRO_STEPS,
  INTRO_CLEAR_SOURCES,
  RUDA_MAUZA_ASSET_PATHS,
  emptyFC,
  fitGeoJSON,
  setLayerVisibility,
  applyMetaverseLayerOpacities,
} from "./tools/Layers/LayerManager/MetaverseLayerConfig";
import {
  addIntroBoundaryLayer,
  clearIntroBoundaryLayer,
} from "./tools/Layers/LayerManager/ProjectMasterplanLayers/IntroBoundaryLayer";
import {
  addProjectBoundaryLayer,
  addNotifiedBoundaryLayer,
} from "./tools/Layers/LayerManager/ProjectMasterplanLayers/ProjectBoundaryLayer";
import { addBlockLayer } from "./tools/Layers/LayerManager/ProjectMasterplanLayers/BlockLayer";
import { addMasterPlanLayer } from "./tools/Layers/LayerManager/ProjectMasterplanLayers/MasterPlanLayer";
import { addSpotLevelLayer } from "./tools/Layers/LayerManager/ProjectMasterplanLayers/SpotLevelLayer";
import { addContourLayer } from "./tools/Layers/LayerManager/ProjectMasterplanLayers/ContourLayer";
import { addRoadLayer } from "./tools/Layers/LayerManager/ProjectMasterplanLayers/RoadLayer";
import {
  addWaterSupplyPointsLayer,
  addWaterSupplyLinesLayer,
  addSewagePointsLayer,
  addCameraLocationsLayer,
} from "./tools/Layers/LayerManager/ProjectMasterplanLayers/UtilitiesLayer";
import {
  addRudaBoundaryLayer,
  addRudaMauzaBoundaryLayer,
  addProposedRoadsLayer,
  applyRudaMauzaBoundaryStyle,
} from "./tools/Layers/LayerManager/ProjectMasterplanLayers/AdministrativeBoundaryLayer";
import { addGeodeticNetworkLayer } from "./tools/Layers/LayerManager/ProjectMasterplanLayers/GeodeticLayer";
import {
  DEFAULT_NOTIFIED_PHASES_STYLE,
  addOrUpdateNotifiedPhasesBoundary,
  setNotifiedPhasesBoundaryVisibility,
} from "./tools/Layers/LayerManager/AdministrativeLayers/NotifiedPhasesBoundaryLayer";
import { setRudaNotifiedBoundaryVisibility } from "./tools/Layers/LayerManager/AdministrativeLayers/RudaNotifiedBoundaryLayer";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const easeInOutQuad = (t) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

function getGeoJSONBounds(geojson) {
  if (!geojson?.features?.length) return null;

  const bounds = new mapboxgl.LngLatBounds();

  const extendBounds = (coordinates) => {
    if (!Array.isArray(coordinates)) return;

    if (
      typeof coordinates[0] === "number" &&
      typeof coordinates[1] === "number"
    ) {
      bounds.extend(coordinates);
      return;
    }

    coordinates.forEach(extendBounds);
  };

  geojson.features.forEach((feature) => {
    extendBounds(feature?.geometry?.coordinates);
  });

  return bounds.isEmpty() ? null : bounds;
}

function waitForSmoothMove(map, timeoutMs) {
  return new Promise((resolve) => {
    let completed = false;

    const finish = () => {
      if (completed) return;
      completed = true;
      clearTimeout(timeoutId);
      map.off("moveend", finish);
      resolve();
    };

    const timeoutId = setTimeout(finish, timeoutMs);
    map.once("moveend", finish);
  });
}

async function smoothFitGeoJSON(
  map,
  geojson,
  { duration = 800, padding = 80, maxZoom = 12 } = {},
) {
  const bounds = getGeoJSONBounds(geojson);
  if (!bounds) return;

  const moveFinished = waitForSmoothMove(map, duration + 10);

  map.fitBounds(bounds, {
    padding,
    duration,
    maxZoom,
    essential: true,
    easing: easeInOutQuad,
  });

  await moveFinished;
}

const interpolateNumber = (start, end, progress) =>
  start + (end - start) * progress;

function getIntroCamera(map, geojson, { padding = 85, maxZoom = 11.5 } = {}) {
  const bounds = getGeoJSONBounds(geojson);
  if (!bounds) return null;

  const camera = map.cameraForBounds(bounds, {
    padding,
    maxZoom,
  });

  if (!camera) return null;

  return {
    center: [camera.center.lng, camera.center.lat],
    zoom: camera.zoom,
    bearing: camera.bearing ?? map.getBearing(),
    pitch: camera.pitch ?? map.getPitch(),
  };
}

function animateIntroContinuously(
  map,
  loadedSteps,
  {
    durationPerStep = 850,
    padding = 85,
    maxZoom = 11.5,
    isCancelled = () => false,
  } = {},
) {
  const cameraSteps = loadedSteps
    .map((step) => ({
      ...step,
      camera: getIntroCamera(map, step.data, { padding, maxZoom }),
    }))
    .filter((step) => step.camera);

  if (!cameraSteps.length) {
    return Promise.resolve();
  }

  const currentCenter = map.getCenter();
  const startCamera = {
    center: [currentCenter.lng, currentCenter.lat],
    zoom: map.getZoom(),
    bearing: map.getBearing(),
    pitch: map.getPitch(),
  };

  const cameras = [startCamera, ...cameraSteps.map((step) => step.camera)];
  const totalSegments = cameraSteps.length;
  const totalDuration = durationPerStep * totalSegments;

  return new Promise((resolve) => {
    let animationFrameId = null;
    let shownStepIndex = -1;
    const startedAt = performance.now();

    const finish = () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      resolve();
    };

    const animateFrame = (currentTime) => {
      if (isCancelled()) {
        finish();
        return;
      }

      const overallProgress = Math.max(
        0,
        Math.min((currentTime - startedAt) / totalDuration, 1),
      );

      const scaledProgress = overallProgress * totalSegments;
      const segmentIndex = Math.min(
        Math.floor(scaledProgress),
        totalSegments - 1,
      );
      const segmentProgress =
        overallProgress === 1 ? 1 : scaledProgress - segmentIndex;

      if (segmentIndex !== shownStepIndex) {
        const currentStep = cameraSteps[segmentIndex];
        addIntroBoundaryLayer(map, currentStep.data, currentStep.label);
        shownStepIndex = segmentIndex;
      }

      const fromCamera = cameras[segmentIndex];
      const toCamera = cameras[segmentIndex + 1];

      map.jumpTo({
        center: [
          interpolateNumber(
            fromCamera.center[0],
            toCamera.center[0],
            segmentProgress,
          ),
          interpolateNumber(
            fromCamera.center[1],
            toCamera.center[1],
            segmentProgress,
          ),
        ],
        zoom: interpolateNumber(
          fromCamera.zoom,
          toCamera.zoom,
          segmentProgress,
        ),
        bearing: interpolateNumber(
          fromCamera.bearing,
          toCamera.bearing,
          segmentProgress,
        ),
        pitch: interpolateNumber(
          fromCamera.pitch,
          toCamera.pitch,
          segmentProgress,
        ),
      });

      if (overallProgress < 1) {
        animationFrameId = requestAnimationFrame(animateFrame);
      } else {
        finish();
      }
    };

    animationFrameId = requestAnimationFrame(animateFrame);
  });
}

function applyMetaverseLayerStyles(
  map,
  layerVisibility,
  adminBoundaryVisibility,
) {
  applyMetaverseLayerOpacities(map, layerVisibility, adminBoundaryVisibility);

  // Keep the approved CB-1 Master Plan palette at full strength.
  // The generic opacity helper was washing these colors out against the basemap.
  if (map.getLayer(LAYERS.masterPlanFill)) {
    map.setPaintProperty(LAYERS.masterPlanFill, "fill-opacity", 1);
  }

  if (map.getLayer(LAYERS.masterPlanLine)) {
    map.setPaintProperty(LAYERS.masterPlanLine, "line-opacity", 1);
  }

  applyRudaMauzaBoundaryStyle(
    map,
    adminBoundaryVisibility?.rudaMauzaBoundaryOpacity ?? 100,
  );
}

async function loadAssetGeoJSON(paths = []) {
  const candidates = Array.isArray(paths) ? paths : [paths];
  let lastError = null;

  for (const path of candidates) {
    try {
      const res = await fetch(path, { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (!data?.features?.length) {
        throw new Error("GeoJSON has no features");
      }

      return data;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("Intro GeoJSON could not be loaded");
}

const logLayerLoadError = (layerName, error) => {
  const status = error?.response?.status;
  const message = error?.response?.data?.message || error?.message || error;

  console.error(`[GISMetaverseMap] ${layerName} layer load error`, {
    status,
    message,
    response: error?.response?.data,
  });
};

export default function GISMetaverseMap({
  mapRef,
  isMapReady,
  setIsMapReady,
  filters,
  layerVisibility,
  adminBoundaryVisibility,
  setLayerVisibility: updateLayerVisibility,
  onIntroComplete,
}) {
  const loadAdministrativeLayers = async (map) => {
    if (!map) return;

    if (adminBoundaryVisibility?.rudaPhasesBoundary) {
      const data = await getRudaNotifiedPhasesBoundaryGeoJSON();
      addOrUpdateNotifiedPhasesBoundary(map, data, {
        ...DEFAULT_NOTIFIED_PHASES_STYLE,
        opacity:
          adminBoundaryVisibility?.rudaPhasesBoundaryOpacity ??
          DEFAULT_NOTIFIED_PHASES_STYLE.opacity,
      });
    }

    if (adminBoundaryVisibility?.rudaBoundary) {
      const data = await getRudaGeoJSON();
      addRudaBoundaryLayer(map, data);
    }

    if (adminBoundaryVisibility?.rudaMauzaBoundary) {
      const data = await loadAssetGeoJSON(RUDA_MAUZA_ASSET_PATHS);
      addRudaMauzaBoundaryLayer(
        map,
        data,
        adminBoundaryVisibility?.rudaMauzaBoundaryOpacity ?? 100,
      );
    }

    if (adminBoundaryVisibility?.proposedRoads) {
      const data = await getRudaProposedRoadsGeoJSON();
      addProposedRoadsLayer(map, data);
    }

    if (adminBoundaryVisibility?.geodeticNetwork) {
      const data = await getGeodeticNetworkGeoJSON();
      addGeodeticNetworkLayer(map, data);
    }

    setNotifiedPhasesBoundaryVisibility(
      map,
      !!adminBoundaryVisibility?.rudaPhasesBoundary,
    );

    setLayerVisibility(
      map,
      [
        LAYERS.rudaBoundaryFill,
        LAYERS.rudaBoundaryLine,
        LAYERS.rudaBoundaryDashLine,
        LAYERS.rudaBoundaryLabel,
      ],
      !!adminBoundaryVisibility?.rudaBoundary,
    );

    setLayerVisibility(
      map,
      [
        LAYERS.rudaMauzaBoundaryFill,
        LAYERS.rudaMauzaBoundaryLine,
        LAYERS.rudaMauzaBoundaryLabel,
      ],
      !!adminBoundaryVisibility?.rudaMauzaBoundary,
    );

    setLayerVisibility(
      map,
      [LAYERS.proposedRoadsLine],
      !!adminBoundaryVisibility?.proposedRoads,
    );

    setLayerVisibility(
      map,
      [LAYERS.geodeticNetworkCircle, LAYERS.geodeticNetworkLabel],
      !!adminBoundaryVisibility?.geodeticNetwork,
    );
  };

  const rebuildAllLayersOnMap = async () => {
    const map = mapRef.current;
    if (!map) return;

    await loadAdministrativeLayers(map);

    const projectId = filters?.projectId;
    if (!projectId) return;

    const projectGeoJSON = await getProjectGeoJSON(projectId);
    addProjectBoundaryLayer(map, projectGeoJSON);

    const shouldShowBlockBoundary =
      !!layerVisibility.blockBoundary || !!filters?.block;

    if (shouldShowBlockBoundary) {
      const blockGeoJSON = await getBlocksGeoJSON(
        projectId,
        filters.block || undefined,
      );
      addBlockLayer(map, blockGeoJSON);
    }

    addNotifiedBoundaryLayer(map, projectGeoJSON);

    if (layerVisibility.masterPlan) {
      const plotGeoJSON = await getPlotsGeoJSON({
        project_id: projectId,
      });

      addMasterPlanLayer(map, plotGeoJSON);
    }

    setLayerVisibility(
      map,
      [LAYERS.boundaryFill, LAYERS.boundaryLine],
      !!layerVisibility.boundary,
    );

    setLayerVisibility(
      map,
      [LAYERS.notifiedBoundaryLine],
      !!layerVisibility.notifiedBoundary,
    );

    setLayerVisibility(
      map,
      [LAYERS.masterPlanFill, LAYERS.masterPlanLine, LAYERS.masterPlanLabel],
      !!layerVisibility.masterPlan,
    );

    setLayerVisibility(
      map,
      [LAYERS.blockFill, LAYERS.blockLine, LAYERS.blockLabel],
      shouldShowBlockBoundary,
    );
  };

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handler = () => {
      rebuildAllLayersOnMap();
    };

    map.on("rebuild-layers", handler);

    return () => {
      map.off("rebuild-layers", handler);
    };
  }, [filters.projectId, filters.block, layerVisibility]);

  const mapContainerRef = useRef(null);
  const introHasRunRef = useRef(false);
  const masterPlanLoadSeqRef = useRef(0);
  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [0, 20],
      zoom: 1.5,
      preserveDrawingBuffer: true,
    });

    mapRef.current.on("load", () => {
      setIsMapReady(true);
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      setIsMapReady(false);
    };
  }, [mapRef, setIsMapReady]);
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    const addProjectLayers = async () => {
      // 🔥 IMPORTANT: re-fetch or re-use stored data
      const projectId = filters.projectId;

      if (!projectId) return;

      // Example: re-add sources FIRST
      const geojson = await getProjectGeoJSON(projectId);

      if (!map.getSource("project-boundary")) {
        map.addSource("project-boundary", {
          type: "geojson",
          data: geojson,
        });
      } else {
        map.getSource("project-boundary").setData(geojson);
      }

      // then layers
      if (!map.getLayer("project-boundary-layer")) {
        map.addLayer({
          id: "project-boundary-layer",
          type: "line",
          source: "project-boundary",
          paint: {
            "line-color": "#00ff88",
            "line-width": 2,
          },
        });
      }
    };

    // ⭐ attach globally to map instance
    map.addProjectLayers = addProjectLayers;
    map.once("style.load", () => {
      map.addProjectLayers?.();
    });
  }, [filters.projectId, filters.block]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    if (introHasRunRef.current) {
      return;
    }

    let cancelled = false;

    const runIntro = async () => {
      if (cancelled) {
        return;
      }

      if (introHasRunRef.current) {
        return;
      }

      try {
        // Load all intro boundaries first so network requests do not create
        // pauses between Pakistan, Punjab and RUDA.
        const loadedSteps = await Promise.all(
          INTRO_STEPS.map(async (step) => ({
            ...step,
            data: await loadAssetGeoJSON(step.assetPaths),
          })),
        );

        if (cancelled) return;

        // Use one continuous camera animation instead of running a separate
        // fitBounds animation for every boundary.
        await animateIntroContinuously(map, loadedSteps, {
          durationPerStep: 850,
          padding: 85,
          maxZoom: 11.5,
          isCancelled: () => cancelled,
        });

        if (cancelled) return;

        clearIntroBoundaryLayer(map);

        // Open the exact layer used by:
        // Layers > Administrative > RUDA Phases Boundary (notified phases table).
        const rudaPhasesBoundary = await getRudaNotifiedPhasesBoundaryGeoJSON();

        if (cancelled) return;

        addOrUpdateNotifiedPhasesBoundary(map, rudaPhasesBoundary, {
          ...DEFAULT_NOTIFIED_PHASES_STYLE,
          opacity:
            adminBoundaryVisibility?.rudaPhasesBoundaryOpacity ??
            DEFAULT_NOTIFIED_PHASES_STYLE.opacity,
        });

        // Keep the older RUDA boundary implementations switched off.
        setLayerVisibility(
          map,
          [
            LAYERS.rudaBoundaryFill,
            LAYERS.rudaBoundaryLine,
            LAYERS.rudaBoundaryDashLine,
            LAYERS.rudaBoundaryLabel,
            LAYERS.rudaMauzaBoundaryFill,
            LAYERS.rudaMauzaBoundaryLine,
            LAYERS.rudaMauzaBoundaryLabel,
          ],
          false,
        );

        // The intro must end with only RUDA Notified Phase Boundary visible.
        setRudaNotifiedBoundaryVisibility(map, false);
        setNotifiedPhasesBoundaryVisibility(map, true);

        // Synchronize the Administrative panel checkboxes/state.
        map.fire("show-notified-phases-only");

        await smoothFitGeoJSON(map, rudaPhasesBoundary, {
          duration: 700,
          padding: 75,
          maxZoom: 11,
        });

        introHasRunRef.current = true;
        onIntroComplete?.();
      } catch (err) {
        if (cancelled) return;

        clearIntroBoundaryLayer(map);

        try {
          const rudaPhasesBoundary =
            await getRudaNotifiedPhasesBoundaryGeoJSON();

          addOrUpdateNotifiedPhasesBoundary(map, rudaPhasesBoundary, {
            ...DEFAULT_NOTIFIED_PHASES_STYLE,
            opacity:
              adminBoundaryVisibility?.rudaPhasesBoundaryOpacity ??
              DEFAULT_NOTIFIED_PHASES_STYLE.opacity,
          });

          setLayerVisibility(
            map,
            [
              LAYERS.rudaBoundaryFill,
              LAYERS.rudaBoundaryLine,
              LAYERS.rudaBoundaryDashLine,
              LAYERS.rudaBoundaryLabel,
              LAYERS.rudaMauzaBoundaryFill,
              LAYERS.rudaMauzaBoundaryLine,
              LAYERS.rudaMauzaBoundaryLabel,
            ],
            false,
          );

          setRudaNotifiedBoundaryVisibility(map, false);
          setNotifiedPhasesBoundaryVisibility(map, true);
          map.fire("show-notified-phases-only");

          await smoothFitGeoJSON(map, rudaPhasesBoundary, {
            duration: 700,
            padding: 75,
            maxZoom: 11,
          });
        } catch (rudaPhasesError) {
          console.error(
            "[GISMetaverseMap] RUDA Notified Phase Boundary intro load error",
            rudaPhasesError,
          );
        }

        introHasRunRef.current = true;
        onIntroComplete?.();
      }
    };

    if (map.isStyleLoaded()) {
      runIntro();
    } else {
      map.once("load", runIntro);
    }

    return () => {
      cancelled = true;
      map.off("load", runIntro);
    };
  }, [mapRef, onIntroComplete]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const run = async () => {
      if (!filters?.projectId) {
        INTRO_CLEAR_SOURCES.forEach((sourceId) => {
          if (map.getSource(sourceId)) {
            map.getSource(sourceId).setData(emptyFC);
          }
        });

        if (map.getSource(SOURCES.block)) {
          map.getSource(SOURCES.block).setData(emptyFC);
        }

        setLayerVisibility(
          map,
          [LAYERS.blockFill, LAYERS.blockLine, LAYERS.blockLabel],
          false,
        );
        return;
      }

      const projectGeoJSON = await getProjectGeoJSON(filters.projectId);
      addProjectBoundaryLayer(map, projectGeoJSON);
      addNotifiedBoundaryLayer(map, projectGeoJSON);

      setLayerVisibility(map, [LAYERS.boundaryFill, LAYERS.boundaryLine], true);
      setLayerVisibility(
        map,
        [LAYERS.notifiedBoundaryLine],
        !!layerVisibility.notifiedBoundary,
      );

      fitGeoJSON(map, projectGeoJSON);

      updateLayerVisibility((prev) => ({
        ...prev,
        boundary: true,
        masterPlan: false,
        blockBoundary: false,
        roads: false,
      }));
    };

    if (map.isStyleLoaded()) run();
    else map.once("load", run);
  }, [filters.projectId, mapRef, updateLayerVisibility]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !filters?.projectId) return;

    const run = async () => {
      if (!layerVisibility.notifiedBoundary) {
        setLayerVisibility(map, [LAYERS.notifiedBoundaryLine], false);
        return;
      }

      const projectGeoJSON = await getProjectGeoJSON(filters.projectId);
      addNotifiedBoundaryLayer(map, projectGeoJSON);
      setLayerVisibility(map, [LAYERS.notifiedBoundaryLine], true);

      applyMetaverseLayerStyles(map, layerVisibility, adminBoundaryVisibility);
    };

    if (map.isStyleLoaded()) run();
    else map.once("load", run);
  }, [
    filters.projectId,
    layerVisibility.notifiedBoundary,
    layerVisibility.notifiedBoundaryOpacity,
    adminBoundaryVisibility,
    mapRef,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !filters?.projectId) return;

    const run = async () => {
      const shouldShowBlockBoundary =
        !!layerVisibility.blockBoundary || !!filters.block;

      if (!shouldShowBlockBoundary) {
        if (map.getSource(SOURCES.block)) {
          map.getSource(SOURCES.block).setData(emptyFC);
        }

        setLayerVisibility(
          map,
          [LAYERS.blockFill, LAYERS.blockLine, LAYERS.blockLabel],
          false,
        );
        return;
      }

      const blockGeoJSON = await getBlocksGeoJSON(
        filters.projectId,
        filters.block || undefined,
      );

      addBlockLayer(map, blockGeoJSON);
      setLayerVisibility(
        map,
        [LAYERS.blockFill, LAYERS.blockLine, LAYERS.blockLabel],
        true,
      );

      applyMetaverseLayerStyles(map, layerVisibility, adminBoundaryVisibility);

      if (filters.block || layerVisibility.blockBoundary) {
        // fitGeoJSON(map, blockGeoJSON);
      }
    };

    if (map.isStyleLoaded()) run();
    else map.once("load", run);
  }, [
    filters.projectId,
    filters.block,
    layerVisibility.blockBoundary,
    layerVisibility.blockBoundaryOpacity,
    adminBoundaryVisibility,
    mapRef,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !filters?.projectId) return;

    const currentLoadSeq = ++masterPlanLoadSeqRef.current;

    const run = async () => {
      const hasPlotFilter =
        !!filters.block ||
        !!filters.plotType ||
        !!filters.plotNo ||
        !!filters.area ||
        !!filters.parkfront ||
        !!filters.rd_facing ||
        !!filters.poss_st ||
        !!filters.plotStatus ||
        !!filters.tr_cate ||
        !!filters.tr_own ||
        !!filters.site_plan;

      // Master Plan Boundary should be controlled only by its checkbox.
      // Previously, plot filters could load/show this source even when the
      // checkbox was off, and older async responses could repaint it later.
      if (!layerVisibility.masterPlan) {
        if (map.getSource(SOURCES.masterPlan)) {
          map.getSource(SOURCES.masterPlan).setData(emptyFC);
        }

        setLayerVisibility(
          map,
          [
            LAYERS.masterPlanFill,
            LAYERS.masterPlanLine,
            LAYERS.masterPlanLabel,
          ],
          false,
        );
        return;
      }

      const plotGeoJSON = await getPlotsGeoJSON({
        project_id: filters.projectId,
        block: filters.block || undefined,
        type: filters.plotType || undefined,
        plot_no: filters.plotNo || undefined,
        plot_area: filters.area || undefined,
        parkfront: filters.parkfront || undefined,
        rd_facing: filters.rd_facing || undefined,
        poss_st: filters.poss_st || undefined,
        canceled: filters.plotStatus || undefined,
        tr_cate: filters.tr_cate || undefined,
        tr_own: filters.tr_own || undefined,
        site_plan: filters.site_plan || undefined,
      });

      // Ignore stale requests. This prevents an older master-plan request
      // from drawing a second/different-styled version after the correct one.
      if (currentLoadSeq !== masterPlanLoadSeqRef.current) return;

      addMasterPlanLayer(map, plotGeoJSON);

      setLayerVisibility(
        map,
        [LAYERS.masterPlanFill, LAYERS.masterPlanLine, LAYERS.masterPlanLabel],
        true,
      );

      applyMetaverseLayerStyles(map, layerVisibility, adminBoundaryVisibility);

      if (hasPlotFilter) {
        // fitGeoJSON(map, plotGeoJSON);
      }
    };

    if (map.isStyleLoaded()) run();
    else map.once("load", run);
  }, [
    filters.projectId,
    filters.block,
    filters.plotType,
    filters.plotNo,
    filters.area,
    filters.parkfront,
    filters.rd_facing,
    filters.poss_st,
    filters.plotStatus,
    filters.tr_cate,
    filters.tr_own,
    filters.site_plan,
    layerVisibility.masterPlan,
    mapRef,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const run = async () => {
      await loadAdministrativeLayers(map);

      applyMetaverseLayerStyles(map, layerVisibility, adminBoundaryVisibility);
    };

    if (map.isStyleLoaded()) run();
    else map.once("load", run);
  }, [adminBoundaryVisibility, layerVisibility, mapRef]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    setLayerVisibility(
      map,
      [LAYERS.boundaryFill, LAYERS.boundaryLine],
      layerVisibility.boundary,
    );

    setLayerVisibility(
      map,
      [LAYERS.notifiedBoundaryLine],
      layerVisibility.notifiedBoundary,
    );

    setLayerVisibility(
      map,
      [LAYERS.masterPlanFill, LAYERS.masterPlanLine, LAYERS.masterPlanLabel],
      layerVisibility.masterPlan,
    );

    setLayerVisibility(
      map,
      [LAYERS.blockFill, LAYERS.blockLine, LAYERS.blockLabel],
      !!layerVisibility.blockBoundary || !!filters.block,
    );

    setLayerVisibility(
      map,
      [LAYERS.spotLevelCircle],
      layerVisibility.spotLevel,
    );

    setLayerVisibility(
      map,
      [LAYERS.contoursLine, LAYERS.contoursLabel],
      layerVisibility.contours,
    );

    setLayerVisibility(
      map,
      [LAYERS.roadsFill, LAYERS.roadsLine],
      layerVisibility.roads,
    );

    setLayerVisibility(
      map,
      [LAYERS.waterSupplyPointsCircle, LAYERS.waterSupplyPointsLabel],
      layerVisibility.waterSupplyPoints,
    );

    setLayerVisibility(
      map,
      [LAYERS.waterSupplyLinesLine, LAYERS.waterSupplyLinesLabel],
      layerVisibility.waterSupplyLines,
    );

    setLayerVisibility(
      map,
      [LAYERS.sewagePointsCircle, LAYERS.sewagePointsLabel],
      layerVisibility.sewagePoints,
    );

    setLayerVisibility(
      map,
      [LAYERS.cameraLocationsCircle, LAYERS.cameraLocationsLabel],
      layerVisibility.cameraLocations,
    );

    applyMetaverseLayerStyles(map, layerVisibility, adminBoundaryVisibility);
  }, [layerVisibility, adminBoundaryVisibility, filters.block, mapRef]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !filters?.projectId) return;

    const run = async () => {
      if (layerVisibility.spotLevel) {
        const data = await getSpotLevelGeoJSON(filters.projectId);
        addSpotLevelLayer(map, data);
      }

      if (layerVisibility.contours) {
        const data = await getContourGeoJSON(filters.projectId);
        addContourLayer(map, data);
      }

      if (layerVisibility.roads) {
        try {
          const data = await getRoadsGeoJSON({
            project_id: filters.projectId,
            block: filters.block || undefined,
          });

          addRoadLayer(map, data);
        } catch (error) {
          logLayerLoadError("Roads", error);
        }
      }

      if (layerVisibility.waterSupplyPoints) {
        const data = await getWaterSupplyPointsGeoJSON(filters.projectId);
        addWaterSupplyPointsLayer(map, data);
      }

      if (layerVisibility.waterSupplyLines) {
        const data = await getWaterSupplyLinesGeoJSON(filters.projectId);
        addWaterSupplyLinesLayer(map, data);
      }

      if (layerVisibility.sewagePoints) {
        const data = await getSewagePointsGeoJSON(filters.projectId);
        addSewagePointsLayer(map, data);
      }

      if (layerVisibility.cameraLocations) {
        const data = await getCameraLocationsGeoJSON(filters.projectId);
        addCameraLocationsLayer(map, data);
      }

      applyMetaverseLayerStyles(map, layerVisibility, adminBoundaryVisibility);
    };

    if (map.isStyleLoaded()) run();
    else map.once("load", run);
  }, [
    filters.projectId,
    filters.block,
    layerVisibility.spotLevel,
    layerVisibility.contours,
    layerVisibility.roads,
    layerVisibility.waterSupplyPoints,
    layerVisibility.waterSupplyLines,
    layerVisibility.sewagePoints,
    layerVisibility.cameraLocations,
    layerVisibility.spotLevelOpacity,
    layerVisibility.contoursOpacity,
    layerVisibility.roadsOpacity,
    layerVisibility.waterSupplyPointsOpacity,
    layerVisibility.waterSupplyLinesOpacity,
    layerVisibility.sewagePointsOpacity,
    layerVisibility.cameraLocationsOpacity,
    adminBoundaryVisibility,
    mapRef,
  ]);

  // ---------------------------------------------------------------------------
  // Vector layer click popups (all toggled vector layers, click-only)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;

    return setupVectorClickPopups({
      map,
      autoCloseMs: 10000,
      minZoom: 13,
      maxZoom: 18,
    });
  }, [mapRef, isMapReady]);

  return <div ref={mapContainerRef} className="h-full w-full" />;
}

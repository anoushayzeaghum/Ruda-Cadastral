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
  wait,
  waitForMapMove,
  setLayerVisibility,
  applyMetaverseLayerOpacities,
} from "./LayerManager/MetaverseLayerConfig";
import {
  addIntroBoundaryLayer,
  clearIntroBoundaryLayer,
} from "./LayerManager/IntroBoundaryLayer";
import {
  addProjectBoundaryLayer,
  addNotifiedBoundaryLayer,
} from "./LayerManager/ProjectBoundaryLayer";
import { addBlockLayer } from "./LayerManager/BlockLayer";
import { addMasterPlanLayer } from "./LayerManager/MasterPlanLayer";
import { addSpotLevelLayer } from "./LayerManager/SpotLevelLayer";
import { addContourLayer } from "./LayerManager/ContourLayer";
import { addRoadLayer } from "./LayerManager/RoadLayer";
import {
  addWaterSupplyPointsLayer,
  addWaterSupplyLinesLayer,
  addSewagePointsLayer,
  addCameraLocationsLayer,
} from "./LayerManager/UtilitiesLayer";
import {
  addRudaBoundaryLayer,
  addRudaMauzaBoundaryLayer,
  addProposedRoadsLayer,
  applyRudaMauzaBoundaryStyle,
} from "./LayerManager/AdministrativeBoundaryLayer";
import { addGeodeticNetworkLayer } from "./LayerManager/GeodeticLayer";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function applyMetaverseLayerStyles(map, layerVisibility, adminBoundaryVisibility) {
  applyMetaverseLayerOpacities(map, layerVisibility, adminBoundaryVisibility);
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
  const rebuildAllLayersOnMap = async () => {
    const map = mapRef.current;
    if (!map) return;

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
  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [69.3451, 30.3753],
      zoom: 4.4,
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
        const steps = INTRO_STEPS;

        for (const step of steps) {
          if (cancelled) {
            return;
          }

          const data = await loadAssetGeoJSON(step.assetPaths);

          if (cancelled) {
            return;
          }

          addIntroBoundaryLayer(map, data, step.label);

          fitGeoJSON(map, data);

          await waitForMapMove(map, 800);

          await wait(500);
        }

        if (cancelled) {
          return;
        }

        clearIntroBoundaryLayer(map);

        // Show the real Administrative Boundaries RUDA layer immediately.
        // Do not wait for the Layers panel to open. The panel checkbox is
        // synced by onIntroComplete below.
        const realRudaBoundary = await getRudaGeoJSON();
        addRudaBoundaryLayer(map, realRudaBoundary);
        setLayerVisibility(
          map,
          [
            LAYERS.rudaBoundaryFill,
            LAYERS.rudaBoundaryLine,
            LAYERS.rudaBoundaryDashLine,
            LAYERS.rudaBoundaryLabel,
          ],
          true,
        );
        applyMetaverseLayerStyles(map, layerVisibility, {
          ...adminBoundaryVisibility,
          rudaBoundary: true,
          rudaBoundaryOpacity:
            adminBoundaryVisibility?.rudaBoundaryOpacity ?? 50,
        });

        introHasRunRef.current = true;

        onIntroComplete?.();
      } catch (err) {
        if (cancelled) return;

        clearIntroBoundaryLayer(map);

        try {
          const realRudaBoundary = await getRudaGeoJSON();
          addRudaBoundaryLayer(map, realRudaBoundary);
          setLayerVisibility(
            map,
            [
              LAYERS.rudaBoundaryFill,
              LAYERS.rudaBoundaryLine,
              LAYERS.rudaBoundaryDashLine,
              LAYERS.rudaBoundaryLabel,
            ],
            true,
          );
          applyMetaverseLayerStyles(map, layerVisibility, {
            ...adminBoundaryVisibility,
            rudaBoundary: true,
            rudaBoundaryOpacity:
              adminBoundaryVisibility?.rudaBoundaryOpacity ?? 50,
          });
        } catch (rudaError) {}

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

      applyMetaverseLayerStyles(
        map,
        layerVisibility,
        adminBoundaryVisibility,
      );
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

      applyMetaverseLayerStyles(
        map,
        layerVisibility,
        adminBoundaryVisibility,
      );

      if (filters.block || layerVisibility.blockBoundary) {
        fitGeoJSON(map, blockGeoJSON);
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

      if (!hasPlotFilter && !layerVisibility.masterPlan) {
        if (map.getSource(SOURCES.masterPlan)) {
          map.getSource(SOURCES.masterPlan).setData(emptyFC);
        }
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

      addMasterPlanLayer(map, plotGeoJSON);

      setLayerVisibility(
        map,
        [LAYERS.masterPlanFill, LAYERS.masterPlanLine, LAYERS.masterPlanLabel],
        true,
      );

      applyMetaverseLayerStyles(
        map,
        layerVisibility,
        adminBoundaryVisibility,
      );

      if (hasPlotFilter || layerVisibility.masterPlan) {
        fitGeoJSON(map, plotGeoJSON);
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
    layerVisibility.boundaryOpacity,
    layerVisibility.masterPlanOpacity,
    adminBoundaryVisibility,
    mapRef,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const run = async () => {
      if (adminBoundaryVisibility.rudaBoundary) {
        const data = await getRudaGeoJSON();
        addRudaBoundaryLayer(map, data);
      }

      if (adminBoundaryVisibility.rudaMauzaBoundary) {
        const data = await loadAssetGeoJSON(RUDA_MAUZA_ASSET_PATHS);
        addRudaMauzaBoundaryLayer(
          map,
          data,
          adminBoundaryVisibility?.rudaMauzaBoundaryOpacity ?? 100,
        );
      }

      if (adminBoundaryVisibility.proposedRoads) {
        const data = await getRudaProposedRoadsGeoJSON();
        addProposedRoadsLayer(map, data);
      }

      if (adminBoundaryVisibility.geodeticNetwork) {
        const data = await getGeodeticNetworkGeoJSON();
        addGeodeticNetworkLayer(map, data);
      }

      setLayerVisibility(
        map,
        [
          LAYERS.rudaBoundaryFill,
          LAYERS.rudaBoundaryLine,
          LAYERS.rudaBoundaryDashLine,
          LAYERS.rudaBoundaryLabel,
        ],
        adminBoundaryVisibility.rudaBoundary,
      );

      setLayerVisibility(
        map,
        [
          LAYERS.rudaMauzaBoundaryFill,
          LAYERS.rudaMauzaBoundaryLine,
          LAYERS.rudaMauzaBoundaryLabel,
        ],
        adminBoundaryVisibility.rudaMauzaBoundary,
      );

      setLayerVisibility(
        map,
        [LAYERS.proposedRoadsLine],
        adminBoundaryVisibility.proposedRoads,
      );

      setLayerVisibility(
        map,
        [LAYERS.geodeticNetworkCircle, LAYERS.geodeticNetworkLabel],
        adminBoundaryVisibility.geodeticNetwork,
      );

      applyMetaverseLayerStyles(
        map,
        layerVisibility,
        adminBoundaryVisibility,
      );
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
        const data = await getRoadsGeoJSON({
          project_id: filters.projectId,
          block: filters.block || undefined,
          type: filters.plotType || undefined,
        });

        addRoadLayer(map, data);
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

      applyMetaverseLayerStyles(
        map,
        layerVisibility,
        adminBoundaryVisibility,
      );
    };

    if (map.isStyleLoaded()) run();
    else map.once("load", run);
  }, [
    filters.projectId,
    filters.block,
    filters.plotType,
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
      minZoom: 16,
      maxZoom: 18,
    });
  }, [mapRef, isMapReady]);

  return <div ref={mapContainerRef} className="h-full w-full" />;
}

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { setupPlotClickPopup } from "../../pages/FlyToDedicated/PlotPopup";
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
//   INTRO_STEPS,
//   INTRO_CLEAR_SOURCES,
  RUDA_MAUZA_ASSET_PATHS,
  emptyFC,
  fitGeoJSON,
//   wait,
//   waitForMapMove,
  setLayerVisibility,
  applyFlyToLayerOpacities,
} from "../FlyToDedicated/LayerManager/FlyToLayerConfig";
// import {
//   addIntroBoundaryLayer,
//   clearIntroBoundaryLayer,
// } from "../GISMetaverse/LayerManager/IntroBoundaryLayer";
import {
  addProjectBoundaryLayer,
  addNotifiedBoundaryLayer,
} from "../GISMetaverse/LayerManager/ProjectBoundaryLayer";
import { addBlockLayer } from "../GISMetaverse/LayerManager/BlockLayer";
import { addMasterPlanLayer } from "../FlyToDedicated/LayerManager/MasterPlanLayer";
import { addSpotLevelLayer } from "../FlyToDedicated/LayerManager/SpotLevelLayer";
import { addContourLayer } from "../FlyToDedicated/LayerManager/ContourLayer";
import { addRoadLayer } from "../FlyToDedicated/LayerManager/RoadLayer";
import {
  addWaterSupplyPointsLayer,
  addWaterSupplyLinesLayer,
  addSewagePointsLayer,
  addCameraLocationsLayer,
} from "../GISMetaverse/LayerManager/UtilitiesLayer";
import {
  addRudaBoundaryLayer,
  addRudaMauzaBoundaryLayer,
  addProposedRoadsLayer,
} from "../GISMetaverse/LayerManager/AdministrativeBoundaryLayer";
import { addGeodeticNetworkLayer } from "../GISMetaverse/LayerManager/GeodeticLayer";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

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

export default function FlyToMap({
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

    if (filters?.block) {
      const blockGeoJSON = await getBlocksGeoJSON(projectId, filters.block);
      addBlockLayer(map, blockGeoJSON);
    }

    addNotifiedBoundaryLayer(map, projectGeoJSON);

    if (layerVisibility.masterPlan || layerVisibility.plotLimits) {
      const plotGeoJSON = await getPlotsGeoJSON({
        project_id: projectId,
        block: filters?.block || undefined,
        type: filters?.plotType || undefined,
        plot_no: filters?.plotNo || undefined,
        plot_area: filters?.area || undefined,
      });

      addMasterPlanLayer(map, plotGeoJSON);
    }

    if (layerVisibility.contours) {
      const contourGeoJSON = await getContourGeoJSON(projectId);
      addContourLayer(map, contourGeoJSON);
    }

    if (layerVisibility.roads) {
      const roadsGeoJSON = await getRoadsGeoJSON({
        project_id: projectId,
        block: filters?.block || undefined,
        type: filters?.plotType || undefined,
      });
      addRoadLayer(map, roadsGeoJSON);
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
      [LAYERS.masterPlanFill, LAYERS.masterPlanLabel],
      !!layerVisibility.masterPlan,
    );

    setLayerVisibility(
      map,
      [LAYERS.masterPlanLine],
      !!layerVisibility.masterPlan || !!layerVisibility.plotLimits,
    );

    setLayerVisibility(
      map,
      [LAYERS.contoursLine, LAYERS.contoursLabel],
      !!layerVisibility.contours,
    );

    setLayerVisibility(
      map,
      [LAYERS.roadsFill, LAYERS.roadsLine],
      !!layerVisibility.roads,
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
//   const introHasRunRef = useRef(false);
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

//   useEffect(() => {
//     const map = mapRef.current;

//     if (!map) {
//       return;
//     }

//     if (introHasRunRef.current) {
//       return;
//     }

//     let cancelled = false;

//     const runIntro = async () => {
//       if (cancelled) {
//         return;
//       }

//       if (introHasRunRef.current) {
//         return;
//       }

//       try {
//         const steps = INTRO_STEPS;

//         for (const step of steps) {
//           if (cancelled) {
//             return;
//           }

//           const data = await loadAssetGeoJSON(step.assetPaths);

//           if (cancelled) {
//             return;
//           }

//           addIntroBoundaryLayer(map, data, step.label);

//           fitGeoJSON(map, data);

//           await waitForMapMove(map, 800);

//           await wait(500);
//         }

//         if (cancelled) {
//           return;
//         }

//         clearIntroBoundaryLayer(map);

//         // Show the real Administrative Boundaries RUDA layer immediately.
//         // Do not wait for the Layers panel to open. The panel checkbox is
//         // synced by onIntroComplete below.
//         const realRudaBoundary = await getRudaGeoJSON();
//         addRudaBoundaryLayer(map, realRudaBoundary);
//         setLayerVisibility(
//           map,
//           [
//             LAYERS.rudaBoundaryFill,
//             LAYERS.rudaBoundaryLine,
//             LAYERS.rudaBoundaryDashLine,
//             LAYERS.rudaBoundaryLabel,
//           ],
//           true,
//         );
//         applyMetaverseLayerOpacities(map, layerVisibility, {
//           ...adminBoundaryVisibility,
//           rudaBoundary: true,
//           rudaBoundaryOpacity:
//             adminBoundaryVisibility?.rudaBoundaryOpacity ?? 50,
//         });

//         introHasRunRef.current = true;

//         onIntroComplete?.();
//       } catch (err) {
//         if (cancelled) return;

//         clearIntroBoundaryLayer(map);

//         try {
//           const realRudaBoundary = await getRudaGeoJSON();
//           addRudaBoundaryLayer(map, realRudaBoundary);
//           setLayerVisibility(
//             map,
//             [
//               LAYERS.rudaBoundaryFill,
//               LAYERS.rudaBoundaryLine,
//               LAYERS.rudaBoundaryDashLine,
//               LAYERS.rudaBoundaryLabel,
//             ],
//             true,
//           );
//           applyMetaverseLayerOpacities(map, layerVisibility, {
//             ...adminBoundaryVisibility,
//             rudaBoundary: true,
//             rudaBoundaryOpacity:
//               adminBoundaryVisibility?.rudaBoundaryOpacity ?? 50,
//           });
//         } catch (rudaError) {}

//         introHasRunRef.current = true;
//         onIntroComplete?.();
//       }
//     };

//     if (map.isStyleLoaded()) {
//       runIntro();
//     } else {
//       map.once("load", runIntro);
//     }

//     return () => {
//       cancelled = true;
//       map.off("load", runIntro);
//     };
//   }, [mapRef, onIntroComplete]);

useEffect(() => {
  const map = mapRef.current;
  if (!map) return;

  const showRudaBoundary = async () => {
    try {
      const data = await getRudaGeoJSON();

      addRudaBoundaryLayer(map, data);

      setLayerVisibility(
        map,
        [
          LAYERS.rudaBoundaryFill,
          LAYERS.rudaBoundaryLine,
          LAYERS.rudaBoundaryDashLine,
          LAYERS.rudaBoundaryLabel,
        ],
        true
      );

      applyFlyToLayerOpacities(map, layerVisibility, {
        ...adminBoundaryVisibility,
        rudaBoundary: true,
        rudaBoundaryOpacity:
          adminBoundaryVisibility?.rudaBoundaryOpacity ?? 50,
      });

      onIntroComplete?.();
    } catch (err) {
      console.error(err);
    }
  };

  if (map.isStyleLoaded()) {
    showRudaBoundary();
  } else {
    map.once("load", showRudaBoundary);
  }

  return () => {
    map.off("load", showRudaBoundary);
  };
}, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const run = async () => {
      if (!filters?.projectId) {
        
  if (map.getSource(SOURCES.projectBoundary)) {
    map.getSource(SOURCES.projectBoundary).setData(emptyFC);
  }

  if (map.getSource(SOURCES.masterPlan)) {
    map.getSource(SOURCES.masterPlan).setData(emptyFC);
  }

  if (map.getSource(SOURCES.block)) {
    map.getSource(SOURCES.block).setData(emptyFC);
  }

  if (map.getSource(SOURCES.contours)) {
    map.getSource(SOURCES.contours).setData(emptyFC);
  }

  if (map.getSource(SOURCES.roads)) {
    map.getSource(SOURCES.roads).setData(emptyFC);
  }

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
        boundaryOpacity: prev.boundaryOpacity ?? 100,
        masterPlanOpacity: prev.masterPlanOpacity ?? 100,
        roadsOpacity: prev.roadsOpacity ?? 100,
        contoursOpacity: prev.contoursOpacity ?? 100,
        plotLimitsOpacity: prev.plotLimitsOpacity ?? 100,
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

      applyFlyToLayerOpacities(
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
      if (!filters.block) {
        if (map.getSource(SOURCES.block)) {
          map.getSource(SOURCES.block).setData(emptyFC);
        }
        return;
      }

      const blockGeoJSON = await getBlocksGeoJSON(
        filters.projectId,
        filters.block,
      );

      addBlockLayer(map, blockGeoJSON);
      setLayerVisibility(map, [LAYERS.blockFill, LAYERS.blockLine], true);
      fitGeoJSON(map, blockGeoJSON);
    };

    if (map.isStyleLoaded()) run();
    else map.once("load", run);
  }, [filters.projectId, filters.block, mapRef]);

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

      if (!hasPlotFilter && !layerVisibility.masterPlan && !layerVisibility.plotLimits) {
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
        [LAYERS.masterPlanFill, LAYERS.masterPlanLabel],
        !!layerVisibility.masterPlan,
      );

      setLayerVisibility(
        map,
        [LAYERS.masterPlanLine],
        !!layerVisibility.masterPlan || !!layerVisibility.plotLimits,
      );

      applyFlyToLayerOpacities(
        map,
        layerVisibility,
        adminBoundaryVisibility,
      );

      if (hasPlotFilter || layerVisibility.masterPlan || layerVisibility.plotLimits) {
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
    layerVisibility.plotLimits,
    layerVisibility.boundaryOpacity,
    layerVisibility.masterPlanOpacity,
    layerVisibility.plotLimitsOpacity,
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
        addRudaMauzaBoundaryLayer(map, data);
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

      applyFlyToLayerOpacities(
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
      [LAYERS.masterPlanFill, LAYERS.masterPlanLabel],
      layerVisibility.masterPlan,
    );

    setLayerVisibility(
      map,
      [LAYERS.masterPlanLine],
      layerVisibility.masterPlan || layerVisibility.plotLimits,
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

    applyFlyToLayerOpacities(map, layerVisibility, adminBoundaryVisibility);
  }, [layerVisibility, adminBoundaryVisibility, mapRef]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !filters?.projectId) return;

    const run = async () => {
      if (layerVisibility.spotLevel) {
        const data = await getSpotLevelGeoJSON(filters.projectId);
        console.log("SpotLevel data:", data);
        addSpotLevelLayer(map, data);
      }

      if (layerVisibility.contours) {
        const data = await getContourGeoJSON(filters.projectId);
        console.log("Contours:", data);
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

      applyFlyToLayerOpacities(
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
  // Plot click popup
  // ---------------------------------------------------------------------------
  // We depend on `isMapReady` (set to true inside the map "load" event) so
  // this effect only fires once the map and its style are fully initialised.
  // That guarantees the masterPlanHover layer already exists when we wire up
  // the click handler, and we get a clean teardown on unmount.
  useEffect(() => {
    const map = mapRef.current;
    // Guard: map must exist and be fully loaded before wiring up interactions.
    if (!map || !isMapReady) return;

    return setupPlotClickPopup({
      map,
      // Query both fill and line layers so clicks on thin plot borders register.
      plotLayerIds: [LAYERS.masterPlanFill, LAYERS.masterPlanLine],
      // The highlight outline layer — driven by filter + opacity in PlotPopup.
      highlightLayerId: LAYERS.masterPlanHover,
      // Must match the property used in the masterPlanHover filter expression.
      highlightFilterKey: "gid",
      // Auto-close the popup after 10 seconds of inactivity.
      autoCloseMs: 10000,
    });
    // Re-run whenever the map instance is swapped out or readiness changes.
  }, [mapRef, isMapReady]);

  return <div ref={mapContainerRef} className="h-full w-full" />;
}

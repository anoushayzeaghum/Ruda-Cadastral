import { useCallback, useRef, useState } from "react";
import Header from "./Header";
import GISMetaverseMap from "./GISMetaverseMap";
import Basemaps from "./tools/Basemaps";
import MetaverseLeftToolbar from "./MetaverseLeftToolbar";
import MetaverseSubHeader from "./MetaverseSubHeader";
import MetaverseMapControls from "./MetaverseMapControls";
import MetaverseLegend from "./tools/Layers/MetaverseLegend";

export default function MetaverseDashboard() {
  const mapRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [activeTool, setActiveTool] = useState(false);
  const [showMetaverseLegend, setShowMetaverseLegend] = useState(false);

  const defaultFilters = {
    projectId: "",
    block: "",
    plotType: "",
    plotNo: "",
    area: "",
    parkfront: "",
    rd_facing: "",
    poss_st: "",
    plotStatus: "",
    tr_cate: "",
    tr_own: "",
    site_plan: "",
  };

  const defaultLayerVisibility = {
    boundary: false,
    masterPlan: false,
    spotLevel: false,
    contours: false,
    roads: false,

    boundaryOpacity: 100,
    masterPlanOpacity: 100,
    spotLevelOpacity: 100,
    contoursOpacity: 100,
    roadsOpacity: 100,

    waterSupplyPoints: false,
    waterSupplyLines: false,
    sewagePoints: false,
    cameraLocations: false,

    waterSupplyPointsOpacity: 100,
    waterSupplyLinesOpacity: 100,
    sewagePointsOpacity: 100,
    cameraLocationsOpacity: 100,
  };

  const defaultAdminBoundaryVisibility = {
    rudaBoundary: false,
    geodeticNetwork: false,
    proposedRoads: false,

    rudaBoundaryOpacity: 50,
    geodeticNetworkOpacity: 100,
    proposedRoadsOpacity: 100,
  };

  const [adminBoundaryVisibility, setAdminBoundaryVisibility] = useState(
    defaultAdminBoundaryVisibility
  );

  const [metaverseFilters, setMetaverseFilters] = useState(defaultFilters);

  const [layerVisibility, setLayerVisibility] = useState(
    defaultLayerVisibility
  );

  const handleIntroComplete = useCallback(() => {
    setMetaverseFilters({
      ...defaultFilters,
      projectId: "5",
    });

    setLayerVisibility((prev) => ({
      ...prev,
      boundary: true,
      masterPlan: true,
      roads: true,

      boundaryOpacity: prev.boundaryOpacity ?? 100,
      masterPlanOpacity: prev.masterPlanOpacity ?? 100,
      roadsOpacity: prev.roadsOpacity ?? 100,
    }));
  }, []);

  const rebuildAllLayers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    // trigger re-run of GISMetaverseMap logic safely
    map.fire("rebuild-layers");
  }, []);

  const handleReset = () => {
    setMetaverseFilters(defaultFilters);
    setLayerVisibility(defaultLayerVisibility);
    setAdminBoundaryVisibility(defaultAdminBoundaryVisibility);
    setShowMetaverseLegend(false);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#111827]">
      <Header />

      <div className="relative h-[calc(100vh-56px)] w-full">
        <GISMetaverseMap
          mapRef={mapRef}
          setIsMapReady={setIsMapReady}
          filters={metaverseFilters}
          layerVisibility={layerVisibility}
          setLayerVisibility={setLayerVisibility}
          adminBoundaryVisibility={adminBoundaryVisibility}
          onIntroComplete={handleIntroComplete}
        />
        <Basemaps
          map={mapRef.current}
          rebuildAllLayers={() => {
            mapRef.current?.fire("rebuild-layers");
          }}
        />

        <MetaverseSubHeader
          filters={metaverseFilters}
          setFilters={setMetaverseFilters}
          setLayerVisibility={setLayerVisibility}
          onReset={handleReset}
          onCalendarClick={() => console.log("Calendar clicked")}
        />

        <MetaverseLeftToolbar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          map={isMapReady ? mapRef.current : null}
          filters={metaverseFilters}
          setFilters={setMetaverseFilters}
          layerVisibility={layerVisibility}
          setLayerVisibility={setLayerVisibility}
          adminBoundaryVisibility={adminBoundaryVisibility}
          setAdminBoundaryVisibility={setAdminBoundaryVisibility}
          rebuildAllLayers={rebuildAllLayers}
        />

        {showMetaverseLegend && (
          <MetaverseLegend adminBoundaryVisibility={adminBoundaryVisibility} />
        )}

        <MetaverseMapControls
          map={isMapReady ? mapRef.current : null}
          showMetaverseLegend={showMetaverseLegend}
          setShowMetaverseLegend={setShowMetaverseLegend}
          adminBoundaryVisibility={adminBoundaryVisibility}
        />
      </div>
    </div>
  );
}
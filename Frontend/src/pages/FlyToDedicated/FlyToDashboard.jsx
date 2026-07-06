import { useCallback, useRef, useState } from "react";
import FlyToHeader from "./FlyToHeader";
import FlyToMap from "./FlyToMap";
import FlyToLeftToolbar from "./FlyToLeftToolbar";
import FlyToSubHeader from "./FlyToSubHeader";
import FlyToMapControls from "./FlyToMapControls";
import FlyToLegend from "./tools/Layers/FlyToLegend";

export default function FlyToDashboard() {
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
    plotLimits: false,

    boundaryOpacity: 100,
    masterPlanOpacity: 100,
    spotLevelOpacity: 100,
    contoursOpacity: 100,
    roadsOpacity: 100,
    plotLimitsOpacity: 100,

    waterSupplyPoints: false,
    waterSupplyLines: false,
    sewagePoints: false,
    cameraLocations: false,
    notifiedBoundary: false,

    waterSupplyPointsOpacity: 100,
    waterSupplyLinesOpacity: 100,
    sewagePointsOpacity: 100,
    cameraLocationsOpacity: 100,
    notifiedBoundaryOpacity: 100,
  };

  const defaultAdminBoundaryVisibility = {
    rudaBoundary: false,
    rudaMauzaBoundary: false,
    geodeticNetwork: false,
    proposedRoads: false,

    rudaBoundaryOpacity: 50,
    geodeticNetworkOpacity: 100,
    proposedRoadsOpacity: 100,
  };

  const [adminBoundaryVisibility, setAdminBoundaryVisibility] = useState(
    defaultAdminBoundaryVisibility,
  );

  const [flytoFilters, setflytoFilters] = useState(defaultFilters);

  const [layerVisibility, setLayerVisibility] = useState(
    defaultLayerVisibility,
  );

  const handleIntroComplete = useCallback(() => {
    // RUDA boundary should not auto-open in this dashboard.
  }, []);

  const rebuildAllLayers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    // trigger re-run of GISMetaverseMap logic safely
    map.fire("rebuild-layers");
  }, []);

  const handleReset = () => {
    setflytoFilters(defaultFilters);
    setLayerVisibility(defaultLayerVisibility);
    setAdminBoundaryVisibility(defaultAdminBoundaryVisibility);
    setShowMetaverseLegend(false);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0f3d2e]">
      <FlyToHeader />

      <div className="relative h-[calc(100vh-56px)] w-full">
        <FlyToMap
          mapRef={mapRef}
          isMapReady={isMapReady}
          setIsMapReady={setIsMapReady}
          filters={flytoFilters}
          layerVisibility={layerVisibility}
          setLayerVisibility={setLayerVisibility}
          adminBoundaryVisibility={adminBoundaryVisibility}
          onIntroComplete={handleIntroComplete}
        />

        {/* <FlyToSubHeader
          filters={flytoFilters}
          setFilters={setflytoFilters}
          setLayerVisibility={setLayerVisibility}
          onReset={handleReset}
          onCalendarClick={() => console.log("Calendar clicked")}
        /> */}

        <FlyToLeftToolbar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          map={isMapReady ? mapRef.current : null}
          filters={flytoFilters}
          setFilters={setflytoFilters}
          layerVisibility={layerVisibility}
          setLayerVisibility={setLayerVisibility}
          adminBoundaryVisibility={adminBoundaryVisibility}
          setAdminBoundaryVisibility={setAdminBoundaryVisibility}
          rebuildAllLayers={rebuildAllLayers}
        />

        {/* {showMetaverseLegend && (
          <MetaverseLegend adminBoundaryVisibility={adminBoundaryVisibility} />
        )} */}

        <FlyToMapControls
          map={isMapReady ? mapRef.current : null}
          showMetaverseLegend={showMetaverseLegend}
          setShowMetaverseLegend={setShowMetaverseLegend}
          adminBoundaryVisibility={adminBoundaryVisibility}
        />
      </div>
    </div>
  );
}

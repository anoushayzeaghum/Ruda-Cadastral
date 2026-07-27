import { useCallback, useRef, useState } from "react";
import MasterPlanHeader from "./MasterPlanHeader";
import FlyToMap from "../FlyToDedicated/FlyToMap";
import FlyToMapControls from "../FlyToDedicated/FlyToMapControls";

export default function MasterPlanDashboard() {
  const mapRef = useRef(null);

  const [isMapReady, setIsMapReady] = useState(false);
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

  const [filters] = useState(defaultFilters);
  const [layerVisibility, setLayerVisibility] = useState(
    defaultLayerVisibility,
  );
  const [adminBoundaryVisibility] = useState(
    defaultAdminBoundaryVisibility,
  );

  const handleIntroComplete = useCallback(() => { }, []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0f3d2e]">
      <MasterPlanHeader />

      <div className="relative h-[calc(100vh-56px)] w-full">
        <FlyToMap
          mapRef={mapRef}
          isMapReady={isMapReady}
          setIsMapReady={setIsMapReady}
          filters={filters}
          layerVisibility={layerVisibility}
          setLayerVisibility={setLayerVisibility}
          adminBoundaryVisibility={adminBoundaryVisibility}
          onIntroComplete={handleIntroComplete}
        />

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
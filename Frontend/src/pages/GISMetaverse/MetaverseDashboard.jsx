import { useCallback, useRef, useState } from "react";
import Header from "./Header";
import GISMetaverseMap from "./GISMetaverseMap";
import MetaverseLeftToolbar from "./MetaverseLeftToolbar";
import MetaverseSubHeader from "./MetaverseSubHeader";
import MetaverseMapControls from "./MetaverseMapControls";

export default function MetaverseDashboard() {
  const mapRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [activeTool, setActiveTool] = useState("layers");

  const [adminBoundaryVisibility, setAdminBoundaryVisibility] = useState({
    rudaBoundary: false,
    geodeticNetwork: false,
    proposedRoads: false,
  });

  const [metaverseFilters, setMetaverseFilters] = useState({
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
  });

  const [layerVisibility, setLayerVisibility] = useState({
    boundary: false,
    masterPlan: false,
    spotLevel: false,
    contours: false,
    roads: false,
    waterSupplyPoints: false,
    waterSupplyLines: false,
    sewagePoints: false,
    cameraLocations: false,
  });

  const handleIntroComplete = useCallback(() => {
    setMetaverseFilters({
      projectId: "5",
      block: "",
      plotType: "",
      plotNo: "",
      area: "",
    });

    setLayerVisibility((prev) => ({
      ...prev,
      boundary: true,
      masterPlan: true,
      roads: true,
    }));
  }, []);

  const handleReset = () => {
    setMetaverseFilters({
      projectId: "",
      block: "",
      plotType: "",
      plotNo: "",
      area: "",
    });

    setLayerVisibility({
      boundary: false,
      masterPlan: false,
      spotLevel: false,
      contours: false,
      roads: false,
      waterSupplyPoints: false,
      waterSupplyLines: false,
      sewagePoints: false,
      cameraLocations: false,
    });
  };

  const handleFilterChange = (key, value) => {
    setMetaverseFilters((prev) => {
      const updated = {
        ...prev,
        [key]: value,
      };

      return updated;
    });
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
        />

        <MetaverseMapControls map={isMapReady ? mapRef.current : null} />
      </div>
    </div>
  );
}

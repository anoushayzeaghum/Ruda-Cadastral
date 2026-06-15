import { useRef, useState } from "react";
import Header from "./Header";
import GISMetaverseMap from "./GISMetaverseMap";
import MetaverseLeftToolbar from "./MetaverseLeftToolbar";
import MetaverseSubHeader from "./MetaverseSubHeader";
import MetaverseMapControls from "./MetaverseMapControls";

export default function MetaverseDashboard() {
  const mapRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [activeTool, setActiveTool] = useState("layers");

  const [metaverseFilters, setMetaverseFilters] = useState({
    projectId: "",
    block: "",
    plotType: "",
    plotNo: "",
    area: "",
  });

  const handleReset = () => {
    setMetaverseFilters({
      projectId: "",
      block: "",
      plotType: "",
      plotNo: "",
      area: "",
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
        />

        <MetaverseSubHeader
          filters={metaverseFilters}
          setFilters={setMetaverseFilters}
          onReset={handleReset}
          onCalendarClick={() => console.log("Calendar clicked")}
        />

        <MetaverseLeftToolbar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          map={isMapReady ? mapRef.current : null}
        />

        <MetaverseMapControls map={isMapReady ? mapRef.current : null} />
      </div>
    </div>
  );
}
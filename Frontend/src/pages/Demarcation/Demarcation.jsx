import React, { useState } from "react";
import Header from "./Header";
import DemarcationMap from "./DemarcationMap";
import LandUseBreakdown from "./LandUseBreakdown";
import SpatialQuery from "./SpatialQuery";
import Legend from "./Legend";
import PlotDetails from "./PlotDetails";
import SelectedPlots from "./SelectedPlots";

export default function Demarcation() {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-[#f4f4f4] font-sans text-[#4a4a4a]">
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
      />

      <div className="p-3">
        <div className="grid grid-cols-12 gap-3 h-[calc(100vh-72px)]">
          <DemarcationMap />

          <div className="col-span-12 lg:col-span-3 xl:col-span-3 flex flex-col gap-3">
            <LandUseBreakdown />
            <Legend />
            <SelectedPlots />
          </div>

          <div className="col-span-12 lg:col-span-3 xl:col-span-3 flex flex-col gap-3">
            <SpatialQuery />
            <PlotDetails />
          </div>
        </div>
      </div>
    </div>
  );
}
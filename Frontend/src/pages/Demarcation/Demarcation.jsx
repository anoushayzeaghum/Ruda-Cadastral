import React, { useCallback, useMemo, useState } from "react";
import Header from "./Header";
import DemarcationMap from "./DemarcationMap";
import LandUseBreakdown from "./LandUseBreakdown";
import SpatialQuery from "./SpatialQuery";
import Legend from "./Legend";
import PlotDetails from "./PlotDetails";

const getLandUseLabel = (feature) => {
  const props = feature?.properties || {};
  return props.type || props.land_use || props.name || "Other";
};

const buildLandUseSummary = (geojson) => {
  const counts = new Map();
  (geojson?.features || []).forEach((feature) => {
    const label = getLandUseLabel(feature);
    counts.set(label, (counts.get(label) || 0) + 1);
  });

  const total = [...counts.values()].reduce((sum, count) => sum + count, 0);

  return [...counts.entries()]
    .map(([label, count]) => ({
      label,
      count,
      percentage: total ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
};

export default function Demarcation() {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [filters, setFilters] = useState({
    selectedProject: null,
    selectedBlock: null,
    projectId: "",
    projectName: "",
    blockId: "",
    block: "",
    plotType: "",
    plotNo: "",
    selectedParcelNumber: "",
    searchNonce: 0,
  });

  const [loadedPlotsGeojson, setLoadedPlotsGeojson] = useState(null);
  const [selectedPlot, setSelectedPlot] = useState(null);

  const landUseSummary = useMemo(
    () => buildLandUseSummary(loadedPlotsGeojson),
    [loadedPlotsGeojson],
  );

  const handleFiltersChange = (partial) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const handlePlotSelect = useCallback((feature) => {
    setSelectedPlot(feature || null);
    const props = feature?.properties || {};
    setFilters((prev) => ({
      ...prev,
      plotNo: props.plot_no ? String(props.plot_no) : prev.plotNo,
      selectedParcelNumber: props.plot_no ? String(props.plot_no) : "",
    }));
  }, []);

  return (
    <div className="flex h-screen min-h-screen flex-col overflow-hidden bg-[#f4f4f4] font-sans text-[#4a4a4a]">
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        sidebarOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />

      {/* Full-screen map with floating panels on top */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <DemarcationMap
          filters={filters}
          onParcelSelect={handlePlotSelect}
          onFeaturesLoaded={setLoadedPlotsGeojson}
        />

        {/* Spatial Query - floating top center */}
        <div
          className="absolute left-1/2 top-2 z-30 -translate-x-1/2 sm:top-4"
          style={{ width: "calc(100vw - 24px)", maxWidth: "820px" }}
        >
          <SpatialQuery
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </div>

        {/* Plot Details - floating bottom left, opens automatically on selection */}
        <div className="absolute bottom-2 left-2 z-20 w-[230px] max-w-[calc(100vw-16px)] sm:bottom-4 sm:left-4 sm:w-[360px]">
          <PlotDetails parcel={selectedPlot} filters={filters} />
        </div>

        {/* Landuse Breakdown + Legend - floating bottom right, each collapsible */}
        <div className="absolute bottom-2 right-2 z-20 flex w-[210px] max-w-[calc(100vw-16px)] flex-col gap-2 sm:bottom-4 sm:right-4 sm:w-[320px] sm:gap-3">
          <LandUseBreakdown
            items={landUseSummary}
            selectedProjectName={filters.projectName}
          />
          <Legend
            items={landUseSummary}
            selectedParcelNumber={filters.selectedParcelNumber}
          />
        </div>
      </div>
    </div>
  );
}

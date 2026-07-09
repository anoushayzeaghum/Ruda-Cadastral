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
    <div className="flex flex-col bg-[#f4f4f4] font-sans text-[#4a4a4a] min-h-screen lg:h-screen lg:overflow-hidden">
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        sidebarOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />

      <div className="p-2 sm:p-3 flex-1 lg:overflow-hidden">
        {/* Mobile Layout - Scrollable, stacked in specific order */}
        <div className="flex flex-col lg:hidden gap-2 pb-4">
          {/* 1. Spatial Query */}
          <SpatialQuery filters={filters} onFiltersChange={handleFiltersChange} />

          {/* 2. Plot Details */}
          <PlotDetails parcel={selectedPlot} filters={filters} />

          {/* 3. Map */}
          <DemarcationMap
            filters={filters}
            onParcelSelect={handlePlotSelect}
            onFeaturesLoaded={setLoadedPlotsGeojson}
          />

          {/* 4. Legend */}
          <Legend items={landUseSummary} selectedParcelNumber={filters.selectedParcelNumber} />

          {/* 5. Landuse Breakdown */}
          <LandUseBreakdown items={landUseSummary} selectedProjectName={filters.projectName} />
        </div>

        {/* Desktop Layout - Grid with original order */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-3 h-full">
          {/* Map - 6 cols */}
          <DemarcationMap
            filters={filters}
            onParcelSelect={handlePlotSelect}
            onFeaturesLoaded={setLoadedPlotsGeojson}
          />

          {/* Left Panel - 3 cols */}
          <div className="flex flex-col gap-3 min-h-0 lg:col-span-3">
            <LandUseBreakdown items={landUseSummary} selectedProjectName={filters.projectName} />
            <PlotDetails parcel={selectedPlot} filters={filters} />
          </div>

          {/* Right Panel - 3 cols */}
          <div className="flex flex-col gap-3 min-h-0 lg:col-span-3">
            <SpatialQuery filters={filters} onFiltersChange={handleFiltersChange} />
            <Legend items={landUseSummary} selectedParcelNumber={filters.selectedParcelNumber} />
          </div>
        </div>
      </div>
    </div>
  );
}

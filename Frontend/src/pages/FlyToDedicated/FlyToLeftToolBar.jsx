import { useState } from "react";
import { Globe2, Layers, Filter as FilterIcon, Search } from "lucide-react";

import Basemaps from "../FlyToDedicated/tools/Basemaps";
import FlyTo from "../FlyToDedicated/tools/FlyTo";
import SegmentMeasurement from "../FlyToDedicated/tools/SegmentMeasurement";
import LayersPanel from "../FlyToDedicated/tools/Layers/MasterPlan";
import FlyToFilter from "../FlyToDedicated/tools/Filter";
import AttributeTable from "./AttributeTable";

export default function FlyToLeftToolbar({
  map,
  filters,
  setFilters,
  layerVisibility,
  setLayerVisibility,
  adminBoundaryVisibility,
  setAdminBoundaryVisibility,
  rebuildAllLayers,
}) {
  const [bottomPanel, setBottomPanel] = useState(null);

  const handleBottomPanel = (panel) => {
    setBottomPanel((prev) => (prev === panel ? null : panel));
  };

  return (
    <>
      {/* ================= ATTRIBUTE TABLE ICON ================= */}
      {/* ================= TOP LEFT TOOL GROUP ================= */}
<div className="absolute top-3 left-2 z-50 flex flex-col items-start gap-2">

  {/* FILTER */}
  <div className="relative">
    {bottomPanel === "filter" && (
      <div className="absolute top-0 left-10 ml-2 w-[320px] max-h-[70vh] overflow-hidden rounded-md border border-[#13593f] bg-[#06291f] text-white shadow-2xl">
        <FlyToFilter
          filters={filters}
          onClose={() => setBottomPanel(null)}
          onApply={(applied) => {
            setFilters((prev) => ({
              ...prev,
              ...applied,
              selectedPlotId: applied.selectedPlotId || "",
              selectedPlotGid: applied.selectedPlotGid || "",
              selectedPlotGeometry: applied.selectedPlotGeometry || null,
              flyToPlotTrigger: Date.now(),
            }));

            // Filter selection should show/fly to the plot only.
            // It must not open the block boundary layer automatically.
            setLayerVisibility((prev) => ({
              ...prev,
              masterPlan: true,
              blockBoundary: false,
            }));

            setBottomPanel(null);
          }}
        />
      </div>
    )}

          <button
            type="button"
            title="Filter"
            onClick={() => handleBottomPanel("filter")}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border shadow-sm transition ${
              bottomPanel === "filter"
                ? "border-[#9be37b] bg-[#0a3327] text-white"
                : "border-[#0c3d2d] bg-[#06291f] text-white hover:bg-[#0a3327]"
            }`}
          >
            <FilterIcon size={20} strokeWidth={2.2} />
          </button>
        </div>

  {/* SEARCH (Attribute Table) */}
  <div className="relative">
    {bottomPanel === "attribute" && (
      <div className="absolute top-0 left-10 ml-2 z-50">
        <AttributeTable
          map={map}
          filters={filters}
          onClose={() => setBottomPanel(null)}
            onSelectPlot={(plotData) => {
              setFilters((prev) => ({
                ...prev,
                ...plotData,
                projectId: plotData.projectId || prev.projectId,
                block: plotData.block || "",
                plotType: plotData.plotType || "",
                area: plotData.area || "",
                plotNo: plotData.plotNo || "",
                selectedPlotId: plotData.selectedPlotId || "",
                selectedPlotGid: plotData.selectedPlotGid || "",
                selectedPlotGeometry: plotData.selectedPlotGeometry || null,
                flyToPlotTrigger: Date.now(),
              }));

              // This is React state, not the Mapbox helper.
              // Keep the exact row identity and only make the plot layer visible.
              setLayerVisibility((prev) => ({
                ...prev,
                masterPlan: true,
                blockBoundary: false,
              }));
            }}
        />
      </div>
    )}

          <button
            type="button"
            title="Attribute Search"
            onClick={() => handleBottomPanel("attribute")}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border shadow-sm transition ${
              bottomPanel === "attribute"
                ? "border-[#9be37b] bg-[#0a3327] text-white"
                : "border-[#0c3d2d] bg-[#06291f] text-white hover:bg-[#0a3327]"
            }`}
          >
            <Search size={20} />
          </button>
        </div>
      </div>

      {/* ================= BOTTOM LEFT TOOLBAR ================= */}
      <div className="absolute bottom-4 left-2 z-40 flex flex-col items-start gap-2">
        {/* BASEMAPS */}
        <div className="relative">
          {bottomPanel === "basemaps" && (
            <div className="absolute bottom-0 left-10 ml-1 w-[calc(100vw-4rem)] max-h-[340px] overflow-y-auto rounded-md border border-[#13593f] bg-[#06291f] text-white shadow-2xl sm:w-[380px]">
              <Basemaps map={map} rebuildAllLayers={rebuildAllLayers} />
            </div>
          )}

          <button
            type="button"
            title="Basemaps"
            onClick={() => handleBottomPanel("basemaps")}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border shadow-sm transition ${
              bottomPanel === "basemaps"
                ? "border-[#9be37b] bg-[#0a3327] text-white"
                : "border-[#0c3d2d] bg-[#06291f] text-white hover:bg-[#0a3327]"
            }`}
          >
            <Globe2 size={20} strokeWidth={2.2} />
          </button>
        </div>

        {/* LAYERS */}
        <div className="relative">
          {bottomPanel === "layers" && (
            <div className="absolute bottom-0 left-10 ml-1 w-[300px] max-h-[500px] overflow-hidden rounded-md border border-[#13593f] bg-[#06291f] text-white shadow-2xl">
              <LayersPanel
                map={map}
                filters={filters}
                layerVisibility={layerVisibility}
                setLayerVisibility={setLayerVisibility}
                adminBoundaryVisibility={adminBoundaryVisibility}
                setAdminBoundaryVisibility={setAdminBoundaryVisibility}
                preserveLayers={true}
              />
            </div>
          )}

          <button
            type="button"
            title="Layers"
            onClick={() => handleBottomPanel("layers")}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border shadow-sm transition ${
              bottomPanel === "layers"
                ? "border-[#9be37b] bg-[#0a3327] text-white"
                : "border-[#0c3d2d] bg-[#06291f] text-white hover:bg-[#0a3327]"
            }`}
          >
            <Layers size={20} strokeWidth={2.2} />
          </button>
        </div>

        {/* FLY TO */}
        <div className="relative">
          <FlyTo
            filters={filters}
            setFilters={setFilters}
            setLayerVisibility={setLayerVisibility}
          />
        </div>

        {/* MEASUREMENT */}
        <SegmentMeasurement map={map} />
      </div>
    </>
  );
}

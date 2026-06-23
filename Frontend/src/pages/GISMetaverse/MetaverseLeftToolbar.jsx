// MetaverseLeftToolbar.jsx
import { useEffect, useState } from "react";
import {
  Layers,
  Drone,
  Filter as FilterIcon,
  MousePointerClick,
  Hourglass,
  Ruler,
  Box,
  Globe2,
  FileInput,
  Send,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Filter from "./tools/Filter";
import Basemaps from "./tools/Basemaps";
import LayersPanel from "./tools/Layers";
import DroneImagery from "./tools/DroneImagery";
import TimeLapse from "./tools/TimeLapse";
import ChangeDetection from "./tools/ChangeDetection";
import Import from "./tools/Import";
import Measurement from "./tools/Measurement";
import FlyTo from "./tools/FlyTo";

const tools = [
  { id: "layers", label: "Layers", icon: Layers },
  { id: "droneImagery", label: "Drone Imagery", icon: Drone },
  { id: "filter", label: "Filter", icon: FilterIcon },
  { id: "changeDetection", label: "Change Detection", icon: MousePointerClick },
  { id: "timeLapse", label: "Time Lapse", icon: Hourglass },
  { id: "measurement", label: "Measurement", icon: Ruler },

  // 👇 3D first
  { id: "threeD", label: "3D View", icon: Box },

  // 👇 moved here (below 3D)
  { id: "flyTo", label: "Fly To", icon: Send },

  { id: "import", label: "Import", icon: FileInput },

  // 👇 moved here (below import)
  { id: "basemaps", label: "Basemaps", icon: Globe2 },
];

const TOOL_BUTTON_SIZE = 36;
const TOOL_GAP = 4;

export default function MetaverseLeftToolbar({
  activeTool,
  setActiveTool,
  map,
  filters,
  setFilters,
  layerVisibility,
  setLayerVisibility,
  adminBoundaryVisibility,
  setAdminBoundaryVisibility,
  rebuildAllLayers,
}) {
  const navigate = useNavigate();
  const [followEnabled, setFollowEnabled] = useState(false);

  useEffect(() => {
    if (!followEnabled || !map || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        map.flyTo({
          center: [pos.coords.longitude, pos.coords.latitude],
          zoom: 16,
          duration: 900,
        });
      },
      (err) => console.error(err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [followEnabled, map]);

  const activeToolIndex = tools.findIndex((t) => t.id === activeTool);

  const panelTop =
    activeToolIndex >= 0
      ? 12 + activeToolIndex * (TOOL_BUTTON_SIZE + TOOL_GAP)
      : 12;

  const isLayersOpen = activeTool === "layers";

  const handleToolClick = (toolId) => {
    if (toolId === "threeD") {
      navigate("/society-3d");
      return;
    }

    setActiveTool((prev) => (prev === toolId ? null : toolId));
  };

  return (
    <>
      {/* LEFT TOOLBAR */}
      <div className="absolute left-2 top-3 z-30 flex flex-col gap-1">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;

          return (
            <button
              key={tool.id}
              title={tool.label}
              onClick={() => handleToolClick(tool.id)}
              className={`relative flex h-9 w-9 items-center justify-center rounded-md shadow-md transition-all duration-150 ${
                isActive
                  ? "bg-white text-[#1B3A6B] border-2 border-[#1B3A6B]"
                  : "bg-[#1B3A6B] text-white border border-[#1B3A6B] hover:bg-[#162f5a]"
              }`}
            >
              <Icon size={20} />
            </button>
          );
        })}
      </div>

      {/* LAYERS PANEL */}
      <div
        className={`absolute z-30 bg-[#202736] text-white border border-[#3a4354] rounded-md shadow-2xl
        sm:left-14 sm:w-[300px]
        bottom-0 left-0 right-0 sm:bottom-auto`}
        style={{
          top: window.innerWidth >= 640 ? `${panelTop}px` : undefined,
          display: isLayersOpen ? "block" : "none",
        }}
      >
        <LayersPanel
          map={map}
          filters={filters}
          layerVisibility={layerVisibility}
          setLayerVisibility={setLayerVisibility}
          adminBoundaryVisibility={adminBoundaryVisibility}
          setAdminBoundaryVisibility={setAdminBoundaryVisibility}
        />
      </div>

      {/* TOOL PANELS (FILTER, IMPORT, etc.) */}
      {activeTool && activeTool !== "layers" && (
        <div
          className="absolute z-30 bg-[#202736] text-white border border-[#3a4354] rounded-md shadow-2xl
          sm:left-14 sm:w-[320px]
          bottom-0 left-0 right-0 sm:bottom-auto"
          style={{
            top: window.innerWidth >= 640 ? `${panelTop}px` : undefined,
          }}
        >
          {activeTool === "filter" && (
            <Filter
              filters={filters}
              setLayerVisibility={setLayerVisibility}
              onApply={(f) => {
                setFilters((prev) => ({ ...prev, ...f }));
                setActiveTool("layers");
              }}
              onClose={() => setActiveTool(null)}
            />
          )}

          {activeTool === "basemaps" && (
            <Basemaps map={map} rebuildAllLayers={rebuildAllLayers} />
          )}

          {activeTool === "droneImagery" && <DroneImagery map={map} />}
          {activeTool === "timeLapse" && (
            <TimeLapse map={map} onClose={() => setActiveTool(null)} />
          )}
          {activeTool === "changeDetection" && (
            <ChangeDetection map={map} onClose={() => setActiveTool(null)} />
          )}
          {activeTool === "import" && (
            <Import map={map} onClose={() => setActiveTool(null)} />
          )}
          {activeTool === "measurement" && <Measurement map={map} />}
          {activeTool === "flyTo" && (
            <FlyTo
              filters={filters}
              setFilters={setFilters}
              setLayerVisibility={setLayerVisibility}
            />
          )}
        </div>
      )}
    </>
  );
}

function GenericToolPanel({ tool }) {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-[#343c4c] px-4 py-3 text-[12px] font-bold">
        <span>{tool?.label}</span>
        <ChevronRight size={15} />
      </div>

      <div className="p-4 text-sm text-white/75">
        Create your <b>{tool?.label}</b> component and render it here.
      </div>
    </div>
  );
}

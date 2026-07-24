import { useCallback, useEffect, useState } from "react";
import {
  Layers,
  Drone,
  Video,
  Filter as FilterIcon,
  MousePointerClick,
  Hourglass,
  Ruler,
  Box,
  Globe2,
  FileInput,
  Send,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Filter from "./tools/Filter";
import Basemaps from "./tools/Basemaps";
import LayersPanel from "./tools/Layers";
import DroneImagery from "./tools/DroneImagery";
import DroneVideos from "./tools/DroneVideos";
import TimeLapse from "./tools/TimeLapse";
import ChangeDetection from "./tools/ChangeDetection";
import Import from "./tools/Import";
import Measurement from "./tools/Measurement";
import FlyTo from "./tools/FlyTo";

const tools = [
  { id: "layers", label: "Layers", icon: Layers },
  { id: "droneImagery", label: "Drone Imagery", icon: Drone },
  { id: "droneVideos", label: "Drone Videos", icon: Video },
  { id: "filter", label: "Filter", icon: FilterIcon },
  { id: "changeDetection", label: "Change Detection", icon: MousePointerClick },
  { id: "timeLapse", label: "Time Lapse", icon: Hourglass },
  { id: "measurement", label: "Measurement", icon: Ruler },
  { id: "threeD", label: "3D View", icon: Box },
  { id: "flyTo", label: "Fly To", icon: Send },
  { id: "import", label: "Import", icon: FileInput },
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
  const [followEnabled] = useState(false);
  const [expandedTool, setExpandedTool] = useState(null);

  useEffect(() => {
    if (!followEnabled || !map || !navigator.geolocation) return undefined;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        map.flyTo({
          center: [
            position.coords.longitude,
            position.coords.latitude,
          ],
          zoom: 16,
          duration: 900,
        });
      },
      (error) => console.error(error),
      { enableHighAccuracy: true },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [followEnabled, map]);

  const activeToolIndex = tools.findIndex(
    (tool) => tool.id === activeTool,
  );

  const handleToolExpandedChange = useCallback((toolId, isExpanded) => {
    setExpandedTool((current) => {
      if (isExpanded) return toolId;
      return current === toolId ? null : current;
    });
  }, []);

  const handleDroneImageryExpandedChange = useCallback(
    (isExpanded) =>
      handleToolExpandedChange("droneImagery", isExpanded),
    [handleToolExpandedChange],
  );

  const handleDroneVideosExpandedChange = useCallback(
    (isExpanded) =>
      handleToolExpandedChange("droneVideos", isExpanded),
    [handleToolExpandedChange],
  );

  const handleTimeLapseExpandedChange = useCallback(
    (isExpanded) =>
      handleToolExpandedChange("timeLapse", isExpanded),
    [handleToolExpandedChange],
  );

  const handleChangeDetectionExpandedChange = useCallback(
    (isExpanded) =>
      handleToolExpandedChange("changeDetection", isExpanded),
    [handleToolExpandedChange],
  );

  useEffect(() => {
    setExpandedTool(null);
  }, [activeTool]);

  const isActiveToolExpanded = expandedTool === activeTool;

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

    setActiveTool((previous) =>
      previous === toolId ? null : toolId,
    );
  };

  return (
    <>
      <div className="absolute left-2 top-3 z-30 flex flex-col gap-1">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;

          return (
            <button
              key={tool.id}
              type="button"
              title={tool.label}
              onClick={() => handleToolClick(tool.id)}
              className={`relative flex h-9 w-9 items-center justify-center rounded-md shadow-md transition-all duration-150 ${isActive
                ? "border-2 border-[#1B3A6B] bg-white text-[#1B3A6B]"
                : "border-[#0f3d2e] bg-[#1f2937] text-white hover:bg-[#0f3d2e]"
                }`}
            >
              <Icon size={20} />
            </button>
          );
        })}
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 z-30 flex-col rounded-md border border-[#13593f] bg-[#06291f] text-white shadow-2xl sm:bottom-auto sm:left-14 sm:w-[300px]"
        style={{
          top:
            window.innerWidth >= 640
              ? `${panelTop}px`
              : undefined,
          display: isLayersOpen ? "flex" : "none",
        }}
      >
        <PanelHeader
          title="Layers"
          onClose={() => setActiveTool(null)}
        />

        <LayersPanel
          map={map}
          filters={filters}
          layerVisibility={layerVisibility}
          setLayerVisibility={setLayerVisibility}
          adminBoundaryVisibility={adminBoundaryVisibility}
          setAdminBoundaryVisibility={setAdminBoundaryVisibility}
        />
      </div>

      {activeTool && activeTool !== "layers" && (
        <div
          className={`absolute bottom-0 left-0 right-0 rounded-md border border-[#13593f] bg-[#06291f] text-white shadow-2xl sm:bottom-auto sm:left-14 sm:w-[320px] ${isActiveToolExpanded ? "z-[10000]" : "z-30"
            }`}
          style={{
            top:
              window.innerWidth >= 640
                ? `${panelTop}px`
                : undefined,
          }}
        >
          {activeTool === "filter" && (
            <Filter
              filters={filters}
              setLayerVisibility={setLayerVisibility}
              onApply={(nextFilters) => {
                setFilters((previous) => ({
                  ...previous,
                  ...nextFilters,
                }));
                setActiveTool("layers");
              }}
              onClose={() => setActiveTool(null)}
            />
          )}

          {activeTool === "basemaps" && (
            <>
              <PanelHeader
                title="Basemaps"
                onClose={() => setActiveTool(null)}
              />
              <Basemaps
                map={map}
                rebuildAllLayers={rebuildAllLayers}
              />
            </>
          )}

          {activeTool === "droneImagery" && (
            <>
              <PanelHeader
                title="Drone Imagery"
                onClose={() => setActiveTool(null)}
              />
              <DroneImagery
                map={map}
                onExpandedChange={
                  handleDroneImageryExpandedChange
                }
              />
            </>
          )}

          {activeTool === "droneVideos" && (
            <DroneVideos
              onClose={() => setActiveTool(null)}
              onExpandedChange={
                handleDroneVideosExpandedChange
              }
            />
          )}

          {activeTool === "timeLapse" && (
            <TimeLapse
              map={map}
              onClose={() => setActiveTool(null)}
              onExpandedChange={
                handleTimeLapseExpandedChange
              }
            />
          )}

          {activeTool === "changeDetection" && (
            <ChangeDetection
              map={map}
              onClose={() => setActiveTool(null)}
              onExpandedChange={
                handleChangeDetectionExpandedChange
              }
            />
          )}

          {activeTool === "import" && (
            <Import
              map={map}
              onClose={() => setActiveTool(null)}
            />
          )}

          {activeTool === "measurement" && (
            <Measurement
              map={map}
              onClose={() => setActiveTool(null)}
            />
          )}

          {activeTool === "flyTo" && (
            <>
              <PanelHeader
                title="Fly To"
                onClose={() => setActiveTool(null)}
              />
              <FlyTo
                filters={filters}
                setFilters={setFilters}
                setLayerVisibility={setLayerVisibility}
              />
            </>
          )}
        </div>
      )}
    </>
  );
}

function PanelHeader({ title, onClose }) {
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-[#0c3d2d] px-4 py-2.5">
      <span className="text-[12px] font-bold uppercase tracking-wide">
        {title}
      </span>

      <button
        type="button"
        onClick={onClose}
        className="flex h-6 w-6 items-center justify-center rounded text-white/50 transition hover:bg-[#0a3327] hover:text-white"
        title="Close"
      >
        <X size={14} />
      </button>
    </div>
  );
}
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
  ChevronRight,
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
import SegmentMeasurement from "./tools/SegmentMeasurement";
import FlyTo from "./tools/FlyTo";

const tools = [
  { id: "layers", label: "Layers", icon: Layers },
  { id: "droneImagery", label: "Drone Imagery", icon: Drone },
  { id: "filter", label: "Filter", icon: FilterIcon },
  { id: "changeDetection", label: "Change Detection", icon: MousePointerClick },
  { id: "timeLapse", label: "Time Lapse", icon: Hourglass },
  { id: "measurement", label: "Measurement", icon: Ruler },
  { id: "threeD", label: "3D View", icon: Box },
  { id: "import", label: "Import", icon: FileInput },
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
}) {
  const navigate = useNavigate();
  const [bottomPanel, setBottomPanel] = useState(null);
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
      (err) => console.error("Follow location error:", err),
      { enableHighAccuracy: true },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [followEnabled, map]);

  const activeToolIndex = tools.findIndex((tool) => tool.id === activeTool);

  const panelTop =
    activeToolIndex >= 0
      ? 12 + activeToolIndex * (TOOL_BUTTON_SIZE + TOOL_GAP)
      : 12;

  const handleToolClick = (toolId) => {
    if (toolId === "threeD") {
      navigate("/society-3d");
      return;
    }

    setBottomPanel(null);
    setActiveTool((prev) => (prev === toolId ? null : toolId));
  };

  const handleBottomPanel = (panel) => {
    setActiveTool(null);
    setBottomPanel((prev) => (prev === panel ? null : panel));
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
              className={`flex h-9 w-9 items-center justify-center rounded-md border shadow-md transition ${
                isActive
                  ? "border-[#8bd66f] bg-[#243041] text-white"
                  : "border-[#344055] bg-[#1d2533] text-white hover:bg-[#293445]"
              }`}
            >
              <Icon size={20} strokeWidth={2.2} />
            </button>
          );
        })}
      </div>

      {activeTool && (
        <div
          className={`absolute z-30 rounded-md border border-[#3a4354] bg-[#202736] text-white shadow-2xl
            /* Mobile: slide up from bottom as a sheet */
            bottom-0 left-0 right-0 max-h-[70vh] overflow-y-auto rounded-b-none
            /* sm+: restore left toolbar panel behaviour */
            sm:bottom-auto sm:left-14 sm:right-auto sm:rounded-b-md
            ${
              activeTool === "filter"
                ? "sm:w-[300px] sm:max-h-[400px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                : activeTool === "layers"
                  ? "sm:w-[300px] sm:max-h-[500px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                  : activeTool === "droneImagery"
                    ? "sm:w-[320px] sm:max-h-[calc(100vh-90px)]"
                    : activeTool === "timeLapse"
                      ? "sm:w-[360px] sm:max-h-[calc(100vh-90px)] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                      : activeTool === "changeDetection"
                        ? "sm:w-[360px] sm:max-h-[500px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                        : activeTool === "import"
                          ? "sm:w-[340px] sm:max-h-[calc(100vh-90px)] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                          : activeTool === "measurement"
                            ? "sm:w-[300px] sm:max-h-[calc(100vh-90px)] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                            : "sm:w-[270px] sm:max-h-[calc(100vh-90px)]"
            }`}
          style={{ top: window.innerWidth >= 640 ? `${panelTop}px` : undefined }}
        >
          {/* Mobile drag handle — hidden on sm+ */}
          <div className="flex items-center justify-between border-b border-[#343c4c] px-4 py-2 sm:hidden">
            <div className="mx-auto h-1 w-10 rounded-full bg-white/30" />
            <button
              type="button"
              onClick={() => setActiveTool(null)}
              className="ml-4 text-white/50 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>

          {activeTool === "layers" && (            <LayersPanel
              map={map}
              filters={filters}
              layerVisibility={layerVisibility}
              setLayerVisibility={setLayerVisibility}
              adminBoundaryVisibility={adminBoundaryVisibility}
              setAdminBoundaryVisibility={setAdminBoundaryVisibility}
            />
          )}

          {activeTool === "filter" && (
            <Filter
              filters={filters}
              projectId={filters?.projectId}
              setLayerVisibility={setLayerVisibility}
              onApply={(appliedFilters) => {
                setFilters?.((prev) => ({ ...prev, ...appliedFilters }));
                setActiveTool("layers");
              }}
              onClose={() => setActiveTool(null)}
            />
          )}

          {activeTool === "droneImagery" && <DroneImagery map={map} />}
          {activeTool === "timeLapse" && <TimeLapse map={map} />}
          {activeTool === "changeDetection" && <ChangeDetection map={map} />}
          {activeTool === "import" && (
            <Import map={map} onClose={() => setActiveTool(null)} />
          )}
          {activeTool === "measurement" && <Measurement map={map} />}

          {activeTool !== "layers" &&
            activeTool !== "filter" &&
            activeTool !== "droneImagery" &&
            activeTool !== "timeLapse" &&
            activeTool !== "changeDetection" &&
            activeTool !== "import" &&
            activeTool !== "measurement" && (
              <GenericToolPanel tool={tools.find((t) => t.id === activeTool)} />
            )}
        </div>
      )}

      <div className="absolute bottom-4 left-2 z-40 flex flex-col items-start gap-2">
        {bottomPanel === "basemaps" && (
          <div className="mb-1 w-[calc(100vw-4rem)] max-h-[340px] overflow-y-auto rounded-md border border-[#3a4354] bg-[#202736] text-white shadow-2xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:w-[380px]">
            <Basemaps map={map} />
          </div>
        )}

        {bottomPanel === "flyTo" && (
          <div className="mb-1 w-[300px] rounded-md border border-[#3a4354] bg-[#202736] text-white shadow-2xl">
            <FlyTo
              filters={filters}
              setFilters={setFilters}
              setLayerVisibility={setLayerVisibility}
              onClose={() => setBottomPanel(null)}
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => handleBottomPanel("basemaps")}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-[#344055] bg-[#1d2533] text-white shadow-md transition hover:bg-[#293445]"
          title="Basemaps"
        >
          <Globe2 size={20} strokeWidth={2.2} />
        </button>
        <FlyTo
          filters={filters}
          setFilters={setFilters}
          setLayerVisibility={setLayerVisibility}
        />

        {/* <SegmentMeasurement map={map} /> */}
      </div>
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

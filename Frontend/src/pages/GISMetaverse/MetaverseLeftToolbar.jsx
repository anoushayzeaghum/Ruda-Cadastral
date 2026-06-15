import {
  Layers,
  ScanLine,
  Filter as FilterIcon,
  MousePointerClick,
  Hourglass,
  Send,
  Ruler,
  Box,
  Globe2,
  FileInput,
  ChevronRight,
} from "lucide-react";

import Filter from "./tools/Filter";
import Basemaps from "./tools/Basemaps";
import LayersPanel from "./tools/Layers";

const tools = [
  { id: "layers", label: "Layers", icon: Layers },
  { id: "droneImagery", label: "Drone Imagery", icon: ScanLine },
  { id: "filter", label: "Filter", icon: FilterIcon },
  { id: "changeDetection", label: "Change Detection", icon: MousePointerClick },
  { id: "timeLapse", label: "Time Lapse", icon: Hourglass },
  { id: "flyTo", label: "Fly To", icon: Send },
  { id: "measurement", label: "Measurement", icon: Ruler },
  { id: "threeD", label: "3D View", icon: Box },
  { id: "basemaps", label: "Basemaps", icon: Globe2 },
  { id: "import", label: "Import", icon: FileInput },
];

const TOOL_BUTTON_SIZE = 36;
const TOOL_GAP = 4;

export default function MetaverseLeftToolbar({
  activeTool,
  setActiveTool,
  map,
}) {
  const activeToolIndex = tools.findIndex((tool) => tool.id === activeTool);

  const panelTop =
    activeToolIndex >= 0
      ? 12 + activeToolIndex * (TOOL_BUTTON_SIZE + TOOL_GAP)
      : 12;

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
              onClick={() => setActiveTool(isActive ? null : tool.id)}
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
          className={`absolute left-14 z-30 rounded-md border border-[#3a4354] bg-[#202736] text-white shadow-2xl ${
            activeTool === "filter"
              ? "w-[320px] overflow-visible"
              : activeTool === "layers"
                ? "w-[300px] max-h-[calc(100vh-90px)] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                : activeTool === "basemaps"
                  ? "w-[380px] max-h-[340px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                  : "w-[270px] max-h-[calc(100vh-90px)] overflow-y-auto"
          }`}
          style={{ top: `${panelTop}px` }}
        >
          {activeTool === "layers" && <LayersPanel map={map} />}

          {activeTool === "filter" && (
            <Filter onClose={() => setActiveTool(null)} />
          )}

          {activeTool === "basemaps" && <Basemaps map={map} />}

          {activeTool !== "layers" &&
            activeTool !== "filter" &&
            activeTool !== "basemaps" && (
              <GenericToolPanel tool={tools.find((t) => t.id === activeTool)} />
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

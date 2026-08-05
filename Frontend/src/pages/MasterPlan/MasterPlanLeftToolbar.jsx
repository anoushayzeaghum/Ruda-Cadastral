import { Layers, X } from "lucide-react";

// Reuse the shared RUDA Master Plan layer component — no copy, no override.
import RUDAMasterPlan from "../GISMetaverse/tools/Layers/RUDAMasterPlan";

const TOOL_BUTTON_SIZE = 36;
const TOOL_GAP = 4;

const TOOL_ITEMS = [
  {
    id: "layers",
    label: "RUDA Master Plan Layers",
    icon: Layers,
  },
];

export default function MasterPlanLeftToolbar({
  activeTool,
  setActiveTool,
  map,
  // The following props are received from MasterPlanDashboard for
  // compatibility but are not forwarded to RUDAMasterPlan, which manages
  // its own internal layer state independently.
  filters,       // eslint-disable-line no-unused-vars
  setFilters,    // eslint-disable-line no-unused-vars
  layerVisibility,  // eslint-disable-line no-unused-vars
  setLayerVisibility, // eslint-disable-line no-unused-vars
}) {
  const activeToolIndex = TOOL_ITEMS.findIndex(
    (tool) => tool.id === activeTool,
  );

  const panelTop =
    activeToolIndex >= 0
      ? 12 + activeToolIndex * (TOOL_BUTTON_SIZE + TOOL_GAP)
      : 12;

  const isLayersOpen = activeTool === "layers";

  const handleToolClick = (toolId) => {
    setActiveTool((previous) =>
      previous === toolId ? null : toolId,
    );
  };

  return (
    <>
      {/* ── Toolbar button strip ─────────────────────────────────────── */}
      <div className="absolute left-2 top-3 z-30 flex flex-col gap-1">
        {TOOL_ITEMS.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;

          return (
            <button
              key={tool.id}
              type="button"
              title={tool.label}
              aria-label={tool.label}
              aria-pressed={isActive}
              onClick={() => handleToolClick(tool.id)}
              className={`relative flex h-9 w-9 items-center justify-center rounded-md shadow-md transition-all duration-150 ${
                isActive
                  ? "border-2 border-[#1B3A6B] bg-white text-[#1B3A6B]"
                  : "border-[#0f3d2e] bg-[#1f2937] text-white hover:bg-[#0f3d2e]"
              }`}
            >
              <Icon size={20} />
            </button>
          );
        })}
      </div>

      {/*
        ── Layers panel ─────────────────────────────────────────────────
        The panel is ALWAYS mounted (never conditionally rendered) so that
        RUDAMasterPlan retains its internal state — checked layers, opacity
        values, changed colors, categorized colors, cached GeoJSON, expanded
        groups, attribute-table state — across open/close cycles.
        Visibility is controlled with display:flex / display:none only.
      */}
      <div
        className="absolute bottom-0 left-0 right-0 z-30 flex-col rounded-md border border-[#13593f] bg-[#06291f] text-white shadow-2xl sm:bottom-auto sm:left-14 sm:w-[300px]"
        style={{
          top:
            typeof window !== "undefined" && window.innerWidth >= 640
              ? `${panelTop}px`
              : undefined,
          display: isLayersOpen ? "flex" : "none",
          maxHeight:
            typeof window !== "undefined" && window.innerWidth >= 640
              ? `calc(100vh - ${panelTop + 16}px)`
              : "70vh",
        }}
      >
        <PanelHeader
          title="RUDA Master Plan Layers"
          onClose={() => setActiveTool(null)}
        />

        <div className="min-h-0 flex-1 overflow-y-auto">
          <RUDAMasterPlan map={map} />
        </div>
      </div>
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

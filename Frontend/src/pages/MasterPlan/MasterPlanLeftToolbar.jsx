import { Layers3, X } from "lucide-react";

// Reuse the shared RUDA Master Plan layer component unchanged.
// This is a direct import — no copy, no recreation, no palette override.
// All symbology, legends, opacity, color editing, attribute tables, toggle-all,
// group toggles, caching, and style-reload resilience come from this component.
import RUDAMasterPlan from "../GISMetaverse/tools/Layers/RUDAMasterPlan";

const TOOL_BUTTON_SIZE = 40;
const TOOL_GAP = 8;

// "Select Project" toolbar button removed — project selection lives in the SubHeader.
const TOOL_ITEMS = [
  {
    id: "layers",
    label: "RUDA Master Plan Layers",
    icon: Layers3,
  },
];

export default function MasterPlanLeftToolbar({
  activeTool,
  setActiveTool,
  map,
  // filters / setFilters / layerVisibility / setLayerVisibility are kept in the
  // signature so MasterPlanDashboard does not need to change, even though
  // RUDAMasterPlan manages its own internal layer state independently.
  filters,
  setFilters,
  layerVisibility,
  setLayerVisibility,
}) {
  const activeToolIndex = TOOL_ITEMS.findIndex(
    (tool) => tool.id === activeTool,
  );

  const panelTop =
    activeToolIndex >= 0
      ? 12 + activeToolIndex * (TOOL_BUTTON_SIZE + TOOL_GAP)
      : 12;

  const toggleTool = (toolId) => {
    setActiveTool((currentTool) =>
      currentTool === toolId ? null : toolId,
    );
  };

  return (
    <>
      {/* ── Toolbar button strip ─────────────────────────────────────────── */}
      <aside
        className="absolute left-2 top-3 z-40 flex flex-col gap-2 sm:left-3"
        aria-label="Master Plan tools"
      >
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
              onClick={() => toggleTool(tool.id)}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border shadow-xl backdrop-blur-md transition focus:outline-none focus:ring-2 focus:ring-[#8fd36f]/70 ${
                isActive
                  ? "border-[#8fd36f] bg-white text-[#0f3d2e]"
                  : "border-white/15 bg-[#10261f]/95 text-white hover:border-[#8fd36f]/70 hover:bg-[#0f3d2e]"
              }`}
            >
              <Icon size={20} />
            </button>
          );
        })}
      </aside>

      {/* ── Layers panel ────────────────────────────────────────────────── */}
      {activeTool === "layers" && (
        <ToolbarPanel
          title="RUDA Master Plan Layers"
          panelTop={panelTop}
          widthClass="sm:w-[370px] lg:w-[400px]"
          onClose={() => setActiveTool(null)}
        >
          {/*
            RUDAMasterPlan manages all of its own state internally.
            The only prop it requires is the live Mapbox map instance.
            Passing null when the map is not yet ready is safe — the
            component guards every map call with an early return.
          */}
          <RUDAMasterPlan map={map} />
        </ToolbarPanel>
      )}
    </>
  );
}

// ── ToolbarPanel ──────────────────────────────────────────────────────────────

function ToolbarPanel({
  title,
  panelTop,
  widthClass,
  onClose,
  children,
}) {
  return (
    <section
      className={`fixed inset-x-2 bottom-2 z-50 flex max-h-[78vh] flex-col overflow-hidden rounded-2xl border border-[#245f4a] bg-[#06291f]/98 text-white shadow-2xl backdrop-blur-md sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-[60px] sm:max-h-[calc(100vh-82px)] ${widthClass}`}
      style={{
        top:
          typeof window !== "undefined" && window.innerWidth >= 640
            ? `${panelTop}px`
            : undefined,
      }}
    >
      {/* Panel header */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#0c3d2d] bg-[#0a3327] px-4 py-2.5">
        <h2 className="truncate text-[12px] font-bold uppercase tracking-[0.12em]">
          {title}
        </h2>

        <button
          type="button"
          title="Close"
          aria-label={`Close ${title}`}
          onClick={onClose}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-white/50 transition hover:bg-[#0a3327] hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30"
        >
          <X size={14} />
        </button>
      </div>

      {/* Scrollable panel body — RUDAMasterPlan handles its own inner scroll */}
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </section>
  );
}

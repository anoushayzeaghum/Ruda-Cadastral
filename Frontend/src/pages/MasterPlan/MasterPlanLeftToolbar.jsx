import { Layers3, X } from "lucide-react";

import Administrative from "../GISMetaverse/tools/Layers/ProjectMasterplan/Administrative";
import LandRevenueRecord from "../GISMetaverse/tools/Layers/ProjectMasterplan/LandRevenueRecord";
import TopographicPlan from "../GISMetaverse/tools/Layers/ProjectMasterplan/TopographicPlan";
import Utilities from "../GISMetaverse/tools/Layers/ProjectMasterplan/Utilities";
import LiveCamera from "../GISMetaverse/tools/Layers/ProjectMasterplan/LiveCamera";
import NotifiedBoundaries from "../GISMetaverse/tools/Layers/ProjectMasterplan/NotifiedBoundaries";

const TOOL_BUTTON_SIZE = 40;
const TOOL_GAP = 8;

// "Select Project" tool removed — project selection is now in MasterPlanSubHeader.
const TOOL_ITEMS = [
  {
    id: "layers",
    label: "Master Plan Layers",
    icon: Layers3,
  },
];

export default function MasterPlanLeftToolbar({
  activeTool,
  setActiveTool,
  map,
  filters,
  setFilters,
  layerVisibility,
  setLayerVisibility,
}) {
  const selectedProjectId = filters?.projectId || "";

  // Subtitle shown in the panel header
  const selectedProjectLabel = selectedProjectId
    ? `Project ID: ${selectedProjectId}`
    : "No project selected";

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

      {activeTool === "layers" && (
        <ToolbarPanel
          title="Master Plan Layers"
          subtitle={selectedProjectLabel}
          panelTop={panelTop}
          widthClass="sm:w-[370px] lg:w-[400px]"
          onClose={() => setActiveTool(null)}
        >
          <div className="h-full overflow-y-auto overscroll-contain [scrollbar-color:#3f6f5e_#06291f] [scrollbar-width:thin]">
            {/* No-project notice — visible before a project is selected */}
            {!selectedProjectId && (
              <div className="m-3 rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-[11px] leading-relaxed text-amber-100">
                Select a project from the SubHeader above to enable
                Master Plan layers.
              </div>
            )}

            {/* Shared layer components — always rendered; each handles empty projectId */}
            <Administrative
              map={map}
              title="ADMINISTRATIVE"
              selectedProjectId={selectedProjectId}
              layerVisibility={layerVisibility}
              setLayerVisibility={setLayerVisibility}
            />

            <LandRevenueRecord
              map={map}
              selectedProjectId={selectedProjectId}
              layerVisibility={layerVisibility}
              setLayerVisibility={setLayerVisibility}
            />

            <TopographicPlan
              map={map}
              selectedProjectId={selectedProjectId}
              layerVisibility={layerVisibility}
              setLayerVisibility={setLayerVisibility}
            />

            <Utilities
              map={map}
              selectedProjectId={selectedProjectId}
              layerVisibility={layerVisibility}
              setLayerVisibility={setLayerVisibility}
            />

            <LiveCamera
              map={map}
              selectedProjectId={selectedProjectId}
              layerVisibility={layerVisibility}
              setLayerVisibility={setLayerVisibility}
            />

            <NotifiedBoundaries
              map={map}
              selectedProjectId={selectedProjectId}
              layerVisibility={layerVisibility}
              setLayerVisibility={setLayerVisibility}
            />
          </div>
        </ToolbarPanel>
      )}
    </>
  );
}

// ── ToolbarPanel ──────────────────────────────────────────────────────────────

function ToolbarPanel({
  title,
  subtitle,
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
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 bg-[#0a3327] px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-xs font-bold uppercase tracking-[0.12em]">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-1 truncate text-[10px] text-white/55">
              {subtitle}
            </p>
          )}
        </div>

        <button
          type="button"
          title="Close"
          aria-label={`Close ${title}`}
          onClick={onClose}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30"
        >
          <X size={15} />
        </button>
      </div>

      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}

import { Box, Layers } from "lucide-react";
import { ThreeDExtrusionManager, ThreeDLayerManager } from "./Society3DLayers";

const tools = [
  { id: "layers", label: "3D Layer Manager", icon: Layers },
  { id: "extrusion", label: "3D Extrusion", icon: Box },
];

const TOOL_BUTTON_SIZE = 36;
const TOOL_GAP = 4;
const TOOLBAR_TOP = 20;

export default function Society3DLeftToolbar({
  activePanel,
  setActivePanel,
  layers,
  setLayers,
  basemap,
  setBasemap,
  selectedProject,
  extrusion,
  setExtrusion,
  selectedFeature,
  onApplyToSelected,
  onClearExtrusions,
}) {
  const activeToolIndex = tools.findIndex((tool) => tool.id === activePanel);
  const panelTop =
    activeToolIndex >= 0
      ? TOOLBAR_TOP + activeToolIndex * (TOOL_BUTTON_SIZE + TOOL_GAP)
      : TOOLBAR_TOP;

  const handleToolClick = (toolId) => {
    setActivePanel((prev) => (prev === toolId ? null : toolId));
  };

  return (
    <>
      <style>{`
        @keyframes society3dPanelDrop {
          from { opacity: 0; transform: translateY(-12px) scaleY(0.98); }
          to { opacity: 1; transform: translateY(0) scaleY(1); }
        }
      `}</style>

      <div className="absolute left-2 top-5 z-40 flex flex-col gap-1">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activePanel === tool.id;

          return (
            <button
              key={tool.id}
              type="button"
              title={tool.label}
              aria-label={tool.label}
              onClick={() => handleToolClick(tool.id)}
              className={`flex h-9 w-9 items-center justify-center rounded-md border text-white shadow-md transition ${
                isActive
                  ? "border-[#9be37b] bg-[#0a3327]"
                  : "border-[#0c3d2d] bg-[#06291f] hover:bg-[#0a3327]"
              }`}
            >
              <Icon size={20} strokeWidth={2.2} />
            </button>
          );
        })}
      </div>

      {activePanel && (
        <div
          className="absolute left-14 z-40 w-[330px]"
          style={{
            top: `${panelTop}px`,
            animation: "society3dPanelDrop 220ms ease-out both",
            transformOrigin: "top left",
          }}
        >
          {activePanel === "layers" && (
            <ThreeDLayerManager
              layers={layers}
              setLayers={setLayers}
              basemap={basemap}
              setBasemap={setBasemap}
              selectedProject={selectedProject}
              onClose={() => setActivePanel(null)}
            />
          )}

          {activePanel === "extrusion" && (
            <ThreeDExtrusionManager
              extrusion={extrusion}
              setExtrusion={setExtrusion}
              selectedFeature={selectedFeature}
              onApplyToSelected={onApplyToSelected}
              onClearExtrusions={onClearExtrusions}
              onClose={() => setActivePanel(null)}
            />
          )}
        </div>
      )}
    </>
  );
}

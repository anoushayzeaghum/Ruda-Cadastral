import { useEffect, useState } from "react";
import { Box, Building2, Layers, X } from "lucide-react";
import {
  ThreeDExtrusionManager,
  ThreeDLayerManager,
  ThreeDBIMModel,
} from "./Society3DLayers";

// Hook — true when viewport width is below the sm breakpoint (640 px)
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 640,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isMobile;
}

const tools = [
  { id: "layers", label: "3D Layer Manager", icon: Layers },
  { id: "bim", label: "3D BIM Model", icon: Building2 },
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
  bimPanelOpen,
  setBimPanelOpen,
  bimLayers,
  setBimLayers,
  selectedFeature,
  onApplyToSelected,
  onClearExtrusions,
}) {
  const isMobile = useIsMobile();
  
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

      {/* Tool buttons - bottom center on mobile, left side on desktop */}
      <div className={`absolute z-40 ${
        isMobile 
          ? 'bottom-3 left-1/2 -translate-x-1/2 flex-row' 
          : 'left-2 top-5 flex-col'
      } flex gap-1`}>
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
              className={`flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-md border text-white shadow-md transition ${
                isActive
                  ? "border-[#9be37b] bg-[#0a3327]"
                  : "border-[#0c3d2d] bg-[#06291f] hover:bg-[#0a3327]"
              }`}
            >
              <Icon size={16} strokeWidth={2.2} className="sm:hidden" />
              <Icon size={20} strokeWidth={2.2} className="hidden sm:block" />
            </button>
          );
        })}
        
        {/* Close button for mobile - only shown when a panel is active */}
        {isMobile && activePanel && (
          <button
            type="button"
            title="Close Panel"
            aria-label="Close panel"
            onClick={() => setActivePanel(null)}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-[#0c3d2d] bg-[#06291f] text-white shadow-md transition hover:bg-[#0a3327]"
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        )}
      </div>

      {activePanel && (
        <>
          {/* Mobile backdrop overlay */}
          {isMobile && (
            <div
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setActivePanel(null)}
            />
          )}
          
          <div
            className={`z-50 overflow-hidden ${
              isMobile
                ? 'fixed bottom-0 left-0 right-0 rounded-t-xl'
                : 'absolute left-14 rounded-md'
            }`}
            style={
              isMobile
                ? { maxHeight: '70vh' }
                : {
                    top: `${panelTop}px`,
                    width: '330px',
                    animation: "society3dPanelDrop 220ms ease-out both",
                    transformOrigin: "top left",
                  }
            }
          >
            {/* Mobile drag handle */}
            {isMobile && (
              <div className="flex justify-center bg-[#06291f] py-2">
                <div className="h-1 w-10 rounded-full bg-white/30" />
              </div>
            )}
            
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

            {activePanel === "bim" && (
              <ThreeDBIMModel
                bimLayers={bimLayers}
                setBimLayers={setBimLayers}
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
        </>
      )}
    </>
  );
}

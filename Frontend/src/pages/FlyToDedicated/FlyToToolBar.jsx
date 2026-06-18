import { useState } from "react";
import { Globe2, Send } from "lucide-react";

import Basemaps from "../../pages/GISMetaverse/tools/Basemaps";
import FlyTo from "../../pages/GISMetaverse/tools/FlyTo";

export default function MetaverseLeftToolbar({
  map,
  filters,
  setFilters,
  setLayerVisibility,
  rebuildAllLayers,
}) {
  const [bottomPanel, setBottomPanel] = useState(null);

  const handleBottomPanel = (panel) => {
    setBottomPanel((prev) => (prev === panel ? null : panel));
  };

  return (
    <>
      <div className="absolute bottom-4 left-2 z-40 flex flex-col items-start gap-2">
        {/* Basemaps */}
        <div className="relative">
          {bottomPanel === "basemaps" && (
            <div className="absolute bottom-0 left-10 ml-1 w-[calc(100vw-4rem)] max-h-[340px] overflow-y-auto rounded-md border border-[#3a4354] bg-[#202736] text-white shadow-2xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:w-[380px]">
              <Basemaps
                map={map}
                rebuildAllLayers={rebuildAllLayers}
              />
            </div>
          )}

          <button
            type="button"
            title="Basemaps"
            onClick={() => handleBottomPanel("basemaps")}
            className={`flex h-9 w-9 items-center justify-center rounded-md border shadow-md transition ${
              bottomPanel === "basemaps"
                ? "border-[#8bd66f] bg-[#243041] text-white"
                : "border-[#344055] bg-[#1d2533] text-white hover:bg-[#293445]"
            }`}
          >
            <Globe2 size={20} strokeWidth={2.2} />
          </button>
        </div>

        {/* Fly To */}
        <div className="relative">
          {bottomPanel === "flyTo" && (
            <div className="absolute left-10 top-1/2 -translate-y-1/2 ml-1">
              <FlyTo
                filters={filters}
                setFilters={setFilters}
                setLayerVisibility={setLayerVisibility}
              />
            </div>
          )}

          <button
            type="button"
            title="Fly To"
            onClick={() => handleBottomPanel("flyTo")}
            className={`flex h-9 w-9 items-center justify-center rounded-md border shadow-md transition ${
              bottomPanel === "flyTo"
                ? "border-[#8bd66f] bg-[#243041] text-white"
                : "border-[#344055] bg-[#1d2533] text-white hover:bg-[#293445]"
            }`}
          >
            <Send size={20} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </>
  );
}
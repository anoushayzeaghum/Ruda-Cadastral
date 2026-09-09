import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { FLOOD_LAYER } from "./LayerManager/Hydrology/FloodLayer";

/**
 * Hydrology layer group.
 *
 * Flood is a frontend-only placeholder at this stage. Toggling it only changes
 * local UI state; it does not add/remove any Mapbox layer or request backend data.
 */
export default function Hydrology() {
  const [open, setOpen] = useState(false);
  const [floodVisible, setFloodVisible] = useState(false);

  const toggleAll = (event) => {
    event.stopPropagation();
    setFloodVisible((current) => !current);
  };

  return (
    <div className="border-b border-[#343c4c]">
      <div className="flex w-full items-center justify-between px-4 py-3 text-white hover:bg-[#0f3d2e]">
        <button
          type="button"
          className="flex flex-1 cursor-pointer items-center gap-2 text-left"
          onClick={() => setOpen((previous) => !previous)}
        >
          <span>HYDROLOGY</span>
          {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>

        <button
          type="button"
          title={
            floodVisible
              ? "Hide all hydrology layers"
              : "Show all hydrology layers"
          }
          onClick={toggleAll}
          className={`relative ml-2 h-5 w-9 shrink-0 overflow-hidden rounded-full transition-colors duration-200 focus:outline-none ${
            floodVisible ? "bg-[#65c96b]" : "bg-white/20"
          }`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
              floodVisible ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {open && (
        <div className="mx-3 mb-3 rounded-sm border border-[#13593f]/40 bg-[#093024] p-2">
          <label className="flex cursor-pointer items-center gap-2 px-1 py-1.5 text-white">
            <input
              type="checkbox"
              checked={floodVisible}
              onChange={(event) => setFloodVisible(event.target.checked)}
              className="accent-[#65c96b]"
            />

            <span
              className="h-4 w-4 shrink-0 rounded-sm border border-white/35"
              style={{ backgroundColor: FLOOD_LAYER.color }}
            />

            <span className="truncate text-[11px]">{FLOOD_LAYER.label}</span>
          </label>
        </div>
      )}
    </div>
  );
}

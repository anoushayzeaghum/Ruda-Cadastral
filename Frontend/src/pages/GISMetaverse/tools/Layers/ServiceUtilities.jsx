import { useState } from "react";
import { ChevronDown, ChevronRight, Grid3X3 } from "lucide-react";

export default function ServiceUtilities({
  selectedProjectId,
  layerVisibility = {},
  setLayerVisibility,
}) {
  const [open, setOpen] = useState(false);

  const toggleLayer = (key) => {
    if (!selectedProjectId) {
      alert("Please select a project first.");
      return;
    }

    if (!setLayerVisibility) return;

    setLayerVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="border-b border-[#343c4c]">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-white hover:bg-[#293445]"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>SERVICES - UTILITIES</span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>

      {open && (
        <div className="mx-3 mb-3 rounded-sm border border-[#3b4558] bg-[#232b3a] p-2">
          <LayerItem
            checked={!!layerVisibility.waterSupplyPoints}
            color="#42a5f5"
            label="Water Supply Points"
            onChange={() => toggleLayer("waterSupplyPoints")}
          />

          <LayerItem
            checked={!!layerVisibility.waterSupplyLines}
            color="#1e88e5"
            label="Water Supply Levels"
            onChange={() => toggleLayer("waterSupplyLines")}
          />

          <LayerItem
            checked={!!layerVisibility.sewagePoints}
            color="#8e44ad"
            label="Sewage Points"
            onChange={() => toggleLayer("sewagePoints")}
          />

          <LayerItem
            checked={!!layerVisibility.cameraLocations}
            color="#f97316"
            label="Camera Locations"
            onChange={() => toggleLayer("cameraLocations")}
          />
        </div>
      )}
    </div>
  );
}

function LayerItem({ checked = false, color, label, onChange }) {
  return (
    <div className="mt-3 first:mt-1">
      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="accent-[#65c96b]"
          />
          <span
            className="h-4 w-4 rounded-sm border-2"
            style={{ borderColor: color }}
          />
          <span>{label}</span>
        </label>

        <Grid3X3 size={14} className="text-white/60" />
      </div>

      <div className="mt-2 flex items-center gap-2 pl-6">
        <div className="h-[3px] flex-1 rounded-full bg-[#8fd36f]" />
        <div className="h-4 w-4 rounded-full border-2 border-white bg-[#65c96b]" />
        <span className="text-[11px] text-white/90">100%</span>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Grid3X3 } from "lucide-react";

export default function MasterPlan({
  selectedProjectId,
  layerVisibility,
  setLayerVisibility,
}) {
  const [open, setOpen] = useState(true);

  const toggleLayer = (key) => {
  if (!selectedProjectId) return;

  setLayerVisibility((prev) => {
    const updated = {
      ...prev,
      [key]: !prev[key],
    };

    return updated;
  });
};
useEffect(() => {
  if (!selectedProjectId) {
    setLayerVisibility({
      boundary: false,
      masterPlan: false,
      spotLevel: false,
      contours: false,
      roads: false,
    });
  } else {
    setLayerVisibility({
      boundary: true,
      masterPlan: true,   // ✅ THIS WAS MISSING
      spotLevel: false,
      contours: false,
      roads: true,
    });
  }
}, [selectedProjectId]);

  return (
    <div className="border-b border-[#343c4c]">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-white hover:bg-[#293445]"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>MASTER PLAN</span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>

      {open && (
        <div className="mx-3 mb-3 rounded-sm border border-[#3b4558] bg-[#232b3a] p-2">
          <LayerItem
            disabled={!selectedProjectId}
            checked={layerVisibility.boundary}
            color="#ff8b24"
            label="Boundary"
            onChange={() => toggleLayer("boundary")}
          />

          <LayerItem
          disabled={!selectedProjectId}
            checked={layerVisibility.masterPlan}
            color="#42a5f5"
            label="Master Plan Boundary"
            onChange={() => toggleLayer("masterPlan")}
          />

          <LayerItem
            checked={layerVisibility.spotLevel}
            color="#65c96b"
            label="Spot Level"
            onChange={() => toggleLayer("spotLevel")}
          />

          <LayerItem
            checked={layerVisibility.contours}
            color="#d7bf32"
            label="Contours"
            onChange={() => toggleLayer("contours")}
          />

          <LayerItem
            checked={layerVisibility.roads}
            color="#ef4444"
            label="Roads"
            onChange={() => toggleLayer("roads")}
          />
        </div>
      )}
    </div>
  );
}

function LayerItem({ checked, color, label, onChange, disabled }) {
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
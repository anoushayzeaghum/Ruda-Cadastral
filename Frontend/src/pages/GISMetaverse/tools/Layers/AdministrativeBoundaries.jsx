import { useState } from "react";
import { ChevronDown, ChevronRight, Grid3X3 } from "lucide-react";

export default function AdministrativeBoundaries({
  adminBoundaryVisibility,
  setAdminBoundaryVisibility,
}) {
  const [open, setOpen] = useState(true);

  const toggleLayer = (key) => {
    setAdminBoundaryVisibility((prev) => ({
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
        <span>ADMINISTRATIVE BOUNDARIES</span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>

      {open && (
        <div className="mx-3 mb-3 rounded-sm border border-[#3b4558] bg-[#232b3a] p-2">
          <LayerItem
            checked={adminBoundaryVisibility.rudaBoundary}
            color="#6bb7e8"
            label="Ruda Boundary"
            onChange={() => toggleLayer("rudaBoundary")}
          />

          <LayerItem
            checked={adminBoundaryVisibility.geodeticNetwork}
            color="#22c55e"
            label="Geodetic Network"
            onChange={() => toggleLayer("geodeticNetwork")}
          />

          <LayerItem
            checked={adminBoundaryVisibility.proposedRoads}
            color="#19598d"
            label="Proposed Roads Layer"
            onChange={() => toggleLayer("proposedRoads")}
          />
        </div>
      )}
    </div>
  );
}

function LayerItem({ checked, color, label, onChange }) {
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
        <div
          className="h-4 w-4 rounded-full border-2 border-white"
          style={{ backgroundColor: color }}
        />
        <span className="text-[11px] text-white/90">100%</span>
      </div>
    </div>
  );
}
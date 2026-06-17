import { useState } from "react";
import { ChevronDown, ChevronRight, Grid3X3 } from "lucide-react";

export default function Utilities({
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

  const updateOpacity = (key, value) => {
    if (!setLayerVisibility) return;

    setLayerVisibility((prev) => ({
      ...prev,
      [`${key}Opacity`]: value,
    }));
  };

  return (
    <div className="border-b border-[#343c4c]">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-white hover:bg-[#293445]"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>UTILITIES</span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>

      {open && (
        <div className="mx-3 mb-3 rounded-sm border border-[#3b4558] bg-[#232b3a] p-2">
          <LayerItem
            disabled={!selectedProjectId}
            checked={!!layerVisibility.waterSupplyPoints}
            color="#42a5f5"
            label="Water Supply Points"
            opacity={layerVisibility.waterSupplyPointsOpacity ?? 100}
            onChange={() => toggleLayer("waterSupplyPoints")}
            onOpacityChange={(value) =>
              updateOpacity("waterSupplyPoints", value)
            }
          />

          <LayerItem
            disabled={!selectedProjectId}
            checked={!!layerVisibility.waterSupplyLines}
            color="#1e88e5"
            label="Water Supply Levels"
            opacity={layerVisibility.waterSupplyLinesOpacity ?? 100}
            onChange={() => toggleLayer("waterSupplyLines")}
            onOpacityChange={(value) =>
              updateOpacity("waterSupplyLines", value)
            }
          />

          <LayerItem
            disabled={!selectedProjectId}
            checked={!!layerVisibility.sewagePoints}
            color="#8e44ad"
            label="Sewage Points"
            opacity={layerVisibility.sewagePointsOpacity ?? 100}
            onChange={() => toggleLayer("sewagePoints")}
            onOpacityChange={(value) => updateOpacity("sewagePoints", value)}
          />
        </div>
      )}
    </div>
  );
}

function LayerItem({
  checked = false,
  color,
  label,
  opacity,
  onChange,
  onOpacityChange,
  disabled,
}) {
  return (
    <div className={`mt-3 first:mt-1 ${disabled ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            className="accent-[#65c96b]"
          />

          <span
            className="h-4 w-4 rounded-sm border-2"
            style={{ borderColor: color }}
          />

          <span className="text-[11px]">{label}</span>
        </label>

        <Grid3X3 size={14} className="text-white/60" />
      </div>

      <div className="mt-2 flex items-center gap-2 pl-6">
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          disabled={disabled}
          onChange={(e) => onOpacityChange(Number(e.target.value))}
          className="h-[3px] flex-1 cursor-pointer rounded-full bg-[#8fd36f] accent-[#65c96b] disabled:cursor-not-allowed"
        />

        <span className="w-7 text-right text-[11px] text-white/90">
          {opacity}%
        </span>
      </div>
    </div>
  );
}

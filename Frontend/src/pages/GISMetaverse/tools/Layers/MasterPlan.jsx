import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Grid3X3 } from "lucide-react";

export default function MasterPlan({
  selectedProjectId,
  layerVisibility,
  setLayerVisibility,
}) {
  const [open, setOpen] = useState(false);

  const toggleLayer = (key) => {
    if (!selectedProjectId) return;

    setLayerVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const updateOpacity = (key, value) => {
    setLayerVisibility((prev) => ({
      ...prev,
      [`${key}Opacity`]: value,
    }));
  };

  useEffect(() => {
    if (!selectedProjectId) {
      setLayerVisibility((prev) => ({
        ...prev,
        boundary: false,
        masterPlan: false,
        spotLevel: false,
        contours: false,
        roads: false,
      }));
    } else {
      setLayerVisibility((prev) => ({
        ...prev,
        boundary: true,
        masterPlan: true,
        spotLevel: false,
        contours: false,
        roads: true,

        boundaryOpacity: prev.boundaryOpacity ?? 100,
        masterPlanOpacity: prev.masterPlanOpacity ?? 100,
        spotLevelOpacity: prev.spotLevelOpacity ?? 100,
        contoursOpacity: prev.contoursOpacity ?? 100,
        roadsOpacity: prev.roadsOpacity ?? 100,
      }));
    }
  }, [selectedProjectId, setLayerVisibility]);

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
            opacity={layerVisibility.boundaryOpacity ?? 100}
            onChange={() => toggleLayer("boundary")}
            onOpacityChange={(value) => updateOpacity("boundary", value)}
          />

          <LayerItem
            disabled={!selectedProjectId}
            checked={layerVisibility.masterPlan}
            color="#42a5f5"
            label="Master Plan Boundary"
            opacity={layerVisibility.masterPlanOpacity ?? 100}
            onChange={() => toggleLayer("masterPlan")}
            onOpacityChange={(value) => updateOpacity("masterPlan", value)}
          />

          <LayerItem
            disabled={!selectedProjectId}
            checked={layerVisibility.spotLevel}
            color="#65c96b"
            label="Spot Level"
            opacity={layerVisibility.spotLevelOpacity ?? 100}
            onChange={() => toggleLayer("spotLevel")}
            onOpacityChange={(value) => updateOpacity("spotLevel", value)}
          />

          <LayerItem
            disabled={!selectedProjectId}
            checked={layerVisibility.contours}
            color="#d7bf32"
            label="Contours"
            opacity={layerVisibility.contoursOpacity ?? 100}
            onChange={() => toggleLayer("contours")}
            onOpacityChange={(value) => updateOpacity("contours", value)}
          />

          <LayerItem
            disabled={!selectedProjectId}
            checked={layerVisibility.roads}
            color="#ef4444"
            label="Roads"
            opacity={layerVisibility.roadsOpacity ?? 100}
            onChange={() => toggleLayer("roads")}
            onOpacityChange={(value) => updateOpacity("roads", value)}
          />
        </div>
      )}
    </div>
  );
}

function LayerItem({
  checked,
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
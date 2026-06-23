import { useState } from "react";
import { ChevronDown, ChevronRight, Grid3X3 } from "lucide-react";

const UTILITY_LAYER_STYLES = {
  waterSupplyPoints: {
    color: "#42a5f5",
    opacity: 100,
    circleLayer: "metaverse-water-supply-points-circle",
    labelLayer: "metaverse-water-supply-points-label",
  },
  waterSupplyLines: {
    color: "#1e88e5",
    opacity: 100,
    lineLayer: "metaverse-water-supply-lines-line",
    labelLayer: "metaverse-water-supply-lines-label",
  },
  sewagePoints: {
    color: "#8e44ad",
    opacity: 100,
    circleLayer: "metaverse-sewage-points-circle",
    labelLayer: "metaverse-sewage-points-label",
  },
};

const clampOpacity = (value = 100) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 100;
  return Math.min(Math.max(numeric, 0), 100);
};

const setPaint = (map, layerId, property, value) => {
  if (map?.getLayer?.(layerId)) {
    map.setPaintProperty(layerId, property, value);
  }
};

const setRuntimeStyle = (key, patch = {}) => {
  if (typeof window === "undefined") return;

  window.__metaverseLayerRuntimeStyles = {
    ...(window.__metaverseLayerRuntimeStyles || {}),
    [key]: {
      ...(window.__metaverseLayerRuntimeStyles?.[key] || {}),
      ...patch,
    },
  };
};

const applyUtilityLayerStyle = (map, key, style = {}) => {
  const def = UTILITY_LAYER_STYLES[key];
  if (!map || !def) return;

  const color = style.color || def.color;
  const opacityRatio = clampOpacity(style.opacity ?? def.opacity) / 100;

  if (def.circleLayer) {
    setPaint(map, def.circleLayer, "circle-color", color);
    setPaint(map, def.circleLayer, "circle-opacity", opacityRatio);
    setPaint(map, def.circleLayer, "circle-stroke-opacity", opacityRatio);
  }

  if (def.lineLayer) {
    setPaint(map, def.lineLayer, "line-color", color);
    setPaint(map, def.lineLayer, "line-opacity", opacityRatio);
  }

  if (def.labelLayer) {
    setPaint(map, def.labelLayer, "text-color", color);
    setPaint(map, def.labelLayer, "text-opacity", opacityRatio);
  }
};

const applyAfterLayerLoads = (map, key, style) => {
  [0, 120, 350, 700, 1200, 2000].forEach((delay) => {
    window.setTimeout(() => applyUtilityLayerStyle(map, key, style), delay);
  });
};

export default function Utilities({
  map,
  selectedProjectId,
  layerVisibility = {},
  setLayerVisibility,
}) {
  const [open, setOpen] = useState(false);
  const [styles, setStyles] = useState(() => ({
    waterSupplyPoints: {
      color: UTILITY_LAYER_STYLES.waterSupplyPoints.color,
      opacity: layerVisibility.waterSupplyPointsOpacity ?? 100,
    },
    waterSupplyLines: {
      color: UTILITY_LAYER_STYLES.waterSupplyLines.color,
      opacity: layerVisibility.waterSupplyLinesOpacity ?? 100,
    },
    sewagePoints: {
      color: UTILITY_LAYER_STYLES.sewagePoints.color,
      opacity: layerVisibility.sewagePointsOpacity ?? 100,
    },
  }));

  const toggleLayer = (key) => {
    if (!selectedProjectId) {
      alert("Please select a project first.");
      return;
    }

    if (!setLayerVisibility) return;

    const nextVisible = !layerVisibility[key];

    setLayerVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));

    if (nextVisible) {
      setRuntimeStyle(key, styles[key]);
      applyAfterLayerLoads(map, key, styles[key]);
    }
  };

  const updateOpacity = (key, value) => {
    const opacity = clampOpacity(value);

    setStyles((prev) => {
      const nextStyle = { ...prev[key], opacity };
      setRuntimeStyle(key, nextStyle);
      applyUtilityLayerStyle(map, key, nextStyle);
      return { ...prev, [key]: nextStyle };
    });
  };

  const updateColor = (key, color) => {
    setStyles((prev) => {
      const nextStyle = { ...prev[key], color };
      setRuntimeStyle(key, nextStyle);
      applyUtilityLayerStyle(map, key, nextStyle);
      return { ...prev, [key]: nextStyle };
    });
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
            color={styles.waterSupplyPoints.color}
            label="Water Supply Points"
            opacity={styles.waterSupplyPoints.opacity}
            onChange={() => toggleLayer("waterSupplyPoints")}
            onOpacityChange={(value) => updateOpacity("waterSupplyPoints", value)}
            onColorChange={(value) => updateColor("waterSupplyPoints", value)}
          />

          <LayerItem
            disabled={!selectedProjectId}
            checked={!!layerVisibility.waterSupplyLines}
            color={styles.waterSupplyLines.color}
            label="Water Supply Levels"
            opacity={styles.waterSupplyLines.opacity}
            onChange={() => toggleLayer("waterSupplyLines")}
            onOpacityChange={(value) => updateOpacity("waterSupplyLines", value)}
            onColorChange={(value) => updateColor("waterSupplyLines", value)}
          />

          <LayerItem
            disabled={!selectedProjectId}
            checked={!!layerVisibility.sewagePoints}
            color={styles.sewagePoints.color}
            label="Sewage Points"
            opacity={styles.sewagePoints.opacity}
            onChange={() => toggleLayer("sewagePoints")}
            onOpacityChange={(value) => updateOpacity("sewagePoints", value)}
            onColorChange={(value) => updateColor("sewagePoints", value)}
          />
        </div>
      )}
    </div>
  );
}

function ColorPickerSquare({ color, label, disabled, onColorChange }) {
  return (
    <span
      className="relative h-4 w-4 shrink-0 overflow-hidden rounded-sm border border-white/35"
      style={{ backgroundColor: color }}
      title={`Change ${label} color`}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <input
        type="color"
        value={color}
        disabled={disabled}
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onChange={(event) => onColorChange?.(event.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
    </span>
  );
}

function LayerItem({
  checked = false,
  color,
  label,
  opacity,
  onChange,
  onOpacityChange,
  onColorChange,
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

          <ColorPickerSquare
            color={color}
            label={label}
            disabled={disabled}
            onColorChange={onColorChange}
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

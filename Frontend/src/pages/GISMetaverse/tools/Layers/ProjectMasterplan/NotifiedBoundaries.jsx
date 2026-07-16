import { useState } from "react";
import { ChevronDown, ChevronRight, Grid3X3 } from "lucide-react";

const NOTIFIED_STYLE = {
  color: "#ef4444",
  opacity: 100,
  lineLayer: "metaverse-notified-boundary-line",
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

const applyNotifiedBoundaryStyle = (map, style = {}) => {
  if (!map) return;

  const color = style.color || NOTIFIED_STYLE.color;
  const opacityRatio =
    clampOpacity(style.opacity ?? NOTIFIED_STYLE.opacity) / 100;

  setPaint(map, NOTIFIED_STYLE.lineLayer, "line-color", color);
  setPaint(map, NOTIFIED_STYLE.lineLayer, "line-opacity", opacityRatio);
};

const applyAfterLayerLoads = (map, style) => {
  [0, 120, 350, 700, 1200, 2000].forEach((delay) => {
    window.setTimeout(() => applyNotifiedBoundaryStyle(map, style), delay);
  });
};

export default function NotifiedBoundaries({
  map,
  selectedProjectId,
  layerVisibility = {},
  setLayerVisibility,
}) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState({
    color: NOTIFIED_STYLE.color,
    opacity: layerVisibility.notifiedBoundaryOpacity ?? 100,
  });

  const toggleLayer = () => {
    if (!selectedProjectId) {
      alert("Please select a project first.");
      return;
    }

    if (!setLayerVisibility) return;

    const nextVisible = !layerVisibility.notifiedBoundary;

    setLayerVisibility((prev) => ({
      ...prev,
      notifiedBoundary: !prev.notifiedBoundary,
    }));

    if (nextVisible) {
      setRuntimeStyle("notifiedBoundary", style);
      applyAfterLayerLoads(map, style);
    }
  };

  const updateOpacity = (value) => {
    const opacity = clampOpacity(value);

    setStyle((prev) => {
      const nextStyle = { ...prev, opacity };
      setRuntimeStyle("notifiedBoundary", nextStyle);
      applyNotifiedBoundaryStyle(map, nextStyle);
      return nextStyle;
    });
  };

  const updateColor = (color) => {
    setStyle((prev) => {
      const nextStyle = { ...prev, color };
      setRuntimeStyle("notifiedBoundary", nextStyle);
      applyNotifiedBoundaryStyle(map, nextStyle);
      return nextStyle;
    });
  };

  return (
    <div className="border-b border-[#343c4c]">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-white hover:bg-[#0f3d2e]"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>NOTIFIED BOUNDARIES</span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>

      {open && (
        <div className="mx-3 mb-3 rounded-sm border border-[#13593f]/40 bg-[#093024] p-2">
          <LayerItem
            disabled={!selectedProjectId}
            checked={!!layerVisibility.notifiedBoundary}
            color={style.color}
            label="Notified Boundary"
            opacity={style.opacity}
            onChange={toggleLayer}
            onOpacityChange={updateOpacity}
            onColorChange={updateColor}
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

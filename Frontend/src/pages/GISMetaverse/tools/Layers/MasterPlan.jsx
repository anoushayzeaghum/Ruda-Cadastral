import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Grid3X3 } from "lucide-react";

const MASTER_PLAN_LAYER_COLORS = {
  boundary: "#0f3d2e",
  blockBoundary: "#7c3aed",
  masterPlan: "#111827",
  spotLevel: "#65c96b",
  contours: "#615514",
  roads: "#ef4444",
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

const applyMasterPlanLayerColor = (map, key, color) => {
  if (!map || !color) return;

  switch (key) {
    case "boundary":
      setPaint(map, "metaverse-project-boundary-fill", "fill-color", color);
      setPaint(map, "metaverse-project-boundary-line", "line-color", color);
      break;

    case "spotLevel":
      setPaint(map, "metaverse-spot-level-circle", "circle-color", color);
      break;

    case "contours":
      setPaint(map, "metaverse-contours-line", "line-color", color);
      setPaint(map, "metaverse-contours-label", "text-color", color);
      break;

    default:
      break;
  }
};

const applyMasterPlanLayerOpacity = (map, key, opacity = 100) => {
  if (!map) return;

  const opacityRatio = clampOpacity(opacity) / 100;

  switch (key) {
    case "boundary":
      setPaint(
        map,
        "metaverse-project-boundary-fill",
        "fill-opacity",
        0.12 * opacityRatio,
      );
      setPaint(
        map,
        "metaverse-project-boundary-line",
        "line-opacity",
        opacityRatio,
      );
      break;

    case "blockBoundary":
      setPaint(
        map,
        "metaverse-block-fill",
        "fill-opacity",
        0.28 * opacityRatio,
      );
      setPaint(map, "metaverse-block-line", "line-opacity", opacityRatio);
      setPaint(map, "metaverse-block-label", "text-opacity", opacityRatio);
      break;

    case "masterPlan":
      setPaint(
        map,
        "metaverse-masterplan-fill",
        "fill-opacity",
        0.45 * opacityRatio,
      );
      setPaint(map, "metaverse-masterplan-line", "line-opacity", opacityRatio);
      setPaint(map, "metaverse-masterplan-label", "text-opacity", opacityRatio);
      break;

    case "spotLevel":
      setPaint(
        map,
        "metaverse-spot-level-circle",
        "circle-opacity",
        opacityRatio,
      );
      setPaint(
        map,
        "metaverse-spot-level-circle",
        "circle-stroke-opacity",
        opacityRatio,
      );
      break;

    case "contours":
      setPaint(map, "metaverse-contours-line", "line-opacity", opacityRatio);
      setPaint(map, "metaverse-contours-label", "text-opacity", opacityRatio);
      break;

    case "roads":
      setPaint(
        map,
        "metaverse-roads-fill",
        "fill-opacity",
        0.35 * opacityRatio,
      );
      setPaint(map, "metaverse-roads-line", "line-opacity", opacityRatio);
      break;

    default:
      break;
  }
};

const applyMasterPlanLayerStyle = (map, key, style = {}) => {
  if (!map) return;

  applyMasterPlanLayerOpacity(map, key, style.opacity ?? 100);

  if (["boundary", "spotLevel", "contours"].includes(key)) {
    applyMasterPlanLayerColor(
      map,
      key,
      style.color || MASTER_PLAN_LAYER_COLORS[key],
    );
  }
};

const applyAfterLayerLoads = (map, key, style) => {
  [0, 120, 350, 700, 1200, 2000].forEach((delay) => {
    window.setTimeout(() => applyMasterPlanLayerStyle(map, key, style), delay);
  });
};

export default function MasterPlan({
  map,
  selectedProjectId,
  layerVisibility,
  setLayerVisibility,
}) {
  const [open, setOpen] = useState(false);

  const [styles, setStyles] = useState({
    boundary: {
      color: MASTER_PLAN_LAYER_COLORS.boundary,
      opacity: layerVisibility.boundaryOpacity ?? 100,
    },
    blockBoundary: {
      color: MASTER_PLAN_LAYER_COLORS.blockBoundary,
      opacity: layerVisibility.blockBoundaryOpacity ?? 100,
    },
    masterPlan: {
      color: MASTER_PLAN_LAYER_COLORS.masterPlan,
      opacity: layerVisibility.masterPlanOpacity ?? 100,
    },
    spotLevel: {
      color: MASTER_PLAN_LAYER_COLORS.spotLevel,
      opacity: layerVisibility.spotLevelOpacity ?? 100,
    },
    contours: {
      color: MASTER_PLAN_LAYER_COLORS.contours,
      opacity: layerVisibility.contoursOpacity ?? 100,
    },
    roads: {
      color: MASTER_PLAN_LAYER_COLORS.roads,
      opacity: layerVisibility.roadsOpacity ?? 100,
    },
  });

  const toggleLayer = (key) => {
    if (!selectedProjectId) return;

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
      applyMasterPlanLayerOpacity(map, key, opacity);
      return { ...prev, [key]: nextStyle };
    });
  };

  const updateColor = (key, value) => {
    setStyles((prev) => {
      const nextStyle = { ...prev[key], color: value };
      setRuntimeStyle(key, nextStyle);
      applyMasterPlanLayerColor(map, key, value);
      return { ...prev, [key]: nextStyle };
    });
  };

  useEffect(() => {
    if (!map) return undefined;

    const timers = Object.keys(styles).flatMap((key) => {
      if (!layerVisibility[key]) return [];
      setRuntimeStyle(key, styles[key]);
      return [0, 250, 700].map((delay) =>
        setTimeout(
          () => applyMasterPlanLayerStyle(map, key, styles[key]),
          delay,
        ),
      );
    });

    return () => timers.forEach(clearTimeout);
  }, [
    map,
    selectedProjectId,
    layerVisibility.boundary,
    layerVisibility.blockBoundary,
    layerVisibility.masterPlan,
    layerVisibility.spotLevel,
    layerVisibility.contours,
    layerVisibility.roads,
  ]);

  useEffect(() => {
    if (!selectedProjectId) {
      setLayerVisibility((prev) => ({
        ...prev,
        boundary: false,
        masterPlan: false,
        spotLevel: false,
        blockBoundary: false,
        contours: false,
        roads: false,
      }));
    } else {
      setLayerVisibility((prev) => ({
        ...prev,

        // Project selection should open ONLY the project boundary.
        // Plot/master plan boundary and roads remain off until the user
        // manually enables them from the layer panel.
        boundary: true,
        masterPlan: false,
        spotLevel: false,
        blockBoundary: false,
        contours: false,
        roads: false,

        boundaryOpacity: prev.boundaryOpacity ?? 100,
        masterPlanOpacity: prev.masterPlanOpacity ?? 100,
        blockBoundaryOpacity: prev.blockBoundaryOpacity ?? 100,
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
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-white hover:bg-[#0f3d2e]"
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
            color={styles.boundary.color}
            label="Project Boundary"
            opacity={styles.boundary.opacity}
            onChange={() => toggleLayer("boundary")}
            onOpacityChange={(value) => updateOpacity("boundary", value)}
            colorEditable
            onColorChange={(value) => updateColor("boundary", value)}
          />

          <LayerItem
            disabled={!selectedProjectId}
            checked={!!layerVisibility.blockBoundary}
            color={styles.blockBoundary.color}
            label="Block Boundary"
            opacity={styles.blockBoundary.opacity}
            onChange={() => toggleLayer("blockBoundary")}
            onOpacityChange={(value) => updateOpacity("blockBoundary", value)}
          />

          <LayerItem
            disabled={!selectedProjectId}
            checked={layerVisibility.masterPlan}
            color={styles.masterPlan.color}
            label="Master Plan Boundary"
            opacity={styles.masterPlan.opacity}
            onChange={() => toggleLayer("masterPlan")}
            onOpacityChange={(value) => updateOpacity("masterPlan", value)}
          />

          <LayerItem
            disabled={!selectedProjectId}
            checked={layerVisibility.spotLevel}
            color={styles.spotLevel.color}
            label="Spot Level"
            opacity={styles.spotLevel.opacity}
            onChange={() => toggleLayer("spotLevel")}
            onOpacityChange={(value) => updateOpacity("spotLevel", value)}
            colorEditable
            onColorChange={(value) => updateColor("spotLevel", value)}
          />

          <LayerItem
            disabled={!selectedProjectId}
            checked={layerVisibility.contours}
            color={styles.contours.color}
            label="Contours"
            opacity={styles.contours.opacity}
            onChange={() => toggleLayer("contours")}
            onOpacityChange={(value) => updateOpacity("contours", value)}
            colorEditable
            onColorChange={(value) => updateColor("contours", value)}
          />

          <LayerItem
            disabled={!selectedProjectId}
            checked={layerVisibility.roads}
            color={styles.roads.color}
            label="Roads"
            opacity={styles.roads.opacity}
            onChange={() => toggleLayer("roads")}
            onOpacityChange={(value) => updateOpacity("roads", value)}
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
        aria-label={`Change ${label} color`}
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onInput={(event) => onColorChange?.(event.target.value)}
        onChange={(event) => onColorChange?.(event.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
    </span>
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
  colorEditable = false,
  onColorChange,
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

          {colorEditable ? (
            <ColorPickerSquare
              color={color}
              label={label}
              disabled={disabled}
              onColorChange={onColorChange}
            />
          ) : (
            <span
              className="h-4 w-4 rounded-sm border border-white/35"
              style={{ backgroundColor: color }}
            />
          )}

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

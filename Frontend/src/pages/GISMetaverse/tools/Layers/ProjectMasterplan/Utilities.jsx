import { useMemo, useState } from "react";
import axios from "axios";
import { ChevronDown, ChevronRight, Grid3X3 } from "lucide-react";
import WaterSupplyPointAttribute from "../AttributeTable/WaterSupplyPointAttribute";
import WaterSupplyLevelAttribute from "../AttributeTable/WaterSupplyLevelAttribute";
import SewagePointAttribute from "../AttributeTable/SewagePointAttribute";
import {
  API_BASE,
  getMapSourceGeoJSON,
  unwrapGeoJSON,
} from "../AttributeTable/AdminAttributeTableShell";

const UTILITY_LAYER_STYLES = {
  waterSupplyPoints: {
    color: "#42a5f5",
    opacity: 100,
    sourceId: "metaverse-water-supply-points-source",
    endpoint: "/wspoint-features-cb1/",
    circleLayer: "metaverse-water-supply-points-circle",
    labelLayer: "metaverse-water-supply-points-label",
  },
  waterSupplyLines: {
    color: "#1e88e5",
    opacity: 100,
    sourceId: "metaverse-water-supply-lines-source",
    endpoint: "/wsl-cb1/",
    lineLayer: "metaverse-water-supply-lines-line",
    labelLayer: "metaverse-water-supply-lines-label",
  },
  sewagePoints: {
    color: "#8e44ad",
    opacity: 100,
    sourceId: "metaverse-sewage-points-source",
    endpoint: "/swpoint-cb1/",
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

const uniqueValues = (features = [], keys = []) => {
  const values = new Set();
  features.forEach((feature) => {
    const props = feature.properties || {};
    keys.forEach((key) => {
      const value = props[key];
      if (value !== undefined && value !== null && value !== "") {
        values.add(String(value));
      }
    });
  });
  return [...values].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );
};

export default function Utilities({
  map,
  selectedProjectId,
  layerVisibility = {},
  setLayerVisibility,
}) {
  const [open, setOpen] = useState(false);
  const [activeAttributeTable, setActiveAttributeTable] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState({
    waterSupplyPoints: false,
    waterSupplyLines: false,
    sewagePoints: false,
  });
  const [dropdownData, setDropdownData] = useState({
    waterSupplyPoints: [],
    waterSupplyLines: [],
    sewagePoints: [],
  });
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

  const readSourceOrFetch = async (key) => {
    const def = UTILITY_LAYER_STYLES[key];
    const fromMap = getMapSourceGeoJSON(map, def.sourceId);
    if (fromMap.features?.length) return fromMap;

    const res = await axios.get(`${API_BASE}${def.endpoint}`, {
      params: { project_id: selectedProjectId },
    });
    return unwrapGeoJSON(res.data);
  };

  const loadDropdownData = async (key) => {
    if (!selectedProjectId) return;

    try {
      const geojson = await readSourceOrFetch(key);
      setDropdownData((prev) => ({
        ...prev,
        [key]: geojson.features || [],
      }));
    } catch (error) {
      console.error(`${key} utility dropdown load error:`, error);
      setDropdownData((prev) => ({ ...prev, [key]: [] }));
    }
  };

  const toggleDropdown = (key) => {
    setDropdownOpen((prev) => ({ ...prev, [key]: !prev[key] }));
    loadDropdownData(key);
  };

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

  const waterSupplyPointSummary = useMemo(() => {
    const features = dropdownData.waterSupplyPoints || [];
    return {
      count: features.length,
      types: uniqueValues(features, ["type"]),
    };
  }, [dropdownData.waterSupplyPoints]);

  const waterSupplyLevelSummary = useMemo(() => {
    const features = dropdownData.waterSupplyLines || [];
    return {
      count: features.length,
      levels: uniqueValues(features, ["dia", "type", "name"]),
    };
  }, [dropdownData.waterSupplyLines]);

  const sewagePointSummary = useMemo(() => {
    const features = dropdownData.sewagePoints || [];
    return {
      count: features.length,
      types: uniqueValues(features, ["type"]),
    };
  }, [dropdownData.sewagePoints]);

  const renderAttributeTable = () => {
    const commonProps = {
      map,
      selectedProjectId,
      onClose: () => setActiveAttributeTable(null),
    };

    switch (activeAttributeTable) {
      case "waterSupplyPoints":
        return <WaterSupplyPointAttribute {...commonProps} />;
      case "waterSupplyLines":
        return <WaterSupplyLevelAttribute {...commonProps} />;
      case "sewagePoints":
        return <SewagePointAttribute {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="border-b border-[#343c4c]">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-white hover:bg-[#0f3d2e]"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>UTILITIES</span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>

      {open && (
        <div className="mx-3 mb-3 rounded-sm border border-[#13593f]/40 bg-[#093024] p-2">
          <LayerItem
            disabled={!selectedProjectId}
            checked={!!layerVisibility.waterSupplyPoints}
            color={styles.waterSupplyPoints.color}
            label="Water Supply Points"
            opacity={styles.waterSupplyPoints.opacity}
            onChange={() => toggleLayer("waterSupplyPoints")}
            onOpacityChange={(value) =>
              updateOpacity("waterSupplyPoints", value)
            }
            onColorChange={(value) => updateColor("waterSupplyPoints", value)}
            hasDropdown
            dropdownOpen={dropdownOpen.waterSupplyPoints}
            onDropdownToggle={() => toggleDropdown("waterSupplyPoints")}
            onTableOpen={() => setActiveAttributeTable("waterSupplyPoints")}
          />

          {dropdownOpen.waterSupplyPoints && (
            <div className="ml-6 mt-2 rounded-sm border border-[#13593f]/30 bg-[#051f17] px-3 py-2 text-[11px] text-white/80">
              <div className="flex justify-between border-b border-[#343c4c]/70 py-1">
                <span>Total Water Supply Points</span>
                <span>{waterSupplyPointSummary.count}</span>
              </div>
              {waterSupplyPointSummary.types.length > 0 && (
                <div className="pt-1">
                  <p className="mb-1 text-white/55">Types</p>
                  {waterSupplyPointSummary.types.map((type) => (
                    <div key={type} className="flex justify-between py-0.5">
                      <span className="max-w-[170px] truncate">{type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <LayerItem
            disabled={!selectedProjectId}
            checked={!!layerVisibility.waterSupplyLines}
            color={styles.waterSupplyLines.color}
            label="Water Supply Levels"
            opacity={styles.waterSupplyLines.opacity}
            onChange={() => toggleLayer("waterSupplyLines")}
            onOpacityChange={(value) =>
              updateOpacity("waterSupplyLines", value)
            }
            onColorChange={(value) => updateColor("waterSupplyLines", value)}
            hasDropdown
            dropdownOpen={dropdownOpen.waterSupplyLines}
            onDropdownToggle={() => toggleDropdown("waterSupplyLines")}
            onTableOpen={() => setActiveAttributeTable("waterSupplyLines")}
          />

          {dropdownOpen.waterSupplyLines && (
            <div className="ml-6 mt-2 rounded-sm border border-[#13593f]/30 bg-[#051f17] px-3 py-2 text-[11px] text-white/80">
              <div className="flex justify-between border-b border-[#343c4c]/70 py-1">
                <span>Total Water Supply Levels</span>
                <span>{waterSupplyLevelSummary.count}</span>
              </div>
              {waterSupplyLevelSummary.levels.length > 0 && (
                <div className="pt-1">
                  <p className="mb-1 text-white/55">Different Levels</p>
                  <div className="max-h-36 overflow-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {waterSupplyLevelSummary.levels.map((level) => (
                      <div key={level} className="truncate py-0.5">
                        {level}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <LayerItem
            disabled={!selectedProjectId}
            checked={!!layerVisibility.sewagePoints}
            color={styles.sewagePoints.color}
            label="Sewage Points"
            opacity={styles.sewagePoints.opacity}
            onChange={() => toggleLayer("sewagePoints")}
            onOpacityChange={(value) => updateOpacity("sewagePoints", value)}
            onColorChange={(value) => updateColor("sewagePoints", value)}
            hasDropdown
            dropdownOpen={dropdownOpen.sewagePoints}
            onDropdownToggle={() => toggleDropdown("sewagePoints")}
            onTableOpen={() => setActiveAttributeTable("sewagePoints")}
          />

          {dropdownOpen.sewagePoints && (
            <div className="ml-6 mt-2 rounded-sm border border-[#13593f]/30 bg-[#051f17] px-3 py-2 text-[11px] text-white/80">
              <div className="flex justify-between border-b border-[#343c4c]/70 py-1">
                <span>Total Sewage Points</span>
                <span>{sewagePointSummary.count}</span>
              </div>
              {sewagePointSummary.types.length > 0 && (
                <div className="pt-1">
                  <p className="mb-1 text-white/55">Types</p>
                  {sewagePointSummary.types.map((type) => (
                    <div key={type} className="truncate py-0.5">
                      {type}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {renderAttributeTable()}
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
  hasDropdown = false,
  dropdownOpen = false,
  onDropdownToggle,
  onTableOpen,
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

        <div className="flex items-center gap-1">
          {onTableOpen && (
            <button
              type="button"
              disabled={disabled}
              onClick={(event) => {
                event.stopPropagation();
                onTableOpen();
              }}
              className="rounded p-0.5 text-white/70 hover:bg-[#0f3d2e] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              title={`Open ${label} attribute table`}
            >
              <Grid3X3 size={14} />
            </button>
          )}

          {hasDropdown && (
            <button
              type="button"
              disabled={disabled}
              onClick={(event) => {
                event.stopPropagation();
                onDropdownToggle?.();
              }}
              className="rounded p-0.5 text-white/70 hover:bg-[#0f3d2e] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              title={`Show ${label} details`}
            >
              {dropdownOpen ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>
          )}
        </div>
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

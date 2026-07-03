import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ChevronDown, ChevronRight, Grid3X3 } from "lucide-react";
import ProjectBoundaryAttribute from "./AttributeTable/ProjectBoundaryAttribute";
import BlockBoundaryAttribute from "./AttributeTable/BlockBoundaryAttribute";
import MasterPlanBoundaryAttribute from "./AttributeTable/MasterPlanBoundaryAttribute";
import SpotLevelAttribute from "./AttributeTable/SpotLevelAttribute";
import ContoursAttribute from "./AttributeTable/ContoursAttribute";
import RoadsAttribute from "./AttributeTable/RoadsAttribute";
import { API_BASE, formatNumber, getMapSourceGeoJSON, unwrapGeoJSON } from "./AttributeTable/AdminAttributeTableShell";
import { readAreaSqft, sqftToAcres } from "./AttributeTable/areaUtils";

const MASTER_PLAN_LAYER_COLORS = {
  boundary: "#0f3d2e",
  blockBoundary: "#7c3aed",
  masterPlan: "#2563eb",
  spotLevel: "#65c96b",
  contours: "#615514",
  roads: "#ef4444",
};

const MASTER_PLAN_SOURCE_IDS = {
  boundary: "metaverse-project-boundary-source",
  blockBoundary: "metaverse-block-source",
  masterPlan: "metaverse-masterplan-source",
  spotLevel: "metaverse-spot-level-source",
  contours: "metaverse-contours-source",
  roads: "metaverse-roads-source",
};


const getFeatureKey = (feature = {}) => {
  const props = feature.properties || {};
  return String(
    props.gid ?? props.id ?? props.block_id ?? props.block ?? props.name ?? feature.id ?? "",
  );
};

const getFeatureLabel = (feature = {}) => {
  const props = feature.properties || {};
  return props.block || props.name || props.gid || feature.id || "-";
};

const getBlockAreaValue = (feature = {}) => {
  const props = feature.properties || {};
  const area = props.area ?? props.Area ?? props.area_acres ?? props.acres;
  const numeric = Number(area);

  if (Number.isFinite(numeric) && numeric > 0) {
    return `${formatNumber(numeric)} acres`;
  }

  const sqft = readAreaSqft(feature);
  const acres = sqftToAcres(sqft);

  return acres > 0 ? `${formatNumber(acres)} acres` : "Area N/A";
};

const getBlockDropdownLabel = (feature = {}) =>
  `${getFeatureLabel(feature)} (${getBlockAreaValue(feature)})`;

const featureCollectionFromRows = (data) => unwrapGeoJSON(data);


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

    case "masterPlan":
      setPaint(map, "metaverse-masterplan-line", "line-color", color);
      setPaint(map, "metaverse-masterplan-label", "text-color", color);
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

  if (["boundary", "masterPlan", "spotLevel", "contours"].includes(key)) {
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
  const [activeAttributeTable, setActiveAttributeTable] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState({
    boundary: false,
    blockBoundary: false,
    masterPlan: false,
    spotLevel: false,
    contours: false,
    roads: false,
  });
  const [dropdownData, setDropdownData] = useState({
    boundary: [],
    blockBoundary: [],
    masterPlan: [],
    spotLevel: [],
    contours: [],
    roads: [],
  });
  const [selectedBlockKeys, setSelectedBlockKeys] = useState([]);

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

  const readSourceOrFetch = async (key, endpoint, params = {}) => {
    const fromMap = getMapSourceGeoJSON(map, MASTER_PLAN_SOURCE_IDS[key]);
    if (fromMap.features?.length) return fromMap;

    const res = await axios.get(`${API_BASE}${endpoint}`, { params });
    return featureCollectionFromRows(res.data);
  };

  const loadDropdownData = async (key) => {
    if (!selectedProjectId) return;

    try {
      if (key === "boundary") {
        const data = await readSourceOrFetch("boundary", "/project/", { gid: selectedProjectId });
        setDropdownData((prev) => ({ ...prev, boundary: data.features || [] }));
      }

      if (key === "blockBoundary") {
        const data = await readSourceOrFetch("blockBoundary", "/block/", { project_id: selectedProjectId });
        const features = [...(data.features || [])].sort((a, b) =>
          String(getFeatureLabel(a)).localeCompare(String(getFeatureLabel(b)), undefined, {
            numeric: true,
            sensitivity: "base",
          }),
        );
        setDropdownData((prev) => ({ ...prev, blockBoundary: features }));
        setSelectedBlockKeys((prev) =>
          prev.length ? prev : features.map(getFeatureKey).filter(Boolean),
        );
      }

      if (key === "masterPlan") {
        const data = await readSourceOrFetch("masterPlan", "/plot/", { project_id: selectedProjectId });
        setDropdownData((prev) => ({ ...prev, masterPlan: data.features || [] }));
      }

      if (key === "spotLevel") {
        const data = await readSourceOrFetch("spotLevel", "/spot-level/", { project_id: selectedProjectId });
        setDropdownData((prev) => ({ ...prev, spotLevel: data.features || [] }));
      }

      if (key === "contours") {
        const data = await readSourceOrFetch("contours", "/contour/", { project_id: selectedProjectId });
        setDropdownData((prev) => ({ ...prev, contours: data.features || [] }));
      }

      if (key === "roads") {
        const data = await readSourceOrFetch("roads", "/road/", { project_id: selectedProjectId });
        setDropdownData((prev) => ({ ...prev, roads: data.features || [] }));
      }
    } catch (error) {
      console.error(`${key} dropdown load error:`, error);
      setDropdownData((prev) => ({ ...prev, [key]: [] }));
    }
  };

  const toggleDropdown = (key) => {
    setDropdownOpen((prev) => ({ ...prev, [key]: !prev[key] }));
    loadDropdownData(key);
  };

  const setBlockLayerFilter = (keys = []) => {
    if (!map) return;
    const selected = keys.map(String);
    const filter = selected.length
      ? [
          "match",
          [
            "to-string",
            [
              "coalesce",
              ["get", "gid"],
              ["get", "id"],
              ["get", "block_id"],
              ["get", "block"],
              ["get", "name"],
            ],
          ],
          selected,
          true,
          false,
        ]
      : ["==", ["get", "__nothing__"], "__selected__"];

    ["metaverse-block-fill", "metaverse-block-line", "metaverse-block-label"].forEach((layerId) => {
      try {
        if (map.getLayer(layerId)) map.setFilter(layerId, filter);
      } catch (error) {
        console.error("Block filter error:", error);
      }
    });
  };

  const toggleBlockSelection = (feature) => {
    const key = getFeatureKey(feature);
    if (!key) return;

    setSelectedBlockKeys((prev) => {
      const set = new Set(prev.map(String));
      if (set.has(key)) set.delete(key);
      else set.add(key);
      const next = [...set];
      setBlockLayerFilter(next);
      return next;
    });
  };

  const selectAllBlocks = () => {
    const keys = (dropdownData.blockBoundary || []).map(getFeatureKey).filter(Boolean);
    setSelectedBlockKeys(keys);
    setBlockLayerFilter(keys);
  };

  const unselectAllBlocks = () => {
    setSelectedBlockKeys([]);
    setBlockLayerFilter([]);
  };

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

  useEffect(() => {
    if (layerVisibility.blockBoundary && selectedBlockKeys.length) {
      setBlockLayerFilter(selectedBlockKeys);
    }
  }, [map, layerVisibility.blockBoundary, selectedBlockKeys]);

  const projectBoundarySummary = useMemo(
    () => dropdownData.boundary.map((feature) => getFeatureLabel(feature)),
    [dropdownData.boundary],
  );

  const blockSelectionSet = useMemo(
    () => new Set(selectedBlockKeys.map(String)),
    [selectedBlockKeys],
  );

  const plotSummary = useMemo(() => {
    const counts = new Map();
    (dropdownData.masterPlan || []).forEach((feature) => {
      const props = feature.properties || {};
      const type = props.type || props.land_use || "Other";
      counts.set(type, (counts.get(type) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  }, [dropdownData.masterPlan]);

  const contoursSummary = useMemo(() => {
    const elevations = new Set();
    (dropdownData.contours || []).forEach((feature) => {
      const props = feature.properties || {};
      if (props.elevation !== undefined && props.elevation !== null && props.elevation !== "") {
        elevations.add(String(props.elevation));
      }
    });
    return {
      count: dropdownData.contours.length,
      elevationCount: elevations.size,
    };
  }, [dropdownData.contours]);

  const roadsSummary = useMemo(() => {
    const rows = new Map();
    (dropdownData.roads || []).forEach((feature) => {
      const props = feature.properties || {};
      const type = props.type || props.road_type || props.row || "Other";
      const current = rows.get(type) || { count: 0, sqft: 0 };
      current.count += 1;
      current.sqft += readAreaSqft(feature);
      rows.set(type, current);
    });
    return [...rows.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  }, [dropdownData.roads]);

  const renderAttributeTable = () => {
    const commonProps = {
      map,
      selectedProjectId,
      onClose: () => setActiveAttributeTable(null),
    };

    switch (activeAttributeTable) {
      case "boundary":
        return <ProjectBoundaryAttribute {...commonProps} />;
      case "blockBoundary":
        return <BlockBoundaryAttribute {...commonProps} />;
      case "masterPlan":
        return <MasterPlanBoundaryAttribute {...commonProps} />;
      case "spotLevel":
        return <SpotLevelAttribute {...commonProps} />;
      case "contours":
        return <ContoursAttribute {...commonProps} />;
      case "roads":
        return <RoadsAttribute {...commonProps} />;
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
        <span>MASTER PLAN</span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>

      {open && (
        <div className="mx-3 mb-3 rounded-sm border border-[#13593f]/40 bg-[#093024] p-2">
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
            hasDropdown
            dropdownOpen={dropdownOpen.boundary}
            onDropdownToggle={() => toggleDropdown("boundary")}
            onTableOpen={() => setActiveAttributeTable("boundary")}
          />

          {dropdownOpen.boundary && (
            <div className="ml-6 mt-2 rounded-sm border border-[#13593f]/30 bg-[#051f17] px-3 py-2 text-[11px] text-white/80">
              {projectBoundarySummary.length === 0 ? (
                <p className="py-1 text-white/60">No project boundary found</p>
              ) : (
                projectBoundarySummary.map((name, index) => (
                  <div key={`${name}-${index}`} className="flex justify-between border-b border-[#343c4c]/70 py-1 last:border-b-0">
                    <span>Project Boundary</span>
                    <span className="max-w-[150px] truncate">{name}</span>
                  </div>
                ))
              )}
            </div>
          )}

          <LayerItem
            disabled={!selectedProjectId}
            checked={!!layerVisibility.blockBoundary}
            color={styles.blockBoundary.color}
            label="Block Boundary"
            opacity={styles.blockBoundary.opacity}
            onChange={() => toggleLayer("blockBoundary")}
            onOpacityChange={(value) => updateOpacity("blockBoundary", value)}
            hasDropdown
            dropdownOpen={dropdownOpen.blockBoundary}
            onDropdownToggle={() => toggleDropdown("blockBoundary")}
            onTableOpen={() => setActiveAttributeTable("blockBoundary")}
          />

          {dropdownOpen.blockBoundary && (
            <div className="ml-6 mt-2 rounded-sm border border-[#13593f]/30 bg-[#051f17] px-2 py-2 text-[11px] text-white/80">
              <div className="mb-1.5 flex items-center justify-between border-b border-[#343c4c] pb-1.5">
                <button type="button" onClick={selectAllBlocks} className="rounded px-1.5 py-0.5 font-semibold text-[#8fd36f] hover:bg-[#0f3d2e]">Select All</button>
                <button type="button" onClick={unselectAllBlocks} className="rounded px-1.5 py-0.5 font-semibold text-[#8fd36f] hover:bg-[#0f3d2e]">Unselect All</button>
              </div>
              {(dropdownData.blockBoundary || []).length === 0 ? (
                <p className="px-1 py-1 text-white/60">No blocks found</p>
              ) : (
                <div className="max-h-44 overflow-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {dropdownData.blockBoundary.map((feature, index) => {
                    const key = getFeatureKey(feature) || String(index);
                    return (
                      <label key={key} className="flex cursor-pointer items-center gap-2 border-b border-[#343c4c]/60 py-1.5 last:border-b-0">
                        <input
                          type="checkbox"
                          checked={blockSelectionSet.has(String(key))}
                          onChange={() => toggleBlockSelection(feature)}
                          className="accent-[#65c96b]"
                        />
                        <span className="min-w-0 flex-1 truncate">{getBlockDropdownLabel(feature)}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <LayerItem
            disabled={!selectedProjectId}
            checked={layerVisibility.masterPlan}
            color={styles.masterPlan.color}
            label="Master Plan Boundary"
            opacity={styles.masterPlan.opacity}
            onChange={() => toggleLayer("masterPlan")}
            onOpacityChange={(value) => updateOpacity("masterPlan", value)}
            hasDropdown
            dropdownOpen={dropdownOpen.masterPlan}
            onDropdownToggle={() => toggleDropdown("masterPlan")}
            onTableOpen={() => setActiveAttributeTable("masterPlan")}
          />

          {dropdownOpen.masterPlan && (
            <div className="ml-6 mt-2 rounded-sm border border-[#13593f]/30 bg-[#051f17] px-3 py-2 text-[11px] text-white/80">
              <div className="flex justify-between border-b border-[#343c4c]/70 py-1">
                <span>Total Plots</span>
                <span>{dropdownData.masterPlan.length}</span>
              </div>
              {plotSummary.length === 0 ? (
                <p className="py-1 text-white/60">No plot types found</p>
              ) : (
                plotSummary.map(([type, count]) => (
                  <div key={type} className="flex justify-between border-b border-[#343c4c]/70 py-1 last:border-b-0">
                    <span className="max-w-[150px] truncate">{type}</span>
                    <span>{count}</span>
                  </div>
                ))
              )}
            </div>
          )}

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
            hasDropdown
            dropdownOpen={dropdownOpen.spotLevel}
            onDropdownToggle={() => toggleDropdown("spotLevel")}
            onTableOpen={() => setActiveAttributeTable("spotLevel")}
          />

          {dropdownOpen.spotLevel && (
            <div className="ml-6 mt-2 rounded-sm border border-[#13593f]/30 bg-[#051f17] px-3 py-2 text-[11px] text-white/80">
              <div className="flex justify-between py-1">
                <span>Total Spot Levels</span>
                <span>{dropdownData.spotLevel.length}</span>
              </div>
            </div>
          )}

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
            hasDropdown
            dropdownOpen={dropdownOpen.contours}
            onDropdownToggle={() => toggleDropdown("contours")}
            onTableOpen={() => setActiveAttributeTable("contours")}
          />

          {dropdownOpen.contours && (
            <div className="ml-6 mt-2 rounded-sm border border-[#13593f]/30 bg-[#051f17] px-3 py-2 text-[11px] text-white/80">
              <div className="flex justify-between border-b border-[#343c4c]/70 py-1">
                <span>Total Contours</span>
                <span>{contoursSummary.count}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Unique Elevations</span>
                <span>{contoursSummary.elevationCount}</span>
              </div>
            </div>
          )}

          <LayerItem
            disabled={!selectedProjectId}
            checked={layerVisibility.roads}
            color={styles.roads.color}
            label="Roads"
            opacity={styles.roads.opacity}
            onChange={() => toggleLayer("roads")}
            onOpacityChange={(value) => updateOpacity("roads", value)}
            hasDropdown
            dropdownOpen={dropdownOpen.roads}
            onDropdownToggle={() => toggleDropdown("roads")}
            onTableOpen={() => setActiveAttributeTable("roads")}
          />

          {dropdownOpen.roads && (
            <div className="ml-6 mt-2 rounded-sm border border-[#13593f]/30 bg-[#051f17] px-3 py-2 text-[11px] text-white/80">
              {roadsSummary.length === 0 ? (
                <p className="py-1 text-white/60">No road types found</p>
              ) : (
                roadsSummary.map(([type, summary]) => (
                  <div key={type} className="border-b border-[#343c4c]/70 py-1 last:border-b-0">
                    <div className="flex justify-between">
                      <span className="max-w-[150px] truncate">{type}</span>
                      <span>{summary.count}</span>
                    </div>
                    <div className="mt-0.5 flex justify-between text-white/55">
                      <span>Area</span>
                      <span>{formatNumber(summary.sqft)} sq ft / {formatNumber(sqftToAcres(summary.sqft))} ac</span>
                    </div>
                  </div>
                ))
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
              {dropdownOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
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

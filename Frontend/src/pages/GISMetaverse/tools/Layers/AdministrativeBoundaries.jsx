import { useEffect, useMemo, useState } from "react";
import { LAYER_PANEL_SCROLL } from "./_layerScroll";
import { ChevronDown, ChevronRight, Grid3X3 } from "lucide-react";
import mapboxgl from "mapbox-gl";

const RUDA_BOUNDARY_LAYER_IDS = [
  "metaverse-ruda-boundary-fill",
  "metaverse-ruda-boundary-line",
  "metaverse-ruda-boundary-dash-line",
  "metaverse-ruda-boundary-label",
];

const ADMIN_LAYER_COLORS = {
  rudaBoundary: "#6bb7e8",
  rudaMauzaBoundary: "#0f3d2e",
  geodeticNetwork: "#1d4ed8",
  proposedRoads: "#19598d",
};

const setPaint = (map, layerId, property, value) => {
  if (map?.getLayer?.(layerId)) {
    map.setPaintProperty(layerId, property, value);
  }
};

const applyAdministrativeLayerColor = (map, key, color) => {
  if (!map || !color) return;

  switch (key) {
    case "rudaMauzaBoundary":
      setPaint(map, "metaverse-ruda-mauza-boundary-fill", "fill-color", color);
      setPaint(
        map,
        "metaverse-ruda-mauza-boundary-fill",
        "fill-outline-color",
        color,
      );
      setPaint(map, "metaverse-ruda-mauza-boundary-line", "line-color", color);
      setPaint(map, "metaverse-ruda-mauza-boundary-label", "text-color", color);
      break;

    case "geodeticNetwork":
      setPaint(map, "metaverse-geodetic-network-circle", "circle-color", color);
      setPaint(map, "metaverse-geodetic-network-label", "text-color", color);
      break;

    default:
      break;
  }
};

const getOpacityRatio = (opacity = 100) => {
  const value = Number(opacity);
  if (!Number.isFinite(value)) return 1;
  return Math.min(Math.max(value, 0), 100) / 100;
};

const applyAdministrativeLayerOpacity = (map, key, opacity = 100) => {
  if (!map) return;

  const o = getOpacityRatio(opacity);

  switch (key) {
    case "rudaBoundary":
      setPaint(map, "metaverse-ruda-boundary-fill", "fill-opacity", 0.5 * o);
      setPaint(map, "metaverse-ruda-boundary-line", "line-opacity", 0.95 * o);
      setPaint(
        map,
        "metaverse-ruda-boundary-dash-line",
        "line-opacity",
        0.9 * o,
      );
      setPaint(map, "metaverse-ruda-boundary-label", "text-opacity", o);
      break;

    case "rudaMauzaBoundary":
      setPaint(
        map,
        "metaverse-ruda-mauza-boundary-fill",
        "fill-opacity",
        0.12 * o,
      );
      setPaint(map, "metaverse-ruda-mauza-boundary-line", "line-opacity", o);
      setPaint(map, "metaverse-ruda-mauza-boundary-label", "text-opacity", o);
      break;

    case "geodeticNetwork":
      setPaint(map, "metaverse-geodetic-network-circle", "circle-opacity", o);
      setPaint(
        map,
        "metaverse-geodetic-network-circle",
        "circle-stroke-opacity",
        o,
      );
      setPaint(map, "metaverse-geodetic-network-label", "text-opacity", o);
      break;

    case "proposedRoads":
      setPaint(map, "metaverse-proposed-roads-line", "line-opacity", o);
      break;

    default:
      break;
  }
};

const RUDA_PHASE_COLORS = [
  "#6bb7e8",
  "#f8d56b",
  "#6bd69a",
  "#f59e72",
  "#b99cf3",
  "#78d6d0",
  "#f3a6c8",
  "#a7d77b",
  "#f4b860",
  "#86a8e7",
  "#d7b377",
  "#8dd3c7",
];

const hashString = (value = "") => {
  const text = String(value || "");
  let hash = 0;

  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }

  return hash;
};

const stripHtml = (value = "") =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const getRudaPhaseColor = (phaseId) => {
  const index = Math.abs(Number(phaseId) || hashString(phaseId || "ruda"));
  return RUDA_PHASE_COLORS[index % RUDA_PHASE_COLORS.length];
};

const getRudaPhaseLabel = (properties = {}, phaseId = "") => {
  const candidates = [
    properties?._ruda_phase_label,
    properties?.phase,
    properties?.phase_name,
    properties?.name,
    properties?.folderpath,
    properties?.popupinfo,
    properties?.snippet,
  ];

  for (const value of candidates) {
    const clean = stripHtml(value);
    if (!clean) continue;

    const phaseMatch = clean.match(/phase\s*[-_:]?\s*([a-z0-9]+)/i);
    if (phaseMatch?.[1]) return `Phase ${phaseMatch[1]}`;

    if (clean.length <= 28) return clean;
    return clean.slice(0, 28);
  }

  return phaseId ? `Phase ${phaseId}` : "RUDA Phase";
};

const getRudaPhaseId = (feature = {}) => {
  const props = feature?.properties || {};
  return (
    props?._ruda_phase_id ??
    props?.gid ??
    feature?.id ??
    props?.id ??
    props?.oid ??
    props?.fid
  );
};

const getRudaPhaseItemsFromGeoJSON = (geojson = {}) => {
  const unique = new Map();

  (geojson?.features || []).forEach((feature) => {
    const props = feature?.properties || {};
    const id = getRudaPhaseId(feature);
    if (id === undefined || id === null || id === "") return;

    const key = String(id);
    if (unique.has(key)) return;

    unique.set(key, {
      id,
      label: getRudaPhaseLabel(props, id),
      color: props?._ruda_phase_color || getRudaPhaseColor(id),
    });
  });

  return [...unique.values()];
};

export default function AdministrativeBoundaries({
  map,
  adminBoundaryVisibility,
  setAdminBoundaryVisibility,
}) {
  const [open, setOpen] = useState(false);
  const [rudaPhaseDropdownOpen, setRudaPhaseDropdownOpen] = useState(false);

  // Keep editable colors local to this panel so changing colors does NOT update
  // adminBoundaryVisibility and does NOT re-trigger any API/loading effects.
  const [editableColors, setEditableColors] = useState({
    rudaMauzaBoundary: ADMIN_LAYER_COLORS.rudaMauzaBoundary,
    geodeticNetwork: ADMIN_LAYER_COLORS.geodeticNetwork,
  });

  // Keep opacity local to this panel. Changing the slider should only repaint
  // already-loaded Mapbox layers and should not update adminBoundaryVisibility,
  // because that parent state can re-trigger API/loading effects.
  const [editableOpacities, setEditableOpacities] = useState({
    rudaBoundary: adminBoundaryVisibility?.rudaBoundaryOpacity ?? 100,
    rudaMauzaBoundary: adminBoundaryVisibility?.rudaMauzaBoundaryOpacity ?? 100,
    geodeticNetwork: adminBoundaryVisibility?.geodeticNetworkOpacity ?? 100,
    proposedRoads: adminBoundaryVisibility?.proposedRoadsOpacity ?? 100,
  });

  const ADMIN_SOURCE_IDS = {
    rudaBoundary: "metaverse-ruda-boundary-source",
    rudaMauzaBoundary: "metaverse-ruda-mauza-boundary-source",
    geodeticNetwork: "metaverse-geodetic-network-source",
    proposedRoads: "metaverse-proposed-roads-source",
  };

  const rudaPhases = adminBoundaryVisibility?.rudaPhases || [];
  const selectedRudaPhaseIds =
    adminBoundaryVisibility?.selectedRudaPhaseIds || [];

  const selectedRudaPhaseSet = useMemo(
    () => new Set(selectedRudaPhaseIds.map((id) => String(id))),
    [selectedRudaPhaseIds],
  );

  const refreshRudaPhasesFromMap = () => {
    if (!map) return [];

    try {
      const source = map.getSource(ADMIN_SOURCE_IDS.rudaBoundary);
      const data = source?._data || source?.serialize?.()?.data;
      const phases = getRudaPhaseItemsFromGeoJSON(data);

      if (phases.length) {
        setAdminBoundaryVisibility((prev) => {
          const previousSelected = prev?.selectedRudaPhaseIds || [];

          return {
            ...prev,
            rudaPhases: phases,
            selectedRudaPhaseIds: previousSelected.length
              ? previousSelected
              : phases.map((phase) => phase.id),
          };
        });
      }

      return phases;
    } catch (error) {
      console.error("RUDA phases read error:", error);
      return [];
    }
  };

  useEffect(() => {
    if (!map || !adminBoundaryVisibility?.rudaBoundary) return;

    refreshRudaPhasesFromMap();
    const timers = [350, 900, 1400].map((delay) =>
      setTimeout(refreshRudaPhasesFromMap, delay),
    );

    return () => timers.forEach(clearTimeout);
  }, [map, adminBoundaryVisibility?.rudaBoundary]);

  useEffect(() => {
    if (!map) return;

    const selected = (adminBoundaryVisibility?.selectedRudaPhaseIds || []).map(
      (id) => String(id),
    );
    const hasPhases = (adminBoundaryVisibility?.rudaPhases || []).length > 0;
    const filter =
      adminBoundaryVisibility?.rudaBoundary && hasPhases
        ? [
            "match",
            ["to-string", ["get", "_ruda_phase_id"]],
            selected,
            true,
            false,
          ]
        : null;

    RUDA_BOUNDARY_LAYER_IDS.forEach((layerId) => {
      try {
        if (map.getLayer(layerId)) map.setFilter(layerId, filter);
      } catch (error) {
        console.error("RUDA phase filter error:", error);
      }
    });
  }, [
    map,
    adminBoundaryVisibility?.rudaBoundary,
    adminBoundaryVisibility?.rudaPhases,
    adminBoundaryVisibility?.selectedRudaPhaseIds,
  ]);

  useEffect(() => {
    if (!map) return undefined;

    const applyColors = () => {
      applyAdministrativeLayerColor(
        map,
        "rudaMauzaBoundary",
        editableColors.rudaMauzaBoundary,
      );
      applyAdministrativeLayerColor(
        map,
        "geodeticNetwork",
        editableColors.geodeticNetwork,
      );
    };

    applyColors();
    const timers = [150, 500, 1000].map((delay) =>
      setTimeout(applyColors, delay),
    );

    return () => timers.forEach(clearTimeout);
  }, [
    map,
    editableColors.rudaMauzaBoundary,
    editableColors.geodeticNetwork,
    adminBoundaryVisibility?.rudaMauzaBoundary,
    adminBoundaryVisibility?.geodeticNetwork,
  ]);

  useEffect(() => {
    if (!map) return undefined;

    const applyOpacities = () => {
      applyAdministrativeLayerOpacity(
        map,
        "rudaBoundary",
        editableOpacities.rudaBoundary,
      );
      applyAdministrativeLayerOpacity(
        map,
        "rudaMauzaBoundary",
        editableOpacities.rudaMauzaBoundary,
      );
      applyAdministrativeLayerOpacity(
        map,
        "geodeticNetwork",
        editableOpacities.geodeticNetwork,
      );
      applyAdministrativeLayerOpacity(
        map,
        "proposedRoads",
        editableOpacities.proposedRoads,
      );
    };

    applyOpacities();
    const timers = [150, 500, 1000].map((delay) =>
      setTimeout(applyOpacities, delay),
    );

    return () => timers.forEach(clearTimeout);
  }, [
    map,
    editableOpacities.rudaBoundary,
    editableOpacities.rudaMauzaBoundary,
    editableOpacities.geodeticNetwork,
    editableOpacities.proposedRoads,
    adminBoundaryVisibility?.rudaBoundary,
    adminBoundaryVisibility?.rudaMauzaBoundary,
    adminBoundaryVisibility?.geodeticNetwork,
    adminBoundaryVisibility?.proposedRoads,
  ]);

  const zoomToBoundarySource = (key) => {
    if (!map) return;

    const sourceId = ADMIN_SOURCE_IDS[key];
    if (!sourceId) return;

    const extendBounds = (bounds, coords) => {
      if (!Array.isArray(coords)) return;

      if (
        coords.length >= 2 &&
        typeof coords[0] === "number" &&
        typeof coords[1] === "number"
      ) {
        bounds.extend(coords);
        return;
      }

      coords.forEach((coord) => extendBounds(bounds, coord));
    };

    const tryZoom = () => {
      try {
        const source = map.getSource(sourceId);
        const data = source?._data || source?.serialize?.()?.data;

        if (!data?.features?.length) return false;

        const bounds = new mapboxgl.LngLatBounds();

        data.features.forEach((feature) => {
          const geometry = feature.geometry;
          if (!geometry) return;

          if (geometry.type === "GeometryCollection") {
            geometry.geometries?.forEach((geom) => {
              extendBounds(bounds, geom.coordinates);
            });
            return;
          }

          extendBounds(bounds, geometry.coordinates);
        });

        if (bounds.isEmpty()) return false;

        map.fitBounds(bounds, {
          padding: 70,
          duration: 1200,
          maxZoom: key === "geodeticNetwork" ? 16 : 14,
        });

        return true;
      } catch (error) {
        console.error("Administrative boundary zoom error:", error);
        return false;
      }
    };

    const zoomWhenReady = () => {
      if (tryZoom()) return;
      setTimeout(tryZoom, 350);
      setTimeout(tryZoom, 900);
      setTimeout(tryZoom, 1400);
    };

    if (map.isStyleLoaded?.()) zoomWhenReady();
    else map.once("load", zoomWhenReady);
  };

  const toggleLayer = (key) => {
    const willBeVisible = !adminBoundaryVisibility?.[key];

    setAdminBoundaryVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
      ...(willBeVisible
        ? {
            _zoomTo: key,
            _zoomToken: Date.now(),
          }
        : {}),
    }));

    if (willBeVisible) {
      zoomToBoundarySource(key);
      if (key === "rudaBoundary") {
        setRudaPhaseDropdownOpen(true);
        setTimeout(refreshRudaPhasesFromMap, 500);
        setTimeout(refreshRudaPhasesFromMap, 1200);
      }
    }
  };

  const updateOpacity = (key, value) => {
    setEditableOpacities((prev) => ({
      ...prev,
      [key]: value,
    }));

    applyAdministrativeLayerOpacity(map, key, value);
  };

  const updateColor = (key, value) => {
    setEditableColors((prev) => ({
      ...prev,
      [key]: value,
    }));

    applyAdministrativeLayerColor(map, key, value);
  };

  const toggleRudaPhase = (phaseId) => {
    setAdminBoundaryVisibility((prev) => {
      const selected = new Set(
        (prev?.selectedRudaPhaseIds || []).map((id) => String(id)),
      );
      const stringId = String(phaseId);

      if (selected.has(stringId)) selected.delete(stringId);
      else selected.add(stringId);

      return {
        ...prev,
        selectedRudaPhaseIds: (prev?.rudaPhases || [])
          .map((phase) => phase.id)
          .filter((id) => selected.has(String(id))),
      };
    });
  };

  const selectAllRudaPhases = () => {
    setAdminBoundaryVisibility((prev) => ({
      ...prev,
      selectedRudaPhaseIds: (prev?.rudaPhases || []).map((phase) => phase.id),
    }));
  };

  const resetRudaPhases = () => {
    setAdminBoundaryVisibility((prev) => ({
      ...prev,
      selectedRudaPhaseIds: [],
    }));
  };

  const allRudaPhasesSelected =
    rudaPhases.length > 0 &&
    rudaPhases.every((phase) => selectedRudaPhaseSet.has(String(phase.id)));

  return (
    <div className="border-b border-[#343c4c]">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-white hover:bg-[#0f3d2e]"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>ADMINISTRATIVE BOUNDARIES</span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>

      {open && (
        <div className="mx-3 mb-3 rounded-sm border border-[#3b4558] bg-[#232b3a] p-2">
          <LayerItem
            checked={adminBoundaryVisibility.rudaBoundary}
            color={ADMIN_LAYER_COLORS.rudaBoundary}
            label="Ruda Boundary"
            opacity={editableOpacities.rudaBoundary}
            onChange={() => toggleLayer("rudaBoundary")}
            onOpacityChange={(value) => updateOpacity("rudaBoundary", value)}
            hasDropdown
            dropdownOpen={rudaPhaseDropdownOpen}
            onDropdownToggle={() => {
              setRudaPhaseDropdownOpen((prev) => !prev);
              refreshRudaPhasesFromMap();
            }}
          />

          {rudaPhaseDropdownOpen && (
            <div className="ml-6 mt-2 rounded-sm border border-[#3b4558] bg-[#1f2633] px-2 py-2">
              {rudaPhases.length === 0 ? (
                <p className="px-1 py-1 text-[11px] text-white/60">
                  No phases found
                </p>
              ) : (
                <>
                  <div className="mb-1.5 flex items-center justify-between border-b border-[#343c4c] pb-1.5">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={allRudaPhasesSelected}
                        onChange={(e) => {
                          if (e.target.checked) selectAllRudaPhases();
                          else resetRudaPhases();
                        }}
                        className="accent-[#65c96b]"
                      />
                      <span className="text-[11px] text-white/90">
                        Select All
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={resetRudaPhases}
                      className="rounded px-1.5 py-0.5 text-[11px] font-semibold text-[#8fd36f] hover:bg-[#0f3d2e]"
                    >
                      Reset
                    </button>
                  </div>

                  <div className={`max-h-44 pr-1 ${LAYER_PANEL_SCROLL}`}>
                    {rudaPhases.map((phase) => {
                      const checked = selectedRudaPhaseSet.has(
                        String(phase.id),
                      );

                      return (
                        <label
                          key={phase.id}
                          className="flex cursor-pointer items-center gap-2 border-b border-[#343c4c]/60 py-1.5 last:border-b-0"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleRudaPhase(phase.id)}
                            className="accent-[#65c96b]"
                          />
                          <span
                            className="h-3.5 w-5 shrink-0 rounded-sm border border-white/50"
                            style={{ backgroundColor: phase.color }}
                          />
                          <span className="min-w-0 flex-1 truncate text-[11px] text-white/80">
                            {phase.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          <LayerItem
            checked={adminBoundaryVisibility.rudaMauzaBoundary}
            color={editableColors.rudaMauzaBoundary}
            label="Ruda Mauza Boundary"
            opacity={editableOpacities.rudaMauzaBoundary}
            onChange={() => toggleLayer("rudaMauzaBoundary")}
            onOpacityChange={(value) =>
              updateOpacity("rudaMauzaBoundary", value)
            }
            colorEditable
            onColorChange={(value) => updateColor("rudaMauzaBoundary", value)}
          />

          <LayerItem
            checked={adminBoundaryVisibility.geodeticNetwork}
            color={editableColors.geodeticNetwork}
            label="Geodetic Network"
            opacity={editableOpacities.geodeticNetwork}
            onChange={() => toggleLayer("geodeticNetwork")}
            onOpacityChange={(value) => updateOpacity("geodeticNetwork", value)}
            colorEditable
            onColorChange={(value) => updateColor("geodeticNetwork", value)}
          />

          <LayerItem
            checked={adminBoundaryVisibility.proposedRoads}
            color={ADMIN_LAYER_COLORS.proposedRoads}
            label="Proposed Roads Layer"
            opacity={editableOpacities.proposedRoads}
            onChange={() => toggleLayer("proposedRoads")}
            onOpacityChange={(value) => updateOpacity("proposedRoads", value)}
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
  hasDropdown = false,
  dropdownOpen = false,
  onDropdownToggle,
  colorEditable = false,
  onColorChange,
}) {
  const handleColorEvent = (event) => {
    event.stopPropagation();
  };

  const handleColorChange = (event) => {
    event.stopPropagation();
    onColorChange?.(event.target.value);
  };

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

          {colorEditable ? (
            <span
              className="relative h-4 w-4 shrink-0 overflow-hidden rounded-sm border border-white/50"
              style={{ backgroundColor: color, borderColor: color }}
              title={`Change ${label} color`}
              onClick={handleColorEvent}
              onMouseDown={handleColorEvent}
            >
              <input
                type="color"
                value={color}
                aria-label={`Change ${label} color`}
                onClick={handleColorEvent}
                onMouseDown={handleColorEvent}
                onInput={handleColorChange}
                onChange={handleColorChange}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </span>
          ) : (
            <span
              className="h-4 w-4 rounded-sm border-2 border-white/50"
              style={{ backgroundColor: color, borderColor: color }}
            />
          )}

          <span className="text-[11px]">{label}</span>
        </label>

        {hasDropdown ? (
          <button
            type="button"
            onClick={onDropdownToggle}
            className="rounded p-0.5 text-white/70 hover:bg-[#0f3d2e] hover:text-white"
            title="Show RUDA phases"
          >
            {dropdownOpen ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>
        ) : (
          <Grid3X3 size={14} className="text-white/60" />
        )}
      </div>

      <div className="mt-2 flex items-center gap-2 pl-6">
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          onChange={(e) => onOpacityChange(Number(e.target.value))}
          className="h-[3px] flex-1 cursor-pointer rounded-full bg-[#8fd36f] accent-[#65c96b]"
        />

        <span className="w-7 text-right text-[11px] text-white/90">
          {opacity}%
        </span>
      </div>
    </div>
  );
}

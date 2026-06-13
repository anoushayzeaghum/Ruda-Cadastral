import { useEffect, useMemo, useRef, useState } from "react";
import {
  Layers,
  Wrench,
  MapPin,
  Satellite,
  Ruler,
  ChevronRight,
  Map,
  Info,
  Search,
  ChevronDown,
  Crosshair,
  SquareDashedIcon,
  Compass,
  Printer,
  CircleDot,
  Network,
  Route,
} from "lucide-react";

const BASEMAPS = [
  {
    name: "Satellite",
    preview: "bg-[linear-gradient(135deg,#314b33,#8b7c52,#2c4a59)]",
  },
  {
    name: "Streets",
    preview: "bg-[linear-gradient(135deg,#f0eadb,#d8d1bb,#b6c4b5)]",
  },
  {
    name: "Light",
    preview: "bg-[linear-gradient(135deg,#f8fafc,#e2e8f0,#cbd5e1)]",
  },
  {
    name: "Dark",
    preview: "bg-[linear-gradient(135deg,#0f172a,#334155,#111827)]",
  },
  {
    name: "Outdoors",
    preview: "bg-[linear-gradient(135deg,#6f9f55,#d5c17b,#7ba98f)]",
  },
];

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

const getRudaPhaseColor = (phaseId) => {
  const index = Math.abs(Number(phaseId) || hashString(phaseId || "ruda"));
  return RUDA_PHASE_COLORS[index % RUDA_PHASE_COLORS.length];
};

export default function LeftPanel({
  layers,
  setLayers,
  rudaPhases,
  setRudaPhases,
  selectedRudaPhaseIds,
  setSelectedRudaPhaseIds,
  selectedProposedRoadIds,
  setSelectedProposedRoadIds,
  basemap,
  setBasemap,
  selectedMauza,
  selectedFilterLayers = [],
}) {
  const [activePanel, setActivePanel] = useState("layers");
  const [rudaDropdownOpen, setRudaDropdownOpen] = useState(false);
  const hasMauza = !!selectedMauza;
  const initializedOpacityKeysRef = useRef(new Set());

  const [rudaProposedRoads, setRudaProposedRoads] = useState([]);
  const [proposedDropdownOpen, setProposedDropdownOpen] = useState(false);

  const getDefaultOpacityForSelectedLayer = (item) => {
    const text = `${item?.key || ""} ${item?.label || ""}`.toLowerCase();

    if (text.includes("district") || text.includes("tehsil") || text.includes("mauza")) {
      return 0;
    }

    if (text.includes("khasra") || text.includes("murabba")) {
      return 25;
    }

    return 100;
  };


  const selectedLayerItems = useMemo(
    () => selectedFilterLayers.filter((item) => item?.label && item?.key),
    [selectedFilterLayers],
  );
  useEffect(() => {
    setLayers((prev) => {
      let changed = false;
      const next = { ...prev };

      const rudaLayerDefaults = {
        rudaBoundary: 10,
        proposedRoads: 100,
      };

      Object.entries(rudaLayerDefaults).forEach(([key, opacity]) => {
        if (initializedOpacityKeysRef.current.has(key)) return;

        const current = next[key];
        next[key] = {
          ...(typeof current === "object"
            ? current
            : { visible: !!current }),
          opacity,
        };
        initializedOpacityKeysRef.current.add(key);
        changed = true;
      });

      selectedLayerItems.forEach((item) => {
        if (!item?.key || initializedOpacityKeysRef.current.has(item.key)) return;

        const current = next[item.key];
        next[item.key] = {
          ...(typeof current === "object"
            ? current
            : { visible: current === undefined ? true : !!current }),
          opacity: getDefaultOpacityForSelectedLayer(item),
        };
        initializedOpacityKeysRef.current.add(item.key);
        changed = true;
      });

      return changed ? next : prev;
    });
  }, [selectedLayerItems, setLayers]);


  const updateLayer = (layerKey, patch) => {
    setLayers((prev) => ({
      ...prev,
      [layerKey]: {
        ...(typeof prev?.[layerKey] === "object"
          ? prev[layerKey]
          : { visible: !!prev?.[layerKey], opacity: 100 }),
        ...patch,
      },
    }));
  };

  const getLayerVisible = (layerKey) => {
    const value = layers?.[layerKey];
    return typeof value === "object" ? !!value.visible : !!value;
  };

  const getLayerOpacity = (layerKey) => {
    const value = layers?.[layerKey];
    return typeof value === "object" && Number.isFinite(Number(value.opacity))
      ? Number(value.opacity)
      : 100;
  };

  const toggleLayer = (layerKey) =>
    updateLayer(layerKey, { visible: !getLayerVisible(layerKey) });

  const getRudaPhaseId = (phase) => phase?.gid ?? phase?.id ?? phase?.oid;

  const getAllRudaPhaseIds = () =>
    (rudaPhases || [])
      .map((phase) => getRudaPhaseId(phase))
      .filter((id) => id !== undefined && id !== null);

  const toggleRudaBoundaryLayer = () => {
    const willOpen = !getLayerVisible("rudaBoundary");

    if (willOpen && (!selectedRudaPhaseIds || selectedRudaPhaseIds.length === 0)) {
      setSelectedRudaPhaseIds(getAllRudaPhaseIds());
    }

    toggleLayer("rudaBoundary");
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (rudaPhases?.length) return;

      try {
        const { getRudaList } = await import("../../services/api");
        const list = await getRudaList();
        if (!mounted) return;
        const ids = (list || []).map((p) => p.gid ?? p.id ?? p.oid);
        setRudaPhases(list || []);
        setSelectedRudaPhaseIds(ids);
      } catch (e) {
        console.error("Failed to load RUDA phases", e);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [rudaPhases, setRudaPhases, setSelectedRudaPhaseIds]);

  useEffect(() => {
    let mounted = true;

    const loadProposedRoads = async () => {
      if (rudaProposedRoads?.length) return;

      try {
        const { getRudaProposedRoadsList } = await import("../../services/api");
        const list = await getRudaProposedRoadsList();

        if (!mounted) return;

        const ids = (list || []).map(
          (r) => r.gid ?? r.id ?? r.oid
        );

        setRudaProposedRoads(list || []);
        setSelectedProposedRoadIds(ids); // select all by default
      } catch (e) {
        console.error("Failed to load proposed roads", e);
      }
    };

    loadProposedRoads();

    return () => {
      mounted = false;
    };
  }, []);

  const getAllProposedRoadIds = () =>
    (rudaProposedRoads || [])
      .map((r) => r.gid ?? r.id ?? r.oid)
      .filter(Boolean);

  const toggleProposedRoadLayer = () => {
    const willOpen = !getLayerVisible("proposedRoads");

    if (willOpen && (selectedProposedRoadIds || []).length === 0) {
      setSelectedProposedRoadIds(getAllProposedRoadIds());
    }

    toggleLayer("proposedRoads");
  };
  return (
    <div className="pointer-events-none absolute left-3 top-24 z-30 flex items-start gap-2">
      {/* Separate icon buttons. No combined background wrapper. */}
      <div className="pointer-events-auto flex flex-col gap-2">
        <PanelIcon
          title="Layer Manager"
          active={activePanel === "layers"}
          onClick={() =>
            setActivePanel(activePanel === "layers" ? "" : "layers")
          }
          icon={<Layers size={18} />}
        />
        <PanelIcon
          title="Toolbox"
          active={activePanel === "toolbox"}
          onClick={() =>
            setActivePanel(activePanel === "toolbox" ? "" : "toolbox")
          }
          icon={<Wrench size={18} />}
        />
        <PanelIcon
          title="Map Background"
          active={activePanel === "basemap"}
          onClick={() =>
            setActivePanel(activePanel === "basemap" ? "" : "basemap")
          }
          icon={<Satellite size={18} />}
        />
      </div>

      {activePanel && (
        <div className="pointer-events-auto w-[320px] max-h-[calc(100vh-170px)] overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-800 shadow-2xl">
          {activePanel === "layers" && (
            <Panel title="Layer Manager">
              <div className="max-h-[calc(100vh-225px)] overflow-y-auto px-3 pb-3">
                <RudaBoundaryLayers
                  rudaPhases={rudaPhases}
                  selectedRudaPhaseIds={selectedRudaPhaseIds}
                  setSelectedRudaPhaseIds={setSelectedRudaPhaseIds}
                  rudaDropdownOpen={rudaDropdownOpen}
                  setRudaDropdownOpen={setRudaDropdownOpen}
                  getLayerVisible={getLayerVisible}
                  getLayerOpacity={getLayerOpacity}
                  toggleLayer={toggleLayer}
                  toggleRudaBoundaryLayer={toggleRudaBoundaryLayer}
                  updateLayer={updateLayer}
                />
                <RudaProposedRoadsLayers
                  rudaProposedRoads={rudaProposedRoads}
                  selectedProposedRoadIds={selectedProposedRoadIds}
                  setSelectedProposedRoadIds={setSelectedProposedRoadIds}
                  proposedDropdownOpen={proposedDropdownOpen}
                  setProposedDropdownOpen={setProposedDropdownOpen}
                  getLayerVisible={getLayerVisible}
                  getLayerOpacity={getLayerOpacity}
                  toggleLayer={toggleLayer}
                  toggleProposedRoadLayer={toggleProposedRoadLayer}
                  updateLayer={updateLayer}
                  getAllProposedRoadIds={getAllProposedRoadIds}
                />

                {selectedLayerItems.length > 0 && (
                  <SelectedAdministrativeLayers
                    items={selectedLayerItems}
                    getLayerVisible={getLayerVisible}
                    getLayerOpacity={getLayerOpacity}
                    toggleLayer={toggleLayer}
                    updateLayer={updateLayer}
                  />
                )}

                {/* <SectionTitle title="Mauza Based Layers" open />
                <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <LayerRow
                    icon={<Network size={15} />}
                    label="Mauza Vertices"
                    checked={getLayerVisible("controlPoints")}
                    opacity={getLayerOpacity("controlPoints")}
                    disabled={!hasMauza}
                    disabledText="Select mauza first"
                    onToggle={() => toggleLayer("controlPoints")}
                    showOpacity={false}
                  />
                  <LayerRow
                    icon={<Route size={15} />}
                    label="Tri-junction Points"
                    checked={getLayerVisible("triJunctionPoints")}
                    opacity={getLayerOpacity("triJunctionPoints")}
                    disabled={!hasMauza}
                    disabledText="Select mauza first"
                    onToggle={() => toggleLayer("triJunctionPoints")}
                    showOpacity={false}
                  />
                </div> */}

                <SectionTitle title="Imagery & Terrain Layers" open />
                <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <LayerRow
                    icon={<Map size={15} />}
                    label="Orthophoto Imagery"
                    checked={getLayerVisible("ortho")}
                    opacity={getLayerOpacity("ortho")}
                    onToggle={() => toggleLayer("ortho")}
                    onOpacity={(value) => updateLayer("ortho", { opacity: value })}
                  />
                  <LayerRow
                    icon={<Map size={15} />}
                    label="Digital Surface Model (DSM)"
                    checked={getLayerVisible("dsm")}
                    opacity={getLayerOpacity("dsm")}
                    onToggle={() => toggleLayer("dsm")}
                    onOpacity={(value) => updateLayer("dsm", { opacity: value })}
                  />
                  <LayerRow
                    icon={<Map size={15} />}
                    label="Digital Terrain Model (DTM)"
                    checked={getLayerVisible("dtm")}
                    opacity={getLayerOpacity("dtm")}
                    onToggle={() => toggleLayer("dtm")}
                    onOpacity={(value) => updateLayer("dtm", { opacity: value })}
                  />
                </div>
              </div>
            </Panel>
          )}

          {activePanel === "toolbox" && (
            <Panel title="Toolbox">
              <div className="px-3 pb-1 pt-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Measurement Tools
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 px-3 pb-3">
                <ToolboxButton
                  icon={<Ruler size={18} />}
                  label="Distance"
                  active={getLayerVisible("measure")}
                  description="Click to measure line distance. Right-click to clear."
                  onClick={() => {
                    const willActivate = !getLayerVisible("measure");
                    // Deactivate other drawing tools when activating this one
                    if (willActivate) {
                      updateLayer("measureArea", { visible: false });
                      updateLayer("measureBearing", { visible: false });
                      updateLayer("coordPicker", { visible: false });
                    }
                    toggleLayer("measure");
                  }}
                />
                <ToolboxButton
                  icon={<SquareDashedIcon size={18} />}
                  label="Area"
                  active={getLayerVisible("measureArea")}
                  description="Click to draw a polygon and calculate area. Right-click to close & finish."
                  onClick={() => {
                    const willActivate = !getLayerVisible("measureArea");
                    if (willActivate) {
                      updateLayer("measure", { visible: false });
                      updateLayer("measureBearing", { visible: false });
                      updateLayer("coordPicker", { visible: false });
                    }
                    toggleLayer("measureArea");
                  }}
                />
                <ToolboxButton
                  icon={<Compass size={18} />}
                  label="Bearing"
                  active={getLayerVisible("measureBearing")}
                  description="Click two points to measure the bearing angle between them."
                  onClick={() => {
                    const willActivate = !getLayerVisible("measureBearing");
                    if (willActivate) {
                      updateLayer("measure", { visible: false });
                      updateLayer("measureArea", { visible: false });
                      updateLayer("coordPicker", { visible: false });
                    }
                    toggleLayer("measureBearing");
                  }}
                />
                <ToolboxButton
                  icon={<Crosshair size={18} />}
                  label="Coordinates"
                  active={getLayerVisible("coordPicker")}
                  description="Click anywhere to copy the exact coordinates of that point."
                  onClick={() => {
                    const willActivate = !getLayerVisible("coordPicker");
                    if (willActivate) {
                      updateLayer("measure", { visible: false });
                      updateLayer("measureArea", { visible: false });
                      updateLayer("measureBearing", { visible: false });
                    }
                    toggleLayer("coordPicker");
                  }}
                />
                <ToolboxButton
                  icon={<CircleDot size={18} />}
                  label="Buffer"
                  active={getLayerVisible("measureBuffer")}
                  description="Click a point to draw a 500 m buffer zone around it."
                  onClick={() => {
                    const willActivate = !getLayerVisible("measureBuffer");
                    if (willActivate) {
                      updateLayer("measure", { visible: false });
                      updateLayer("measureArea", { visible: false });
                      updateLayer("measureBearing", { visible: false });
                      updateLayer("coordPicker", { visible: false });
                    }
                    toggleLayer("measureBuffer");
                  }}
                />
                <ToolboxButton
                  icon={<Printer size={18} />}
                  label="Print Map"
                  description="Export the current map view as a PNG image."
                  onClick={() => toggleLayer("printMap")}
                />
              </div>

              {/* Active tool hint */}
              {(getLayerVisible("measure") ||
                getLayerVisible("measureArea") ||
                getLayerVisible("measureBearing") ||
                getLayerVisible("coordPicker") ||
                getLayerVisible("measureBuffer")) && (
                <div className="mx-3 mb-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] leading-snug text-blue-700">
                  {getLayerVisible("measure") &&
                    "📏 Click points to measure distance. Right-click to clear."}
                  {getLayerVisible("measureArea") &&
                    "🔲 Click to draw polygon vertices. Right-click to close and calculate area."}
                  {getLayerVisible("measureBearing") &&
                    "🧭 Click the start point, then the end point to measure bearing."}
                  {getLayerVisible("coordPicker") &&
                    "📍 Click anywhere on the map to get precise coordinates."}
                  {getLayerVisible("measureBuffer") &&
                    "⭕ Click a location to draw a 500 m buffer zone around it."}
                </div>
              )}
            </Panel>
          )}

          {activePanel === "basemap" && (
            <Panel title="Map Background">
              <div className="grid grid-cols-2 gap-2 p-3">
                {BASEMAPS.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setBasemap(item.name)}
                    className={`overflow-hidden rounded-lg border text-left transition ${
                      basemap === item.name
                        ? "border-green-700 bg-green-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className={`h-16 w-full ${item.preview}`} />
                    <div className="flex items-center justify-between px-2 py-2 text-xs font-semibold text-slate-800">
                      <span className="flex items-center gap-1.5">
                        <Map size={14} />
                        {item.name}
                      </span>
                      {basemap === item.name && (
                        <span className="text-green-700">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}


function RudaBoundaryLayers({
  rudaPhases,
  selectedRudaPhaseIds,
  setSelectedRudaPhaseIds,
  rudaDropdownOpen,
  setRudaDropdownOpen,
  getLayerVisible,
  getLayerOpacity,
  toggleLayer,
  toggleRudaBoundaryLayer,
  updateLayer,
}) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2.5">
        <h4 className="text-[12px] font-semibold leading-tight text-slate-700">
          RUDA Boundaries
        </h4>
      </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <RudaLayerRow
            label="RUDA Boundary"
            checked={getLayerVisible("rudaBoundary")}
            opacity={getLayerOpacity("rudaBoundary")}
            isOpen={rudaDropdownOpen}
            onToggle={toggleRudaBoundaryLayer}
            onOpacity={(value) => updateLayer("rudaBoundary", { opacity: value })}
            onDropdownToggle={() => setRudaDropdownOpen((s) => !s)}
          />

          {rudaDropdownOpen && (
            <div className="border-b border-slate-100 bg-slate-50 px-3 py-2">
              <div className="max-h-44 overflow-y-auto rounded-lg border border-slate-200 bg-white px-2 py-1.5 shadow-sm">
                {(rudaPhases || []).length === 0 ? (
                  <p className="px-1 py-1 text-[11px] font-medium text-slate-500">
                    No phases found
                  </p>
                ) : (
                  <>
                    {(() => {
                      const allIds = (rudaPhases || [])
                        .map((phase) => phase.gid ?? phase.id ?? phase.oid)
                        .filter((id) => id !== undefined && id !== null);
                      const selectedIdSet = new Set(
                        (selectedRudaPhaseIds || []).map((id) => String(id)),
                      );
                      const allChecked =
                        allIds.length > 0 &&
                        allIds.every((id) => selectedIdSet.has(String(id)));

                      return (
                        <div className="mb-1 flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={allChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRudaPhaseIds(allIds);
                                } else {
                                  setSelectedRudaPhaseIds([]);
                                }
                              }}
                              className="h-3.5 w-3.5 shrink-0 accent-green-700"
                            />
                            <span className="text-[12px] font-semibold leading-tight text-slate-700">
                              Select All
                            </span>
                          </label>

                          <button
                            type="button"
                            onClick={() => setSelectedRudaPhaseIds([])}
                            className="rounded px-1.5 py-0.5 text-[11px] font-semibold text-green-700 hover:bg-green-50"
                          >
                            Reset
                          </button>
                        </div>
                      );
                    })()}

                    {(rudaPhases || []).map((phase) => {
                      const id = phase.gid ?? phase.id ?? phase.oid;
                      const name = phase.name ?? phase.folderpath ?? `Phase ${id}`;
                      const selectedIdSet = new Set(
                        (selectedRudaPhaseIds || []).map((value) => String(value)),
                      );
                      const checked = selectedIdSet.has(String(id));

                      return (
                        <label
                          key={id}
                          className="flex items-center gap-2 border-b border-slate-50 py-1.5 last:border-b-0"
                        >
                          <input
                            type="checkbox"
                            checked={!!checked}
                            onChange={() => {
                              if (checked) {
                                setSelectedRudaPhaseIds((prev) =>
                                  (prev || []).filter((x) => String(x) !== String(id)),
                                );
                              } else {
                                setSelectedRudaPhaseIds((prev) => [
                                  ...(prev || []),
                                  id,
                                ]);
                              }
                            }}
                            className="h-3.5 w-3.5 shrink-0 accent-green-700"
                          />
                          <span
                            className="h-3.5 w-5 shrink-0 rounded-sm border border-slate-500"
                            style={{ backgroundColor: getRudaPhaseColor(id) }}
                          />
                          <span className="min-w-0 flex-1 truncate text-[12px] font-medium leading-tight text-slate-700">
                            {name}
                          </span>
                        </label>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          )}

          {/* <AdminLayerRow
            label="Proposed Roads"
            checked={getLayerVisible("proposedRoads")}
            opacity={getLayerOpacity("proposedRoads")}
            isLast
            onToggle={() => toggleLayer("proposedRoads")}
            onOpacity={(value) => updateLayer("proposedRoads", { opacity: value })}
          /> */}
      </div>
    </div>
  );
}

function RudaProposedRoadsLayers({
  rudaProposedRoads,
  selectedProposedRoadIds,
  setSelectedProposedRoadIds,
  proposedDropdownOpen,
  setProposedDropdownOpen,
  getLayerVisible,
  getLayerOpacity,
  toggleLayer,
  toggleProposedRoadLayer,
  updateLayer,
  getAllProposedRoadIds,
}) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2.5">
        <h4 className="text-[12px] font-semibold text-slate-700">
          RUDA Proposed Roads
        </h4>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <RudaLayerRow
          label="Proposed Roads"
          checked={getLayerVisible("proposedRoads")}
          opacity={getLayerOpacity("proposedRoads")}
          isOpen={proposedDropdownOpen}
          onToggle={toggleProposedRoadLayer}
          onOpacity={(value) =>
            updateLayer("proposedRoads", { opacity: value })
          }
          onDropdownToggle={() =>
            setProposedDropdownOpen((s) => !s)
          }
        />

        {proposedDropdownOpen && (
          <div className="border-b border-slate-100 bg-slate-50 px-3 py-2">
            <div className="max-h-44 overflow-y-auto rounded-lg border border-slate-200 bg-white px-2 py-1.5 shadow-sm">

              {(rudaProposedRoads || []).length === 0 ? (
                <p className="px-1 py-1 text-[11px] text-slate-500">
                  No proposed roads found
                </p>
              ) : (
                <>
                  {/* Select All */}
                  <div className="mb-1 flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={
                          (selectedProposedRoadIds || []).length ===
                          rudaProposedRoads.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProposedRoadIds(
                              getAllProposedRoadIds()
                            );
                          } else {
                            setSelectedProposedRoadIds([]);
                          }
                        }}
                        className="h-3.5 w-3.5 accent-green-700"
                      />
                      <span className="text-[12px] font-semibold">
                        Select All
                      </span>
                    </label>

                    <button
                      onClick={() => setSelectedProposedRoadIds([])}
                      className="text-[11px] text-green-700"
                    >
                      Reset
                    </button>
                  </div>

                  {/* List */}
                  {(rudaProposedRoads || []).map((road) => {
                    const id = road.gid ?? road.id ?? road.oid;
                    const name = road.name ?? `Road ${id}`;

                    const checked = (selectedProposedRoadIds || []).includes(id);

                    return (
                      <label
                        key={id}
                        className="flex items-center gap-2 py-1.5"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            if (checked) {
                              setSelectedProposedRoadIds((prev) =>
                                prev.filter((x) => x !== id)
                              );
                            } else {
                              setSelectedProposedRoadIds((prev) => [
                                ...prev,
                                id,
                              ]);
                            }
                          }}
                          className="h-3.5 w-3.5 accent-green-700"
                        />
                        <span className="truncate text-[12px]">
                          {name}
                        </span>
                      </label>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
function RudaLayerRow({
  label,
  checked,
  opacity,
  isOpen,
  onToggle,
  onOpacity,
  onDropdownToggle,
}) {
  return (
    <div className="border-b border-slate-100 bg-white px-2.5 py-2">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={!!checked}
          onChange={onToggle}
          className="h-4 w-4 shrink-0 accent-green-700"
        />

        <span className="min-w-0 flex-1 truncate text-[12px] font-medium leading-tight text-slate-700">
          {label}
        </span>

        <div className="flex shrink-0 items-center gap-1.5 text-slate-800">
          <button
            type="button"
            title="Show RUDA phases"
            aria-label="Show RUDA phases"
            onClick={onDropdownToggle}
            className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-slate-100"
          >
            <ChevronDown
              size={16}
              fill="currentColor"
              strokeWidth={2.6}
              className={`transition ${isOpen ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      <div className="mt-0.5 flex items-center gap-2 pl-6">
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          onChange={(e) => onOpacity(Number(e.target.value))}
          className="h-1.5 min-w-0 flex-1 accent-green-700"
        />
        <span className="w-9 shrink-0 text-right text-[11px] font-medium text-slate-600">
          {opacity}%
        </span>
      </div>
    </div>
  );
}

function SelectedAdministrativeLayers({
  items,
  getLayerVisible,
  getLayerOpacity,
  toggleLayer,
  updateLayer,
}) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2.5">
        <h4 className="text-[12px] font-semibold leading-tight text-slate-700">
          Selected Administrative Layers
        </h4>
      </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {items.map((item, index) => (
            <AdminLayerRow
              key={item.key}
              label={item.label}
              checked={getLayerVisible(item.key)}
              opacity={getLayerOpacity(item.key)}
              isLast={index === items.length - 1}
              onToggle={() => toggleLayer(item.key)}
              onOpacity={(value) => updateLayer(item.key, { opacity: value })}
            />
          ))}
      </div>
    </div>
  );
}

function AdminLayerRow({ label, checked, opacity, isLast, onToggle, onOpacity }) {
  return (
    <div
      className={`bg-white px-2.5 py-2 ${
        isLast ? "" : "border-b border-slate-100"
      }`}
    >
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={!!checked}
          onChange={onToggle}
          className="h-4 w-4 shrink-0 accent-green-700"
        />

        <span className="min-w-0 flex-1 truncate text-[12px] font-medium leading-tight text-slate-700">
          {label}
        </span>

        <div className="flex shrink-0 items-center gap-1.5 text-slate-800">
          <button
            type="button"
            title="Layer info"
            aria-label="Layer info"
            className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-slate-100"
          >
            <Info size={14} fill="currentColor" strokeWidth={2.2} />
          </button>
          <button
            type="button"
            title="Zoom/Search layer"
            aria-label="Zoom/Search layer"
            className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-slate-100"
          >
            <Search size={15} strokeWidth={2.6} />
          </button>
          <button
            type="button"
            title="Layer options"
            aria-label="Layer options"
            className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-slate-100"
          >
            <ChevronDown size={16} fill="currentColor" strokeWidth={2.6} />
          </button>
        </div>
      </div>

      <div className="mt-0.5 flex items-center gap-2 pl-6">
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          onChange={(e) => onOpacity(Number(e.target.value))}
          className="h-1.5 min-w-0 flex-1 accent-green-700"
        />
        <span className="w-9 shrink-0 text-right text-[11px] font-medium text-slate-600">
          {opacity}%
        </span>
      </div>
    </div>
  );
}

function PanelIcon({ title, icon, active, onClick }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`flex h-10 w-10 items-center justify-center rounded-lg border shadow-lg transition ${
        active
          ? "border-green-300 bg-[#0f3d2e] text-white"
          : "border-slate-300 bg-white text-[#0f3d2e] hover:border-green-700 hover:bg-green-50"
      }`}
    >
      {icon}
    </button>
  );
}

function Panel({ title, children }) {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-200 bg-[#0f3d2e] px-3 py-2.5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function SectionTitle({ title, open }) {
  return (
    <div className="mt-3 flex items-center justify-between px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-700">
      <span>{title}</span>
      <ChevronRight size={15} className={open ? "rotate-90" : ""} />
    </div>
  );
}

function LayerRow({
  icon,
  label,
  checked,
  opacity,
  onToggle,
  onOpacity,
  disabled = false,
  disabledText = "",
  rightAction = null,
  showOpacity = true,
}) {
  return (
    <div
      className={`rounded-md border border-slate-200 bg-white p-2 ${disabled ? "opacity-55" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium text-slate-800">
          <input
            type="checkbox"
            checked={!!checked}
            onChange={onToggle}
            disabled={disabled}
            className="h-4 w-4 accent-green-700"
          />
          <span className="text-green-700">{icon}</span>
          <span className="truncate">{label}</span>
        </label>
        <div className="flex shrink-0 items-center gap-2">
          {showOpacity && (
            <span className="text-xs font-semibold text-slate-600">
              {opacity}%
            </span>
          )}
          {rightAction}
        </div>
      </div>

      {showOpacity && (
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          disabled={disabled}
          onChange={(e) => onOpacity(Number(e.target.value))}
          className="mt-0.5 h-1.5 w-full accent-green-700"
        />
      )}
      {disabled && disabledText && (
        <p className="mt-1 text-[10px] text-slate-500">{disabledText}</p>
      )}
    </div>
  );
}

function ToolboxButton({ icon, label, active, onClick, description }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={description || label}
      aria-label={label}
      className={`flex flex-col items-center justify-center gap-1 rounded-md border p-2 transition ${
        active
          ? "border-green-700 bg-green-50 text-green-800 shadow-inner"
          : "border-slate-200 bg-white text-slate-800 hover:border-green-700 hover:bg-green-50"
      }`}
    >
      <span className={active ? "text-green-800" : "text-green-700"}>{icon}</span>
      <span className="text-center text-[10px] font-medium leading-tight">
        {label}
      </span>
    </button>
  );
}

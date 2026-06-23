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
  Image as ImageIcon,
} from "lucide-react";

const BASEMAPS = [
  {
    name: "Satellite",
    preview:
      "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/13/4640/3075",
  },
  {
    name: "Streets",
    preview:
      "https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/13/4640/3075",
  },
  {
    name: "Light",
    preview: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6",
  },
  {
    name: "Dark",
    preview: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21",
  },
  {
    name: "Outdoors",
    preview: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  },
];

const VECTOR_BOUNDARY_LAYERS = [
  { key: "khasraLayer", label: "Khasra Boundary" },
  { key: "squareLayer", label: "Square Boundary" },
  { key: "acreLayer", label: "Acre Boundary" },
  { key: "triJunctionPoints", label: "Tri Junction Points" },
  { key: "fieldPoints", label: "Field Points" },
  { key: "murabbaLayer", label: "Mussavi" },
];

const RASTER_DATA_LAYERS = [{ key: "handuGujranOrtho", label: "Massavi" }];

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
  const [rudaSectionOpen, setRudaSectionOpen] = useState(true);
  const [rudaDropdownOpen, setRudaDropdownOpen] = useState(false);
  const hasMauza = !!selectedMauza;
  const initializedOpacityKeysRef = useRef(new Set());

  const [rudaProposedRoads, setRudaProposedRoads] = useState([]);
  const [proposedDropdownOpen, setProposedDropdownOpen] = useState(false);

  const [layerAvailability, setLayerAvailability] = useState({
    khasra: false,
    square: false,
    acre: false,
    murabba: false,
  });

  const getDefaultOpacityForSelectedLayer = (item) => {
    const text = `${item?.key || ""} ${item?.label || ""}`.toLowerCase();

    if (
      text.includes("district") ||
      text.includes("tehsil") ||
      text.includes("mauza")
    ) {
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
        rudaBoundary: 70,
        proposedRoads: 100,
        geodeticNetwork: 100,
      };

      Object.entries(rudaLayerDefaults).forEach(([key, opacity]) => {
        if (initializedOpacityKeysRef.current.has(key)) return;

        const current = next[key];
        next[key] = {
          ...(typeof current === "object" ? current : { visible: !!current }),
          opacity,
        };
        initializedOpacityKeysRef.current.add(key);
        changed = true;
      });

      selectedLayerItems.forEach((item) => {
        if (!item?.key || initializedOpacityKeysRef.current.has(item.key))
          return;

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

  const toggleVectorBoundaryLayer = (layerKey) => {
    const forceLoadKeys = new Set(["khasraLayer", "murabbaLayer"]);
    const nextVisible = !getLayerVisible(layerKey);

    updateLayer(layerKey, {
      visible: nextVisible,
      ...(forceLoadKeys.has(layerKey) ? { forceLoad: nextVisible } : {}),
    });
  };

  const getRudaPhaseId = (phase) => phase?.gid ?? phase?.id ?? phase?.oid;

  const getAllRudaPhaseIds = () =>
    (rudaPhases || [])
      .map((phase) => getRudaPhaseId(phase))
      .filter((id) => id !== undefined && id !== null);

  const toggleRudaBoundaryLayer = () => {
    const willOpen = !getLayerVisible("rudaBoundary");

    if (
      willOpen &&
      (!selectedRudaPhaseIds || selectedRudaPhaseIds.length === 0)
    ) {
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

        const ids = (list || []).map((r) => r.gid ?? r.id ?? r.oid);

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
    <div className="pointer-events-none absolute left-3 top-20 z-30 flex items-start gap-2">
      {/* Separate icon buttons. No combined background wrapper. */}
      <div className="pointer-events-auto flex flex-col gap-1">
        <PanelIcon
          title="Layer Manager"
          active={activePanel === "layers"}
          onClick={() =>
            setActivePanel(activePanel === "layers" ? "" : "layers")
          }
          icon={<Layers size={18} />}
        />
        <PanelIcon
          title="Vector Boundaries"
          active={activePanel === "vectorBoundaries"}
          onClick={() =>
            setActivePanel(
              activePanel === "vectorBoundaries" ? "" : "vectorBoundaries",
            )
          }
          icon={<Map size={18} />}
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
          title="Raster Data"
          active={activePanel === "rasterData"}
          onClick={() =>
            setActivePanel(activePanel === "rasterData" ? "" : "rasterData")
          }
          icon={<ImageIcon size={18} />}
        />
        <PanelIcon
          title="Basemap"
          active={activePanel === "basemap"}
          onClick={() =>
            setActivePanel(activePanel === "basemap" ? "" : "basemap")
          }
          icon={<Satellite size={18} />}
        />
      </div>

      {activePanel && (
        <div className="pointer-events-auto w-[320px] max-h-[calc(100vh-160px)] overflow-hidden rounded-md border border-[#3a4354] bg-[#202736] text-white shadow-2xl">
          {activePanel === "layers" && (
            <Panel title="Layer Manager">
              <div className="max-h-[calc(100vh-205px)] overflow-y-auto px-3 pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <RudaBoundaryLayers
                  rudaPhases={rudaPhases}
                  rudaSectionOpen={rudaSectionOpen}
                  setRudaSectionOpen={setRudaSectionOpen}
                  selectedRudaPhaseIds={selectedRudaPhaseIds}
                  setSelectedRudaPhaseIds={setSelectedRudaPhaseIds}
                  rudaDropdownOpen={rudaDropdownOpen}
                  setRudaDropdownOpen={setRudaDropdownOpen}
                  rudaProposedRoads={rudaProposedRoads}
                  selectedProposedRoadIds={selectedProposedRoadIds}
                  setSelectedProposedRoadIds={setSelectedProposedRoadIds}
                  proposedDropdownOpen={proposedDropdownOpen}
                  setProposedDropdownOpen={setProposedDropdownOpen}
                  getLayerVisible={getLayerVisible}
                  getLayerOpacity={getLayerOpacity}
                  toggleLayer={toggleLayer}
                  toggleRudaBoundaryLayer={toggleRudaBoundaryLayer}
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
              </div>
            </Panel>
          )}

          {activePanel === "vectorBoundaries" && (
            <Panel title="Vector Boundaries">
              <div className="max-h-[calc(100vh-225px)] overflow-y-auto px-3 pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <VectorBoundaryLayers
                  items={VECTOR_BOUNDARY_LAYERS}
                  getLayerVisible={getLayerVisible}
                  getLayerOpacity={getLayerOpacity}
                  toggleLayer={toggleVectorBoundaryLayer}
                  updateLayer={updateLayer}
                />
              </div>
            </Panel>
          )}

          {activePanel === "toolbox" && (
            <Panel title="Toolbox">
              <div className="px-3 pb-1 pt-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">
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
                <div className="mx-3 mb-3 rounded-md border border-[#3a4354] bg-[#1d2533] px-3 py-2 text-[11px] leading-snug text-white/75">
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
            <Panel title="Basemap">
              <div className="grid grid-cols-2 gap-2 p-3">
                {BASEMAPS.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setBasemap(item.name)}
                    className={`overflow-hidden rounded-lg border text-left transition ${
                      basemap === item.name
                        ? "border-[#8bd66f] bg-[#243041]"
                        : "border-[#344055] bg-[#1d2533] hover:bg-[#293445]"
                    }`}
                  >
                    <div className="relative h-16 w-full overflow-hidden">
                      <img
                        src={item.preview}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-between px-2 py-2 text-xs font-semibold text-white">
                      <span className="flex items-center gap-1.5">
                        <Map size={14} />
                        {item.name}
                      </span>
                      {basemap === item.name && (
                        <span className="text-[#8bd66f]">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </Panel>
          )}

          {activePanel === "rasterData" && (
            <Panel title="Raster Data">
              <div className="max-h-[calc(100vh-225px)] overflow-y-auto px-3 pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <RasterDataLayers
                  items={RASTER_DATA_LAYERS}
                  getLayerVisible={getLayerVisible}
                  getLayerOpacity={getLayerOpacity}
                  toggleLayer={toggleLayer}
                  updateLayer={updateLayer}
                />
              </div>
            </Panel>
          )}
          </div>
      )}
    </div>
  );
}

function RasterDataLayers({
  items,
  getLayerVisible,
  getLayerOpacity,
  toggleLayer,
  updateLayer,
}) {
  return (
    <div className="mt-3 overflow-hidden rounded-md border border-[#3a4354] bg-[#1d2533] shadow-md">
      <div className="flex items-center gap-2 border-b border-[#343c4c] bg-[#202736] px-3 py-2.5">
        <h4 className="text-[12px] font-semibold leading-tight text-white">
          Raster Layers
        </h4>
      </div>

      <div className="overflow-hidden rounded-md border border-[#343c4c] bg-[#202736] shadow-sm">
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

function RudaBoundaryLayers({
  rudaPhases,
  rudaSectionOpen,
  setRudaSectionOpen,
  selectedRudaPhaseIds,
  setSelectedRudaPhaseIds,
  rudaDropdownOpen,
  setRudaDropdownOpen,
  rudaProposedRoads,
  selectedProposedRoadIds,
  setSelectedProposedRoadIds,
  proposedDropdownOpen,
  setProposedDropdownOpen,
  getLayerVisible,
  getLayerOpacity,
  toggleLayer,
  toggleRudaBoundaryLayer,
  toggleProposedRoadLayer,
  updateLayer,
  getAllProposedRoadIds,
}) {
  return (
    <div className="mt-3 overflow-hidden rounded-md border border-[#3a4354] bg-[#1d2533] shadow-md">
      <button
        type="button"
        onClick={() => setRudaSectionOpen((open) => !open)}
        className="flex w-full items-center justify-between border-b border-[#343c4c] bg-[#202736] px-3 py-2.5 text-left transition hover:bg-[#293445]"
      >
        <h4 className="text-[12px] font-semibold leading-tight text-white">
          RUDA Boundaries
        </h4>
        <ChevronDown
          size={16}
          strokeWidth={2.6}
          className={`text-white/70 transition ${rudaSectionOpen ? "rotate-180" : ""}`}
        />
      </button>

      {rudaSectionOpen && (
        <div className="overflow-hidden rounded-md border border-[#343c4c] bg-[#202736] shadow-sm">
        <RudaLayerRow
          label="RUDA Boundary"
          checked={getLayerVisible("rudaBoundary")}
          opacity={getLayerOpacity("rudaBoundary")}
          isOpen={rudaDropdownOpen}
          onToggle={toggleRudaBoundaryLayer}
          onOpacity={(value) => updateLayer("rudaBoundary", { opacity: value })}
          onDropdownToggle={() => setRudaDropdownOpen((s) => !s)}
          dropdownTitle="Show RUDA phases"
        />

        {rudaDropdownOpen && (
          <div className="border-b border-[#343c4c] bg-[#1d2533] px-3 py-2">
            <div className="max-h-44 overflow-y-auto rounded-md border border-[#343c4c] bg-[#202736] px-2 py-1.5 shadow-sm [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {(rudaPhases || []).length === 0 ? (
                <p className="px-1 py-1 text-[11px] font-medium text-white/50">
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
                      <div className="mb-1 flex items-center justify-between border-b border-[#343c4c] pb-1.5">
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
                            className="h-3.5 w-3.5 shrink-0 accent-[#8bd66f]"
                          />
                          <span className="text-[12px] font-semibold leading-tight text-white">
                            Select All
                          </span>
                        </label>

                        <button
                          type="button"
                          onClick={() => setSelectedRudaPhaseIds([])}
                          className="rounded px-1.5 py-0.5 text-[11px] font-semibold text-[#8bd66f] hover:bg-[#293445]"
                        >
                          Reset
                        </button>
                      </div>
                    );
                  })()}

                  {(rudaPhases || []).map((phase) => {
                    const id = phase.gid ?? phase.id ?? phase.oid;
                    const name =
                      phase.name ?? phase.folderpath ?? `Phase ${id}`;
                    const selectedIdSet = new Set(
                      (selectedRudaPhaseIds || []).map((value) =>
                        String(value),
                      ),
                    );
                    const checked = selectedIdSet.has(String(id));

                    return (
                      <label
                        key={id}
                        className="flex items-center gap-2 border-b border-[#343c4c]/70 py-1.5 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={!!checked}
                          onChange={() => {
                            if (checked) {
                              setSelectedRudaPhaseIds((prev) =>
                                (prev || []).filter(
                                  (x) => String(x) !== String(id),
                                ),
                              );
                            } else {
                              setSelectedRudaPhaseIds((prev) => [
                                ...(prev || []),
                                id,
                              ]);
                            }
                          }}
                          className="h-3.5 w-3.5 shrink-0 accent-[#8bd66f]"
                        />
                        <span
                          className="h-3.5 w-5 shrink-0 rounded-sm border border-white/50"
                          style={{ backgroundColor: getRudaPhaseColor(id) }}
                        />
                        <span className="min-w-0 flex-1 truncate text-[12px] font-medium leading-tight text-white/85">
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

        <RudaLayerRow
          label="Proposed Roads"
          checked={getLayerVisible("proposedRoads")}
          opacity={getLayerOpacity("proposedRoads")}
          isOpen={proposedDropdownOpen}
          onToggle={toggleProposedRoadLayer}
          onOpacity={(value) =>
            updateLayer("proposedRoads", { opacity: value })
          }
          onDropdownToggle={() => setProposedDropdownOpen((s) => !s)}
          dropdownTitle="Show proposed roads"
        />

        {proposedDropdownOpen && (
          <div className="border-b border-[#343c4c] bg-[#1d2533] px-3 py-2">
            <div className="max-h-44 overflow-y-auto rounded-md border border-[#343c4c] bg-[#202736] px-2 py-1.5 shadow-sm [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {(rudaProposedRoads || []).length === 0 ? (
                <p className="px-1 py-1 text-[11px] text-white/50">
                  No proposed roads found
                </p>
              ) : (
                <>
                  <div className="mb-1 flex items-center justify-between border-b border-[#343c4c] pb-1.5">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={
                          (selectedProposedRoadIds || []).length ===
                          rudaProposedRoads.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProposedRoadIds(getAllProposedRoadIds());
                          } else {
                            setSelectedProposedRoadIds([]);
                          }
                        }}
                        className="h-3.5 w-3.5 accent-[#8bd66f]"
                      />
                      <span className="text-[12px] font-semibold leading-tight text-white">
                        Select All
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setSelectedProposedRoadIds([])}
                      className="rounded px-1.5 py-0.5 text-[11px] font-semibold text-[#8bd66f] hover:bg-[#293445]"
                    >
                      Reset
                    </button>
                  </div>

                  {(rudaProposedRoads || []).map((road) => {
                    const id = road.gid ?? road.id ?? road.oid;
                    const name = road.name ?? `Road ${id}`;
                    const checked = (selectedProposedRoadIds || []).includes(
                      id,
                    );

                    return (
                      <label
                        key={id}
                        className="flex items-center gap-2 border-b border-[#343c4c]/70 py-1.5 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            if (checked) {
                              setSelectedProposedRoadIds((prev) =>
                                (prev || []).filter((x) => x !== id),
                              );
                            } else {
                              setSelectedProposedRoadIds((prev) => [
                                ...(prev || []),
                                id,
                              ]);
                            }
                          }}
                          className="h-3.5 w-3.5 accent-[#8bd66f]"
                        />
                        <span className="truncate text-[12px] font-medium leading-tight text-white/85">
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

        <RudaLayerRow
          label="Geodetic Network"
          checked={getLayerVisible("geodeticNetwork")}
          opacity={getLayerOpacity("geodeticNetwork")}
          onToggle={() => toggleLayer("geodeticNetwork")}
          onOpacity={(value) =>
            updateLayer("geodeticNetwork", { opacity: value })
          }
        />
      </div>
      )}
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
  dropdownTitle = "Layer options",
}) {
  return (
    <div className="border-b border-[#343c4c] bg-[#202736] px-2.5 py-2">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={!!checked}
          onChange={onToggle}
          className="h-4 w-4 shrink-0 accent-[#8bd66f]"
        />

        <span className="min-w-0 flex-1 truncate text-[12px] font-medium leading-tight text-white/85">
          {label}
        </span>

        {onDropdownToggle && (
          <div className="flex shrink-0 items-center gap-1.5 text-white/75">
            <button
              type="button"
              title={dropdownTitle}
              aria-label={dropdownTitle}
              onClick={onDropdownToggle}
              className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-[#293445]"
            >
              <ChevronDown
                size={16}
                fill="currentColor"
                strokeWidth={2.6}
                className={`transition ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        )}
      </div>

      <div className="mt-1 flex items-center gap-2 pl-6">
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          onChange={(e) => onOpacity(Number(e.target.value))}
          className="h-1.5 min-w-0 flex-1 accent-[#8bd66f]"
        />
        <span className="w-9 shrink-0 text-right text-[11px] font-medium text-white/60">
          {opacity}%
        </span>
      </div>
    </div>
  );
}

function VectorBoundaryLayers({
  items,
  getLayerVisible,
  getLayerOpacity,
  toggleLayer,
  updateLayer,
}) {
  return (
    <div className="mt-3 overflow-hidden rounded-md border border-[#3a4354] bg-[#1d2533] shadow-md">
      <div className="flex items-center gap-2 border-b border-[#343c4c] bg-[#202736] px-3 py-2.5">
        <h4 className="text-[12px] font-semibold leading-tight text-white">
          Vector Boundaries
        </h4>
      </div>

      <div className="overflow-hidden rounded-md border border-[#343c4c] bg-[#202736] shadow-sm">
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

function SelectedAdministrativeLayers({
  items,
  getLayerVisible,
  getLayerOpacity,
  toggleLayer,
  updateLayer,
}) {
  return (
    <div className="mt-3 overflow-hidden rounded-md border border-[#3a4354] bg-[#1d2533] shadow-md">
      <div className="flex items-center gap-2 border-b border-[#343c4c] bg-[#202736] px-3 py-2.5">
        <h4 className="text-[12px] font-semibold leading-tight text-white">
          Selected Administrative Layers
        </h4>
      </div>

      <div className="overflow-hidden rounded-md border border-[#343c4c] bg-[#202736] shadow-sm">
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

function AdminLayerRow({
  label,
  checked,
  opacity,
  isLast,
  onToggle,
  onOpacity,
}) {
  return (
    <div
      className={`bg-[#202736] px-2.5 py-2 ${
        isLast ? "" : "border-b border-[#343c4c]"
      }`}
    >
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={!!checked}
          onChange={onToggle}
          className="h-4 w-4 shrink-0 accent-[#8bd66f]"
        />

        <span className="min-w-0 flex-1 truncate text-[12px] font-medium leading-tight text-white/85">
          {label}
        </span>

        <div className="flex shrink-0 items-center gap-1.5 text-white/75">
          <button
            type="button"
            title="Layer info"
            aria-label="Layer info"
            className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-[#293445]"
          >
            <Info size={14} fill="currentColor" strokeWidth={2.2} />
          </button>
          <button
            type="button"
            title="Zoom/Search layer"
            aria-label="Zoom/Search layer"
            className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-[#293445]"
          >
            <Search size={15} strokeWidth={2.6} />
          </button>
          <button
            type="button"
            title="Layer options"
            aria-label="Layer options"
            className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-[#293445]"
          >
            <ChevronDown size={16} fill="currentColor" strokeWidth={2.6} />
          </button>
        </div>
      </div>

      <div className="mt-1 flex items-center gap-2 pl-6">
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          onChange={(e) => onOpacity(Number(e.target.value))}
          className="h-1.5 min-w-0 flex-1 accent-[#8bd66f]"
        />
        <span className="w-9 shrink-0 text-right text-[11px] font-medium text-white/60">
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
      className={`flex h-9 w-9 items-center justify-center rounded-md border shadow-md transition ${
        active
          ? "border-[#8bd66f] bg-[#243041] text-white"
          : "border-[#344055] bg-[#1d2533] text-white hover:bg-[#293445]"
      }`}
    >
      {icon}
    </button>
  );
}

function Panel({ title, children }) {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-[#343c4c] bg-[#202736] px-3 py-2.5">
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
    <div className="mt-3 flex items-center justify-between px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-white/70">
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
      className={`rounded-md border border-[#343c4c] bg-[#202736] p-2 ${disabled ? "opacity-55" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium text-white/85">
          <input
            type="checkbox"
            checked={!!checked}
            onChange={onToggle}
            disabled={disabled}
            className="h-4 w-4 accent-[#8bd66f]"
          />
          <span className="text-[#8bd66f]">{icon}</span>
          <span className="truncate">{label}</span>
        </label>
        <div className="flex shrink-0 items-center gap-2">
          {showOpacity && (
            <span className="text-xs font-semibold text-white/60">
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
          className="mt-0.5 h-1.5 w-full accent-[#8bd66f]"
        />
      )}
      {disabled && disabledText && (
        <p className="mt-1 text-[10px] text-white/50">{disabledText}</p>
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
          ? "border-[#8bd66f] bg-[#243041] text-white shadow-inner"
          : "border-[#344055] bg-[#1d2533] text-white/85 hover:bg-[#293445]"
      }`}
    >
      <span className={active ? "text-[#8bd66f]" : "text-white/80"}>
        {icon}
      </span>
      <span className="text-center text-[10px] font-medium leading-tight">
        {label}
      </span>
    </button>
  );
}

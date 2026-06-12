import { useEffect, useMemo, useState } from "react";
import {
  Layers,
  Wrench,
  MapPin,
  Lock,
  Package,
  Satellite,
  Ruler,
  User,
  ChevronRight,
  Map,
  Grid3X3,
  Eye,
  MapPinned,
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

export default function LeftPanel({
  layers,
  setLayers,
  rudaPhases,
  setRudaPhases,
  selectedRudaPhaseIds,
  setSelectedRudaPhaseIds,
  basemap,
  setBasemap,
  selectedMauza,
  selectedFilterLayers = [],
}) {
  const [activePanel, setActivePanel] = useState("layers");
  const [rudaDropdownOpen, setRudaDropdownOpen] = useState(false);
  const hasMauza = !!selectedMauza;

  const selectedLayerItems = useMemo(
    () => selectedFilterLayers.filter((item) => item?.label && item?.key),
    [selectedFilterLayers],
  );

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

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (rudaPhases?.length) return;

      try {
        const { getRudaList } = await import("../../services/api");
        const list = await getRudaList();
        if (!mounted) return;
        setRudaPhases(list || []);
        const ids = (list || []).map((p) => p.gid ?? p.id ?? p.oid);
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
                <SectionTitle title="RUDA Boundary" open />
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <LayerRow
                    icon={<MapPinned size={15} />}
                    label="RUDA Boundary"
                    checked={getLayerVisible("rudaBoundary")}
                    opacity={getLayerOpacity("rudaBoundary")}
                    onToggle={() => toggleLayer("rudaBoundary")}
                    onOpacity={(value) =>
                      updateLayer("rudaBoundary", { opacity: value })
                    }
                    rightAction={
                      <button
                        type="button"
                        title="Show RUDA phases"
                        aria-label="Show RUDA phases"
                        onClick={() => setRudaDropdownOpen((s) => !s)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-100"
                      >
                        <ChevronRight
                          size={15}
                          className={`transition ${rudaDropdownOpen ? "rotate-90" : ""}`}
                        />
                      </button>
                    }
                  />

                  {rudaDropdownOpen && (
                    <div className="mt-2 max-h-44 overflow-y-auto rounded-md border border-slate-200 bg-white p-2 shadow-sm">
                      <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={
                            Array.isArray(rudaPhases) &&
                            rudaPhases.length > 0 &&
                            selectedRudaPhaseIds?.length === rudaPhases.length
                          }
                          onChange={(e) => {
                            if (e.target.checked)
                              setSelectedRudaPhaseIds(
                                rudaPhases.map((p) => p.gid ?? p.id ?? p.oid),
                              );
                            else setSelectedRudaPhaseIds([]);
                          }}
                          className="accent-green-700"
                        />
                        Select All Phases
                      </label>

                      {(rudaPhases || []).map((phase) => {
                        const id = phase.gid ?? phase.id ?? phase.oid;
                        const name =
                          phase.name ?? phase.folderpath ?? `Phase ${id}`;
                        const checked = selectedRudaPhaseIds?.includes(id);
                        return (
                          <label
                            key={id}
                            className="flex items-center gap-2 py-1 text-xs text-slate-700"
                          >
                            <input
                              type="checkbox"
                              checked={!!checked}
                              onChange={() => {
                                if (checked)
                                  setSelectedRudaPhaseIds((prev) =>
                                    (prev || []).filter((x) => x !== id),
                                  );
                                else
                                  setSelectedRudaPhaseIds((prev) => [
                                    ...(prev || []),
                                    id,
                                  ]);
                              }}
                              className="accent-green-700"
                            />
                            <span className="truncate">{name}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {selectedLayerItems.length > 0 && (
                  <>
                    <SectionTitle title="Selected Administrative Layers" open />
                    <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                      {selectedLayerItems.map((item) => (
                        <LayerRow
                          key={item.key}
                          icon={<Eye size={15} />}
                          label={item.label}
                          checked={getLayerVisible(item.key)}
                          opacity={getLayerOpacity(item.key)}
                          onToggle={() => toggleLayer(item.key)}
                          onOpacity={(value) =>
                            updateLayer(item.key, { opacity: value })
                          }
                        />
                      ))}
                    </div>
                  </>
                )}

                <SectionTitle title="Mauza Based Layers" open />
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
                </div>
              </div>
            </Panel>
          )}

          {activePanel === "toolbox" && (
            <Panel title="Toolbox">
              <div className="grid grid-cols-3 gap-2 p-3">
                <ToolboxButton icon={<MapPin size={18} />} label="Connect" />
                <ToolboxButton icon={<Lock size={18} />} label="Parcel" />
                <ToolboxButton icon={<Package size={18} />} label="Mauza" />
                <ToolboxButton icon={<Ruler size={18} />} label="Demarcate" />
                <ToolboxButton icon={<User size={18} />} label="Default" />
                <ToolboxButton icon={<Grid3X3 size={18} />} label="Grid" />
              </div>
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
          className="mt-2 h-1.5 w-full accent-green-700"
        />
      )}
      {disabled && disabledText && (
        <p className="mt-1 text-[10px] text-slate-500">{disabledText}</p>
      )}
    </div>
  );
}

function ToolboxButton({ icon, label }) {
  return (
    <button className="flex flex-col items-center justify-center gap-1 rounded-md border border-slate-200 bg-white p-2 text-slate-800 transition hover:border-green-700 hover:bg-green-50">
      <span className="text-green-700">{icon}</span>
      <span className="text-center text-[10px] font-medium leading-tight">
        {label}
      </span>
    </button>
  );
}

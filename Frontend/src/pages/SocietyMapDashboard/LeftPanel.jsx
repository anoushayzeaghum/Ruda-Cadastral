import { useMemo, useRef, useEffect, useState } from "react";
import {
  Layers,
  Wrench,
  Satellite,
  Ruler,
  User,
  Map,
  Grid3X3,
  Info,
  Search,
  ChevronDown,
  Building2,
  MapPinned,
  Mountain,
  Activity,
  Image,
  Globe2,
  Plane,
} from "lucide-react";

const BASEMAPS = [
  { name: "Satellite", preview: "bg-[linear-gradient(135deg,#314b33,#8b7c52,#2c4a59)]" },
  { name: "Streets", preview: "bg-[linear-gradient(135deg,#f0eadb,#d8d1bb,#b6c4b5)]" },
  { name: "Light", preview: "bg-[linear-gradient(135deg,#f8fafc,#e2e8f0,#cbd5e1)]" },
  { name: "Dark", preview: "bg-[linear-gradient(135deg,#0f172a,#334155,#111827)]" },
  { name: "Outdoors", preview: "bg-[linear-gradient(135deg,#6f9f55,#d5c17b,#7ba98f)]" },
];

const SOCIETY_VECTOR_LAYERS = [
  { key: "societyBoundary", label: "Society Boundary", icon: <Building2 size={15} /> },
  { key: "masterPlan", label: "Master Plan", icon: <MapPinned size={15} /> },
  { key: "spotLevel", label: "Spot Level", icon: <Activity size={15} /> },
  { key: "contours", label: "Contours", icon: <Mountain size={15} /> },
];

const SOCIETY_RASTER_LAYERS = [
  { key: "dem", label: "DEM", icon: <Mountain size={15} /> },
  { key: "dtm", label: "DTM", icon: <Activity size={15} /> },
  { key: "orthoImage", label: "Ortho Image", icon: <Image size={15} /> },
  { key: "satelliteView", label: "Satellite View", icon: <Globe2 size={15} /> },
  { key: "droneImagery", label: "Drone Imagery", icon: <Plane size={15} /> },
];

export default function LeftPanel({
  layers,
  setLayers,
  basemap,
  setBasemap,
  selectedSociety,
  selectedFilterLayers = [],
}) {
  const [activePanel, setActivePanel] = useState("layers");
  const hasSociety = !!selectedSociety;
  const initializedOpacityKeysRef = useRef(new Set());

  const selectedLayerItems = useMemo(
    () => selectedFilterLayers.filter((item) => item?.label && item?.key),
    [selectedFilterLayers],
  );

  useEffect(() => {
    setLayers((prev) => {
      let changed = false;
      const next = { ...prev };

      const defaults = {
        districtBoundary: 0,
        tehsilBoundary: 0,
        mauzaBoundary: 0,
        societyBoundary: 25,
        masterPlan: 70,
        spotLevel: 100,
        contours: 100,
        dem: 100,
        dtm: 100,
        orthoImage: 100,
        satelliteView: 100,
        droneImagery: 100,
      };

      Object.entries(defaults).forEach(([key, opacity]) => {
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
        if (!item?.key || initializedOpacityKeysRef.current.has(item.key)) return;
        const current = next[item.key];
        next[item.key] = {
          ...(typeof current === "object"
            ? current
            : { visible: current === undefined ? true : !!current }),
          opacity: item.key.includes("Boundary") ? 0 : 100,
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

  return (
    <div className="pointer-events-none absolute left-3 top-24 z-30 flex items-start gap-2">
      <div className="pointer-events-auto flex flex-col gap-2">
        <PanelIcon
          title="Layer Manager"
          active={activePanel === "layers"}
          onClick={() => setActivePanel(activePanel === "layers" ? "" : "layers")}
          icon={<Layers size={18} />}
        />
        <PanelIcon
          title="Society Layers"
          active={activePanel === "societyLayers"}
          onClick={() =>
            setActivePanel(activePanel === "societyLayers" ? "" : "societyLayers")
          }
          icon={<Building2 size={18} />}
        />
        <PanelIcon
          title="Toolbox"
          active={activePanel === "toolbox"}
          onClick={() => setActivePanel(activePanel === "toolbox" ? "" : "toolbox")}
          icon={<Wrench size={18} />}
        />
        <PanelIcon
          title="Map Background"
          active={activePanel === "basemap"}
          onClick={() => setActivePanel(activePanel === "basemap" ? "" : "basemap")}
          icon={<Satellite size={18} />}
        />
      </div>

      {activePanel && (
        <div className="pointer-events-auto w-[340px] max-h-[calc(100vh-170px)] overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-800 shadow-2xl">
          {activePanel === "layers" && (
            <Panel title="Layer Manager">
              <div className="max-h-[calc(100vh-225px)] overflow-y-auto px-3 pb-3">
                {selectedLayerItems.length > 0 && (
                  <SelectedAdministrativeLayers
                    items={selectedLayerItems}
                    getLayerVisible={getLayerVisible}
                    getLayerOpacity={getLayerOpacity}
                    toggleLayer={toggleLayer}
                    updateLayer={updateLayer}
                  />
                )}
              </div>
            </Panel>
          )}

          {activePanel === "societyLayers" && (
            <Panel title="Society Layers">
              <div className="max-h-[calc(100vh-225px)] overflow-y-auto p-3">
                <div className="grid grid-cols-2 gap-3">
                  <LayerColumn title="Vector Boundaries">
                    {SOCIETY_VECTOR_LAYERS.map((item, index) => (
                      <SocietyLayerRow
                        key={item.key}
                        icon={item.icon}
                        label={item.label}
                        checked={getLayerVisible(item.key)}
                        opacity={getLayerOpacity(item.key)}
                        disabled={!hasSociety}
                        disabledText="Select society first"
                        isLast={index === SOCIETY_VECTOR_LAYERS.length - 1}
                        onToggle={() => toggleLayer(item.key)}
                        onOpacity={(value) => updateLayer(item.key, { opacity: value })}
                      />
                    ))}
                  </LayerColumn>

                  <LayerColumn title="Raster Datasets">
                    {SOCIETY_RASTER_LAYERS.map((item, index) => (
                      <SocietyLayerRow
                        key={item.key}
                        icon={item.icon}
                        label={item.label}
                        checked={getLayerVisible(item.key)}
                        opacity={getLayerOpacity(item.key)}
                        disabled={!hasSociety}
                        disabledText="Select society first"
                        isLast={index === SOCIETY_RASTER_LAYERS.length - 1}
                        onToggle={() => toggleLayer(item.key)}
                        onOpacity={(value) => updateLayer(item.key, { opacity: value })}
                      />
                    ))}
                  </LayerColumn>
                </div>
              </div>
            </Panel>
          )}

          {activePanel === "toolbox" && (
            <Panel title="Toolbox">
              <div className="grid grid-cols-3 gap-2 p-3">
                <ToolboxButton icon={<Map size={18} />} label="Connect" />
                <ToolboxButton icon={<Building2 size={18} />} label="Society" />
                <ToolboxButton icon={<Ruler size={18} />} label="Measure" />
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

      <div className="overflow-hidden bg-white">
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

function LayerColumn({ title, children }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
      <div className="border-b border-slate-200 bg-white px-3 py-2">
        <h4 className="text-[12px] font-bold uppercase tracking-wide text-[#0f3d2e]">
          {title}
        </h4>
      </div>
      <div className="bg-white">{children}</div>
    </div>
  );
}

function SocietyLayerRow({
  icon,
  label,
  checked,
  opacity,
  disabled,
  disabledText,
  isLast,
  onToggle,
  onOpacity,
}) {
  return (
    <div className={`bg-white px-2.5 py-2 ${isLast ? "" : "border-b border-slate-100"} ${disabled ? "opacity-55" : ""}`}>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={!!checked}
          onChange={onToggle}
          disabled={disabled}
          className="h-4 w-4 shrink-0 accent-green-700"
        />
        <span className="shrink-0 text-green-700">{icon}</span>
        <span className="min-w-0 flex-1 truncate text-[12px] font-medium leading-tight text-slate-700">
          {label}
        </span>
      </label>

      <div className="mt-1 flex items-center gap-2 pl-6">
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          disabled={disabled}
          onChange={(e) => onOpacity(Number(e.target.value))}
          className="h-1.5 min-w-0 flex-1 accent-green-700"
        />
        <span className="w-8 shrink-0 text-right text-[10px] font-medium text-slate-600">
          {opacity}%
        </span>
      </div>

      {disabled && disabledText && (
        <p className="mt-1 pl-6 text-[10px] text-slate-500">{disabledText}</p>
      )}
    </div>
  );
}

function AdminLayerRow({ label, checked, opacity, isLast, onToggle, onOpacity }) {
  return (
    <div className={`bg-white px-2.5 py-2 ${isLast ? "" : "border-b border-slate-100"}`}>
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
          <button type="button" title="Layer info" className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-slate-100">
            <Info size={14} fill="currentColor" strokeWidth={2.2} />
          </button>
          <button type="button" title="Zoom/Search layer" className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-slate-100">
            <Search size={15} strokeWidth={2.6} />
          </button>
          <button type="button" title="Layer options" className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-slate-100">
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

function ToolboxButton({ icon, label }) {
  return (
    <button className="flex flex-col items-center justify-center gap-1 rounded-md border border-slate-200 bg-white p-2 text-slate-800 transition hover:border-green-700 hover:bg-green-50">
      <span className="text-green-700">{icon}</span>
      <span className="text-center text-[10px] font-medium leading-tight">{label}</span>
    </button>
  );
}

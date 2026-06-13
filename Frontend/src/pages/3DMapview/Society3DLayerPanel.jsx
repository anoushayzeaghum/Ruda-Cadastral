import {
  Building2,
  ChevronDown,
  Layers,
  Map,
  Mountain,
  Route,
  Trees,
  Waypoints,
} from "lucide-react";

const VECTOR_LAYERS = [
  { key: "societyBoundary", label: "Society Boundary", icon: Building2 },
  { key: "masterPlan", label: "Master Plan", icon: Map },
  { key: "buildings3d", label: "3D Buildings", icon: Building2 },
  { key: "spotLevel", label: "Spot Level", icon: Waypoints },
  // { key: "contours", label: "Contours", icon: Mountain },
];

export default function Society3DLayerPanel({
  layers,
  setLayers,
  basemap,
  setBasemap,
  selectedSociety,
}) {
  const updateLayer = (key, patch) => {
    setLayers((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || { visible: false, opacity: 100 }),
        ...patch,
      },
    }));
  };

  const getLayerVisible = (key) => layers?.[key]?.visible === true;
  const getLayerOpacity = (key) => Number(layers?.[key]?.opacity ?? 100);

  return (
    <aside className="absolute right-16 top-24 z-20 w-[330px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
      <div className="flex items-center justify-between bg-[#0f3d2e] px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <Layers size={18} />
          <h2 className="text-sm font-bold uppercase tracking-wide">3D Layer Manager</h2>
        </div>
        <ChevronDown size={17} />
      </div>

      <div className="space-y-3 p-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-[12px] font-semibold text-slate-700">Basemap</p>
          <div className="grid grid-cols-4 gap-2">
            {['Satellite', 'Streets', 'Light', 'None'].map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setBasemap(name)}
                className={`rounded-md px-2 py-1.5 text-[11px] font-semibold transition ${
                  basemap === name
                    ? 'bg-green-700 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-[12px] font-semibold text-slate-700">
            Society 3D Layers
          </div>

          <div className="divide-y divide-slate-100">
            {VECTOR_LAYERS.map((item) => (
              <LayerRow
                key={item.key}
                icon={item.icon}
                label={item.label}
                checked={getLayerVisible(item.key)}
                opacity={getLayerOpacity(item.key)}
                disabled={!selectedSociety}
                onToggle={() => updateLayer(item.key, { visible: !getLayerVisible(item.key) })}
                onOpacityChange={(value) => updateLayer(item.key, { opacity: Number(value) })}
              />
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

function LayerRow({ icon: Icon, label, checked, opacity, disabled, onToggle, onOpacityChange }) {
  return (
    <div className={`px-3 py-3 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          disabled={disabled}
          className="h-4 w-4 rounded border-slate-300 text-green-700 focus:ring-green-600"
        />
        <Icon size={15} className="text-green-700" />
        <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-slate-700">{label}</span>
        <span className="w-9 text-right text-[11px] font-semibold text-slate-500">{opacity}%</span>
      </div>

      <div className="ml-8 mt-2 flex items-center gap-2">
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          disabled={disabled || !checked}
          onChange={(event) => onOpacityChange(event.target.value)}
          className="h-1.5 w-full accent-green-700 disabled:opacity-50"
        />
      </div>
    </div>
  );
}

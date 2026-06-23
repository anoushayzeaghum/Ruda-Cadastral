import {
  Building2,
  ChevronDown,
  Layers,
  Map,
  X,
} from "lucide-react";

const VECTOR_LAYERS = [
  { key: "projectBoundary", label: "Project Boundary", icon: Building2 },
  { key: "masterPlan", label: "Master Plan", icon: Map },
  { key: "buildings3d", label: "3D Buildings", icon: Building2 },
];

export default function Society3DLayerPanel({
  layers,
  setLayers,
  basemap,
  setBasemap,
  selectedProject,
  onClose,
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
    <>
      <style>{`
        @keyframes society3dPanelDrop {
          from {
            opacity: 0;
            transform: translateY(-18px) scaleY(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scaleY(1);
          }
        }
      `}</style>

      <aside
        className="w-[330px] overflow-hidden rounded-md border border-[#3a4354] bg-[#202736] text-white shadow-2xl"
        style={{
          animation: "society3dPanelDrop 220ms ease-out both",
          transformOrigin: "top center",
        }}
      >
        <div className="flex items-center justify-between border-b border-[#343c4c] bg-[#1d2533] px-4 py-3">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-[#8bd66f]" />
            <h2 className="text-sm font-bold uppercase tracking-wide">
              3D Layer Manager
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <ChevronDown size={17} className="text-white/55" />
            <button
              type="button"
              title="Close"
              aria-label="Close layer manager"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-md text-white/55 transition hover:bg-white/10 hover:text-white"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(100vh-120px)] space-y-3 overflow-y-auto p-4">
          <div className="rounded-md border border-[#3a4354] bg-[#1d2533] p-3">
            <p className="mb-2 text-[12px] font-semibold text-white/80">
              Basemap
            </p>
            <div className="grid grid-cols-4 gap-2">
              {["Satellite", "Streets", "Light", "None"].map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setBasemap(name)}
                  className={`rounded-md border px-2 py-1.5 text-[11px] font-semibold transition ${
                    basemap === name
                      ? "border-[#8bd66f] bg-[#243041] text-white"
                      : "border-[#344055] bg-[#202736] text-white/80 hover:bg-[#293445]"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-[#3a4354]">
            <div className="border-b border-[#343c4c] bg-[#1d2533] px-3 py-2 text-[12px] font-semibold text-white/80">
              Project 3D Layers
            </div>

            <div className="divide-y divide-[#343c4c]">
              {VECTOR_LAYERS.map((item) => (
                <LayerRow
                  key={item.key}
                  icon={item.icon}
                  label={item.label}
                  checked={getLayerVisible(item.key)}
                  opacity={getLayerOpacity(item.key)}
                  disabled={!selectedProject}
                  onToggle={() =>
                    updateLayer(item.key, {
                      visible: !getLayerVisible(item.key),
                    })
                  }
                  onOpacityChange={(value) =>
                    updateLayer(item.key, { opacity: Number(value) })
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function LayerRow({
  icon: Icon,
  label,
  checked,
  opacity,
  disabled,
  onToggle,
  onOpacityChange,
}) {
  return (
    <div className={`px-3 py-3 ${disabled ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          disabled={disabled}
          className="h-4 w-4 rounded border-[#344055] bg-[#1d2533] text-[#8bd66f] focus:ring-[#8bd66f]"
        />
        <Icon size={15} className="text-[#8bd66f]" />
        <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-white/85">
          {label}
        </span>
        <span className="w-9 text-right text-[11px] font-semibold text-white/45">
          {opacity}%
        </span>
      </div>

      <div className="ml-8 mt-2 flex items-center gap-2">
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          disabled={disabled || !checked}
          onChange={(event) => onOpacityChange(event.target.value)}
          className="h-1.5 w-full accent-[#8bd66f] disabled:opacity-50"
        />
      </div>
    </div>
  );
}

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
        className="w-full sm:w-[330px] overflow-hidden border border-[#13593f] bg-[#06291f] text-white shadow-2xl"
        style={{
          borderRadius: '0',
        }}
      >
        <div className="flex items-center justify-between border-b border-[#0c3d2d] bg-[#06291f] px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Layers size={16} className="text-[#9be37b] sm:w-[18px] sm:h-[18px]" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wide">
              3D Layer Manager
            </h2>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <ChevronDown size={15} className="text-white/55 hidden sm:block sm:w-[17px] sm:h-[17px]" />
            <button
              type="button"
              title="Close"
              aria-label="Close layer manager"
              onClick={onClose}
              className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md text-white/55 transition hover:bg-white/10 hover:text-white"
            >
              <X size={14} className="sm:w-[15px] sm:h-[15px]" />
            </button>
          </div>
        </div>

        <div className="space-y-2 sm:space-y-3 overflow-y-auto p-3 sm:p-4"
          style={{ maxHeight: 'calc(70vh - 100px)' }}
        >
          <div className="rounded-md border border-[#13593f] bg-[#06291f] p-2 sm:p-3">
            <p className="mb-1.5 sm:mb-2 text-[11px] sm:text-[12px] font-semibold text-white/80">
              Basemap
            </p>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {["Satellite", "Streets", "Light", "None"].map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setBasemap(name)}
                  className={`rounded-md border px-1.5 sm:px-2 py-1 sm:py-1.5 text-[10px] sm:text-[11px] font-semibold transition ${
                    basemap === name
                      ? "border-[#9be37b] bg-[#0a3327] text-white"
                      : "border-[#0c3d2d] bg-[#031a14] text-white/80 hover:bg-[#0a3327]"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-[#13593f]">
            <div className="border-b border-[#0c3d2d] bg-[#06291f] px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-[12px] font-semibold text-white/80">
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
    <div className={`px-2.5 sm:px-3 py-2 sm:py-3 ${disabled ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          disabled={disabled}
          className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-[#0c3d2d] bg-[#06291f] text-[#9be37b] focus:ring-[#9be37b]"
        />
        <Icon size={14} className="text-[#9be37b] sm:w-[15px] sm:h-[15px]" />
        <span className="min-w-0 flex-1 truncate text-[11px] sm:text-[12px] font-semibold text-white/85">
          {label}
        </span>
        <span className="w-8 sm:w-9 text-right text-[10px] sm:text-[11px] font-semibold text-white/45">
          {opacity}%
        </span>
      </div>

      <div className="ml-6 sm:ml-8 mt-1.5 sm:mt-2 flex items-center gap-2">
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          disabled={disabled || !checked}
          onChange={(event) => onOpacityChange(event.target.value)}
          className="h-1.5 w-full accent-[#9be37b] disabled:opacity-50"
        />
      </div>
    </div>
  );
}

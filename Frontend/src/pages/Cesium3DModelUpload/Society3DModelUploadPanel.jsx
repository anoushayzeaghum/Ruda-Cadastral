import { Crosshair, Eye, EyeOff, LocateFixed, Trash2, Upload, X } from "lucide-react";

const numberValue = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default function Society3DModelUploadPanel({
  model,
  onFileSelect,
  onSettingsChange,
  onUseMapCenter,
  onFlyToModel,
  onRemoveModel,
  onClose,
}) {
  const settings = model?.settings || {};

  const update = (key, value) => {
    onSettingsChange?.({ [key]: numberValue(value, settings[key] ?? 0) });
  };

  return (
    <aside className="w-full overflow-hidden rounded-md border border-[#13593f] bg-[#06291f] text-white shadow-2xl sm:w-[350px]">
      <div className="flex items-start justify-between border-b border-[#0c3d2d] px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <Upload size={18} className="text-[#9be37b]" />
            <h2 className="text-sm font-bold uppercase tracking-wide">Upload 3D Model</h2>
          </div>
          <p className="mt-1 text-[11px] text-white/55">
            Upload a GLB or self-contained glTF and position it on the Cesium map.
          </p>
        </div>
        <button
          type="button"
          title="Close"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-md text-white/55 transition hover:bg-white/10 hover:text-white"
        >
          <X size={15} />
        </button>
      </div>

      <div className="max-h-[calc(75vh-70px)] space-y-4 overflow-y-auto p-4">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-[#2a765c] bg-[#031a14] px-4 py-5 text-center transition hover:border-[#9be37b] hover:bg-[#0a3327]">
          <Upload size={22} className="mb-2 text-[#9be37b]" />
          <span className="text-xs font-bold">Choose GLB / glTF file</span>
          <span className="mt-1 text-[10px] text-white/45">GLB is recommended because it contains textures in one file.</span>
          <input
            type="file"
            accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
            className="hidden"
            onChange={(event) => onFileSelect?.(event.target.files?.[0] || null)}
          />
        </label>

        {model?.error && (
          <div className="rounded-md border border-red-400/40 bg-red-950/40 px-3 py-2 text-[11px] font-semibold text-red-200">
            {model.error}
          </div>
        )}

        {model?.url && (
          <>
            <div className="rounded-md border border-[#13593f] bg-[#031a14] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Loaded file</p>
              <p className="mt-1 truncate text-xs font-bold text-white/90">{model.name}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <ActionButton icon={<Crosshair size={14} />} label="Use Map Center" onClick={onUseMapCenter} />
              <ActionButton icon={<LocateFixed size={14} />} label="Fly to Model" onClick={onFlyToModel} />
            </div>

            <section className="rounded-md border border-[#13593f] p-3">
              <p className="mb-3 text-[12px] font-semibold text-white/80">Position</p>
              <div className="grid grid-cols-2 gap-2">
                <NumberField label="Longitude" value={settings.longitude} step="0.000001" onChange={(v) => update("longitude", v)} />
                <NumberField label="Latitude" value={settings.latitude} step="0.000001" onChange={(v) => update("latitude", v)} />
                <NumberField label="Height (m)" value={settings.height} step="0.1" onChange={(v) => update("height", v)} />
                <NumberField label="Scale" value={settings.scale} step="0.1" min="0.01" onChange={(v) => update("scale", v)} />
              </div>
            </section>

            <section className="rounded-md border border-[#13593f] p-3">
              <p className="mb-3 text-[12px] font-semibold text-white/80">Orientation</p>
              <div className="grid grid-cols-3 gap-2">
                <NumberField label="Heading°" value={settings.heading} step="1" onChange={(v) => update("heading", v)} />
                <NumberField label="Pitch°" value={settings.pitch} step="1" onChange={(v) => update("pitch", v)} />
                <NumberField label="Roll°" value={settings.roll} step="1" onChange={(v) => update("roll", v)} />
              </div>
            </section>

            <div className="grid grid-cols-2 gap-2">
              <ActionButton
                icon={settings.visible ? <EyeOff size={14} /> : <Eye size={14} />}
                label={settings.visible ? "Hide Model" : "Show Model"}
                onClick={() => onSettingsChange?.({ visible: !settings.visible })}
              />
              <button
                type="button"
                onClick={onRemoveModel}
                className="flex items-center justify-center gap-2 rounded-md border border-red-400/40 bg-red-950/30 px-3 py-2 text-[11px] font-bold text-red-200 transition hover:bg-red-950/50"
              >
                <Trash2 size={14} /> Remove
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

function NumberField({ label, value, onChange, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold text-white/55">{label}</span>
      <input
        type="number"
        value={value ?? 0}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-[#0c3d2d] bg-[#031a14] px-2 py-2 text-[11px] font-semibold text-white outline-none focus:border-[#9be37b]"
        {...props}
      />
    </label>
  );
}

function ActionButton({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-2 rounded-md border border-[#2a765c] bg-[#0a3327] px-3 py-2 text-[11px] font-bold text-white transition hover:border-[#9be37b] hover:bg-[#13593f]"
    >
      {icon} {label}
    </button>
  );
}

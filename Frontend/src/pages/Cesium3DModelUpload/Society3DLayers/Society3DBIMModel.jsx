import { Building2, LocateFixed, X } from "lucide-react";

export default function Society3DBIMModel({ bimLayers, setBimLayers, onClose }) {
  const visible = bimLayers?.chaharBaghBim === true;

  return (
    <aside className="w-full overflow-hidden border border-[#13593f] bg-[#06291f] text-white shadow-2xl sm:w-[330px]">
      <div className="flex items-start justify-between border-b border-[#0c3d2d] px-3 py-2 sm:px-4 sm:py-3">
        <div>
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-[#9be37b]" />
            <h2 className="text-sm font-bold uppercase tracking-wide">3D BIM Model</h2>
          </div>
          <p className="mt-1 text-[11px] text-white/55">
            Stream and position the Chahar Bagh BIM model from Cesium ion.
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

      <div className="space-y-3 p-4">
        <div className="rounded-md border border-[#13593f] bg-[#031a14] p-3">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-white/80">
            <LocateFixed size={14} className="text-[#9be37b]" />
            Cesium ion asset
          </div>
          

          <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-md border border-[#0c3d2d] bg-[#06291f] px-3 py-2 text-[12px] font-semibold transition hover:border-[#9be37b]">
            <input
              type="checkbox"
              checked={visible}
              onChange={() =>
                setBimLayers((prev) => ({
                  ...prev,
                  chaharBaghBim: !visible,
                }))
              }
              className="h-4 w-4 rounded border-[#0c3d2d] bg-[#06291f] text-[#9be37b] focus:ring-[#9be37b]"
            />
            Chahar Bagh BIM Model
          </label>
        </div>
      </div>
    </aside>
  );
}

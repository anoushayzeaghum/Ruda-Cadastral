import { Building2, X } from "lucide-react";

export default function Society3DBIMModel({ bimLayers, setBimLayers, onClose }) {
  const toggleManholesModel = () => {
    setBimLayers((prev) => ({
      ...prev,
      manholesModel: !prev.manholesModel,
    }));
  };

  return (
    <aside className="w-full sm:w-[330px] overflow-hidden border border-[#13593f] bg-[#06291f] text-white shadow-2xl">
      <div className="flex items-start justify-between border-b border-[#0c3d2d] bg-[#06291f] px-3 sm:px-4 py-2 sm:py-3">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Building2 size={16} className="text-[#9be37b] sm:w-[18px] sm:h-[18px]" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wide">
              3D BIM Model
            </h2>
          </div>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] text-white/55">
            Manage BIM layer visibility and controls.
          </p>
        </div>

        <button
          type="button"
          title="Close"
          aria-label="Close BIM panel"
          onClick={onClose}
          className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-md text-white/55 transition hover:bg-white/10 hover:text-white"
        >
          <X size={14} className="sm:w-[15px] sm:h-[15px]" />
        </button>
      </div>

      <div
        className="space-y-3 sm:space-y-4 p-3 sm:p-4"
        style={{ maxHeight: "calc(70vh - 120px)", overflowY: "auto" }}
      >
        <div className="rounded-md border border-[#13593f] bg-[#06291f] p-3">
          <p className="text-[11px] sm:text-[12px] font-semibold text-white/80">
            BIM Layers
          </p>

          <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-md border border-[#0c3d2d] bg-[#031a14] px-3 py-2 text-[11px] sm:text-[12px] font-semibold text-white transition hover:border-[#9be37b]">
            <input
              type="checkbox"
              checked={bimLayers.manholesModel}
              onChange={toggleManholesModel}
              className="h-4 w-4 rounded border-[#0c3d2d] bg-[#06291f] text-[#9be37b] focus:ring-[#9be37b]"
            />
            Manholes Model
          </label>
        </div>
      </div>
    </aside>
  );
}

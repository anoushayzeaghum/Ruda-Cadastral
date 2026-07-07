import { Building2, Info, X } from "lucide-react";

export default function Society3DBIMModel({ bimLayers, setBimLayers, onClose }) {
  const manholesVisible = bimLayers?.manholesModel === true;

  const toggleManholesModel = () => {
    setBimLayers((prev) => ({
      ...prev,
      manholesModel: !prev?.manholesModel,
    }));
  };

  return (
    <aside className="w-full overflow-hidden border border-[#13593f] bg-[#06291f] text-white shadow-2xl sm:w-[330px]">
      <div className="flex items-start justify-between border-b border-[#0c3d2d] bg-[#06291f] px-3 py-2 sm:px-4 sm:py-3">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Building2 size={16} className="text-[#9be37b] sm:h-[18px] sm:w-[18px]" />
            <h2 className="text-xs font-bold uppercase tracking-wide sm:text-sm">
              3D BIM Model
            </h2>
          </div>
          <p className="mt-0.5 text-[10px] text-white/55 sm:mt-1 sm:text-[11px]">
            Load the converted Cesium ion BIM model.
          </p>
        </div>

        <button
          type="button"
          title="Close"
          aria-label="Close BIM panel"
          onClick={onClose}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white/55 transition hover:bg-white/10 hover:text-white sm:h-7 sm:w-7"
        >
          <X size={14} className="sm:h-[15px] sm:w-[15px]" />
        </button>
      </div>

      <div
        className="space-y-3 p-3 sm:space-y-4 sm:p-4"
        style={{ maxHeight: "calc(70vh - 120px)", overflowY: "auto" }}
      >
        <div className="rounded-md border border-[#13593f] bg-[#06291f] p-3">
          <p className="text-[11px] font-semibold text-white/80 sm:text-[12px]">
            BIM Layers
          </p>

          <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-md border border-[#0c3d2d] bg-[#031a14] px-3 py-2 text-[11px] font-semibold text-white transition hover:border-[#9be37b] sm:text-[12px]">
            <input
              type="checkbox"
              checked={manholesVisible}
              onChange={toggleManholesModel}
              className="h-4 w-4 rounded border-[#0c3d2d] bg-[#06291f] text-[#9be37b] focus:ring-[#9be37b]"
            />
            <span className="flex-1">Manholes Model</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[9px] uppercase ${
                manholesVisible
                  ? "bg-[#9be37b]/15 text-[#9be37b]"
                  : "bg-white/10 text-white/45"
              }`}
            >
              {manholesVisible ? "On" : "Off"}
            </span>
          </label>
        </div>

     
      </div>
    </aside>
  );
}

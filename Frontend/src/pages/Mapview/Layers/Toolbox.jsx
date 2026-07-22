import { X } from "lucide-react";
import Measurement from "../../GISMetaverse/tools/Measurement";

export default function Toolbox({ map, isMobile, onClose }) {
  return (
    <div
      className="overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      style={
        isMobile
          ? { maxHeight: "calc(70vh - 60px)" }
          : { maxHeight: "calc(100vh - 160px)" }
      }
    >
      <div className="flex items-center justify-between border-b border-[#0c3d2d] bg-[#06291f] px-3 py-2.5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
          Toolbox
        </h3>
        <button
          type="button"
          onClick={onClose}
          title="Close panel"
          aria-label="Close panel"
          className="flex h-6 w-6 items-center justify-center rounded text-white/50 transition hover:bg-[#0a3327] hover:text-white"
        >
          <X size={14} />
        </button>
      </div>
      <Measurement map={map} />
    </div>
  );
}

import { Pentagon, RotateCcw, Square, X } from "lucide-react";

export default function DrawAOI({
  isMobile,
  onClose,
  enabled = false,
  onToggle = () => {},
  onFinish = () => {},
  onClear = () => {},
  status = {},
}) {
  const vertexCount = Number(status?.vertexCount) || 0;
  const canFinish = Boolean(status?.canFinish);

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
        <div className="flex items-center gap-2">
          <Pentagon size={16} className="text-[#9be37b]" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
            Draw AOI
          </h3>
        </div>

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

      <div className="bg-[#031a14] p-3">
        <div className="rounded-md border border-[#13593f] bg-[#06291f] p-3">
          <p className="text-[11px] leading-relaxed text-white/70">
            Click on the map to add polygon vertices. The cursor snaps to
            nearby vertices of visible polygon layers. Double-click, press
            Enter, or use Finish to complete the AOI.
          </p>

          <button
            type="button"
            onClick={() => onToggle(!enabled)}
            className={`mt-3 w-full rounded-md px-3 py-2 text-xs font-semibold transition ${
              enabled
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-[#9be37b] text-[#06291f] hover:bg-[#b4ef98]"
            }`}
          >
            {enabled ? "Stop Drawing" : "Start Drawing"}
          </button>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={!canFinish}
              onClick={onFinish}
              className="inline-flex items-center justify-center gap-1 rounded-md border border-[#9be37b]/50 bg-[#0f5132] px-2 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#146b43] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Square size={13} />
              Finish ({vertexCount})
            </button>

            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center justify-center gap-1 rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white/10"
            >
              <RotateCcw size={13} />
              Clear
            </button>
          </div>

          <div className="mt-3 rounded border border-[#0c3d2d] bg-[#031a14] px-2.5 py-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-white/60">Drawing status</span>
              <span
                className={`font-semibold ${
                  enabled ? "text-[#9be37b]" : "text-white/50"
                }`}
              >
                {enabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-white/60">Vertices</span>
              <span className="font-semibold text-white">{vertexCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

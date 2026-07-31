import { useEffect } from "react";
import { Info, Play, Check } from "lucide-react";

export default function MeasurementFinishDialog({
  isOpen,
  onContinue,
  onCalculate,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onContinue(); // Escape defaults to continue/close
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onContinue]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-200">
      {/* Click outside to close (defaults to continue) */}
      <div className="absolute inset-0" onClick={onContinue} />

      <div className="relative w-full max-w-sm rounded-xl border border-emerald-500/30 bg-[#0b1322]/90 p-5 text-white shadow-2xl backdrop-blur-md transition-all duration-300 scale-100">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
            <Info size={20} />
          </div>
          <div>
            <h3 className="text-[14px] font-bold tracking-wide uppercase text-emerald-400">
              Measurement Completed
            </h3>
            <p className="mt-2 text-[12px] leading-relaxed text-slate-300">
              Would you like to calculate the final result or continue editing and add more vertices?
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onContinue}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-[12px] font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white"
          >
            <Play size={13} className="text-slate-400" />
            Continue
          </button>
          <button
            type="button"
            onClick={onCalculate}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-[12px] font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-500"
          >
            <Check size={13} />
            Calculate
          </button>
        </div>
      </div>
    </div>
  );
}

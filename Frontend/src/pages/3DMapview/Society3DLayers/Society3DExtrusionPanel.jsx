import { useEffect, useState } from "react";
import { Box, MousePointer2, RotateCcw, Wand2, X } from "lucide-react";
import { getFeatureId } from "../cesiumHelpers";

export default function Society3DExtrusionPanel({
  extrusion,
  setExtrusion,
  selectedFeature,
  onApplyToSelected,
  onApplyToAll,
  onClearExtrusions,
  onClose,
}) {
  const selectedId = selectedFeature ? getFeatureId(selectedFeature) : "";
  const [applyTarget, setApplyTarget] = useState("selected");

  useEffect(() => {
    if (!selectedFeature && applyTarget === "selected") {
      setApplyTarget("all");
    }
  }, [selectedFeature, applyTarget]);

  const handleApply = () => {
    if (applyTarget === "selected" && !selectedFeature) return;

    const payload = {
      applyTarget,
      applyToAll: applyTarget === "all",
      selectedFeature: applyTarget === "all" ? null : selectedFeature,
      selectedId: applyTarget === "all" ? "__ALL_PLOTS__" : selectedId,
    };

    if (applyTarget === "all") {
      // Preferred handler for all plots.
      // Add this prop in Society3DMapview if you already have a separate all-plot extrusion function.
      if (typeof onApplyToAll === "function") {
        onApplyToAll(payload);
        return;
      }

      // Backward-compatible fallback for existing code.
      // Your parent handler should check payload.applyToAll === true and apply height to every plot entity.
      onApplyToSelected?.(payload);
      return;
    }

    onApplyToSelected?.(payload);
  };

  return (
    <aside className="w-[330px] overflow-hidden rounded-md border border-[#3a4354] bg-[#202736] text-white shadow-2xl">
      <div className="flex items-start justify-between border-b border-[#343c4c] bg-[#1d2533] px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <Box size={18} className="text-[#8bd66f]" />
            <h2 className="text-sm font-bold uppercase tracking-wide">
              3D Extrusion Manager
            </h2>
          </div>
          <p className="mt-1 text-[11px] text-white/55">
            Select one plot or all plots, set height and apply extrusion.
          </p>
        </div>

        <button
          type="button"
          title="Close"
          aria-label="Close extrusion manager"
          onClick={onClose}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/55 transition hover:bg-white/10 hover:text-white"
        >
          <X size={15} />
        </button>
      </div>

      <div className="space-y-4 p-4">
        <div className="rounded-md border border-[#3a4354] bg-[#1d2533] p-3">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-white/80">
            <MousePointer2 size={14} className="text-[#8bd66f]" />
            Selected Feature
          </div>

          <select
            value={applyTarget}
            onChange={(event) => setApplyTarget(event.target.value)}
            className="mt-2 w-full rounded-md border border-[#344055] bg-[#111827] px-2 py-2 text-[12px] font-semibold text-white outline-none transition focus:border-[#8bd66f]"
          >
            <option value="selected" disabled={!selectedFeature}>
              {selectedId ? `Selected Plot: ${selectedId}` : "No plot selected"}
            </option>
            <option value="all">All Plots</option>
          </select>
        </div>

        <label className="block">
          <span className="mb-1 flex items-center gap-2 text-[12px] font-semibold text-white/80">
            <Wand2 size={14} className="text-[#8bd66f]" /> Height (feet)
          </span>
          <input
            type="number"
            min="1"
            value={extrusion.heightFeet}
            onChange={(event) =>
              setExtrusion((prev) => ({
                ...prev,
                heightFeet: event.target.value,
              }))
            }
            className="w-full rounded-md border border-[#344055] bg-[#111827] px-3 py-2 text-sm font-semibold text-white outline-none transition focus:border-[#8bd66f]"
          />
        </label>

        <div>
          <p className="mb-2 text-[12px] font-semibold text-white/80">
            Extrude From
          </p>
          <div className="grid grid-cols-2 gap-2">
            {["base", "top"].map((value) => (
              <label
                key={value}
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border px-3 py-2 text-[12px] font-semibold uppercase transition ${
                  extrusion.extrudeFrom === value
                    ? "border-[#8bd66f] bg-[#243041] text-white"
                    : "border-[#344055] bg-[#1d2533] text-white/75 hover:bg-[#293445]"
                }`}
              >
                <input
                  type="radio"
                  name="extrudeFrom"
                  value={value}
                  checked={extrusion.extrudeFrom === value}
                  onChange={(event) =>
                    setExtrusion((prev) => ({
                      ...prev,
                      extrudeFrom: event.target.value,
                    }))
                  }
                  className="sr-only"
                />
                {value}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleApply}
            disabled={applyTarget === "selected" && !selectedFeature}
            className="rounded-md border border-[#8bd66f] bg-[#243041] px-3 py-2 text-[12px] font-bold text-white transition hover:bg-[#2f3d52] disabled:cursor-not-allowed disabled:border-[#344055] disabled:bg-[#1d2533] disabled:text-white/35"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={onClearExtrusions}
            className="flex items-center justify-center gap-1 rounded-md border border-[#344055] bg-[#1d2533] px-3 py-2 text-[12px] font-bold text-white/85 transition hover:bg-[#293445] hover:text-white"
          >
            <RotateCcw size={13} /> Clear All
          </button>
        </div>
      </div>
    </aside>
  );
}

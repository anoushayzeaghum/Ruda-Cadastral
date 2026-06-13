import { Box, Brush, MousePointer2, RotateCcw, Wand2 } from "lucide-react";
import { getFeatureId } from "./cesiumHelpers";

export default function Society3DExtrusionPanel({
  extrusion,
  setExtrusion,
  selectedFeature,
  onApplyToSelected,
  onClearExtrusions,
}) {
  const selectedId = selectedFeature ? getFeatureId(selectedFeature) : "";

  return (
    <aside className="absolute left-4 top-24 z-20 w-[300px] overflow-hidden rounded-xl border border-slate-700/40 bg-slate-900/95 text-white shadow-xl backdrop-blur">
      <div className="border-b border-slate-700 px-4 py-3">
        <div className="flex items-center gap-2">
          <Box size={18} className="text-cyan-300" />
          <h2 className="text-sm font-bold uppercase tracking-wide">3D Extrusion</h2>
        </div>
        <p className="mt-1 text-[11px] text-slate-300">Click a plot/building to select it, then apply height.</p>
      </div>

      <div className="space-y-4 p-4">
        <div className="rounded-lg border border-slate-700 bg-slate-800/80 p-3">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-200">
            <MousePointer2 size={14} />
            Selected Feature
          </div>
          <p className="mt-2 truncate rounded-md bg-slate-950/70 px-2 py-2 text-[12px] text-cyan-200">
            {selectedId || "No plot selected"}
          </p>
        </div>

        <label className="block">
          <span className="mb-1 flex items-center gap-2 text-[12px] font-semibold text-slate-200">
            <Wand2 size={14} /> Height (feet)
          </span>
          <input
            type="number"
            min="1"
            value={extrusion.heightFeet}
            onChange={(event) => setExtrusion((prev) => ({ ...prev, heightFeet: event.target.value }))}
            className="w-full rounded-md border border-slate-600 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-cyan-400"
          />
        </label>

        <label className="block">
          <span className="mb-1 flex items-center gap-2 text-[12px] font-semibold text-slate-200">
            <Brush size={14} /> Color
          </span>
          <input
            type="color"
            value={extrusion.color}
            onChange={(event) => setExtrusion((prev) => ({ ...prev, color: event.target.value }))}
            className="h-10 w-full cursor-pointer rounded-md border border-slate-600 bg-slate-100 p-1"
          />
        </label>

        <div>
          <p className="mb-2 text-[12px] font-semibold text-slate-200">Extrude From</p>
          <div className="grid grid-cols-2 gap-2">
            {['base', 'top'].map((value) => (
              <label
                key={value}
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border px-3 py-2 text-[12px] font-semibold uppercase ${
                  extrusion.extrudeFrom === value
                    ? 'border-cyan-300 bg-cyan-500/20 text-cyan-200'
                    : 'border-slate-700 bg-slate-800 text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="extrudeFrom"
                  value={value}
                  checked={extrusion.extrudeFrom === value}
                  onChange={(event) => setExtrusion((prev) => ({ ...prev, extrudeFrom: event.target.value }))}
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
            onClick={onApplyToSelected}
            disabled={!selectedFeature}
            className="rounded-md bg-blue-600 px-3 py-2 text-[12px] font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={onClearExtrusions}
            className="flex items-center justify-center gap-1 rounded-md bg-slate-100 px-3 py-2 text-[12px] font-bold text-slate-800 transition hover:bg-white"
          >
            <RotateCcw size={13} /> Clear All
          </button>
        </div>
      </div>
    </aside>
  );
}

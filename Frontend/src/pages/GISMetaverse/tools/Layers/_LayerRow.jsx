import { Grid3X3 } from "lucide-react";

/**
 * Shared layer row used by every Layers sub-panel.
 * Shows a checkbox, colour swatch, label, and a live opacity slider.
 * Opacity slider is always rendered and functional — it applies instantly.
 */
export default function LayerRow({
  label,
  color,
  checked,
  opacity,
  onCheckedChange,
  onOpacityChange,
}) {
  return (
    <div className="mt-3 first:mt-1">
      {/* Row: checkbox + swatch + label + grid icon */}
      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={!!checked}
            onChange={(e) => onCheckedChange?.(e.target.checked)}
            className="accent-[#65c96b]"
          />
          <span
            className="h-4 w-4 shrink-0 rounded-sm border-2"
            style={{ borderColor: color }}
          />
          <span className="text-[11px]">{label}</span>
        </label>

        <Grid3X3 size={14} className="text-white/60 shrink-0" />
      </div>

      {/* Opacity slider — always interactive */}
      <div className="mt-2 flex items-center gap-2 pl-6">
        <input
          type="range"
          min="0"
          max="100"
          value={opacity ?? 100}
          onChange={(e) => onOpacityChange?.(Number(e.target.value))}
          className="h-[3px] flex-1 rounded-full accent-[#65c96b]"
          style={{
            background: `linear-gradient(to right, ${color} ${opacity ?? 100}%, #344055 ${opacity ?? 100}%)`,
          }}
        />
        <span className="w-8 text-right text-[11px] text-white/90 shrink-0">
          {opacity ?? 100}%
        </span>
      </div>
    </div>
  );
}

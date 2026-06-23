export default function LayerStyleControl({
  color,
  onColorClick,
  label,
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="h-4 w-6 rounded-sm border-2"
        style={{ borderColor: color }}
        onClick={onColorClick}
      />
      <span className="text-[11px] text-white/80">{label}</span>
    </div>
  );
}
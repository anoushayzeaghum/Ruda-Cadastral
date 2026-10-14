import React from "react";

export const MP_PRINCIPLE_ZONING_NOTIFIED_PATTERN_ID =
  "mp-principle-zoning-notified-public-utility-pattern";

export const MP_PRINCIPLE_ZONING_NOTIFIED_LEGEND = [
  { label: "Brown Zone", color: "#f3c56b" },
  { label: "Infill Development", color: "#95bdcf" },
  { label: "Green Zone", color: "#91ec63" },
  { label: "Industrial Zone", color: "#c55ce4" },
  { label: "Public Utility Zone", color: "#fff16a", pattern: true },
];

export const DEFAULT_MP_PRINCIPLE_ZONING_NOTIFIED_COLORS =
  MP_PRINCIPLE_ZONING_NOTIFIED_LEGEND.reduce((result, item) => {
    result[item.label] = item.color;
    return result;
  }, {});

const FALLBACK_ZONE_COLOR = "#94a3b8";
const OUTLINE_COLOR = "#475569";

const getColor = (colors, label) =>
  colors?.[label] ||
  DEFAULT_MP_PRINCIPLE_ZONING_NOTIFIED_COLORS[label] ||
  FALLBACK_ZONE_COLOR;

const buildZoneMatchExpression = (colors = {}) => [
  "match",
  ["coalesce", ["get", "zoning_cat"], ""],
  "Brown Zone",
  getColor(colors, "Brown Zone"),
  "Infill Development",
  getColor(colors, "Infill Development"),
  "Green Zone",
  getColor(colors, "Green Zone"),
  "Industrial Zone",
  getColor(colors, "Industrial Zone"),
  "Public Utility Zone",
  getColor(colors, "Public Utility Zone"),
  FALLBACK_ZONE_COLOR,
];

export const ensureMpPrincipleZoningNotifiedPatterns = (map) => {
  if (!map || typeof map.hasImage !== "function") return;
  if (map.hasImage(MP_PRINCIPLE_ZONING_NOTIFIED_PATTERN_ID)) return;
  if (typeof document === "undefined") return;

  const size = 24;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) return;

  context.clearRect(0, 0, size, size);
  context.fillStyle = "#fff16a";
  context.fillRect(0, 0, size, size);

  context.strokeStyle = "#f05a5a";
  context.lineWidth = 6;
  context.lineCap = "square";

  for (let offset = -size; offset <= size * 2; offset += 12) {
    context.beginPath();
    context.moveTo(offset, size);
    context.lineTo(offset + size, 0);
    context.stroke();
  }

  map.addImage(
    MP_PRINCIPLE_ZONING_NOTIFIED_PATTERN_ID,
    context.getImageData(0, 0, size, size),
    { pixelRatio: 2 },
  );
};

export const getMpPrincipleZoningNotifiedFillPaint = (
  colors = DEFAULT_MP_PRINCIPLE_ZONING_NOTIFIED_COLORS,
  opacityRatio = 1,
) => ({
  "fill-color": buildZoneMatchExpression(colors),
  "fill-opacity": 0.72 * opacityRatio,
});

export const getMpPrincipleZoningNotifiedPatternFillPaint = (
  _colors = DEFAULT_MP_PRINCIPLE_ZONING_NOTIFIED_COLORS,
  opacityRatio = 1,
) => ({
  "fill-pattern": MP_PRINCIPLE_ZONING_NOTIFIED_PATTERN_ID,
  "fill-opacity": 0.9 * opacityRatio,
});

export const getMpPrincipleZoningNotifiedOutlinePaint = (
  _colors = DEFAULT_MP_PRINCIPLE_ZONING_NOTIFIED_COLORS,
  opacityRatio = 1,
) => ({
  "line-color": OUTLINE_COLOR,
  "line-width": 1.25,
  "line-opacity": 0.9 * opacityRatio,
});

export const getMpPrincipleZoningNotifiedLinePaint =
  getMpPrincipleZoningNotifiedOutlinePaint;

export default function MpPrincipleZoningNotifiedStyle({
  colors = DEFAULT_MP_PRINCIPLE_ZONING_NOTIFIED_COLORS,
  onColorChange,
}) {
  return (
    <div className="space-y-1.5">
      {MP_PRINCIPLE_ZONING_NOTIFIED_LEGEND.map((item) => {
        const color = getColor(colors, item.label);

        return (
          <div
            key={item.label}
            className="flex items-center justify-between gap-2 text-[11px] text-white/80"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="h-4 w-5 shrink-0 rounded-[2px] border border-white/30"
                style={
                  item.pattern
                    ? {
                        backgroundColor: color,
                        backgroundImage:
                          "repeating-linear-gradient(135deg, #f05a5a 0 4px, transparent 4px 9px)",
                      }
                    : { backgroundColor: color }
                }
              />
              <span className="truncate">{item.label}</span>
            </div>

            {typeof onColorChange === "function" && !item.pattern && (
              <input
                type="color"
                value={color}
                title={`Change ${item.label} color`}
                onChange={(event) => onColorChange(item.label, event.target.value)}
                className="h-5 w-6 cursor-pointer border-0 bg-transparent p-0"
              />
            )}
          </div>
        );
      })}

      <div className="flex items-center justify-between gap-2 pt-1 text-[10px] text-white/45">
        <span>Other / unmapped categories</span>
        <span className="h-3.5 w-5 rounded-[2px] border border-white/20 bg-[#94a3b8]" />
      </div>
    </div>
  );
}

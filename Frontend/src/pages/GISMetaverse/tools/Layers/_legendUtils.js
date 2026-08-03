/**
 * Legend item factory helpers.
 * These produce plain objects that InlineLayerLegend can render.
 */

export const polygonLegend = (label, color, options = {}) => ({
  id: options.id || label,
  label,
  type: "polygon",
  color: options.borderColor || color,
  fillColor: options.fillColor || color,
  borderColor: options.borderColor || color,
});

export const lineLegend = (label, color, options = {}) => ({
  id: options.id || label,
  label,
  type: options.dashed ? "dashed-line" : "line",
  color,
  width: options.width || 3,
  dashArray: options.dashArray,
});

export const pointLegend = (label, color, options = {}) => ({
  id: options.id || label,
  label,
  type: "point",
  color,
  radius: options.radius || 5,
  borderColor: options.borderColor || "#ffffff",
});

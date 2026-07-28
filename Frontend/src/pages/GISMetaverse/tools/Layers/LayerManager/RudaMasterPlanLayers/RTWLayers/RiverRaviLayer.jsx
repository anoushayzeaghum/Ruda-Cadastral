export const RIVER_RAVI_COLOR = "#0ea5e9";
export const RIVER_RAVI_WATER_PLANE_COLOR = "#0ea5e9";
export const RIVER_RAVI_RIVER_BED_COLOR = "#926e3c";

// Supports the common property names used for the River Ravi type field.
// The values are normalized to lowercase so values such as
// "Water Plane", "water plane", "River Bed", and "river bed" all work.
const RIVER_RAVI_TYPE_EXPRESSION = [
  "downcase",
  [
    "to-string",
    [
      "coalesce",
      ["get", "type"],
      ["get", "river_type"],
      ["get", "category"],
      ["get", "landuse"],
      "",
    ],
  ],
];

const getRiverRaviColorExpression = () => [
  "match",
  RIVER_RAVI_TYPE_EXPRESSION,
  "river bed",
  RIVER_RAVI_RIVER_BED_COLOR,
  "riverbed",
  RIVER_RAVI_RIVER_BED_COLOR,
  "water plane",
  RIVER_RAVI_WATER_PLANE_COLOR,
  "waterplane",
  RIVER_RAVI_WATER_PLANE_COLOR,
  RIVER_RAVI_WATER_PLANE_COLOR,
];

export const getRiverRaviFillPaint = (
  _color = RIVER_RAVI_COLOR,
  opacity = 1,
) => ({
  "fill-color": getRiverRaviColorExpression(),
  "fill-opacity": 0.42 * opacity,
});

export const getRiverRaviOutlinePaint = (
  _color = RIVER_RAVI_COLOR,
  opacity = 1,
) => ({
  "line-color": getRiverRaviColorExpression(),
  "line-width": ["interpolate", ["linear"], ["zoom"], 7, 1.3, 13, 2.4],
  "line-opacity": opacity,
});

export const getRiverRaviLinePaint = (
  _color = RIVER_RAVI_COLOR,
  opacity = 1,
) => ({
  "line-color": getRiverRaviColorExpression(),
  "line-width": ["interpolate", ["linear"], ["zoom"], 7, 2.5, 13, 5],
  "line-opacity": opacity,
});

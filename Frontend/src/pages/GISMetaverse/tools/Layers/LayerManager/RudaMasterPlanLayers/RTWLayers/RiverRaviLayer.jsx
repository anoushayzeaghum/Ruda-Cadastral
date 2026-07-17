export const RIVER_RAVI_COLOR = "#0ea5e9";

export const getRiverRaviFillPaint = (
  color = RIVER_RAVI_COLOR,
  opacity = 1,
) => ({
  "fill-color": color,
  "fill-opacity": 0.42 * opacity,
});

export const getRiverRaviOutlinePaint = (
  color = RIVER_RAVI_COLOR,
  opacity = 1,
) => ({
  "line-color": color,
  "line-width": ["interpolate", ["linear"], ["zoom"], 7, 1.3, 13, 2.4],
  "line-opacity": opacity,
});

export const getRiverRaviLinePaint = (
  color = RIVER_RAVI_COLOR,
  opacity = 1,
) => ({
  "line-color": color,
  "line-width": ["interpolate", ["linear"], ["zoom"], 7, 2.5, 13, 5],
  "line-opacity": opacity,
});

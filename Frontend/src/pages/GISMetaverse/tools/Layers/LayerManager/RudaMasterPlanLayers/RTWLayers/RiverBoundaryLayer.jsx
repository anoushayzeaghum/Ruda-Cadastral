export const RIVER_BOUNDARY_COLOR = "#38bdf8";

export const getRiverBoundaryFillPaint = (
  color = RIVER_BOUNDARY_COLOR,
  opacity = 1,
) => ({
  "fill-color": color,
  "fill-opacity": 0.12 * opacity,
});

export const getRiverBoundaryOutlinePaint = (
  color = RIVER_BOUNDARY_COLOR,
  opacity = 1,
) => ({
  "line-color": color,
  "line-width": ["interpolate", ["linear"], ["zoom"], 7, 1.7, 13, 3],
  "line-opacity": opacity,
});

export const getRiverBoundaryLinePaint = getRiverBoundaryOutlinePaint;

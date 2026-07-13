export const RAILWAY_LINE_DEFAULT_COLOR = "#111111";

// The wide, very short dashed line creates railway sleepers extending
// beyond the thinner continuous rail alignment drawn above it.
export const getRailwayLineCasingPaint = (
  color = RAILWAY_LINE_DEFAULT_COLOR,
  opacityRatio = 1,
) => ({
  "line-color": color,
  "line-width": 7,
  "line-opacity": opacityRatio,
  "line-dasharray": [0.25, 1],
});

export const getRailwayLinePaint = (
  color = RAILWAY_LINE_DEFAULT_COLOR,
  opacityRatio = 1,
) => ({
  "line-color": color,
  "line-width": 2.2,
  "line-opacity": opacityRatio,
});

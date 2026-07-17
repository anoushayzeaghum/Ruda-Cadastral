export const RTW_ALIGNMENT_COLOR = "#ec4899";

export const getRtwAlignmentFillPaint = (
  color = RTW_ALIGNMENT_COLOR,
  opacity = 1,
) => ({
  "fill-color": color,
  "fill-opacity": 0.18 * opacity,
});

export const getRtwAlignmentOutlinePaint = (
  color = RTW_ALIGNMENT_COLOR,
  opacity = 1,
) => ({
  "line-color": color,
  "line-width": ["interpolate", ["linear"], ["zoom"], 7, 1.8, 13, 3.2],
  "line-opacity": opacity,
});

export const getRtwAlignmentLinePaint = getRtwAlignmentOutlinePaint;

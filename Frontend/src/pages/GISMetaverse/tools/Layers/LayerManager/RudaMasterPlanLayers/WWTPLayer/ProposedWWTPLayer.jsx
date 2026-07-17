export const PROPOSED_WWTP_COLOR = "#f97316";

export const getProposedWWTPFillPaint = (
  color = PROPOSED_WWTP_COLOR,
  opacity = 1,
) => ({
  "fill-color": color,
  "fill-opacity": 0.38 * opacity,
});

export const getProposedWWTPOutlinePaint = (
  color = PROPOSED_WWTP_COLOR,
  opacity = 1,
) => ({
  "line-color": color,
  "line-width": ["interpolate", ["linear"], ["zoom"], 7, 1.4, 13, 2.6],
  "line-opacity": opacity,
});

export const getProposedWWTPLinePaint = getProposedWWTPOutlinePaint;

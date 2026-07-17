export const WWTP_SITES_COLOR = "#8b5cf6";

export const getWWTPSitesFillPaint = (
  color = WWTP_SITES_COLOR,
  opacity = 1,
) => ({
  "fill-color": color,
  "fill-opacity": 0.4 * opacity,
});

export const getWWTPSitesOutlinePaint = (
  color = WWTP_SITES_COLOR,
  opacity = 1,
) => ({
  "line-color": color,
  "line-width": ["interpolate", ["linear"], ["zoom"], 7, 1.4, 13, 2.6],
  "line-opacity": opacity,
});

export const getWWTPSitesLinePaint = getWWTPSitesOutlinePaint;

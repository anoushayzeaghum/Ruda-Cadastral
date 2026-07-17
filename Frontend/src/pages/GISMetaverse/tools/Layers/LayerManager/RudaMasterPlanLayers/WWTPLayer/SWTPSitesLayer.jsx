export const SWTP_SITES_COLOR = "#14b8a6";

export const getSWTPSitesFillPaint = (
  color = SWTP_SITES_COLOR,
  opacity = 1,
) => ({
  "fill-color": color,
  "fill-opacity": 0.4 * opacity,
});

export const getSWTPSitesOutlinePaint = (
  color = SWTP_SITES_COLOR,
  opacity = 1,
) => ({
  "line-color": color,
  "line-width": ["interpolate", ["linear"], ["zoom"], 7, 1.4, 13, 2.6],
  "line-opacity": opacity,
});

export const getSWTPSitesLinePaint = getSWTPSitesOutlinePaint;

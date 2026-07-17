export const MASTER_PLANNING_BOUNDARY_COLOR = "#34351f";

/**
 * Master Planning Boundary shown as a dark dashed outline with no polygon fill.
 * This follows the boundary appearance in the supplied reference screenshot.
 */
export const getMasterPlanningBoundaryOutlinePaint = (
  color = MASTER_PLANNING_BOUNDARY_COLOR,
  opacity = 1,
) => ({
  "line-color": color,
  "line-width": ["interpolate", ["linear"], ["zoom"], 7, 1.8, 13, 3.2],
  "line-opacity": opacity,
  "line-dasharray": [2.2, 1.35],
});

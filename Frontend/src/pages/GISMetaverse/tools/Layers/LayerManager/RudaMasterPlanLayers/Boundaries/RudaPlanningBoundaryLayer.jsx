export const RUDA_PLANNING_BOUNDARY_COLOR = "#f4ea00";

/**
 * Yellow dotted outline used for the RUDA Planning Boundary.
 * The same paint works for polygon outlines and line geometries.
 */
export const getRudaPlanningBoundaryOutlinePaint = (
  color = RUDA_PLANNING_BOUNDARY_COLOR,
  opacity = 1,
) => ({
  "line-color": color,
  "line-width": ["interpolate", ["linear"], ["zoom"], 7, 1.8, 13, 3],
  "line-opacity": opacity,
  "line-dasharray": [1, 1.6],
});

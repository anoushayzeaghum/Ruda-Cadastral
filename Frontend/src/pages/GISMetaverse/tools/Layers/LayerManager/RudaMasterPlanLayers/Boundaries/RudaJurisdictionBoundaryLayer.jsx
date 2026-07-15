export const RUDA_JURISDICTION_BOUNDARY_COLOR = "#ff00b8";

/**
 * Pink dotted outline used for the RUDA Jurisdiction Boundary.
 * The same paint works for polygon outlines and line geometries.
 */
export const getRudaJurisdictionBoundaryOutlinePaint = (
  color = RUDA_JURISDICTION_BOUNDARY_COLOR,
  opacity = 1,
) => ({
  "line-color": color,
  "line-width": ["interpolate", ["linear"], ["zoom"], 7, 1.8, 13, 3],
  "line-opacity": opacity,
  "line-dasharray": [1, 1.6],
});

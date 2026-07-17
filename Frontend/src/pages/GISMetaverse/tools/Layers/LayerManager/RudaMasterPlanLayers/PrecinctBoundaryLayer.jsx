export const PRECINCT_BOUNDARY_COLOR = "#f4ea00";

const PRECINCT_NAME_EXPRESSION = [
  "to-string",
  [
    "coalesce",
    ["get", "precinct_name"],
    ["get", "precient_name"],
    ["get", "precinct"],
    ["get", "precient"],
    ["get", "PRECINCT_NAME"],
    ["get", "PRECIENT_NAME"],
    ["get", "Precinct_Name"],
    ["get", "Precient_Name"],
    ["get", "name"],
    ["get", "Name"],
    ["get", "NAME"],
    ["get", "refname"],
    ["get", "REFNAME"],
    "Precinct Boundary",
  ],
];

/** Thick yellow boundary casing from the supplied precinct reference. */
export const getPrecinctBoundaryOutlinePaint = (
  color = PRECINCT_BOUNDARY_COLOR,
  opacity = 1,
) => ({
  "line-color": color,
  "line-width": ["interpolate", ["linear"], ["zoom"], 7, 3.2, 13, 5],
  "line-opacity": opacity,
});

/** Black dashed line drawn above the yellow casing. */
export const getPrecinctBoundaryLinePaint = (_color, opacity = 1) => ({
  "line-color": "#111111",
  "line-width": ["interpolate", ["linear"], ["zoom"], 7, 1, 13, 1.6],
  "line-opacity": opacity,
  "line-dasharray": [2, 1.8],
});

export const getPrecinctBoundaryLabelLayout = () => ({
  "text-field": PRECINCT_NAME_EXPRESSION,
  "text-size": ["interpolate", ["linear"], ["zoom"], 10, 11, 14, 16],
  "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
  "text-max-width": 14,
  "text-letter-spacing": 0.02,
  "text-anchor": "center",
  "text-allow-overlap": false,
  "text-ignore-placement": false,
});

export const getPrecinctBoundaryLabelPaint = (opacity = 1) => ({
  "text-color": "#111111",
  "text-opacity": opacity,
  "text-halo-color": "#f4ea00",
  "text-halo-width": 1.5,
  "text-halo-blur": 0.3,
});

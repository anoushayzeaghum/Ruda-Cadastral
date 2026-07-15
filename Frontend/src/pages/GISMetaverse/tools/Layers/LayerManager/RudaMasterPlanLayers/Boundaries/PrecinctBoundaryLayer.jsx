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

/** Yellow dotted precinct outline. */
export const getPrecinctBoundaryOutlinePaint = (
  color = PRECINCT_BOUNDARY_COLOR,
  opacity = 1,
) => ({
  "line-color": color,
  "line-width": ["interpolate", ["linear"], ["zoom"], 7, 1.6, 13, 2.8],
  "line-opacity": opacity,
  "line-dasharray": [1, 1.5],
});

/** Precinct names become visible once the map reaches the configured min zoom. */
export const getPrecinctBoundaryLabelLayout = () => ({
  "text-field": PRECINCT_NAME_EXPRESSION,
  "text-size": ["interpolate", ["linear"], ["zoom"], 10, 10, 14, 14],
  "text-max-width": 14,
  "text-letter-spacing": 0.02,
  "text-anchor": "center",
  "text-allow-overlap": false,
  "text-ignore-placement": false,
});

export const getPrecinctBoundaryLabelPaint = (opacity = 1) => ({
  "text-color": "#111827",
  "text-opacity": opacity,
  "text-halo-color": "#ffffff",
  "text-halo-width": 1.5,
  "text-halo-blur": 0.4,
});

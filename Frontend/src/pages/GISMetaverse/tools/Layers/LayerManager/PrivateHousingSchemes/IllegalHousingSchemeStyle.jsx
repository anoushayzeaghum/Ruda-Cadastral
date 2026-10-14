export const ILLEGAL_HOUSING_SCHEME_COLOR = "#ef4444";

const IllegalHousingSchemeStyle = Object.freeze({
  color: ILLEGAL_HOUSING_SCHEME_COLOR,
  fillOpacity: 0.42,
  lineOpacity: 1,
  lineWidth: ["interpolate", ["linear"], ["zoom"], 7, 1.4, 14, 3],
  pointRadius: ["interpolate", ["linear"], ["zoom"], 7, 3, 15, 6],
  pointStrokeColor: "#ffffff",
  pointStrokeWidth: 1,
});

export default IllegalHousingSchemeStyle;

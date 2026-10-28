export const ILLEGAL_HOUSING_SCHEME_COLOR = "#ef4444";
export const ILLEGAL_HOUSING_SCHEME_OUTLINE_COLOR = "#b91c1c";

const IllegalHousingSchemeStyle = Object.freeze({
  color: ILLEGAL_HOUSING_SCHEME_COLOR,
  fillColor: ILLEGAL_HOUSING_SCHEME_COLOR,
  fillEnabled: false,
  fillOpacity: 0.42,
  outlineColor: ILLEGAL_HOUSING_SCHEME_OUTLINE_COLOR,
  outlineEnabled: true,
  outlineOpacity: 1,
  outlineWidth: ["interpolate", ["linear"], ["zoom"], 7, 1.4, 14, 3],
  lineOpacity: 1,
  lineWidth: ["interpolate", ["linear"], ["zoom"], 7, 1.4, 14, 3],
  pointRadius: ["interpolate", ["linear"], ["zoom"], 7, 3, 15, 6],
  pointStrokeColor: "#ffffff",
  pointStrokeWidth: 1,
});

export default IllegalHousingSchemeStyle;
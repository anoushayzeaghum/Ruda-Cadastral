export const SIALKOT_MOTORWAY_DEFAULT_COLOR = "#f59e0b";

export const getSialkotMotorwayCasingPaint = (
  _color = SIALKOT_MOTORWAY_DEFAULT_COLOR,
  opacityRatio = 1,
) => ({
  "line-color": "#111111",
  "line-width": 7,
  "line-opacity": opacityRatio,
});

export const getSialkotMotorwayLinePaint = (
  color = SIALKOT_MOTORWAY_DEFAULT_COLOR,
  opacityRatio = 1,
) => ({
  "line-color": color,
  "line-width": 4.5,
  "line-opacity": opacityRatio,
});

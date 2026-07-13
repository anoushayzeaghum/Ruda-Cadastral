export const LAHORE_RING_ROAD_DEFAULT_COLOR = "#f5e600";

export const getLahoreRingRoadCasingPaint = (
  _color = LAHORE_RING_ROAD_DEFAULT_COLOR,
  opacityRatio = 1,
) => ({
  "line-color": "#111111",
  "line-width": 7,
  "line-opacity": opacityRatio,
});

export const getLahoreRingRoadLinePaint = (
  color = LAHORE_RING_ROAD_DEFAULT_COLOR,
  opacityRatio = 1,
) => ({
  "line-color": color,
  "line-width": 4.5,
  "line-opacity": opacityRatio,
});

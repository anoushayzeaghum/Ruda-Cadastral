export const ORANGE_TRACK_DEFAULT_COLOR = "#f59e0b";

export const getOrangeTrackCasingPaint = (
  _color = ORANGE_TRACK_DEFAULT_COLOR,
  opacityRatio = 1,
) => ({
  "line-color": "#111111",
  "line-width": 7,
  "line-opacity": opacityRatio,
});

export const getOrangeTrackLinePaint = (
  color = ORANGE_TRACK_DEFAULT_COLOR,
  opacityRatio = 1,
) => ({
  "line-color": color,
  "line-width": 4.5,
  "line-opacity": opacityRatio,
});

export const getOrangeTrackOverlayPaint = (
  _color = ORANGE_TRACK_DEFAULT_COLOR,
  opacityRatio = 1,
) => ({
  "line-color": "#ffffff",
  "line-width": 1.15,
  "line-opacity": opacityRatio,
  "line-dasharray": [1.5, 7],
});

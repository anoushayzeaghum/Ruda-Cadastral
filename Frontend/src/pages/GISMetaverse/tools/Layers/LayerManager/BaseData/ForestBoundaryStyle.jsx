const ForestBoundaryStyle = Object.freeze({
  color: "#22c55e",
  fillOpacity: 0.28,
  lineOpacity: 1,
  lineWidth: ["interpolate", ["linear"], ["zoom"], 7, 1.1, 14, 2.5],
  pointRadius: ["interpolate", ["linear"], ["zoom"], 7, 3, 15, 6],
  pointStrokeColor: "#ffffff",
  pointStrokeWidth: 1,
});

export default ForestBoundaryStyle;

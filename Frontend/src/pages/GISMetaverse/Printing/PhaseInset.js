import bbox from "@turf/bbox";
import {
  getRiverGeoJSON,
  getRiverRaviGeoJSON,
  getRudaGeoJSON,
} from "../../../services/metaverseApi";

const PHASE_STYLES = [
  { match: "2b", fill: "#F8D56B" },
  { match: "2a", fill: "#B99CF3" },
  { match: "phase 3", fill: "#F59E72" },
  { match: "phase - 3", fill: "#F59E72" },
  { match: "phase 1", fill: "#6BD69A" },
  { match: "phase - 1", fill: "#6BD69A" },
  { match: "jhok", fill: "#78D6D0" },
];

const getPhaseLabel = (properties = {}) =>
  properties.phases_new ??
  properties.phases ??
  properties.phase_name ??
  properties.phase ??
  properties.phase_no ??
  properties.phase_no_ ??
  properties.name ??
  properties.Name ??
  properties.name_ ??
  properties.project_name ??
  properties.project ??
  properties.title ??
  properties.label ??
  properties.remarks ??
  "";

const formatPhaseLabel = (value) => {
  const text = String(value || "").trim();
  const lower = text.toLowerCase();
  if (lower.includes("2b")) return "PHASE-2B";
  if (lower.includes("2a")) return "PHASE-2A";
  if (lower.includes("phase 3") || lower.includes("phase-3")) return "PHASE-3";
  if (lower.includes("phase 1") || lower.includes("phase-1")) return "PHASE-1";
  if (lower.includes("jhok")) return "JHOK FOREST";
  return text.toUpperCase();
};

const featureCollection = (value) =>
  value?.type === "FeatureCollection"
    ? value
    : { type: "FeatureCollection", features: [] };

const project = ([lng, lat], bounds, width, height, padding) => {
  const [minLng, minLat, maxLng, maxLat] = bounds;
  const scale = Math.min(
    (width - padding * 2) / (maxLng - minLng),
    (height - padding * 2) / (maxLat - minLat),
  );
  const renderedW = (maxLng - minLng) * scale;
  const renderedH = (maxLat - minLat) * scale;
  const offsetX = padding + (width - padding * 2 - renderedW) / 2;
  const offsetY = padding + (height - padding * 2 - renderedH) / 2;
  return [
    offsetX + (lng - minLng) * scale,
    offsetY + renderedH - (lat - minLat) * scale,
  ];
};

const drawGeometry = (ctx, geometry, drawPath) => {
  if (!geometry) return;
  const polygons =
    geometry.type === "Polygon"
      ? [geometry.coordinates]
      : geometry.type === "MultiPolygon"
        ? geometry.coordinates
        : [];
  polygons.forEach((polygon) => {
    ctx.beginPath();
    polygon.forEach((ring) => {
      if (!ring?.length) return;
      const [sx, sy] = drawPath(ring[0]);
      ctx.moveTo(sx, sy);
      ring.slice(1).forEach((coordinate) => {
        const [x, y] = drawPath(coordinate);
        ctx.lineTo(x, y);
      });
      ctx.closePath();
    });
    ctx.fill("evenodd");
    ctx.stroke();
  });
};

const drawRiverLayer = (ctx, geojson, drawPath, fill, stroke, opacity) => {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 5;
  (geojson.features || []).forEach((feature) =>
    drawGeometry(ctx, feature.geometry, drawPath),
  );
  ctx.restore();
};

export const createPhaseInsetImage = async () => {
  const [phaseResult, proposedRiverResult, riverResult] = await Promise.all([
    getRudaGeoJSON(),
    getRiverGeoJSON(),
    getRiverRaviGeoJSON(),
  ]);
  const phaseGeoJSON = featureCollection(phaseResult);
  if (!phaseGeoJSON.features.length)
    throw new Error("Master Plan Phases contains no features.");
  const bounds = bbox(phaseGeoJSON);
  if (!bounds.every(Number.isFinite))
    throw new Error("Could not compute phase extent.");

  const width = 1180;
  const height = 940;
  const padding = 8;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  const drawPath = (coordinate) =>
    project(coordinate, bounds, width, height, padding);

  phaseGeoJSON.features.forEach((feature) => {
    const label = String(getPhaseLabel(feature.properties || ""));
    const style = PHASE_STYLES.find(({ match }) =>
      label.toLowerCase().includes(match),
    );
    ctx.fillStyle = style?.fill || "#D9E2EC";
    ctx.strokeStyle = "#5E6A7C";
    ctx.lineWidth = 2;
    drawGeometry(ctx, feature.geometry, drawPath);
  });
  drawRiverLayer(
    ctx,
    featureCollection(proposedRiverResult),
    drawPath,
    "#f97316",
    "#f97316",
    0.22,
  );
  drawRiverLayer(
    ctx,
    featureCollection(riverResult),
    drawPath,
    "#3b82f6",
    "#3b82f6",
    0.72,
  );

  const labels = new Map();
  phaseGeoJSON.features.forEach((feature) => {
    const label = formatPhaseLabel(getPhaseLabel(feature.properties || {}));
    if (!label) return;
    try {
      const featureBounds = bbox(feature);
      const previous = labels.get(label);
      labels.set(
        label,
        previous
          ? [
              Math.min(previous[0], featureBounds[0]),
              Math.min(previous[1], featureBounds[1]),
              Math.max(previous[2], featureBounds[2]),
              Math.max(previous[3], featureBounds[3]),
            ]
          : featureBounds,
      );
    } catch {
      // Ignore malformed phase geometry while preserving the rest of the inset.
    }
  });

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 34px Arial, sans-serif";
  ctx.lineJoin = "round";
  labels.forEach((featureBounds, label) => {
    const [x, y] = drawPath([
      (featureBounds[0] + featureBounds[2]) / 2,
      (featureBounds[1] + featureBounds[3]) / 2,
    ]);
    ctx.strokeStyle = "rgba(255,255,255,0.96)";
    ctx.lineWidth = 8;
    ctx.strokeText(label, x, y);
    ctx.fillStyle = "#2f3742";
    ctx.fillText(label, x, y);
  });
  ctx.restore();
  return canvas.toDataURL("image/png", 1);
};

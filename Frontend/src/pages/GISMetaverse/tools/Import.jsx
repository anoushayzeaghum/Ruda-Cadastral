import React, { useEffect, useState, useRef } from "react";
import {
  X,
  Upload,
  Trash2,
  FileCheck,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import bbox from "@turf/bbox";
import shp from "shpjs";
import JSZip from "jszip";
import { kml as kmlToGeoJSON } from "@tmcw/togeojson";
import RudaLogo from "../../../assets/Ruda.png";
import { PRINT_EVENTS, dispatchPrintEvent } from "../Printing/PrintEvents";
import {
  getMpPrincipleZoningGeoJSON,
  getRiverGeoJSON,
  getRiverRaviGeoJSON,
  getRudaGeoJSON,
} from "../../../services/metaverseApi";
import {
  normalizeLandUseGeoJSON,
} from "./Layers/LayerManager/BaseData/LandUseLayer";
import {
  RIVER_BOUNDARY_COLOR,
} from "./Layers/LayerManager/RudaMasterPlanLayers/RTWLayers/RiverBoundaryLayer";
import {
  RIVER_RAVI_COLOR,
  RIVER_RAVI_WATER_PLANE_COLOR,
  RIVER_RAVI_RIVER_BED_COLOR,
} from "./Layers/LayerManager/RudaMasterPlanLayers/RTWLayers/RiverRaviLayer";

// ── constants ──────────────────────────────────────────────────────────────────
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_EXTENSIONS = [".geojson", ".json", ".kml", ".kmz", ".zip"];
const SOURCE_ID = "user-imported-data";
const LAYER_IDS = {
  fill: "user-imported-fill",
  outline: "user-imported-outline",
  label: "user-imported-label",
  line: "user-imported-line",
  point: "user-imported-point",
};

// ── helpers ────────────────────────────────────────────────────────────────────

/** Detect file type from extension */
const detectFileType = (fileName) => {
  const name = fileName.toLowerCase();
  if (name.endsWith(".geojson") || name.endsWith(".json")) return "geojson";
  if (name.endsWith(".kml")) return "kml";
  if (name.endsWith(".kmz")) return "kmz";
  if (name.endsWith(".zip")) return "shapefile";
  return null;
};

/** Safely remove all imported layers + source from the map */
const removeImportedLayers = (map) => {
  if (!map) return;
  Object.values(LAYER_IDS).forEach((id) => {
    if (map.getLayer(id)) map.removeLayer(id);
  });
  if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
};

/** Normalise shpjs output — if multiple shapefiles, merge into one FeatureCollection */
const normaliseGeoJSON = (data) => {
  if (Array.isArray(data)) {
    const features = data.flatMap((fc) => fc.features || []);
    return { type: "FeatureCollection", features };
  }
  if (data.type === "FeatureCollection") return data;
  if (data.type === "Feature")
    return { type: "FeatureCollection", features: [data] };
  // bare Geometry
  return {
    type: "FeatureCollection",
    features: [{ type: "Feature", geometry: data, properties: {} }],
  };
};

/** Build a summary object from a FeatureCollection */
const summarise = (fc) => {
  const count = fc.features.length;
  const types = [
    ...new Set(fc.features.map((f) => f.geometry?.type).filter(Boolean)),
  ];
  return { count, types };
};

/** Validate that a parsed object is valid GeoJSON */
const validateGeoJSON = (obj) => {
  if (!obj || typeof obj !== "object")
    return "File does not contain valid JSON.";
  const validTypes = [
    "FeatureCollection",
    "Feature",
    "Point",
    "MultiPoint",
    "LineString",
    "MultiLineString",
    "Polygon",
    "MultiPolygon",
    "GeometryCollection",
  ];
  if (!validTypes.includes(obj.type))
    return `Invalid GeoJSON type "${obj.type}".`;
  const fc = normaliseGeoJSON(obj);
  if (!fc.features || fc.features.length === 0)
    return "GeoJSON contains no features.";
  return null; // valid
};

/**
 * Parse a KML string (text) into a normalised GeoJSON FeatureCollection.
 * Uses @tmcw/togeojson which works with a DOM Document, so we parse
 * the KML text with DOMParser first.
 */
const parseKMLText = (kmlText) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(kmlText, "text/xml");

  // Detect XML parse errors
  const parserError = doc.querySelector("parsererror");
  if (parserError) {
    throw new Error("KML file contains invalid XML.");
  }

  const geojson = kmlToGeoJSON(doc);
  return normaliseGeoJSON(geojson);
};

const waitForMapRender = (map, timeoutMs = 5000) =>
  new Promise((resolve) => {
    if (!map) {
      resolve();
      return;
    }

    let finished = false;
    let timeoutId;

    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timeoutId);
      map.off("idle", finish);
      map.off("render", onRender);
      resolve();
    };

    const onRender = () => {
      // Wait one extra animation frame so the WebGL buffer contains the
      // newly-fitted camera and all visible vector/raster layers.
      requestAnimationFrame(() => requestAnimationFrame(finish));
    };

    timeoutId = setTimeout(finish, timeoutMs);

    if (!map.isStyleLoaded?.()) {
      map.once("load", () => {
        map.once("idle", finish);
        map.once("render", onRender);
        map.triggerRepaint?.();
      });
      return;
    }

    map.once("idle", finish);
    map.once("render", onRender);
    map.triggerRepaint?.();
  });

const getImportedTitle = (fileName = "Imported Boundary") =>
  fileName
    .replace(/\.(geojson|json|kml|kmz|zip)$/i, "")
    .replace(/[_-]+/g, " ")
    .trim();

const prepareImportedFeatures = (geojson, fallbackLabel) => ({
  ...geojson,
  features: (geojson.features || []).map((feature, index) => {
    const properties = feature.properties || {};
    const label =
      properties.name ||
      properties.Name ||
      properties.NAME ||
      properties.title ||
      properties.Title ||
      properties.label ||
      properties.Label ||
      fallbackLabel ||
      `Imported Feature ${index + 1}`;

    return {
      ...feature,
      properties: {
        ...properties,
        _import_label: String(label),
      },
    };
  }),
});

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");


// ── KMZ print inset: pure Canvas 2D cartographic renderer ─────────────────────
//
// No Mapbox map is created for the inset. All rendering is done with Canvas 2D
// so the output is deterministic, basemap-free, and visually matches the
// reference RUDA Principle Land Use Zoning layout.

// Print-specific zoning colours — saturated to match the reference image.
const PRINT_ZONING_STYLE = {
  "brown zone":        { fill: "#f9c65b", outline: "#f218b8" },
  "green zone":        { fill: "#7df15a", outline: "#f218b8" },
  "infill development":{ fill: "#ff22c8", outline: "#f218b8" },
  "industrial zone":   { fill: "#b62ce8", outline: "#f218b8" },
  "public utility zone":{ fill: "#ffd15a", hatch: "#ff5a36", outline: "#f218b8" },
  "pond area":         { fill: "#73c7f2", outline: "#3a91d8" },
};

// Legend definition for the canvas-drawn inset legend (order matches reference).
const PRINT_ZONING_LEGEND = [
  { label: "Brown Zone",         fill: "#f9c65b" },
  { label: "Green Zone",         fill: "#7df15a" },
  { label: "Infill Development", fill: "#ff22c8" },
  { label: "Industrial Zone",    fill: "#b62ce8" },
  { label: "Public Utility Zone",fill: "#ffd15a", hatch: "#ff5a36" },
  { label: "Pond Area",          fill: "#73c7f2" },
];

/** Normalise common API response shapes to a GeoJSON FeatureCollection. */
const toFeatureCollection = (value) => {
  const raw = value?.data || value?.results || value;
  if (raw?.type === "FeatureCollection") return raw;
  if (raw?.type === "Feature") {
    return { type: "FeatureCollection", features: [raw] };
  }
  if (Array.isArray(raw?.features)) {
    return { type: "FeatureCollection", features: raw.features };
  }
  if (Array.isArray(raw)) {
    return { type: "FeatureCollection", features: raw };
  }
  return { type: "FeatureCollection", features: [] };
};

/** Extract the phase/zone label used by the existing Master Plan Phases layer. */
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

const formatInsetPhaseLabel = (value = "") => {
  const text = String(value).trim();
  if (!text) return "";
  const lower = text.toLowerCase();
  if (lower.includes("2b")) return "PHASE-2B";
  if (lower.includes("2a")) return "PHASE-2A";
  if (lower.includes("phase 3") || lower.includes("phase-3") || lower.includes("phase - 3")) return "PHASE-3";
  if (lower.includes("phase 1") || lower.includes("phase-1") || lower.includes("phase - 1")) return "PHASE-1";
  if (lower.includes("jhok")) return "JHOK FOREST";
  return text.toUpperCase();
};

/** Return the print style for a normalised zoning category string. */
const getPrintZoningStyle = (category) =>
  PRINT_ZONING_STYLE[category] ?? { fill: "#cccccc", outline: "#888888" };

/**
 * Build a geographic → canvas pixel transform that:
 * - preserves the zoning aspect ratio (no stretch)
 * - centres the geometry inside the canvas
 * - leaves `padding` pixels of white space on all sides
 */
const createInsetTransform = ({ bounds, width, height, padding }) => {
  const [minLng, minLat, maxLng, maxLat] = bounds;
  const geoW = maxLng - minLng;
  const geoH = maxLat - minLat;
  if (geoW === 0 || geoH === 0) return null;

  const usableW = width  - padding * 2;
  const usableH = height - padding * 2;

  // Single scale factor so circles remain circles and shapes aren't distorted.
  const scale = Math.min(usableW / geoW, usableH / geoH);

  // Rendered geometry size
  const renderedW = geoW * scale;
  const renderedH = geoH * scale;

  // Offsets that centre the geometry in the usable area
  const offsetX = padding + (usableW - renderedW) / 2;
  const offsetY = padding + (usableH - renderedH) / 2;

  return { minLng, minLat, scale, offsetX, offsetY, renderedH };
};

/** Convert a [lng, lat] pair to canvas [x, y] using the inset transform. */
const projectLngLatToInset = ([lng, lat], transform) => {
  const { minLng, minLat, scale, offsetX, offsetY, renderedH } = transform;
  const x = offsetX + (lng - minLng) * scale;
  // Y is flipped: north is up → higher lat = smaller canvas Y
  const y = offsetY + renderedH - (lat - minLat) * scale;
  return [x, y];
};

/**
 * Create a repeating diagonal hatch canvas pattern for Public Utility Zone.
 * Returns a CanvasPattern that can be set as ctx.fillStyle.
 */
const createPublicUtilityHatchPattern = (ctx, bgColor, hatchColor, size = 12) => {
  const patCanvas = document.createElement("canvas");
  patCanvas.width  = size;
  patCanvas.height = size;
  const pctx = patCanvas.getContext("2d");

  pctx.fillStyle = bgColor;
  pctx.fillRect(0, 0, size, size);

  pctx.strokeStyle = hatchColor;
  pctx.lineWidth = 2.2;
  pctx.beginPath();
  pctx.moveTo(-2, size);
  pctx.lineTo(size, -2);
  pctx.stroke();
  pctx.beginPath();
  pctx.moveTo(size - 2, size + 2);
  pctx.lineTo(size + 2, size - 2);
  pctx.stroke();

  return ctx.createPattern(patCanvas, "repeat");
};

/**
 * Draw all zoning polygon features onto the canvas.
 * Handles Polygon and MultiPolygon geometry types.
 * Uses even-odd fill so rings with holes render correctly.
 */
const drawZoningFeatures = ({ ctx, geojson, transform }) => {
  const NORMALIZED_FIELD = "__zoning_cat";

  // Pre-build hatch patterns keyed by category so we create each once.
  const hatchPatterns = {};

  const buildPath = (rings) => {
    ctx.beginPath();
    for (const ring of rings) {
      if (!ring || ring.length < 3) continue;
      const [sx, sy] = projectLngLatToInset(ring[0], transform);
      ctx.moveTo(sx, sy);
      for (let i = 1; i < ring.length; i++) {
        const [cx, cy] = projectLngLatToInset(ring[i], transform);
        ctx.lineTo(cx, cy);
      }
      ctx.closePath();
    }
  };

  const drawFeature = (feature) => {
    const cat  = feature?.properties?.[NORMALIZED_FIELD] ?? "";
    const style = getPrintZoningStyle(cat);
    const geom  = feature?.geometry;
    if (!geom) return;

    const polygons =
      geom.type === "Polygon"      ? [geom.coordinates] :
      geom.type === "MultiPolygon" ? geom.coordinates   : [];

    for (const polygon of polygons) {
      // polygon = array of rings (outer + holes)
      buildPath(polygon);

      // Base fill
      ctx.fillStyle = style.fill;
      ctx.fill("evenodd");

      // Hatch overlay for public utility zone
      if (style.hatch) {
        if (!hatchPatterns[cat]) {
          hatchPatterns[cat] = createPublicUtilityHatchPattern(
            ctx, style.fill, style.hatch,
          );
        }
        ctx.fillStyle = hatchPatterns[cat];
        buildPath(polygon); // re-build path after fill consumed it
        ctx.fill("evenodd");
      }

      // Polygon outline
      ctx.strokeStyle = style.outline;
      ctx.lineWidth   = 1.8;
      buildPath(polygon);
      ctx.stroke();
    }
  };

  // Draw non-hatch zones first, then hatch, to keep the outline on top.
  const features = geojson.features ?? [];
  features.forEach((f) => {
    const cat = f?.properties?.[NORMALIZED_FIELD] ?? "";
    if (!PRINT_ZONING_STYLE[cat]?.hatch) drawFeature(f);
  });
  features.forEach((f) => {
    const cat = f?.properties?.[NORMALIZED_FIELD] ?? "";
    if (PRINT_ZONING_STYLE[cat]?.hatch) drawFeature(f);
  });
};

/** Draw Polygon/MultiPolygon/LineString/MultiLineString geometry on the inset. */
const traceGeometryOnInset = ({ ctx, geometry, transform }) => {
  if (!geometry) return;

  const traceLine = (coords, close = false) => {
    if (!coords?.length) return;
    const [sx, sy] = projectLngLatToInset(coords[0], transform);
    ctx.moveTo(sx, sy);
    for (let i = 1; i < coords.length; i++) {
      const [x, y] = projectLngLatToInset(coords[i], transform);
      ctx.lineTo(x, y);
    }
    if (close) ctx.closePath();
  };

  if (geometry.type === "Polygon") {
    geometry.coordinates.forEach((ring) => traceLine(ring, true));
  } else if (geometry.type === "MultiPolygon") {
    geometry.coordinates.forEach((polygon) =>
      polygon.forEach((ring) => traceLine(ring, true)),
    );
  } else if (geometry.type === "LineString") {
    traceLine(geometry.coordinates, false);
  } else if (geometry.type === "MultiLineString") {
    geometry.coordinates.forEach((line) => traceLine(line, false));
  }
};

/**
 * Draw Proposed River beneath River 2025 using the colours from the project's
 * existing RUDA Master Plan river layer files.
 */
const drawInsetRiverLayers = ({
  ctx,
  proposedRiverGeoJSON,
  riverRaviGeoJSON,
  transform,
}) => {
  const drawCollection = ({ geojson, fillColor, fillOpacity, lineColor, lineWidth, riverRavi = false }) => {
    (geojson?.features || []).forEach((feature) => {
      const geometry = feature?.geometry;
      if (!geometry) return;

      let resolvedColor = fillColor;
      if (riverRavi) {
        const props = feature.properties || {};
        const type = String(
          props.type ?? props.river_type ?? props.category ?? props.landuse ?? "",
        ).trim().toLowerCase();
        resolvedColor = type.includes("bed")
          ? RIVER_RAVI_RIVER_BED_COLOR
          : RIVER_RAVI_WATER_PLANE_COLOR;
      }

      const isPolygon = geometry.type === "Polygon" || geometry.type === "MultiPolygon";
      ctx.beginPath();
      traceGeometryOnInset({ ctx, geometry, transform });
      if (isPolygon) {
        ctx.save();
        ctx.globalAlpha = fillOpacity;
        ctx.fillStyle = resolvedColor;
        ctx.fill("evenodd");
        ctx.restore();
      }
      ctx.strokeStyle = lineColor || resolvedColor;
      ctx.lineWidth = lineWidth;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();
    });
  };

  // Proposed River first so River 2025 remains visually dominant on top.
  drawCollection({
    geojson: proposedRiverGeoJSON,
    fillColor: RIVER_BOUNDARY_COLOR,
    fillOpacity: 0.22,
    lineColor: RIVER_BOUNDARY_COLOR,
    lineWidth: 5,
  });

  drawCollection({
    geojson: riverRaviGeoJSON,
    fillColor: RIVER_RAVI_COLOR,
    fillOpacity: 0.72,
    lineColor: RIVER_RAVI_COLOR,
    lineWidth: 4,
    riverRavi: true,
  });
};

/**
 * Draw phase/zone labels such as PHASE-1, PHASE-2A, PHASE-2B and PHASE-3
 * on top of the zoning inset. Labels use the same property fallbacks as the
 * existing MasterPlanPhasesLayer.
 */
const drawInsetPhaseLabels = ({ ctx, phaseGeoJSON, transform }) => {
  const grouped = new Map();

  (phaseGeoJSON?.features || []).forEach((feature) => {
    const label = formatInsetPhaseLabel(getPhaseLabel(feature?.properties || {}));
    if (!label || !feature?.geometry) return;
    try {
      const b = bbox(feature);
      if (!b.every((v) => Number.isFinite(v))) return;
      const existing = grouped.get(label);
      if (!existing) grouped.set(label, [...b]);
      else {
        existing[0] = Math.min(existing[0], b[0]);
        existing[1] = Math.min(existing[1], b[1]);
        existing[2] = Math.max(existing[2], b[2]);
        existing[3] = Math.max(existing[3], b[3]);
      }
    } catch {
      // Skip malformed phase geometry without affecting the inset.
    }
  });

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 34px Arial, sans-serif";
  ctx.lineJoin = "round";

  grouped.forEach((b, label) => {
    const lng = (b[0] + b[2]) / 2;
    const lat = (b[1] + b[3]) / 2;
    const [x, y] = projectLngLatToInset([lng, lat], transform);

    // Strong white halo keeps the labels readable on saturated zoning fills.
    ctx.strokeStyle = "rgba(255,255,255,0.96)";
    ctx.lineWidth = 8;
    ctx.strokeText(label, x, y);
    ctx.fillStyle = "#2f3742";
    ctx.fillText(label, x, y);
  });

  ctx.restore();
};

/**
 * Draw the compact Land Use Zoning legend directly onto the inset canvas.
 * Placed in the bottom-right corner by default; shifts up if that area is
 * likely to contain the KMZ callout.
 */
const drawInsetZoningLegend = ({ ctx, width, height, kmzPixelX, kmzPixelY }) => {
  const swatchW   = 38;
  const swatchH   = 22;
  const padX      = 16;
  const padY      = 14;
  const rowH      = 33;
  const fontSize  = 27;
  const titleSize = 32;

  const rows = PRINT_ZONING_LEGEND;

  ctx.font = `600 ${fontSize}px Arial, sans-serif`;
  const maxLabelW = rows.reduce((max, item) => {
    const w = ctx.measureText(item.label).width;
    return Math.max(max, w);
  }, 0);

  const boxW = swatchW + padX * 3 + maxLabelW;
  const boxH =
    padY * 2 + titleSize + 8 +
    PRINT_ZONING_LEGEND.length * rowH;
  const margin = 14;

  let bx = width - boxW - margin;
  let by = height - boxH - margin;

  if (
    typeof kmzPixelX === "number" && typeof kmzPixelY === "number" &&
    kmzPixelX > width / 2 && kmzPixelY > height / 2
  ) {
    by = margin;
  }

  ctx.fillStyle = "rgba(255,255,255,0.98)";
  ctx.fillRect(bx, by, boxW, boxH);
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 1.6;
  ctx.strokeRect(bx, by, boxW, boxH);

  ctx.font = `700 ${titleSize}px Arial, sans-serif`;
  ctx.fillStyle = "#111827";
  ctx.textBaseline = "top";
  ctx.fillText("Land Use Zoning", bx + padX, by + padY);

  let rowY = by + padY + titleSize + 8;

  const drawLegendRow = (item) => {
    const sx = bx + padX;
    const sy = rowY + (rowH - swatchH) / 2;
    ctx.fillStyle = item.fill;
    ctx.fillRect(sx, sy, swatchW, swatchH);

    if (item.hatch) {
      const swatchPat = createPublicUtilityHatchPattern(ctx, item.fill, item.hatch, 8);
      ctx.fillStyle = swatchPat;
      ctx.fillRect(sx, sy, swatchW, swatchH);
    }

    ctx.strokeStyle = "rgba(17,24,39,0.45)";
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, sy, swatchW, swatchH);

    ctx.font = `500 ${fontSize}px Arial, sans-serif`;
    ctx.fillStyle = "#111827";
    ctx.textBaseline = "middle";
    ctx.fillText(item.label, sx + swatchW + padX, rowY + rowH / 2);
    rowY += rowH;
  };

  PRINT_ZONING_LEGEND.forEach(drawLegendRow);
};

/**
 * Draw the KMZ location callout: red dot marker + leader line + label box.
 * The label box is placed in the quadrant with the most open space.
 */
const drawKmzLocationCallout = ({ ctx, px, py, label, width, height }) => {
  const safeLabel = String(label || "Imported KMZ");

  // ── Marker ────────────────────────────────────────────────────────────────
  // White halo
  ctx.beginPath();
  ctx.arc(px, py, 18, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fill();
  ctx.strokeStyle = "#7f1d1d";
  ctx.lineWidth   = 2;
  ctx.stroke();
  // Red dot
  ctx.beginPath();
  ctx.arc(px, py, 10, 0, Math.PI * 2);
  ctx.fillStyle   = "#dc2626";
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth   = 1.5;
  ctx.stroke();

  // ── Callout box ───────────────────────────────────────────────────────────
  // Keep the locator readable after the high-resolution canvas is scaled
  // into the print inset.
  const fontSize   = 30;
  const boxPadX    = 16;
  const boxPadY    = 12;
  const maxTextW   = 400;
  const leaderGap  = 42;
  const margin     = 24;

  ctx.font = `700 ${fontSize}px Arial, sans-serif`;
  const measured = Math.min(ctx.measureText(safeLabel).width, maxTextW);
  const boxW = measured + boxPadX * 2;
  const boxH = fontSize  + boxPadY * 2;

  // Quadrant: push the box away from the canvas centre so it sits in open space.
  const placeRight = px < width  / 2;
  const placeBelow = py < height / 2;

  let bx = placeRight ? px + leaderGap : px - leaderGap - boxW;
  let by = placeBelow ? py + leaderGap : py - leaderGap - boxH;

  bx = Math.max(margin, Math.min(bx, width  - boxW - margin));
  by = Math.max(margin, Math.min(by, height - boxH - margin));

  // Leader line: connect marker centre to nearest edge of the box
  const anchorX =
    px < bx         ? bx :
    px > bx + boxW  ? bx + boxW :
    bx + boxW / 2;
  const anchorY =
    py < by         ? by :
    py > by + boxH  ? by + boxH :
    by + boxH / 2;

  ctx.strokeStyle = "#8b2d2d";
  ctx.lineWidth   = 2.2;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(anchorX, anchorY);
  ctx.stroke();

  // Box shadow
  ctx.shadowColor   = "rgba(0,0,0,0.18)";
  ctx.shadowBlur    = 6;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(bx, by, boxW, boxH);
  ctx.shadowColor = "transparent";
  ctx.shadowBlur  = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  ctx.strokeStyle = "#8b2d2d";
  ctx.lineWidth   = 1.5;
  ctx.strokeRect(bx, by, boxW, boxH);

  ctx.fillStyle    = "#111827";
  ctx.textBaseline = "middle";
  ctx.fillText(safeLabel, bx + boxPadX, by + boxH / 2, maxTextW);
};

/**
 * Main inset image generator.
 *
 * Renders a print-quality RUDA Principle Land Use Zoning overview using
 * pure Canvas 2D (no Mapbox map). The uploaded KMZ is represented only as
 * a callout annotation at its geographic centre. Returns a PNG DataURL.
 */
const createPrincipleLandUseInsetImage = async ({ importedGeoJSON, label }) => {
  // Fetch the exact RUDA Master Plan datasets used by the live layer manager.
  // River/phase calls are optional: a failure must not stop the zoning inset.
  const [zoningResult, proposedRiverResult, riverRaviResult, phasesResult] =
    await Promise.allSettled([
      getMpPrincipleZoningGeoJSON(),
      getRiverGeoJSON(),
      getRiverRaviGeoJSON(),
      getRudaGeoJSON(),
    ]);

  if (zoningResult.status !== "fulfilled") {
    throw zoningResult.reason || new Error("Could not load Principle Land Use Zoning.");
  }

  const zoningGeoJSON = normalizeLandUseGeoJSON(zoningResult.value);
  if (!zoningGeoJSON?.features?.length) {
    throw new Error("Principle Land Use Zoning contains no features.");
  }

  const proposedRiverGeoJSON =
    proposedRiverResult.status === "fulfilled"
      ? toFeatureCollection(proposedRiverResult.value)
      : { type: "FeatureCollection", features: [] };
  const riverRaviGeoJSON =
    riverRaviResult.status === "fulfilled"
      ? toFeatureCollection(riverRaviResult.value)
      : { type: "FeatureCollection", features: [] };
  const phaseGeoJSON =
    phasesResult.status === "fulfilled"
      ? toFeatureCollection(phasesResult.value)
      : { type: "FeatureCollection", features: [] };

  if (proposedRiverResult.status === "rejected") {
    console.warn("Proposed River could not be added to KMZ inset.", proposedRiverResult.reason);
  }
  if (riverRaviResult.status === "rejected") {
    console.warn("River 2025 could not be added to KMZ inset.", riverRaviResult.reason);
  }
  if (phasesResult.status === "rejected") {
    console.warn("RUDA phase labels could not be added to KMZ inset.", phasesResult.reason);
  }

  // Slightly taller canvas + very small geographic margin makes the long RUDA
  // zoning footprint fill more of the inset while still preserving the full extent.
  const CANVAS_W = 1180;
  const CANVAS_H =  940;
  const PADDING  =    8;

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const zoningBounds = bbox(zoningGeoJSON);
  if (!zoningBounds.every((v) => Number.isFinite(v))) {
    throw new Error("Could not compute zoning extent.");
  }

  const transform = createInsetTransform({
    bounds: zoningBounds,
    width: CANVAS_W,
    height: CANVAS_H,
    padding: PADDING,
  });
  if (!transform) throw new Error("Degenerate zoning extent.");

  // 1) Principle Land Use Zoning base.
  drawZoningFeatures({ ctx, geojson: zoningGeoJSON, transform });

  // 2) Proposed River + River 2025 from RUDAMasterPlan.jsx configuration.
  drawInsetRiverLayers({
    ctx,
    proposedRiverGeoJSON,
    riverRaviGeoJSON,
    transform,
  });

  // 3) Phase/zone labels, e.g. PHASE-1 / PHASE-2A / PHASE-2B / PHASE-3.
  drawInsetPhaseLabels({ ctx, phaseGeoJSON, transform });

  // 4) Locate the imported KMZ on the same geographic transform.
  let kmzPx = null;
  let kmzPy = null;
  try {
    const kmzBounds = bbox(importedGeoJSON);
    if (kmzBounds.every((v) => Number.isFinite(v))) {
      const kmzLng = (kmzBounds[0] + kmzBounds[2]) / 2;
      const kmzLat = (kmzBounds[1] + kmzBounds[3]) / 2;
      [kmzPx, kmzPy] = projectLngLatToInset([kmzLng, kmzLat], transform);
    }
  } catch {
    // KMZ location unavailable — zoning + rivers + labels can still print.
  }

  if (kmzPx !== null && kmzPy !== null) {
    drawKmzLocationCallout({
      ctx,
      px: kmzPx,
      py: kmzPy,
      label,
      width: CANVAS_W,
      height: CANVAS_H,
    });
  }

  // Draw legend last so it is never hidden by river, phase or callout graphics.
  drawInsetZoningLegend({
    ctx,
    width: CANVAS_W,
    height: CANVAS_H,
    kmzPixelX: kmzPx,
    kmzPixelY: kmzPy,
  });

  return canvas.toDataURL("image/png", 1);
};

const buildLegendRows = (uploadedTitle) => [
  {
    id: "ruda-jurisdiction",
    label: "Lahore RUDA Jurisdiction",
    kind: "jurisdiction",
  },
  {
    id: "uploaded-boundary",
    label: uploadedTitle || "Imported Boundary",
    kind: "imported",
  },
];

const makePrintableHtml = ({
  title,
  mapImage,
  insetImage,
  legendRows,
  logoUrl,
  scaleText,
}) => {
  const legendHtml = legendRows
    .map(
      (item) => `
        <div class="legend-row">
          <span class="legend-swatch ${escapeHtml(item.kind)}"></span>
          <span>${escapeHtml(item.label)}</span>
        </div>`,
    )
    .join("");

  const landUseLegendHtml = ""; // Legend is now rendered directly into the inset PNG.

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A3 landscape; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; width: 100%; height: 100%; font-family: Arial, Helvetica, sans-serif; }
    body { background: #fff; }
    .sheet {
      position: relative;
      width: 420mm;
      height: 297mm;
      overflow: hidden;
      border: 3px solid #1f2937;
      background: #f8fafc;
    }
    .map {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      display: block;
    }
    .title {
      position: absolute;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      min-width: 38%;
      padding: 10px 20px;
      background: rgba(255,255,255,.94);
      border: 1px solid #334155;
      text-align: center;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: .02em;
      box-shadow: 0 8px 22px rgba(0,0,0,.18);
    }
    .logo-box {
      position: absolute;
      left: 16px;
      top: 16px;
      width: 108px;
      height: 108px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,.96);
      border: 1px solid #334155;
      padding: 8px;
    }
    .logo-box img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .north {
      position: absolute;
      right: 18px;
      top: 16px;
      width: 108px;
      height: 108px;
      border: 1px solid #334155;
      background: rgba(255,255,255,.96);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 5px;
    }
    .north svg { width: 96px; height: 96px; display: block; }
    /* ── Bottom-left block: inset map + credit, visually attached ── */
    .bottom-left-block {
      position: absolute;
      left: 18px;
      bottom: 18px;
      width: 400px;
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .inset {
      width: 100%;
      background: #ffffff;
      border: 2px solid #111827;
      border-bottom: none;
      padding: 5px;
      box-shadow: 0 3px 10px rgba(0,0,0,.14);
    }
    .inset-map-wrap { position: relative; width: 100%; }
    .inset img {
      width: 100%;
      height: auto;
      object-fit: contain;
      object-position: center;
      background: #ffffff;
      border: 1px solid #64748b;
      display: block;
    }
    .legend {
      position: absolute;
      right: 18px;
      bottom: 18px;
      width: 270px;
      max-height: 290px;
      overflow: hidden;
      background: rgba(255,255,255,.96);
      border: 2px solid #334155;
      padding: 12px;
    }
    .legend h3 { margin: 0 0 8px; font-size: 18px; }
    .legend-row { display: flex; align-items: center; gap: 8px; margin: 6px 0; font-size: 11px; }
    .legend-swatch {
      width: 34px;
      height: 17px;
      flex: 0 0 auto;
      background: transparent;
    }
    .legend-swatch.imported {
      border: 3px solid #ffff00;
      background: rgba(209,213,219,.5);
    }
    .legend-swatch.jurisdiction {
      border: 3px solid #d100b8;
      box-shadow: inset 0 0 0 1px #ffffff;
    }
    .scale {
      position: absolute;
      left: 50%;
      bottom: 18px;
      transform: translateX(-50%);
      background: rgba(255,255,255,.94);
      border: 1px solid #334155;
      padding: 7px 12px;
      font-size: 12px;
      font-weight: 700;
    }
    .scale-bar {
      width: 210px;
      height: 10px;
      margin-top: 5px;
      border: 1px solid #111827;
      background: linear-gradient(90deg,#111827 0 25%,#fff 25% 50%,#111827 50% 75%,#fff 75% 100%);
    }
    .credit {
      width: 100%;
      padding: 5px 6px;
      background: rgba(255,255,255,.96);
      border: 2px solid #111827;
      border-top: 1px solid #334155;
      font-size: 8.5px;
      line-height: 1.25;
      font-weight: 700;
      text-align: center;
    }
    @media print {
      html, body { width: 420mm; height: 297mm; }
      .sheet { width: 420mm; height: 297mm; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <img class="map" src="${mapImage}" alt="Printed map" />
    <div class="logo-box"><img src="${logoUrl}" alt="RUDA Logo" /></div>
    <div class="title">${escapeHtml(title)}</div>
    <div class="north" aria-label="North arrow">
      <svg viewBox="0 0 100 100" role="img">
        <text x="50" y="10" text-anchor="middle" font-size="12" font-family="Arial" font-weight="700">N</text>
        <text x="50" y="98" text-anchor="middle" font-size="12" font-family="Arial" font-weight="700">S</text>
        <text x="7" y="55" text-anchor="middle" font-size="12" font-family="Arial" font-weight="700">W</text>
        <text x="93" y="55" text-anchor="middle" font-size="12" font-family="Arial" font-weight="700">E</text>
        <circle cx="50" cy="52" r="34" fill="#fff" stroke="#111" stroke-width="1.5"/>
        <circle cx="50" cy="52" r="27" fill="none" stroke="#111" stroke-width="1"/>
        <path d="M50 15 L57 46 L50 41 L43 46 Z" fill="#111"/>
        <path d="M50 89 L43 58 L50 63 L57 58 Z" fill="#fff" stroke="#111" stroke-width="1"/>
        <path d="M13 52 L44 45 L39 52 L44 59 Z" fill="#fff" stroke="#111" stroke-width="1"/>
        <path d="M87 52 L56 59 L61 52 L56 45 Z" fill="#111"/>
        <path d="M27 29 L46 46 L39 43 L36 50 Z" fill="#111"/>
        <path d="M73 75 L54 58 L61 61 L64 54 Z" fill="#fff" stroke="#111" stroke-width="1"/>
        <path d="M73 29 L54 46 L61 43 L64 50 Z" fill="#fff" stroke="#111" stroke-width="1"/>
        <path d="M27 75 L46 58 L39 61 L36 54 Z" fill="#111"/>
        <circle cx="50" cy="52" r="3" fill="#111"/>
      </svg>
    </div>

    <div class="bottom-left-block">
      <div class="inset">
        <div class="inset-map-wrap">
          <img src="${insetImage || mapImage}" alt="RUDA Principle Land Use Zoning overview" />
        </div>
      </div>
      <div class="credit">
        Prepared By: GIS Section, LA&amp;EM Department<br/>
        Ravi Urban Development Authority (RUDA)
      </div>
    </div>

    <div class="legend">
      <h3>Legend</h3>
      ${legendHtml || '<div class="legend-row">Visible map layers</div>'}
    </div>

    <div class="scale">
      ${escapeHtml(scaleText)}
      <div class="scale-bar"></div>
    </div>
  </div>
  <script>
    const waitForImages = () => {
      const images = Array.from(document.images);
      return Promise.all(
        images.map((image) => {
          if (image.complete) return Promise.resolve();
          return new Promise((resolve) => {
            image.addEventListener("load", resolve, { once: true });
            image.addEventListener("error", resolve, { once: true });
          });
        }),
      );
    };

    const returnToApplication = () => {
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.focus();
        }
      } catch (error) {
        // Ignore cross-window focus errors.
      }

      // Close the temporary print tab so it cannot keep focus or leave the
      // application feeling blocked after printing/cancelling.
      setTimeout(() => {
        try {
          window.close();
        } catch (error) {
          // Ignore browsers that do not allow scripted closing.
        }
      }, 100);
    };

    window.addEventListener("afterprint", returnToApplication, { once: true });

    window.addEventListener("load", async () => {
      await waitForImages();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.focus();
          window.print();

          // Some browsers do not fire afterprint when the print dialog is
          // cancelled. Restore focus and close the temporary tab as fallback.
          setTimeout(returnToApplication, 1500);
        });
      });
    });
  </script>
</body>
</html>`;
};

// ── component ──────────────────────────────────────────────────────────────────
export default function Import({ map, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [summary, setSummary] = useState(null); // { fileName, count, types }
  const [importedGeoJSON, setImportedGeoJSON] = useState(null);
  const [importedFileType, setImportedFileType] = useState(null);
  const [printLoading, setPrintLoading] = useState(false);
  const [hasLayer, setHasLayer] = useState(() => {
    return !!(map && map.getSource(SOURCE_ID));
  });
  const fileInputRef = useRef(null);

  // ── clear imported data ──────────────────────────────────────────────────────
  const clearImportedData = () => {
    removeImportedLayers(map);
    setHasLayer(false);
    setSummary(null);
    setImportedGeoJSON(null);
    setImportedFileType(null);
    setError(null);
    setWarning(null);
  };

  // ── add layers to map ────────────────────────────────────────────────────────
  const addLayers = (geojson) => {
    removeImportedLayers(map);

    map.addSource(SOURCE_ID, {
      type: "geojson",
      data: geojson,
      generateId: true,
    });

    // Polygon fill
    map.addLayer({
      id: LAYER_IDS.fill,
      type: "fill",
      source: SOURCE_ID,
      paint: {
        "fill-color": "#d1d5db",
        "fill-opacity": 0.34,
      },
      filter: ["any", ["==", "$type", "Polygon"]],
    });

    // Polygon outline
    map.addLayer({
      id: LAYER_IDS.outline,
      type: "line",
      source: SOURCE_ID,
      paint: {
        "line-color": "#facc15",
        "line-width": 3,
      },
      filter: ["any", ["==", "$type", "Polygon"]],
    });

    // Polygon label layer — places the imported KMZ / vector name inside polygons
    map.addLayer({
      id: LAYER_IDS.label,
      type: "symbol",
      source: SOURCE_ID,
      layout: {
        "text-field": [
          "coalesce",
          ["get", "_import_label"],
          "Imported Boundary",
        ],
        "text-size": 15,
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        "text-anchor": "center",
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": "#111827",
        "text-halo-color": "#ffffff",
        "text-halo-width": 2,
        "text-halo-blur": 0.5,
      },
      filter: ["==", "$type", "Polygon"],
    });

    // Line layer
    map.addLayer({
      id: LAYER_IDS.line,
      type: "line",
      source: SOURCE_ID,
      paint: {
        "line-color": "#60a5fa",
        "line-width": 2.5,
      },
      filter: ["==", "$type", "LineString"],
    });

    // Point layer
    map.addLayer({
      id: LAYER_IDS.point,
      type: "circle",
      source: SOURCE_ID,
      paint: {
        "circle-radius": 6,
        "circle-color": "#f87171",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1.5,
      },
      filter: ["==", "$type", "Point"],
    });

    // Fit map bounds
    try {
      const bounds = bbox(geojson);
      if (bounds.every((v) => isFinite(v))) {
        map.fitBounds(
          [
            [bounds[0], bounds[1]],
            [bounds[2], bounds[3]],
          ],
          { padding: 60, maxZoom: 18 },
        );
      }
    } catch {
      // bbox may fail on empty / degenerate geometry — ignore
    }

    setHasLayer(true);
  };

  // ── main handler ─────────────────────────────────────────────────────────────
  const handleFile = async (file) => {
    setError(null);
    setWarning(null);
    setSummary(null);

    // 1. extension check
    const type = detectFileType(file.name);
    if (!type) {
      setError(
        `Unsupported file type. Accepted: ${ACCEPTED_EXTENSIONS.join(", ")}.`,
      );
      return;
    }

    // 2. size check
    if (file.size > MAX_FILE_SIZE) {
      setError(
        `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 10 MB.`,
      );
      return;
    }

    setLoading(true);
    let objectUrl = null;

    try {
      let geojson;

      // ── GeoJSON / JSON ───────────────────────────────────────────────────────
      if (type === "geojson") {
        objectUrl = URL.createObjectURL(file);
        const response = await fetch(objectUrl);
        let parsed;
        try {
          parsed = await response.json();
        } catch {
          setError("File does not contain valid JSON.");
          return;
        }

        const validationError = validateGeoJSON(parsed);
        if (validationError) {
          setError(validationError);
          return;
        }

        geojson = normaliseGeoJSON(parsed);
      }

      // ── KML ──────────────────────────────────────────────────────────────────
      else if (type === "kml") {
        const kmlText = await file.text();
        try {
          geojson = parseKMLText(kmlText);
        } catch (e) {
          setError(e.message || "Failed to parse KML file.");
          return;
        }

        if (!geojson.features || geojson.features.length === 0) {
          setError("KML file contains no features.");
          return;
        }
      }

      // ── KMZ ──────────────────────────────────────────────────────────────────
      else if (type === "kmz") {
        // KMZ is a ZIP archive containing at least one .kml file
        const arrayBuffer = await file.arrayBuffer();

        let zip;
        try {
          zip = await JSZip.loadAsync(arrayBuffer);
        } catch {
          setError(
            "Failed to open KMZ file. Make sure it is a valid KMZ archive.",
          );
          return;
        }

        // Find the primary KML file — prefer doc.kml, then any .kml at root,
        // then any .kml anywhere in the archive
        const allFileNames = Object.keys(zip.files);
        const kmlFiles = allFileNames.filter(
          (n) => n.toLowerCase().endsWith(".kml") && !zip.files[n].dir,
        );

        if (kmlFiles.length === 0) {
          setError("KMZ archive does not contain a KML file.");
          return;
        }

        // Priority: doc.kml (Google Earth default) → first root-level kml → first any kml
        const primaryKml =
          kmlFiles.find((n) => n.toLowerCase() === "doc.kml") ||
          kmlFiles.find((n) => !n.includes("/")) ||
          kmlFiles[0];

        if (kmlFiles.length > 1) {
          setWarning(
            `KMZ contains ${kmlFiles.length} KML files. Using "${primaryKml}".`,
          );
        }

        const kmlText = await zip.files[primaryKml].async("string");
        try {
          geojson = parseKMLText(kmlText);
        } catch (e) {
          setError(e.message || "Failed to parse KML inside KMZ.");
          return;
        }

        if (!geojson.features || geojson.features.length === 0) {
          setError("KMZ file contains no features.");
          return;
        }
      }

      // ── Zipped Shapefile ─────────────────────────────────────────────────────
      else {
        const arrayBuffer = await file.arrayBuffer();

        // Inspect ZIP contents for required files
        try {
          const zip = await JSZip.loadAsync(arrayBuffer);
          const fileNames = Object.keys(zip.files);
          const hasPrj = fileNames.some((n) =>
            n.toLowerCase().endsWith(".prj"),
          );
          const hasShp = fileNames.some((n) =>
            n.toLowerCase().endsWith(".shp"),
          );
          const hasDbf = fileNames.some((n) =>
            n.toLowerCase().endsWith(".dbf"),
          );

          if (!hasShp) {
            setError(
              "ZIP does not contain a .shp file. Please upload a valid zipped Shapefile.",
            );
            return;
          }
          if (!hasDbf) {
            setWarning(
              "⚠ No .dbf file found — attribute data will be missing.",
            );
          }
          if (!hasPrj) {
            setWarning((prev) =>
              prev
                ? prev + " Also, no .prj file found — assuming WGS 84."
                : "⚠ No .prj file found in the ZIP. The data will be assumed to be in WGS 84 (EPSG:4326).",
            );
          }
        } catch {
          // If we can't inspect the ZIP we still try parsing
        }

        // shpjs needs a fresh ArrayBuffer since JSZip consumed the first one
        const freshBuffer = await file.arrayBuffer();
        let parsed;
        try {
          parsed = await shp(freshBuffer);
        } catch (e) {
          console.error("shpjs parse error:", e);
          setError(
            "Failed to parse shapefile. Ensure the ZIP contains valid .shp and .dbf files.",
          );
          return;
        }

        geojson = normaliseGeoJSON(parsed);

        if (!geojson.features || geojson.features.length === 0) {
          setError("Shapefile contains no features.");
          return;
        }
      }

      // ── add to map ───────────────────────────────────────────────────────────
      const importTitle = getImportedTitle(file.name);
      const preparedGeoJSON = prepareImportedFeatures(geojson, importTitle);

      addLayers(preparedGeoJSON);
      setImportedGeoJSON(preparedGeoJSON);
      setImportedFileType(type);

      const { count, types } = summarise(preparedGeoJSON);
      setSummary({ fileName: file.name, title: importTitle, count, types });
    } catch (e) {
      console.error("Import error:", e);
      setError("An unexpected error occurred while importing the file.");
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setLoading(false);
    }
  };

  const handlePrint = async (customTitle = "") => {
    if (!map || importedFileType !== "kmz" || !importedGeoJSON?.features?.length) {
      setError("Import a .KMZ file before using Print Imported .KMZ.");
      return;
    }

    // Open the window immediately inside the click event. Opening it after
    // fitBounds/idle awaits causes browsers to treat it as an unsolicited
    // pop-up and silently block the print page.
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      setError(
        "The browser blocked the print window. Allow pop-ups for this site and try again.",
      );
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`<!doctype html>
      <html>
        <head><title>Preparing map…</title></head>
        <body style="font-family:Arial,sans-serif;padding:24px">
          Preparing printable map…
        </body>
      </html>`);
    printWindow.document.close();

    setPrintLoading(true);
    setError(null);

    const previousCamera = {
      center: map.getCenter(),
      zoom: map.getZoom(),
      bearing: map.getBearing(),
      pitch: map.getPitch(),
    };

    try {
      // Keep the current-view capture only as a safe fallback. The preferred
      // lower-left inset is generated from the RUDA Principle Land Use Zoning
      // dataset and the uploaded KMZ is highlighted at its true location.
      await waitForMapRender(map);
      const fallbackOverviewImage = map.getCanvas().toDataURL("image/png", 1);

      let zoningInsetImage = fallbackOverviewImage;
      try {
        zoningInsetImage = await createPrincipleLandUseInsetImage({
          importedGeoJSON,
          label: summary?.title || "Imported KMZ",
        });
      } catch (insetError) {
        console.warn(
          "Principle Land Use Zoning inset could not be generated; using current map overview instead.",
          insetError,
        );
      }

      // Force the imported polygon to use the official print symbology,
      // regardless of the styling contained in the uploaded file.
      if (map.getLayer(LAYER_IDS.fill)) {
        map.setPaintProperty(LAYER_IDS.fill, "fill-color", "#d1d5db");
        map.setPaintProperty(LAYER_IDS.fill, "fill-opacity", 0.34);
      }
      if (map.getLayer(LAYER_IDS.outline)) {
        map.setPaintProperty(LAYER_IDS.outline, "line-color", "#ffff00");
        map.setPaintProperty(LAYER_IDS.outline, "line-width", 3);
      }

      const bounds = bbox(importedGeoJSON);

      if (bounds.every((value) => Number.isFinite(value))) {
        map.fitBounds(
          [
            [bounds[0], bounds[1]],
            [bounds[2], bounds[3]],
          ],
          {
            padding: { top: 90, right: 90, bottom: 90, left: 90 },
            maxZoom: 17,
            duration: 700,
            essential: true,
          },
        );
      }

      await waitForMapRender(map);

      const canvas = map.getCanvas();
      const mapImage = canvas.toDataURL("image/png", 1);

      if (!mapImage || mapImage === "data:," || mapImage.length < 1000) {
        throw new Error(
          "The map canvas could not be captured. Make sure preserveDrawingBuffer is enabled on the Mapbox map.",
        );
      }

      const title = customTitle?.trim() || summary?.title || "Imported Boundary Map";
      const legendRows = buildLegendRows(title);
      const center = map.getCenter();
      const scaleText = `Map center: ${center.lat.toFixed(5)}, ${center.lng.toFixed(5)} · Zoom ${map.getZoom().toFixed(1)}`;

      printWindow.document.open();
      printWindow.document.write(
        makePrintableHtml({
          title,
          mapImage,
          insetImage: zoningInsetImage || fallbackOverviewImage || mapImage,
          legendRows,
          logoUrl: RudaLogo,
          scaleText,
        }),
      );
      printWindow.document.close();
    } catch (printError) {
      console.error("Print error:", printError);
      printWindow.close();
      setError(
        printError?.message || "The map could not be prepared for printing.",
      );
    } finally {
      map.easeTo({
        ...previousCamera,
        duration: 500,
      });
      setPrintLoading(false);
    }
  };

  // Allow the main Header print button to use this exact printing workflow.
  useEffect(() => {
    const handleHeaderPrint = (event) => {
      handlePrint(event.detail?.customTitle || "");
    };

    window.addEventListener(PRINT_EVENTS.PRINT_IMPORTED_KMZ, handleHeaderPrint);

    return () => {
      window.removeEventListener(
        PRINT_EVENTS.PRINT_IMPORTED_KMZ,
        handleHeaderPrint,
      );
    };
  }, [map, importedGeoJSON, importedFileType, summary]);

  // Keep the main Header print button synchronized with the imported-layer state.
  useEffect(() => {
    const publishPrintState = () => {
      window.dispatchEvent(
        new CustomEvent(PRINT_EVENTS.IMPORT_STATE, {
          detail: {
            hasLayer,
            hasKmz: hasLayer && importedFileType === "kmz",
            printLoading,
          },
        }),
      );
    };

    publishPrintState();
    window.addEventListener(PRINT_EVENTS.REQUEST_IMPORT_STATE, publishPrintState);

    return () => {
      window.removeEventListener(
        PRINT_EVENTS.REQUEST_IMPORT_STATE,
        publishPrintState,
      );
    };
  }, [hasLayer, importedFileType, printLoading]);

  // ── event handlers ───────────────────────────────────────────────────────────
  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // reset so same file can be re-selected
    e.target.value = "";
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 text-white w-full">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="font-bold text-sm tracking-wide">Import Data</span>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-gray-500/60 rounded-lg p-5 text-center cursor-pointer
                   hover:border-emerald-400/60 hover:bg-[#283447]/60 transition-all duration-200
                   flex flex-col items-center justify-center gap-2"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload size={24} className="text-gray-400" />
        <p className="text-xs text-gray-300">
          Drag &amp; drop a file or{" "}
          <span className="text-emerald-400 underline">browse</span>
        </p>
        <p className="text-[10px] text-gray-500">
          GeoJSON · KML · KMZ · Shapefile (ZIP) — max 10 MB
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".geojson,.json,.kml,.kmz,.zip"
          onChange={onFileChange}
          className="hidden"
          id="import-file-input"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-3 flex items-center gap-2 text-yellow-400 text-xs animate-pulse">
          <Loader2 size={14} className="animate-spin" />
          <span>Parsing file…</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-3 flex items-start gap-2 text-red-400 text-xs bg-red-400/10 rounded-md p-2.5">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Warning */}
      {warning && !error && (
        <div className="mt-3 flex items-start gap-2 text-amber-400 text-xs bg-amber-400/10 rounded-md p-2.5">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{warning}</span>
        </div>
      )}

      {/* Summary */}
      {summary && !error && (
        <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md p-3">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1.5">
            <FileCheck size={14} />
            <span>Import Successful</span>
          </div>
          <div className="text-[11px] text-gray-300 space-y-0.5">
            <p>
              <span className="text-gray-500">File:</span>{" "}
              <span className="break-all">{summary.fileName}</span>
            </p>
            <p>
              <span className="text-gray-500">Features:</span> {summary.count}
            </p>
            <p>
              <span className="text-gray-500">Geometry:</span>{" "}
              {summary.types.join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* Clear button */}
      {hasLayer && (
        <button
          onClick={clearImportedData}
          className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md
                     bg-red-500/15 text-red-400 text-xs font-medium
                     hover:bg-red-500/25 transition-colors duration-200 border border-red-500/20"
        >
          <Trash2 size={13} />
          Clear Imported Data
        </button>
      )}
    </div>
  );
}
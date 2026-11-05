/**
 * Vector labels on the RUDA GIS Metaverse map.
 *
 * Polygon symbols are rendered once per vector tile by Mapbox, which can
 * repeat the same text across tiles / multipart polygons.  These helpers
 * produce one *point* per distinct named polygon, while leaving the real
 * polygon GeoJSON untouched for outlines, fills and feature-click popups.
 */
import { area, pointOnFeature } from "@turf/turf";

export const VECTOR_LABEL_MIN_ZOOM = 11;
export const UNIQUE_LABEL_PROPERTY = "_ruda_unique_label";

// Satellite hybrids have raster layers instead of native Mapbox symbols.
// If a custom RUDA label gets inserted beneath a hybrid raster overlay,
// bring just that text layer forward; preserve existing polygon/line order.
const HYBRID_RASTER_LAYER_IDS = new Set([
  "esri-hybrid-imagery-layer",
  "esri-hybrid-reference-layer",
  "google-hybrid-imagery-layer",
]);


const normalizeLabel = (value) =>
  typeof value === "string" || typeof value === "number"
    ? String(value).replace(/\s+/g, " ").trim()
    : "";

function getProperty(properties, fields) {
  for (const key of fields) {
    const value = normalizeLabel(properties?.[key]);
    if (value && value !== "-" && value.toLowerCase() !== "null") return value;
  }
  return "";
}

function representativePoint(feature) {
  try {
    const point = pointOnFeature(feature);
    const coordinates = point?.geometry?.coordinates;
    if (
      Array.isArray(coordinates) &&
      coordinates.length >= 2 &&
      coordinates.slice(0, 2).every(Number.isFinite) &&
      Math.abs(coordinates[0]) <= 180 &&
      Math.abs(coordinates[1]) <= 90
    ) {
      return coordinates.slice(0, 2);
    }
  } catch (_) {
    // An invalid polygon must not prevent the rest of the layer from loading.
  }
  return null;
}

/** Build one stable map label per distinct name, selecting the largest feature
 * if the dataset splits the same named area into multiple polygons. */
export function buildUniquePolygonLabelPoints(
  geojson,
  fields,
  { labelProperty = UNIQUE_LABEL_PROPERTY } = {},
) {
  const selected = new Map();
  for (const feature of geojson?.features || []) {
    const geometry = feature?.geometry;
    if (!geometry || !["Polygon", "MultiPolygon"].includes(geometry.type)) continue;
    const label = getProperty(feature.properties, fields);
    if (!label) continue;
    // A repeated name may legitimately occur in different districts/tehsils.
    // Deduplicate the geometry fragments of a locality, not every locality
    // across the entire RUDA jurisdiction.
    const properties = feature.properties || {};
    const district = getProperty(properties, ["district", "DISTRICT", "dist_name"]);
    const tehsil = getProperty(properties, ["tehsil", "TEHSIL", "teh_name"]);
    // Square numbers repeat across different Mauzas in the same Tehsil.
    // Keep each location's own label while deduplicating fragments of one area.
    const mauza = getProperty(properties, ["mauza", "mouza", "Mauza", "MOZA", "moza"]);
    const normalized = [label, district, tehsil, mauza].map((value) => value.toLocaleLowerCase()).join("|");
    let size = 0;
    try {
      size = area(feature);
    } catch (_) {
      continue;
    }
    if (!selected.has(normalized) || size > selected.get(normalized).size) {
      selected.set(normalized, { feature, label, size });
    }
  }
  const features = [];
  for (const { feature, label } of selected.values()) {
    const coordinates = representativePoint(feature);
    if (!coordinates) continue;
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates },
      properties: { ...feature.properties, [labelProperty]: label },
    });
  }
  return { type: "FeatureCollection", features };
}

/** Keep source and label layer identities stable through recolors and toggles. */
export function upsertUniqueLabelSource(map, polygonData, polygonSourceId, fields, options) {
  const sourceId = `${polygonSourceId}-unique-label-points`;
  const data = buildUniquePolygonLabelPoints(polygonData, fields, options);
  const source = map.getSource(sourceId);
  if (source) source.setData(data);
  else map.addSource(sourceId, { type: "geojson", data });
  return sourceId;
}

/**
 * Apply to RUDA-owned *label* symbol layers only, never Mapbox Streets' native
 * road/place labels, measurement annotations, or intro-tour titles.
 * New layers are picked up by the map's styledata event after map.addLayer.
 */
export function applyVectorLabelStandards(map) {
  if (!map?.getStyle || !map?.getLayer) return;
  const layers = map.getStyle()?.layers || [];
  const highestHybridRasterIndex = layers.reduce(
    (highest, layer, index) => HYBRID_RASTER_LAYER_IDS.has(layer.id) ? index : highest,
    -1,
  );
  const labelsBehindHybrid = [];
  for (const [index, layer] of layers.entries()) {
    if (layer.type !== "symbol") continue;
    if (!/^(?:gism-|gis-|metaverse-|ruda-)/i.test(layer.id)) continue;
    if (!/-label(?:s)?$/i.test(layer.id) || /intro-label/i.test(layer.id)) continue;
    if (!layer.layout?.["text-field"]) continue;
    // All RUDA vector labels appear at zoom 11 and stay available above it.
    // A maxzoom of 24 is Mapbox's practical default upper bound.
    if (layer.minzoom !== VECTOR_LABEL_MIN_ZOOM || (layer.maxzoom != null && layer.maxzoom < 24)) {
      map.setLayerZoomRange(layer.id, VECTOR_LABEL_MIN_ZOOM, 24);
    }
    if (layer.layout["text-allow-overlap"] !== false) {
      map.setLayoutProperty(layer.id, "text-allow-overlap", false);
    }
    if (layer.layout["text-ignore-placement"] !== false) {
      map.setLayoutProperty(layer.id, "text-ignore-placement", false);
    }
    // Google/Esri reference imagery must be BELOW RUDA vector lettering.
    if (highestHybridRasterIndex >= 0 && index <= highestHybridRasterIndex) {
      labelsBehindHybrid.push(layer.id);
    }
  }
  // Moves happen only if necessary, avoiding a styledata/moveLayer loop.
  for (const layerId of labelsBehindHybrid) {
    if (map.getLayer(layerId)) map.moveLayer(layerId);
  }
}

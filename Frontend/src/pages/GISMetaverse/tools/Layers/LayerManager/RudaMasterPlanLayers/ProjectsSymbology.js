/**
 * Styling for the RUDA `project` PostGIS table, as exposed by /api/project/.
 * Verified Django fields: gid, name, brief_name, phase, type, geom (MultiPolygon 4326).
 * Category values are discovered at runtime from the API, not hard-coded.
 */
export const PROJECT_CATEGORY_UNSPECIFIED = "Unspecified";
export const PROJECT_CATEGORY_FIELDS = {
  phase: "__rudaProjectPhase",
  type: "__rudaProjectType",
};

const PROJECT_COLORS = [
  "#2563eb", "#e8791d", "#16a34a", "#a21caf", "#dc2626", "#0891b2",
  "#b45309", "#4f46e5", "#be185d", "#65a30d", "#0d9488", "#7c3aed",
  "#c2410c", "#1d4ed8", "#15803d", "#9333ea", "#ca8a04", "#db2777",
];

export const projectCategoryValue = (value) => {
  const cleaned = String(value ?? "").trim().replace(/\s+/g, " ");
  return cleaned ? cleaned.toLocaleLowerCase("en") : PROJECT_CATEGORY_UNSPECIFIED;
};

export const projectCategoryLabel = (value) =>
  String(value ?? "").trim().replace(/\s+/g, " ") || PROJECT_CATEGORY_UNSPECIFIED;

export const projectFeatureProperties = (feature, metadata = {}, fallbackId = null) => {
  const sourceProps = feature?.properties || {};
  const metaProps = metadata?.properties || metadata || {};
  const resolved = (name) => {
    const candidate = metaProps[name];
    return candidate !== null && candidate !== undefined && candidate !== ""
      ? candidate
      : sourceProps[name];
  };
  // Label from the source Project Name field only (not brief_name).
  // Accommodate an original shapefile property named "Name" as well.
  const name = String(resolved("name") ?? "").trim() || String(resolved("Name") ?? "").trim();
  const briefName = resolved("brief_name") ?? "";
  const phase = resolved("phase");
  const type = resolved("type");
  const gid = resolved("gid") ?? metadata?.id ?? feature?.id ?? fallbackId;
  return {
    ...sourceProps,
    gid,
    name,
    brief_name: briefName,
    phase: phase ?? "",
    type: type ?? "",
    __rudaProjectPhase: projectCategoryValue(phase),
    __rudaProjectType: projectCategoryValue(type),
    __rudaProjectLabel: name,
  };
};

export const getProjectCategories = (geojson, field) => {
  const property = PROJECT_CATEGORY_FIELDS[field] || PROJECT_CATEGORY_FIELDS.phase;
  const counts = new Map();
  for (const feature of geojson?.features || []) {
    const props = feature?.properties || {};
    const value = props[property] || projectCategoryValue(props[field]);
    const label = projectCategoryLabel(props[field]);
    const id = props.gid ?? feature?.id;
    if (!counts.has(value)) counts.set(value, { value, label, ids: new Set() });
    counts.get(value).ids.add(id == null ? `index-${counts.get(value).ids.size}` : String(id));
  }
  return Array.from(counts.values())
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: "base" }))
    .map(({ value, label, ids }) => ({ value, label, count: ids.size }));
};

const extraCategoryHex = (index) => {
  // Native <input type="color"> requires #RRGGBB rather than CSS hsl().
  const hue = ((index * 137.508) % 360) / 30;
  const saturation = 0.63;
  const lightness = 0.43;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const component = chroma * (1 - Math.abs((hue % 2) - 1));
  const [r, g, b] = hue < 2 ? [chroma, component, 0]
    : hue < 4 ? [component, chroma, 0]
    : hue < 6 ? [0, chroma, component]
    : hue < 8 ? [0, component, chroma]
    : hue < 10 ? [component, 0, chroma]
    : [chroma, 0, component];
  const offset = lightness - chroma / 2;
  return `#${[r, g, b].map((v) => Math.round((v + offset) * 255)
    .toString(16).padStart(2, "0")).join("")}`;
};

export const defaultProjectColors = (categories) =>
  categories.reduce((result, category, i) => {
    result[category.value] = PROJECT_COLORS[i] || extraCategoryHex(i);
    return result;
  }, {});

export const projectColorExpression = (style) => {
  const field = style?.field === "type" ? "type" : "phase";
  const colors = style?.[field] || {};
  const matches = Object.entries(colors).flatMap(([value, color]) => [value, color]);
  return matches.length
    ? ["match", ["get", PROJECT_CATEGORY_FIELDS[field]], ...matches, "#64748b"]
    : "#64748b";
};

// Find one stable interior point for the largest polygon part of each project.
// Separate Point features prevent Mapbox from repeating names across multipart polygons.
const signedArea = (ring) => {
  let twiceArea = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    twiceArea += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return twiceArea / 2;
};

const ringCentroid = (ring) => {
  let x = 0;
  let y = 0;
  let areaFactor = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    const p = ring[i];
    const q = ring[i + 1];
    const cross = p[0] * q[1] - q[0] * p[1];
    x += (p[0] + q[0]) * cross;
    y += (p[1] + q[1]) * cross;
    areaFactor += cross;
  }
  return Math.abs(areaFactor) > 1e-14 ? [x / (3 * areaFactor), y / (3 * areaFactor)] : null;
};

const insideRing = (point, ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i];
    const b = ring[j];
    const intersects = (a[1] > point[1]) !== (b[1] > point[1]) &&
      point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0];
    if (intersects) inside = !inside;
  }
  return inside;
};

const insidePolygon = (point, polygon) =>
  insideRing(point, polygon[0]) && !polygon.slice(1).some((hole) => insideRing(point, hole));

const polygonAnchor = (polygon) => {
  const outer = polygon?.[0];
  if (!Array.isArray(outer) || outer.length < 4) return null;
  const cx = ringCentroid(outer);
  if (cx && insidePolygon(cx, polygon)) return cx;

  // Iterate instead of spreading huge GIS rings into Math.min/max arguments.
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of outer) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  // Search horizontal scan-lines for a point in the actual polygon, not its bbox.
  for (const fraction of [0.5, 0.3, 0.7, 0.15, 0.85, 0.05, 0.95]) {
    const y = minY + (maxY - minY) * fraction;
    const intersects = [];
    for (let i = 0; i < outer.length - 1; i += 1) {
      const a = outer[i];
      const b = outer[i + 1];
      if ((a[1] > y) !== (b[1] > y)) {
        intersects.push(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
      }
    }
    intersects.sort((a, b) => a - b);
    for (let i = 0; i < intersects.length - 1; i += 2) {
      const x = (intersects[i] + intersects[i + 1]) / 2;
      if (insidePolygon([x, y], polygon)) return [x, y];
    }
  }
  // Defensive fallback if all scan lines cross holes/degenerate rings.
  return cx || [(minX + maxX) / 2, (minY + maxY) / 2];
};

export const getProjectLabelAnchor = (geometry) => {
  if (!geometry) return null;
  const polys = geometry.type === "Polygon"
    ? [geometry.coordinates]
    : geometry.type === "MultiPolygon" ? geometry.coordinates : [];
  const valid = polys.filter((polygon) => polygon?.[0]?.length >= 4);
  valid.sort((a, b) => Math.abs(signedArea(b[0])) - Math.abs(signedArea(a[0])));
  return valid.length ? polygonAnchor(valid[0]) : null;
};

export const buildProjectLabelGeoJSON = (geojson) => {
  const unique = new Set();
  const features = [];
  for (const feature of geojson?.features || []) {
    const props = feature?.properties || {};
    if (!props.__rudaProjectLabel) continue;
    const id = props.gid ?? feature?.id;
    const key = id == null ? null : String(id);
    if (key && unique.has(key)) continue;
    const coordinates = getProjectLabelAnchor(feature.geometry);
    if (!coordinates) continue;
    if (key) unique.add(key);
    features.push({
      type: "Feature",
      properties: { gid: id, label: props.__rudaProjectLabel },
      geometry: { type: "Point", coordinates },
    });
  }
  return { type: "FeatureCollection", features };
};

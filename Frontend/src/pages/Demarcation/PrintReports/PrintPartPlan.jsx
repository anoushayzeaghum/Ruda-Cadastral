import { jsPDF } from "jspdf";
import {
  addImageContained,
  buildPlotDetails,
  canvasAsPng,
  createPdfPreviewWindow,
  openPdfPreview,
  valueOrDash,
} from "./printUtils";

const EMPTY_FEATURE_COLLECTION = {
  type: "FeatureCollection",
  features: [],
};

const LAND_USE_COLORS = {
  greenOpenAreaParks: "#159E49",
  condominiums: "#D5ACD2",
  mixUse: "#9D9E31",
  commercial: "#9FD3EB",
  publicBuilding: "#EFA4AA",
  residential10Marla: "#F89A1C",
  residential1Kanal: "#C97800",
  petrolPump: "#E34E52",
  grandMosque: "#F8F07E",
  rudaOffice: "#62D9AA",
  convenienceShops: "#A84FA2",
  canal: "#9FD3EB",
  passage: "#F4F4F4",
  utility: "#EFA4AA",
  fallback: "#D8DADD",
};

const LAND_USE_LABELS = {
  greenOpenAreaParks: "Park / Green Area",
  condominiums: "Condominiums",
  mixUse: "Mixed Use",
  commercial: "Commercial",
  publicBuilding: "Public Building",
  residential10Marla: "Residential",
  residential1Kanal: "Residential",
  petrolPump: "Petrol Pump",
  grandMosque: "Grand Mosque",
  rudaOffice: "RUDA Office",
  convenienceShops: "Convenience Shops",
  canal: "Canal",
  passage: "Passage",
  utility: "Utility",
  fallback: "Plot",
};

const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");

const normalizedLowerText = (value) => normalizeText(value).toLowerCase();

const firstProperty = (properties = {}, keys = []) => {
  for (const key of keys) {
    const value = properties?.[key];
    if (value !== undefined && value !== null && normalizeText(value) !== "") {
      return value;
    }
  }
  return "";
};

const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, value));

const classifyLandUse = (feature) => {
  const properties = feature?.properties || {};
  const existingClass = normalizeText(properties._masterplan_class);
  if (existingClass && LAND_USE_COLORS[existingClass]) return existingClass;

  const landUse = normalizedLowerText(
    firstProperty(properties, [
      "land_use",
      "landuse",
      "land_use_type",
      "category",
      "type",
      "name",
    ]),
  );

  const detail = normalizedLowerText(
    [
      properties.plot_area,
      properties.plot_size,
      properties.dimension,
      properties.name,
      properties.category,
      properties.type,
      properties.land_use,
    ]
      .filter(Boolean)
      .join(" "),
  );

  if (
    [
      "green area",
      "green areas",
      "green",
      "open area",
      "open areas",
      "open space",
      "open spaces",
      "park",
      "parks",
    ].includes(landUse)
  ) {
    return "greenOpenAreaParks";
  }

  if (landUse.includes("condominium") || landUse.includes("condo")) {
    return "condominiums";
  }

  if (
    landUse.includes("mix use") ||
    landUse.includes("mixed use") ||
    landUse.includes("mix-use") ||
    landUse.includes("mixed-use")
  ) {
    return "mixUse";
  }

  if (landUse.includes("commercial")) return "commercial";

  if (
    landUse.includes("public building") ||
    landUse.includes("public use") ||
    landUse.includes("public facility")
  ) {
    return "publicBuilding";
  }

  if (landUse.includes("residential")) {
    if (
      detail.includes("1 kanal") ||
      detail.includes("1-kanal") ||
      detail.includes("1kanal")
    ) {
      return "residential1Kanal";
    }
    return "residential10Marla";
  }

  if (
    landUse.includes("petrol pump") ||
    landUse.includes("fuel station") ||
    landUse.includes("filling station")
  ) {
    return "petrolPump";
  }

  if (
    landUse.includes("grand mosque") ||
    landUse.includes("mosque") ||
    landUse.includes("masjid") ||
    landUse.includes("religious building")
  ) {
    return "grandMosque";
  }

  if (landUse.includes("ruda office")) return "rudaOffice";

  if (
    landUse.includes("convenience shop") ||
    landUse.includes("convenience store")
  ) {
    return "convenienceShops";
  }

  if (landUse.includes("canal") || landUse.includes("water channel")) {
    return "canal";
  }

  if (
    landUse.includes("passage") ||
    landUse.includes("walkway") ||
    landUse.includes("corridor")
  ) {
    return "passage";
  }

  if (landUse.includes("utility")) return "utility";
  return "fallback";
};

const getPlotNo = (feature) => {
  const properties = feature?.properties || {};
  const direct = normalizeText(
    firstProperty(properties, ["plot_no", "plotNo", "plot_number", "plot"]),
  );
  if (direct) return direct;

  const name = normalizeText(properties.name);
  return /^(?:[A-Za-z]+[-/]?)?\d+[A-Za-z-]*$/i.test(name) ? name : "";
};

const getBlock = (feature) =>
  normalizeText(
    firstProperty(feature?.properties || {}, ["block", "block_name", "sector"]),
  );

const getFeatureIdentifier = (feature) => {
  const properties = feature?.properties || {};
  const directId = firstProperty(properties, [
    "gid",
    "id",
    "objectid",
    "unique_id",
    "plot_id",
  ]);

  if (normalizeText(directId)) return `id:${normalizeText(directId)}`;

  const plotNo = getPlotNo(feature);
  const block = getBlock(feature);
  return plotNo ? `plot:${block}:${plotNo}` : "";
};

const isSameFeature = (left, right) => {
  if (!left || !right) return false;
  if (left === right) return true;

  const leftId = getFeatureIdentifier(left);
  const rightId = getFeatureIdentifier(right);
  return Boolean(leftId && rightId && leftId === rightId);
};

const getPolygonGroups = (geometry) => {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return [geometry.coordinates || []];
  if (geometry.type === "MultiPolygon") return geometry.coordinates || [];
  return [];
};

const getLineGroups = (geometry) => {
  if (!geometry) return [];
  if (geometry.type === "LineString") return [geometry.coordinates || []];
  if (geometry.type === "MultiLineString") return geometry.coordinates || [];
  return [];
};

const flattenCoordinates = (geometry) => {
  if (!geometry) return [];

  if (geometry.type === "Point") return [geometry.coordinates];
  if (geometry.type === "MultiPoint" || geometry.type === "LineString") {
    return geometry.coordinates || [];
  }
  if (geometry.type === "MultiLineString" || geometry.type === "Polygon") {
    return (geometry.coordinates || []).flat(1);
  }
  if (geometry.type === "MultiPolygon") {
    return (geometry.coordinates || []).flat(2);
  }
  return [];
};

const createLocalProjector = (originCoordinate) => {
  const [originX = 0, originY = 0] = originCoordinate || [];
  const geographic =
    Math.abs(Number(originX)) <= 180 && Math.abs(Number(originY)) <= 90;
  const latitudeRadians = (Number(originY) * Math.PI) / 180;
  const longitudeFactor = 111320 * Math.max(0.15, Math.cos(latitudeRadians));
  const latitudeFactor = 110540;

  return (coordinate) => {
    const x = Number(coordinate?.[0]);
    const y = Number(coordinate?.[1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

    if (geographic) {
      return {
        x: (x - Number(originX)) * longitudeFactor,
        y: (y - Number(originY)) * latitudeFactor,
      };
    }

    return {
      x: x - Number(originX),
      y: y - Number(originY),
    };
  };
};

const averageCoordinate = (coordinates = []) => {
  const valid = coordinates.filter(
    (coordinate) =>
      Array.isArray(coordinate) &&
      Number.isFinite(Number(coordinate[0])) &&
      Number.isFinite(Number(coordinate[1])),
  );

  if (!valid.length) return [0, 0];

  const totals = valid.reduce(
    (sum, coordinate) => [
      sum[0] + Number(coordinate[0]),
      sum[1] + Number(coordinate[1]),
    ],
    [0, 0],
  );

  return [totals[0] / valid.length, totals[1] / valid.length];
};

const getFeatureOrigin = (feature) => {
  const coordinates = flattenCoordinates(feature?.geometry);
  return averageCoordinate(coordinates);
};

const projectFeaturePoints = (feature, projectCoordinate) =>
  flattenCoordinates(feature?.geometry).map(projectCoordinate).filter(Boolean);

const getBounds = (points = []) => {
  if (!points.length) {
    return {
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0,
      width: 0,
      height: 0,
      centerX: 0,
      centerY: 0,
    };
  }

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
};

const boundsIntersect = (left, right) =>
  !(
    left.maxX < right.minX ||
    left.minX > right.maxX ||
    left.maxY < right.minY ||
    left.minY > right.maxY
  );

const polygonArea = (points = []) => {
  if (points.length < 3) return 0;
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }
  return area / 2;
};

const polygonCentroid = (points = []) => {
  if (points.length < 3) {
    const bounds = getBounds(points);
    return { x: bounds.centerX, y: bounds.centerY };
  }

  const area = polygonArea(points);
  if (Math.abs(area) < 1e-9) {
    const bounds = getBounds(points);
    return { x: bounds.centerX, y: bounds.centerY };
  }

  let x = 0;
  let y = 0;

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const cross = current.x * next.y - next.x * current.y;
    x += (current.x + next.x) * cross;
    y += (current.y + next.y) * cross;
  }

  return {
    x: x / (6 * area),
    y: y / (6 * area),
  };
};

const getLargestOuterRing = (feature, projectCoordinate) => {
  const groups = getPolygonGroups(feature?.geometry);
  let largest = [];
  let largestArea = -1;

  groups.forEach((rings) => {
    const outerRing = rings?.[0] || [];
    const projected = outerRing.map(projectCoordinate).filter(Boolean);
    const area = Math.abs(polygonArea(projected));
    if (area > largestArea) {
      largest = projected;
      largestArea = area;
    }
  });

  if (largest.length > 1) {
    const first = largest[0];
    const last = largest[largest.length - 1];
    if (first.x === last.x && first.y === last.y) return largest.slice(0, -1);
  }

  return largest;
};

const createCanvas = (width, height) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

const createScreenTransform = (view, width, height, padding = 0) => {
  const usableWidth = Math.max(1, width - padding * 2);
  const usableHeight = Math.max(1, height - padding * 2);
  const viewWidth = Math.max(1e-9, view.maxX - view.minX);
  const viewHeight = Math.max(1e-9, view.maxY - view.minY);
  const scale = Math.min(usableWidth / viewWidth, usableHeight / viewHeight);
  const viewCenterX = (view.minX + view.maxX) / 2;
  const viewCenterY = (view.minY + view.maxY) / 2;

  return {
    scale,
    point: (point) => ({
      x: width / 2 + (point.x - viewCenterX) * scale,
      y: height / 2 - (point.y - viewCenterY) * scale,
    }),
  };
};

const tracePolygonGeometry = (ctx, feature, projectCoordinate, screenPoint) => {
  const groups = getPolygonGroups(feature?.geometry);
  let traced = false;

  groups.forEach((rings) => {
    rings.forEach((ring) => {
      const points = ring
        .map(projectCoordinate)
        .filter(Boolean)
        .map(screenPoint);
      if (points.length < 3) return;

      traced = true;
      ctx.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
      ctx.closePath();
    });
  });

  return traced;
};

const drawPolygonFeature = (
  ctx,
  feature,
  projectCoordinate,
  screenPoint,
  { fill, stroke, lineWidth = 2, alpha = 1 } = {},
) => {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  const traced = tracePolygonGeometry(
    ctx,
    feature,
    projectCoordinate,
    screenPoint,
  );

  if (traced && fill) {
    ctx.fillStyle = fill;
    ctx.fill("evenodd");
  }

  if (traced && stroke && lineWidth > 0) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
  }
  ctx.restore();
};

const drawRoadFeature = (
  ctx,
  feature,
  projectCoordinate,
  screenPoint,
  { overview = false } = {},
) => {
  const polygonGroups = getPolygonGroups(feature?.geometry);
  if (polygonGroups.length) {
    drawPolygonFeature(ctx, feature, projectCoordinate, screenPoint, {
      fill: "#FFFFFF",
      stroke: overview ? "#6D6D6D" : "#4B4B4B",
      lineWidth: overview ? 2.6 : 3.4,
    });
    return;
  }

  const lineGroups = getLineGroups(feature?.geometry);
  if (!lineGroups.length) return;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  lineGroups.forEach((line) => {
    const points = line.map(projectCoordinate).filter(Boolean).map(screenPoint);
    if (points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.strokeStyle = "#686868";
    ctx.lineWidth = overview ? 15 : 20;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = overview ? 10 : 14;
    ctx.stroke();
  });

  ctx.restore();
};

const drawTextWithHalo = (
  ctx,
  text,
  x,
  y,
  {
    font = "600 24px Arial",
    fill = "#111111",
    halo = "rgba(255,255,255,0.96)",
    haloWidth = 5,
    align = "center",
    baseline = "middle",
    angle = 0,
  } = {},
) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.lineJoin = "round";
  if (haloWidth > 0) {
    ctx.strokeStyle = halo;
    ctx.lineWidth = haloWidth;
    ctx.strokeText(String(text), 0, 0);
  }
  ctx.fillStyle = fill;
  ctx.fillText(String(text), 0, 0);
  ctx.restore();
};

const drawMultilineText = (
  ctx,
  lines,
  x,
  y,
  {
    font = "600 24px Arial",
    fill = "#111111",
    halo = "rgba(255,255,255,0.96)",
    haloWidth = 5,
    lineHeight = 30,
    angle = 0,
  } = {},
) => {
  const cleanLines = lines.map(normalizeText).filter(Boolean);
  if (!cleanLines.length) return;

  const startY = y - ((cleanLines.length - 1) * lineHeight) / 2;
  cleanLines.forEach((line, index) => {
    drawTextWithHalo(ctx, line, x, startY + index * lineHeight, {
      font,
      fill,
      halo,
      haloWidth,
      angle,
    });
  });
};

const longestSegmentAngle = (screenPoints = []) => {
  let longestLength = 0;
  let angle = 0;

  for (let index = 0; index < screenPoints.length; index += 1) {
    const start = screenPoints[index];
    const end = screenPoints[(index + 1) % screenPoints.length];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    if (length > longestLength) {
      longestLength = length;
      angle = Math.atan2(dy, dx);
    }
  }

  while (angle > Math.PI / 2) angle -= Math.PI;
  while (angle < -Math.PI / 2) angle += Math.PI;
  return angle;
};

const getPlotAreaLabel = (feature) => {
  const properties = feature?.properties || {};
  const direct = normalizeText(
    firstProperty(properties, [
      "plot_area",
      "plot_size",
      "area_label",
      "category",
      "size",
    ]),
  );

  if (direct && !/^\d+(\.\d+)?$/.test(direct)) return direct;

  const squareFeet = Number(
    firstProperty(properties, ["area_sqft", "area_sft", "sqft", "area_ft2"]),
  );
  if (Number.isFinite(squareFeet) && squareFeet > 0) {
    if (squareFeet >= 5445) {
      return `${(squareFeet / 5445).toFixed(2).replace(/\.00$/, "")} Kanal`;
    }
    return `${(squareFeet / 272.25).toFixed(1).replace(/\.0$/, "")} Marla`;
  }

  return direct;
};

const getSquareFeetLabel = (feature) => {
  const squareFeet = Number(
    firstProperty(feature?.properties || {}, [
      "area_sqft",
      "area_sft",
      "sqft",
      "area_ft2",
    ]),
  );

  if (!Number.isFinite(squareFeet) || squareFeet <= 0) return "";
  return `${squareFeet.toFixed(2).replace(/\.00$/, "")} Sft`;
};

const getRoadLabelLines = (feature) => {
  const properties = feature?.properties || {};
  let name = normalizeText(
    firstProperty(properties, [
      "road_name",
      "street_name",
      "street",
      "name",
      "road",
      "type",
    ]),
  );

  const widthValue = normalizeText(
    firstProperty(properties, [
      "road_width",
      "row_width",
      "row",
      "width_ft",
      "road_ft",
      "width",
    ]),
  );

  if (!name || normalizedLowerText(name) === "road") name = "Road";

  const widthHasUnit = /feet|foot|ft|row/i.test(widthValue);
  const widthLabel = widthValue
    ? widthHasUnit
      ? widthValue
      : `${widthValue} feet ROW`
    : "";

  if (name && widthLabel) return [name, `(${widthLabel})`];
  if (name) return [name];
  if (widthLabel) return [widthLabel];
  return ["Road"];
};

const getRoadLabelPoint = (feature, projectCoordinate) => {
  const ring = getLargestOuterRing(feature, projectCoordinate);
  if (ring.length) return polygonCentroid(ring);

  const lines = getLineGroups(feature?.geometry);
  const longestLine = lines
    .map((line) => line.map(projectCoordinate).filter(Boolean))
    .sort((left, right) => right.length - left.length)[0];

  if (!longestLine?.length) return null;
  return longestLine[Math.floor(longestLine.length / 2)];
};

const buildOverviewView = (
  selectedFeature,
  plotFeatures,
  projectCoordinate,
  aspect,
) => {
  const selectedPoints = projectFeaturePoints(
    selectedFeature,
    projectCoordinate,
  );
  const selectedBounds = getBounds(selectedPoints);
  const baseSize = Math.max(selectedBounds.width, selectedBounds.height, 18);
  const centerX = selectedBounds.centerX;
  const centerY = selectedBounds.centerY;
  const featureBounds = plotFeatures.map((feature) => ({
    feature,
    bounds: getBounds(projectFeaturePoints(feature, projectCoordinate)),
  }));

  let heightFactor = 6.5;
  let view;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const viewHeight = baseSize * heightFactor;
    const viewWidth = viewHeight * aspect;
    view = {
      minX: centerX - viewWidth / 2,
      maxX: centerX + viewWidth / 2,
      minY: centerY - viewHeight / 2,
      maxY: centerY + viewHeight / 2,
    };

    const visibleCount = featureBounds.filter(({ bounds }) =>
      boundsIntersect(bounds, view),
    ).length;

    if (visibleCount >= 16 || attempt === 4) break;
    heightFactor *= 1.35;
  }

  return view;
};

const drawOverviewPlotLabel = (
  ctx,
  feature,
  projectCoordinate,
  screenTransform,
) => {
  const ring = getLargestOuterRing(feature, projectCoordinate);
  if (ring.length < 3) return;

  const screenRing = ring.map(screenTransform.point);
  const screenBounds = getBounds(screenRing);
  if (screenBounds.width < 18 || screenBounds.height < 12) return;

  const centroid = screenTransform.point(polygonCentroid(ring));
  const landUseClass = classifyLandUse(feature);
  const plotNo = getPlotNo(feature);
  const areaLabel = getPlotAreaLabel(feature);
  const angle = longestSegmentAngle(screenRing);
  const availableSize = Math.min(screenBounds.width, screenBounds.height);

  if (plotNo) {
    const fontSize = clamp(availableSize * 0.42, 15, 31);
    drawTextWithHalo(ctx, plotNo, centroid.x, centroid.y, {
      font: `700 ${fontSize}px Arial`,
      fill: "#003DFF",
      haloWidth: Math.max(3, fontSize * 0.14),
      angle,
    });
    return;
  }

  const landUseLabel = LAND_USE_LABELS[landUseClass] || "";
  if (!landUseLabel || landUseClass === "fallback") return;

  const fontSize = clamp(availableSize * 0.24, 13, 24);
  drawMultilineText(ctx, [landUseLabel, areaLabel], centroid.x, centroid.y, {
    font: `600 ${fontSize}px Arial`,
    fill: "#1B1B1B",
    haloWidth: Math.max(3, fontSize * 0.13),
    lineHeight: fontSize * 1.12,
    angle,
  });
};

const createOverviewCanvas = ({
  selectedFeature,
  contextGeojson,
  roadsGeojson,
  width = 3200,
  height = 1180,
}) => {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  const contextPlots = (contextGeojson?.features || []).filter(
    (feature) => getPolygonGroups(feature?.geometry).length > 0,
  );
  const plots = contextPlots.some((feature) =>
    isSameFeature(feature, selectedFeature),
  )
    ? contextPlots
    : [...contextPlots, selectedFeature];
  const roads = roadsGeojson?.features || [];
  const originCoordinate = getFeatureOrigin(selectedFeature);
  const projectCoordinate = createLocalProjector(originCoordinate);
  const view = buildOverviewView(
    selectedFeature,
    plots.length ? plots : [selectedFeature],
    projectCoordinate,
    width / height,
  );
  const screenTransform = createScreenTransform(view, width, height, 24);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.clip();

  roads.forEach((feature) => {
    const bounds = getBounds(projectFeaturePoints(feature, projectCoordinate));
    if (!boundsIntersect(bounds, view)) return;
    drawRoadFeature(ctx, feature, projectCoordinate, screenTransform.point, {
      overview: true,
    });
  });

  plots.forEach((feature) => {
    const bounds = getBounds(projectFeaturePoints(feature, projectCoordinate));
    if (!boundsIntersect(bounds, view)) return;

    const landUseClass = classifyLandUse(feature);
    drawPolygonFeature(ctx, feature, projectCoordinate, screenTransform.point, {
      fill: LAND_USE_COLORS[landUseClass] || LAND_USE_COLORS.fallback,
      stroke: "#232323",
      lineWidth: 2.4,
    });
  });

  plots.forEach((feature) => {
    const bounds = getBounds(projectFeaturePoints(feature, projectCoordinate));
    if (!boundsIntersect(bounds, view)) return;
    drawOverviewPlotLabel(ctx, feature, projectCoordinate, screenTransform);
  });

  roads.forEach((feature) => {
    const bounds = getBounds(projectFeaturePoints(feature, projectCoordinate));
    if (!boundsIntersect(bounds, view)) return;
    const labelPoint = getRoadLabelPoint(feature, projectCoordinate);
    if (!labelPoint) return;
    const screenPoint = screenTransform.point(labelPoint);
    drawMultilineText(
      ctx,
      getRoadLabelLines(feature),
      screenPoint.x,
      screenPoint.y,
      {
        font: "600 19px Arial",
        fill: "#3E3E3E",
        haloWidth: 5,
        lineHeight: 22,
      },
    );
  });

  ctx.restore();
  return canvas;
};

const getPrincipalAxes = (points = []) => {
  const centroid = polygonCentroid(points);
  if (!points.length) {
    return {
      centroid,
      longAxis: { x: 0, y: 1 },
      shortAxis: { x: 1, y: 0 },
    };
  }

  let xx = 0;
  let yy = 0;
  let xy = 0;

  points.forEach((point) => {
    const dx = point.x - centroid.x;
    const dy = point.y - centroid.y;
    xx += dx * dx;
    yy += dy * dy;
    xy += dx * dy;
  });

  const angle = 0.5 * Math.atan2(2 * xy, xx - yy);
  let longAxis = { x: Math.cos(angle), y: Math.sin(angle) };
  let shortAxis = { x: -longAxis.y, y: longAxis.x };

  const longExtent = getBounds(
    points.map((point) => ({
      x:
        (point.x - centroid.x) * longAxis.x +
        (point.y - centroid.y) * longAxis.y,
      y: 0,
    })),
  ).width;

  const shortExtent = getBounds(
    points.map((point) => ({
      x:
        (point.x - centroid.x) * shortAxis.x +
        (point.y - centroid.y) * shortAxis.y,
      y: 0,
    })),
  ).width;

  if (shortExtent > longExtent) {
    const previousLong = longAxis;
    longAxis = shortAxis;
    shortAxis = { x: -previousLong.x, y: -previousLong.y };
  }

  if (longAxis.y < 0) {
    longAxis = { x: -longAxis.x, y: -longAxis.y };
    shortAxis = { x: -shortAxis.x, y: -shortAxis.y };
  }

  return { centroid, longAxis, shortAxis };
};

const createAxisProjector =
  ({ centroid, longAxis, shortAxis }) =>
  (point) => ({
    x:
      (point.x - centroid.x) * shortAxis.x +
      (point.y - centroid.y) * shortAxis.y,
    y:
      (point.x - centroid.x) * longAxis.x + (point.y - centroid.y) * longAxis.y,
  });

const getAxisFeaturePoints = (feature, projectCoordinate, axisProjector) =>
  projectFeaturePoints(feature, projectCoordinate).map(axisProjector);

const findAdjacentPlots = ({
  selectedFeature,
  plotFeatures,
  projectCoordinate,
  axisProjector,
}) => {
  const selectedPoints = getAxisFeaturePoints(
    selectedFeature,
    projectCoordinate,
    axisProjector,
  );
  const selectedBounds = getBounds(selectedPoints);
  const selectedWidth = Math.max(selectedBounds.width, 1);
  const selectedHeight = Math.max(selectedBounds.height, 1);
  const selectedCenterY = selectedBounds.centerY;
  const best = { left: null, right: null };

  plotFeatures.forEach((feature) => {
    if (isSameFeature(feature, selectedFeature)) return;

    const points = getAxisFeaturePoints(
      feature,
      projectCoordinate,
      axisProjector,
    );
    if (!points.length) return;

    const bounds = getBounds(points);
    const overlap = Math.max(
      0,
      Math.min(selectedBounds.maxY, bounds.maxY) -
        Math.max(selectedBounds.minY, bounds.minY),
    );
    const overlapRatio =
      overlap / Math.max(1, Math.min(selectedHeight, bounds.height));
    if (overlapRatio < 0.35) return;

    const side = bounds.centerX < selectedBounds.centerX ? "left" : "right";
    const rawGap =
      side === "left"
        ? selectedBounds.minX - bounds.maxX
        : bounds.minX - selectedBounds.maxX;
    const allowedGap = Math.max(selectedWidth, bounds.width) * 0.85;
    if (rawGap > allowedGap) return;

    const score =
      Math.max(0, rawGap) +
      Math.abs(bounds.centerY - selectedCenterY) * 0.28 +
      Math.abs(bounds.height - selectedHeight) * 0.05;

    if (!best[side] || score < best[side].score) {
      best[side] = { feature, bounds, score };
    }
  });

  return {
    left: best.left?.feature || null,
    right: best.right?.feature || null,
  };
};

const formatFeetAndInches = (metres) => {
  if (!Number.isFinite(metres) || metres <= 0) return "";
  const totalInches = Math.round(metres * 39.3700787402);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}'-${String(inches).padStart(2, "0")}"`;
};

const drawSelectedDimensions = (
  ctx,
  selectedRing,
  axisProjector,
  screenPoint,
) => {
  const ring = selectedRing.map(axisProjector);
  if (ring.length < 3) return;

  const edges = ring.map((start, index) => {
    const end = ring[(index + 1) % ring.length];
    return {
      start,
      end,
      length: Math.hypot(end.x - start.x, end.y - start.y),
    };
  });

  const maximumLength = Math.max(...edges.map((edge) => edge.length), 0);
  let visibleEdges = edges.filter(
    (edge) => edge.length >= Math.max(0.3, maximumLength * 0.22),
  );

  if (visibleEdges.length > 6) {
    const chosen = new Set(
      [...visibleEdges]
        .sort((left, right) => right.length - left.length)
        .slice(0, 6),
    );
    visibleEdges = edges.filter((edge) => chosen.has(edge));
  }

  const screenCenter = screenPoint({ x: 0, y: 0 });

  visibleEdges.forEach((edge) => {
    const start = screenPoint(edge.start);
    const end = screenPoint(edge.end);
    const midpoint = {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2,
    };
    const awayX = midpoint.x - screenCenter.x;
    const awayY = midpoint.y - screenCenter.y;
    const awayLength = Math.max(1, Math.hypot(awayX, awayY));
    const offset = 25;
    const labelX = midpoint.x + (awayX / awayLength) * offset;
    const labelY = midpoint.y + (awayY / awayLength) * offset;
    let angle = Math.atan2(end.y - start.y, end.x - start.x);
    while (angle > Math.PI / 2) angle -= Math.PI;
    while (angle < -Math.PI / 2) angle += Math.PI;

    drawTextWithHalo(ctx, formatFeetAndInches(edge.length), labelX, labelY, {
      font: "600 18px Arial",
      fill: "#242424",
      haloWidth: 5,
      angle,
    });
  });
};

const createDimensionView = ({
  selectedFeature,
  leftAdjacent,
  rightAdjacent,
  projectCoordinate,
  axisProjector,
  aspect,
}) => {
  const selectedBounds = getBounds(
    getAxisFeaturePoints(selectedFeature, projectCoordinate, axisProjector),
  );
  const selectedWidth = Math.max(selectedBounds.width, 1);
  const selectedHeight = Math.max(selectedBounds.height, 1);
  const includedFeatures = [
    selectedFeature,
    leftAdjacent,
    rightAdjacent,
  ].filter(Boolean);
  const includedBounds = includedFeatures.map((feature) =>
    getBounds(getAxisFeaturePoints(feature, projectCoordinate, axisProjector)),
  );

  const requiredHalfWidth = Math.max(
    selectedWidth * 2.1,
    ...includedBounds.map((bounds) =>
      Math.max(Math.abs(bounds.minX), Math.abs(bounds.maxX)),
    ),
  );
  const requiredHalfHeight = Math.max(
    selectedHeight * 0.78,
    ...includedBounds.map((bounds) =>
      Math.max(Math.abs(bounds.minY), Math.abs(bounds.maxY)),
    ),
  );

  let viewHeight = requiredHalfHeight * 2 + selectedHeight * 0.18;
  let viewWidth = Math.max(
    requiredHalfWidth * 2 + selectedWidth * 0.7,
    viewHeight * aspect,
  );

  if (viewWidth / viewHeight > aspect) {
    viewHeight = viewWidth / aspect;
  } else {
    viewWidth = viewHeight * aspect;
  }

  return {
    minX: -viewWidth / 2,
    maxX: viewWidth / 2,
    minY: -viewHeight / 2,
    maxY: viewHeight / 2,
  };
};

const drawAdjacentPlotLabel = (
  ctx,
  feature,
  projectCoordinate,
  axisProjector,
  screenPoint,
) => {
  if (!feature) return;
  const ring = getLargestOuterRing(feature, projectCoordinate).map(
    axisProjector,
  );
  if (!ring.length) return;
  const center = screenPoint(polygonCentroid(ring));
  const plotNo = getPlotNo(feature);

  drawMultilineText(ctx, [plotNo, "Adjacent", "Plot"], center.x, center.y, {
    font: "600 24px Arial",
    fill: "#202020",
    haloWidth: 5,
    lineHeight: 27,
  });
};

const drawSelectedPlotLabel = (
  ctx,
  selectedFeature,
  details,
  projectCoordinate,
  axisProjector,
  screenPoint,
) => {
  const ring = getLargestOuterRing(selectedFeature, projectCoordinate).map(
    axisProjector,
  );
  if (!ring.length) return;
  const center = screenPoint(polygonCentroid(ring));
  const areaLabel =
    normalizeText(details?.plotArea) || getPlotAreaLabel(selectedFeature);
  const squareFeetLabel = getSquareFeetLabel(selectedFeature);
  const plotNo = normalizeText(details?.plotNo) || getPlotNo(selectedFeature);

  const topLines = [areaLabel, squareFeetLabel].filter(Boolean);
  drawMultilineText(ctx, topLines, center.x, center.y - 30, {
    font: "600 27px Arial",
    fill: "#1B1B1B",
    haloWidth: 6,
    lineHeight: 32,
  });

  drawTextWithHalo(ctx, plotNo, center.x, center.y + 60, {
    font: "700 72px Arial",
    fill: "#003DFF",
    haloWidth: 8,
  });
};

const createDimensionCanvas = ({
  selectedFeature,
  contextGeojson,
  roadsGeojson,
  details,
  width = 3200,
  height = 980,
}) => {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  const plotFeatures = contextGeojson?.features || [];
  const roadFeatures = roadsGeojson?.features || [];
  const originCoordinate = getFeatureOrigin(selectedFeature);
  const projectCoordinate = createLocalProjector(originCoordinate);
  const selectedRing = getLargestOuterRing(selectedFeature, projectCoordinate);
  const axes = getPrincipalAxes(selectedRing);
  const axisProjector = createAxisProjector(axes);
  const { left, right } = findAdjacentPlots({
    selectedFeature,
    plotFeatures,
    projectCoordinate,
    axisProjector,
  });

  const view = createDimensionView({
    selectedFeature,
    leftAdjacent: left,
    rightAdjacent: right,
    projectCoordinate,
    axisProjector,
    aspect: width / height,
  });
  const screenTransform = createScreenTransform(view, width, height, 32);
  const axisScreenPoint = screenTransform.point;

  const roadProjectCoordinate = (coordinate) => {
    const localPoint = projectCoordinate(coordinate);
    return localPoint ? axisProjector(localPoint) : null;
  };

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.clip();

  roadFeatures.forEach((feature) => {
    const bounds = getBounds(
      projectFeaturePoints(feature, roadProjectCoordinate),
    );
    if (!boundsIntersect(bounds, view)) return;
    drawRoadFeature(ctx, feature, roadProjectCoordinate, axisScreenPoint, {
      overview: false,
    });
  });

  [left, right].filter(Boolean).forEach((feature) => {
    drawPolygonFeature(ctx, feature, roadProjectCoordinate, axisScreenPoint, {
      fill: "#F8F8F8",
      stroke: "#303030",
      lineWidth: 3.5,
    });
  });

  drawPolygonFeature(
    ctx,
    selectedFeature,
    roadProjectCoordinate,
    axisScreenPoint,
    {
      fill: "#9ED8F1",
      stroke: "#0037FF",
      lineWidth: 8,
    },
  );

  roadFeatures.forEach((feature) => {
    const bounds = getBounds(
      projectFeaturePoints(feature, roadProjectCoordinate),
    );
    if (!boundsIntersect(bounds, view)) return;
    const labelPoint = getRoadLabelPoint(feature, roadProjectCoordinate);
    if (!labelPoint) return;
    const screenPoint = axisScreenPoint(labelPoint);
    drawMultilineText(
      ctx,
      getRoadLabelLines(feature),
      screenPoint.x,
      screenPoint.y,
      {
        font: "600 21px Arial",
        fill: "#313131",
        haloWidth: 6,
        lineHeight: 25,
      },
    );
  });

  drawAdjacentPlotLabel(
    ctx,
    left,
    projectCoordinate,
    axisProjector,
    axisScreenPoint,
  );
  drawAdjacentPlotLabel(
    ctx,
    right,
    projectCoordinate,
    axisProjector,
    axisScreenPoint,
  );
  drawSelectedPlotLabel(
    ctx,
    selectedFeature,
    details,
    projectCoordinate,
    axisProjector,
    axisScreenPoint,
  );
  drawSelectedDimensions(ctx, selectedRing, axisProjector, axisScreenPoint);

  ctx.restore();
  return canvas;
};

const drawCompassRosePdf = (doc, centerX, centerY, radius = 9) => {
  const inner = radius * 0.18;
  const middle = radius * 0.56;

  doc.setDrawColor(20, 20, 20);
  doc.setLineWidth(0.25);
  doc.line(centerX, centerY - radius, centerX, centerY + radius);
  doc.line(centerX - radius, centerY, centerX + radius, centerY);
  doc.line(
    centerX - radius * 0.68,
    centerY - radius * 0.68,
    centerX + radius * 0.68,
    centerY + radius * 0.68,
  );
  doc.line(
    centerX + radius * 0.68,
    centerY - radius * 0.68,
    centerX - radius * 0.68,
    centerY + radius * 0.68,
  );

  doc.setFillColor(18, 18, 18);
  doc.triangle(
    centerX,
    centerY - radius,
    centerX - inner,
    centerY,
    centerX + inner,
    centerY,
    "FD",
  );
  doc.triangle(
    centerX,
    centerY + radius,
    centerX - inner,
    centerY,
    centerX + inner,
    centerY,
    "FD",
  );
  doc.triangle(
    centerX + radius,
    centerY,
    centerX,
    centerY - inner,
    centerX,
    centerY + inner,
    "FD",
  );
  doc.triangle(
    centerX - radius,
    centerY,
    centerX,
    centerY - inner,
    centerX,
    centerY + inner,
    "FD",
  );

  doc.setFillColor(255, 255, 255);
  doc.triangle(
    centerX,
    centerY - middle,
    centerX - inner * 0.65,
    centerY,
    centerX + inner * 0.65,
    centerY,
    "FD",
  );
  doc.triangle(
    centerX,
    centerY + middle,
    centerX - inner * 0.65,
    centerY,
    centerX + inner * 0.65,
    centerY,
    "FD",
  );

  doc.setFillColor(18, 18, 18);
  doc.circle(centerX, centerY, radius * 0.12, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.4);
  doc.setTextColor(25, 25, 25);
  doc.text("N", centerX, centerY - radius - 2.4, { align: "center" });
  doc.text("S", centerX, centerY + radius + 4.2, { align: "center" });
  doc.text("W", centerX - radius - 3.6, centerY + 1.8, { align: "center" });
  doc.text("E", centerX + radius + 3.6, centerY + 1.8, { align: "center" });
};

const getTitleFontSize = (doc, title, maximumWidth) => {
  let fontSize = 18.5;
  doc.setFont("helvetica", "bold");
  while (fontSize > 11.5) {
    doc.setFontSize(fontSize);
    if (doc.getTextWidth(title) <= maximumWidth) break;
    fontSize -= 0.5;
  }
  return fontSize;
};

export const printPartPlan = async ({
  parcel,
  filters = {},
  contextGeojson = EMPTY_FEATURE_COLLECTION,
  roadsGeojson = EMPTY_FEATURE_COLLECTION,
}) => {
  if (!parcel) {
    alert("Please select a plot first.");
    return;
  }

  const previewWindow = createPdfPreviewWindow("Part Plan");
  if (!previewWindow) return;

  try {
    const details = buildPlotDetails(parcel, filters);
    const [locationCanvas, dimensionCanvas] = await Promise.all([
      Promise.resolve(
        createOverviewCanvas({
          selectedFeature: parcel,
          contextGeojson,
          roadsGeojson,
          width: 3200,
          height: 1160,
        }),
      ),
      Promise.resolve(
        createDimensionCanvas({
          selectedFeature: parcel,
          contextGeojson,
          roadsGeojson,
          details,
          width: 3200,
          height: 980,
        }),
      ),
    ]);

    const locationImage = canvasAsPng(locationCanvas);
    const dimensionImage = canvasAsPng(dimensionCanvas);

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a3",
      compress: true,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 8;
    const contentWidth = pageWidth - margin * 2;
    const titleHeight = 19;
    const subtitleHeight = 11;
    const mapHeight = 128;
    const dimensionTop = margin + titleHeight + subtitleHeight + mapHeight;
    const dimensionHeight = pageHeight - dimensionTop - margin;

    doc.setTextColor(15, 15, 15);
    doc.setDrawColor(85, 85, 85);
    doc.setLineWidth(0.28);

    /* ===== TOP BAR ===== */
    doc.setFillColor(30, 58, 95);
    doc.rect(0, 0, pageWidth, 1.8, "F");

    /* ===== OUTER BORDER ===== */
    doc.setDrawColor(30, 58, 95);
    doc.setLineWidth(0.35);
    doc.rect(margin, margin, contentWidth, pageHeight - margin * 2);

    const schemeName = valueOrDash(
      details.project,
      "CHAHARBAGH HOUSING SCHEME",
    ).toUpperCase();
    const title = `SCHEME PART PLAN OF PLOT NO ${valueOrDash(
      details.plotNo,
    )}, BLOCK ${valueOrDash(details.block)}, ${schemeName}`;

    /* ===== TITLE BOX ===== */
    doc.setFillColor(30, 58, 95);
    doc.setDrawColor(30, 58, 95);
    doc.rect(margin, margin, contentWidth, titleHeight, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(getTitleFontSize(doc, title, contentWidth - 10));
    doc.setTextColor(255, 255, 255);
    doc.text(title, margin + 5, margin + 12.5);
    doc.setTextColor(15, 15, 15);

    /* ===== SUBTITLE BOX ===== */
    const subtitleTop = margin + titleHeight;
    doc.setDrawColor(30, 58, 95);
    doc.setLineWidth(0.35);
    doc.rect(margin, subtitleTop, contentWidth, subtitleHeight);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11.5);
    doc.setTextColor(100, 100, 100);
    doc.text(
      "LOCATION PLAN AS PER APPROVED MASTER PLAN",
      margin + 5,
      subtitleTop + 7.5,
    );
    doc.setTextColor(15, 15, 15);

    /* ===== LOCATION PLAN ===== */
    const mapTop = subtitleTop + subtitleHeight;
    doc.setDrawColor(30, 58, 95);
    doc.setLineWidth(0.35);
    doc.rect(margin, mapTop, contentWidth, mapHeight);

    if (locationImage) {
      addImageContained(
        doc,
        locationImage.dataUrl,
        locationImage.width,
        locationImage.height,
        margin + 0.5,
        mapTop + 0.5,
        contentWidth - 1,
        mapHeight - 1,
      );
    }

    // Place the compass rose in the upper-left corner of the location plan,
    // matching the approved template instead of centring it over the map.
    drawCompassRosePdf(doc, margin + 21, mapTop + 17, 8.2);

    /* ===== PLOT DIMENSIONS ===== */
    doc.setDrawColor(30, 58, 95);
    doc.setLineWidth(0.35);
    doc.rect(margin, dimensionTop, contentWidth, dimensionHeight);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.2);
    doc.setTextColor(30, 58, 95);
    doc.text("PLOT DIMENSIONS", margin + 7, dimensionTop + 7);
    doc.setTextColor(15, 15, 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.7);
    doc.setTextColor(100, 100, 100);
    doc.text("As per approved Scheme Plan", margin + 7, dimensionTop + 11.5);
    doc.setTextColor(15, 15, 15);

    if (dimensionImage) {
      addImageContained(
        doc,
        dimensionImage.dataUrl,
        dimensionImage.width,
        dimensionImage.height,
        margin + 9,
        dimensionTop + 4,
        contentWidth - 18,
        dimensionHeight - 10,
      );
    }

    drawCompassRosePdf(doc, pageWidth - margin - 25, dimensionTop + 27, 9.2);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(85, 85, 85);
    doc.text(
      "NOTE: ALL DIMENSIONS ARE IN FEET AND INCHES.",
      margin + 7,
      pageHeight - margin - 6,
    );
    doc.setTextColor(15, 15, 15);

    /* ===== FOOTER ===== */
    doc.setDrawColor(30, 58, 95);
    doc.setLineWidth(0.5);
    doc.line(
      margin,
      pageHeight - margin - 4,
      pageWidth - margin,
      pageHeight - margin - 4,
    );
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Generated: ${new Date().toLocaleDateString(
        "en-GB",
      )} | RUDA Part Plan System | This is a computer-generated document.`,
      pageWidth / 2,
      pageHeight - margin - 1,
      { align: "center" },
    );

    openPdfPreview(
      doc,
      `Part Plan - Plot ${details.plotNo || ""}`,
      previewWindow,
    );
  } catch (error) {
    previewWindow.close();
    console.error("Part plan generation failed", error);
    alert(
      "Failed to generate the part plan. Please check the selected plot data and try again.",
    );
  }
};

export default printPartPlan;

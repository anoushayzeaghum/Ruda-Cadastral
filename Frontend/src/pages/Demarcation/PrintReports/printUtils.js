import gopLogoUrl from "./assets/gop-logo.png";
import rudaLogoUrl from "./assets/ruda-logo.jpg";
import rudaWatermarkUrl from "./assets/ruda-watermark.png";

export const EMPTY_FC = { type: "FeatureCollection", features: [] };

export const firstValue = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
};

export const valueOrDash = (...values) => firstValue(...values) || "-";

const numericValue = (...values) => {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

export const formatDate = (value, fallbackToToday = false) => {
  const raw = firstValue(value);
  const date = raw ? new Date(raw) : fallbackToToday ? new Date() : null;
  if (!date || Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

export const buildPlotDetails = (parcel = null, filters = {}) => {
  const p = parcel?.properties || {};

  return {
    project: firstValue(
      filters.projectName,
      p.project,
      p.project_name,
      p.scheme,
      p.scheme_name,
      p.project_id,
    ),
    block: firstValue(p.block, p.block_name, filters.block),
    phase: firstValue(p.phase, p.phase_name, p.project_phase, p.ph),
    plotNo: firstValue(p.plot_no, p.plotno, p.plot_number, p.pl_no, parcel?.id),
    landUse: firstValue(p.land_use, p.landuse, p.plot_category, p.category, p.name, p.type),
    plotCategory: firstValue(
      p.plot_category,
      p.category,
      p.type,
      p.land_use,
      p.name,
    ),
    plotArea: firstValue(
      p.plot_area,
      p.area,
      p.total_area,
      p.area_sqft,
      p.area_sft,
      p.shape_area,
    ),
    plotSize: firstValue(p.plot_size, p.size, p.dimension, p.plot_area, p.area),
    dimension: firstValue(p.dimension, p.dimensions, p.plot_dimension),
    roadFt: firstValue(
      p.rd_ft,
      p.road_ft,
      p.road_width,
      p.road_wide,
      p.row_width,
    ),
    roadFacing: firstValue(p.rd_facing, p.road_facing, p.facing),
    streetRoadNo: firstValue(
      p.street_road_no,
      p.street_no,
      p.road_no,
      p.rd_no,
      p.road_name,
      p.rd_facing,
    ),
    parkFront: firstValue(p.parkfront, p.park_front),
    storey: firstValue(p.storey, p.storeys, p.floors),
    possession: firstValue(p.possession, p.possession_date, p.poss_date),
    possessionDate: formatDate(
      firstValue(p.possession_date, p.poss_date, p.handover_date, p.date),
    ),
    possessionStatus: firstValue(p.poss_st, p.possession_status),
    canceled: firstValue(p.canceled, p.cancelled),
    sitePlan: firstValue(p.site_plan, p.siteplan),
    uniqueId: firstValue(p.unique_id, p.uid, p.plot_id, p.gid),
    transferSrNo: firstValue(p.tr_srno, p.transfer_sr_no, p.registration_no),
    owner: firstValue(
      p.tr_own,
      p.owner,
      p.owner_name,
      p.allottee,
      p.allottee_name,
      p.name_of_owner,
    ),
    transferPlotNo: firstValue(p.tr_p_no, p.transfer_plot_no),
    transferCategory: firstValue(p.tr_cate, p.transfer_category),
    remarks: firstValue(p.remarks, p.remark),
    shapeArea: firstValue(p.shape_area),
    shapeLength: firstValue(p.shape_leng, p.shape_length),
    fileReference: firstValue(
      p.file_reference_no,
      p.file_ref_no,
      p.file_no,
      p.reference_no,
      p.ref_no,
    ),
    registrationNo: firstValue(
      p.registration_no,
      p.registration,
      p.reg_no,
      p.tr_srno,
    ),
    applicationNo: firstValue(p.application_no, p.application, p.app_no),
    postalAddress: firstValue(
      p.postal_address,
      p.owner_address,
      p.address,
      p.mail_address,
    ),
    cnic: firstValue(p.cnic, p.owner_cnic, p.allottee_cnic, p.nic),
    documentDate: formatDate(
      firstValue(p.site_plan_date, p.document_date, p.date, p.updated_at),
      true,
    ),
    excessArea: firstValue(p.excess_area, p.excess_area_sqft, p.extra_area),
    chamferArea: firstValue(p.chamfer_area, p.champher_area, p.corner_area),
    frontBoundedBy: firstValue(p.front_bounded_by, p.front_side, p.front),
    backBoundedBy: firstValue(p.back_bounded_by, p.back_side, p.back),
    rightBoundedBy: firstValue(p.right_bounded_by, p.right_side, p.right),
    leftBoundedBy: firstValue(p.left_bounded_by, p.left_side, p.left),
    frontLength: firstValue(p.front_length, p.front_dimension, p.front_dim),
    backLength: firstValue(p.back_length, p.back_dimension, p.back_dim),
    rightLength: firstValue(p.right_length, p.right_dimension, p.right_dim),
    leftLength: firstValue(p.left_length, p.left_dimension, p.left_dim),
  };
};

export const getPlotPdfKey = (plotNo) => {
  const match = String(plotNo || "").match(/\d+[A-Za-z]?/);
  return match ? match[0] : "";
};

export const getGeometryRing = (geometry) => {
  if (!geometry) return [];

  let ring = [];
  if (geometry.type === "Polygon") ring = geometry.coordinates?.[0] || [];
  if (geometry.type === "MultiPolygon")
    ring = geometry.coordinates?.[0]?.[0] || [];

  if (ring.length > 1) {
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first?.[0] === last?.[0] && first?.[1] === last?.[1]) {
      ring = ring.slice(0, -1);
    }
  }

  return ring.filter(
    (coord) =>
      Array.isArray(coord) &&
      coord.length >= 2 &&
      Number.isFinite(Number(coord[0])) &&
      Number.isFinite(Number(coord[1])),
  );
};

const walkCoordinates = (coordinates, output) => {
  if (!Array.isArray(coordinates)) return;
  if (
    coordinates.length >= 2 &&
    Number.isFinite(Number(coordinates[0])) &&
    Number.isFinite(Number(coordinates[1]))
  ) {
    output.push([Number(coordinates[0]), Number(coordinates[1])]);
    return;
  }
  coordinates.forEach((item) => walkCoordinates(item, output));
};

export const getFeatureCoordinates = (feature) => {
  const output = [];
  walkCoordinates(feature?.geometry?.coordinates, output);
  return output;
};

export const getBounds = (features = []) => {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let hasCoordinates = false;

  features.forEach((feature) => {
    getFeatureCoordinates(feature).forEach(([x, y]) => {
      hasCoordinates = true;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    });
  });

  return hasCoordinates ? { minX, maxX, minY, maxY } : null;
};

const expandBounds = (bounds, factor = 0.18) => {
  if (!bounds) return null;
  const width = Math.max(bounds.maxX - bounds.minX, 1e-8);
  const height = Math.max(bounds.maxY - bounds.minY, 1e-8);
  return {
    minX: bounds.minX - width * factor,
    maxX: bounds.maxX + width * factor,
    minY: bounds.minY - height * factor,
    maxY: bounds.maxY + height * factor,
  };
};

const intersectsBounds = (a, b) =>
  a &&
  b &&
  a.minX <= b.maxX &&
  a.maxX >= b.minX &&
  a.minY <= b.maxY &&
  a.maxY >= b.minY;

const boundsOfFeature = (feature) => getBounds(feature ? [feature] : []);

const getContextFeatures = (selectedFeature, contextGeojson, mode) => {
  const all = contextGeojson?.features || [];
  if (!selectedFeature) return all;
  if (mode === "location") return all.length ? all : [selectedFeature];

  const selectedBounds = boundsOfFeature(selectedFeature);
  if (!selectedBounds) return [selectedFeature];

  const selectedCenter = [
    (selectedBounds.minX + selectedBounds.maxX) / 2,
    (selectedBounds.minY + selectedBounds.maxY) / 2,
  ];

  // The site-plan drawing should show the selected plot at a readable scale,
  // together with only its immediate surroundings. The old 4.5x expansion
  // included most of the scheme and caused all labels to overlap.
  const neighborhoodBounds = expandBounds(
    selectedBounds,
    mode === "partOverview" ? 8.5 : mode === "part" ? 0.9 : 1.35,
  );
  const nearby = all
    .filter((feature) => intersectsBounds(boundsOfFeature(feature), neighborhoodBounds))
    .map((feature) => {
      const b = boundsOfFeature(feature);
      const cx = b ? (b.minX + b.maxX) / 2 : selectedCenter[0];
      const cy = b ? (b.minY + b.maxY) / 2 : selectedCenter[1];
      return {
        feature,
        distance: Math.hypot(cx - selectedCenter[0], cy - selectedCenter[1]),
      };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(
      0,
      mode === "partOverview" ? 90 : mode === "part" ? 8 : 18,
    )
    .map(({ feature }) => feature);

  if (!nearby.some((feature) => feature === selectedFeature)) {
    nearby.unshift(selectedFeature);
  }

  return nearby.length ? nearby : [selectedFeature];
};

export const loadImage = (src) =>
  new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

let assetsPromise = null;
export const loadPrintAssets = () => {
  if (!assetsPromise) {
    assetsPromise = Promise.all([
      loadImage(gopLogoUrl),
      loadImage(rudaLogoUrl),
      loadImage(rudaWatermarkUrl),
    ]).then(([gopLogo, rudaLogo, watermark]) => ({
      gopLogo,
      rudaLogo,
      watermark,
    }));
  }
  return assetsPromise;
};

export const captureDemarcationMap = async () => {
  const canvas =
    document.querySelector("#demarcation-map .mapboxgl-canvas") ||
    document.querySelector(".demarcation-map-root .mapboxgl-canvas") ||
    document.querySelector(".mapboxgl-canvas");

  if (!canvas || typeof canvas.toDataURL !== "function") return null;

  try {
    return {
      dataUrl: canvas.toDataURL("image/png", 1),
      width: canvas.width || canvas.clientWidth,
      height: canvas.height || canvas.clientHeight,
    };
  } catch (error) {
    console.warn("Map canvas capture failed", error);
    return null;
  }
};

export const addImageContained = (
  doc,
  imageData,
  sourceWidth,
  sourceHeight,
  x,
  y,
  width,
  height,
  format = "PNG",
) => {
  if (!imageData || !sourceWidth || !sourceHeight) return;
  const sourceRatio = sourceWidth / sourceHeight;
  const boxRatio = width / height;

  let drawWidth = width;
  let drawHeight = height;
  let drawX = x;
  let drawY = y;

  if (sourceRatio > boxRatio) {
    drawHeight = width / sourceRatio;
    drawY = y + (height - drawHeight) / 2;
  } else {
    drawWidth = height * sourceRatio;
    drawX = x + (width - drawWidth) / 2;
  }

  doc.addImage(
    imageData,
    format,
    drawX,
    drawY,
    drawWidth,
    drawHeight,
    undefined,
    "FAST",
  );
};

export const addImageCovered = (
  doc,
  imageData,
  sourceWidth,
  sourceHeight,
  x,
  y,
  width,
  height,
  format = "PNG",
) => {
  if (!imageData || !sourceWidth || !sourceHeight) return;
  const sourceRatio = sourceWidth / sourceHeight;
  const boxRatio = width / height;

  let drawWidth = width;
  let drawHeight = height;
  let drawX = x;
  let drawY = y;

  if (sourceRatio > boxRatio) {
    drawWidth = height * sourceRatio;
    drawX = x - (drawWidth - width) / 2;
  } else {
    drawHeight = width / sourceRatio;
    drawY = y - (drawHeight - height) / 2;
  }

  doc.saveGraphicsState();
  doc.rect(x, y, width, height);
  doc.clip();
  doc.addImage(
    imageData,
    format,
    drawX,
    drawY,
    drawWidth,
    drawHeight,
    undefined,
    "FAST",
  );
  doc.restoreGraphicsState();
};

export const createPdfPreviewWindow = (title = "Preparing PDF") => {
  const preview = window.open("", "_blank");
  if (!preview) {
    alert("Please allow popups to preview the PDF.");
    return null;
  }

  preview.opener = null;
  preview.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          html, body { height: 100%; margin: 0; }
          body { display: grid; place-items: center; font-family: Arial, sans-serif; color: #244338; background: #f7faf8; }
        </style>
      </head>
      <body>Generating PDF...</body>
    </html>
  `);
  preview.document.close();
  return preview;
};

export const openPdfPreview = (
  doc,
  title = "Document",
  previewWindow = null,
) => {
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const preview = previewWindow || window.open("", "_blank");

  if (!preview) {
    URL.revokeObjectURL(url);
    alert("Please allow popups to preview the PDF.");
    return;
  }

  preview.opener = null;
  preview.location.replace(url);
  window.setTimeout(() => URL.revokeObjectURL(url), 120000);
};

const degToRad = (value) => (value * Math.PI) / 180;

export const distanceMeters = (a, b) => {
  if (!a || !b) return 0;
  if (Math.abs(Number(a[0])) > 180 || Math.abs(Number(a[1])) > 90) {
    return Math.hypot(Number(b[0]) - Number(a[0]), Number(b[1]) - Number(a[1]));
  }
  const radius = 6371008.8;
  const lat1 = degToRad(Number(a[1]));
  const lat2 = degToRad(Number(b[1]));
  const dLat = lat2 - lat1;
  const dLng = degToRad(Number(b[0]) - Number(a[0]));
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(h));
};

export const formatFeet = (meters) => {
  if (!Number.isFinite(meters)) return "";
  const feet = meters * 3.280839895;
  const wholeFeet = Math.floor(feet);
  const inches = Math.round((feet - wholeFeet) * 12);
  if (inches === 12) return `${wholeFeet + 1}'-0\"`;
  return `${wholeFeet}'-${inches}\"`;
};


const samePoint = (a, b, tolerance = 1e-10) =>
  a &&
  b &&
  Math.abs(Number(a[0]) - Number(b[0])) <= tolerance &&
  Math.abs(Number(a[1]) - Number(b[1])) <= tolerance;

const pointLineDistance = (point, start, end) => {
  const dx = Number(end[0]) - Number(start[0]);
  const dy = Number(end[1]) - Number(start[1]);
  const length = Math.hypot(dx, dy);

  if (!length) {
    return Math.hypot(
      Number(point[0]) - Number(start[0]),
      Number(point[1]) - Number(start[1]),
    );
  }

  return Math.abs(
    dy * Number(point[0]) -
      dx * Number(point[1]) +
      Number(end[0]) * Number(start[1]) -
      Number(end[1]) * Number(start[0]),
  ) / length;
};

const simplifyPlotRing = (ring = []) => {
  if (ring.length < 3) return ring;

  let cleaned = ring.filter(
    (point, index) => index === 0 || !samePoint(point, ring[index - 1]),
  );

  if (cleaned.length > 2 && samePoint(cleaned[0], cleaned[cleaned.length - 1])) {
    cleaned = cleaned.slice(0, -1);
  }

  if (cleaned.length < 4) return cleaned;

  const extent = getBounds([
    {
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [[...cleaned, cleaned[0]]] },
      properties: {},
    },
  ]);

  const diagonal = extent
    ? Math.hypot(extent.maxX - extent.minX, extent.maxY - extent.minY)
    : 0;

  const lineTolerance = Math.max(diagonal * 0.012, 1e-10);
  const minimumSegment = Math.max(diagonal * 0.018, 1e-10);

  let changed = true;
  while (changed && cleaned.length > 4) {
    changed = false;
    const result = [];

    for (let index = 0; index < cleaned.length; index += 1) {
      const previous = cleaned[(index - 1 + cleaned.length) % cleaned.length];
      const current = cleaned[index];
      const next = cleaned[(index + 1) % cleaned.length];

      const previousLength = Math.hypot(
        Number(current[0]) - Number(previous[0]),
        Number(current[1]) - Number(previous[1]),
      );
      const nextLength = Math.hypot(
        Number(next[0]) - Number(current[0]),
        Number(next[1]) - Number(current[1]),
      );
      const distanceFromLine = pointLineDistance(current, previous, next);

      const removeCurrent =
        previousLength < minimumSegment ||
        nextLength < minimumSegment ||
        distanceFromLine < lineTolerance;

      if (removeCurrent && cleaned.length - 1 >= 4) {
        changed = true;
      } else {
        result.push(current);
      }
    }

    if (result.length >= 4) cleaned = result;
    else break;
  }

  return cleaned;
};

const getProjectedRingBox = (ring, project) => {
  const points = ring.map(project);
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
};


const pointInProjectedPolygon = (point, ring) => {
  let inside = false;
  const [x, y] = point;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];

    const intersects =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / ((yj - yi) || Number.EPSILON) + xi;

    if (intersects) inside = !inside;
  }

  return inside;
};

const pointToProjectedSegmentDistance = (point, start, end) => {
  const [px, py] = point;
  const [ax, ay] = start;
  const [bx, by] = end;
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;

  if (!lengthSquared) return Math.hypot(px - ax, py - ay);

  const t = Math.max(
    0,
    Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared),
  );

  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
};

const projectedDistanceToPolygon = (point, ring) => {
  let distance = Infinity;

  for (let index = 0; index < ring.length; index += 1) {
    distance = Math.min(
      distance,
      pointToProjectedSegmentDistance(
        point,
        ring[index],
        ring[(index + 1) % ring.length],
      ),
    );
  }

  return pointInProjectedPolygon(point, ring) ? distance : -distance;
};

const getInteriorLabelPosition = (ring, project) => {
  const projectedRing = ring.map(project);
  const xs = projectedRing.map(([x]) => x);
  const ys = projectedRing.map(([, y]) => y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = Math.max(maxX - minX, 1);
  const height = Math.max(maxY - minY, 1);

  const projectedCentroid = project(polygonCentroid(ring));
  let bestPoint = pointInProjectedPolygon(projectedCentroid, projectedRing)
    ? projectedCentroid
    : [(minX + maxX) / 2, (minY + maxY) / 2];
  let bestDistance = projectedDistanceToPolygon(bestPoint, projectedRing);

  let step = Math.max(Math.min(width, height) / 5, 2);

  while (step >= 1) {
    let improved = false;
    const searchMinX = Math.max(minX, bestPoint[0] - step * 3);
    const searchMaxX = Math.min(maxX, bestPoint[0] + step * 3);
    const searchMinY = Math.max(minY, bestPoint[1] - step * 3);
    const searchMaxY = Math.min(maxY, bestPoint[1] + step * 3);

    for (let x = searchMinX; x <= searchMaxX; x += step) {
      for (let y = searchMinY; y <= searchMaxY; y += step) {
        const distance = projectedDistanceToPolygon([x, y], projectedRing);
        if (distance > bestDistance) {
          bestDistance = distance;
          bestPoint = [x, y];
          improved = true;
        }
      }
    }

    step = improved ? step / 1.7 : step / 2;
  }

  return {
    x: bestPoint[0],
    y: bestPoint[1],
    radius: Math.max(bestDistance, 0),
    width,
    height,
    projectedRing,
  };
};

const drawPlotNumberInsidePolygon = (ctx, text, ring, project) => {
  const value = String(text || "").trim();
  if (!value || ring.length < 3) return;

  const placement = getInteriorLabelPosition(ring, project);
  if (placement.radius < 3) return;

  const maxFontSize = Math.min(
    25,
    placement.radius * 1.18,
    placement.height * 0.48,
  );
  const minFontSize = placement.radius >= 7 ? 7 : 5;

  let fontSize = Math.max(minFontSize, maxFontSize);
  const maxTextWidth = Math.max(placement.radius * 1.75, 10);

  while (fontSize > minFontSize) {
    ctx.font = `700 ${fontSize}px Arial`;
    if (ctx.measureText(value).width <= maxTextWidth) break;
    fontSize -= 0.5;
  }

  if (ctx.measureText(value).width > maxTextWidth) return;

  ctx.save();

  ctx.beginPath();
  ctx.moveTo(placement.projectedRing[0][0], placement.projectedRing[0][1]);
  placement.projectedRing.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
  ctx.closePath();
  ctx.clip();

  ctx.font = `700 ${fontSize}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(2, fontSize * 0.12);
  ctx.strokeStyle = "rgba(255,255,255,0.98)";
  ctx.strokeText(value, placement.x, placement.y);
  ctx.fillStyle = "#294474";
  ctx.fillText(value, placement.x, placement.y);

  ctx.restore();
};

const drawCanvasLabel = (
  ctx,
  text,
  x,
  y,
  maxWidth,
  maxHeight,
  {
    maxFontSize = 25,
    minFontSize = 9,
    fontWeight = 600,
    fillStyle = "#243f73",
  } = {},
) => {
  const value = String(text || "").trim();
  if (!value || maxWidth < 14 || maxHeight < 10) return;

  let fontSize = Math.min(maxFontSize, maxHeight * 0.62);

  while (fontSize >= minFontSize) {
    ctx.font = `${fontWeight} ${fontSize}px Arial`;
    if (ctx.measureText(value).width <= maxWidth) break;
    fontSize -= 1;
  }

  if (fontSize < minFontSize) return;

  ctx.save();
  ctx.font = `${fontWeight} ${fontSize}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(2.5, fontSize * 0.13);
  ctx.strokeStyle = "rgba(255,255,255,0.98)";
  ctx.strokeText(value, x, y);
  ctx.fillStyle = fillStyle;
  ctx.fillText(value, x, y);
  ctx.restore();
};

const polygonCentroid = (ring) => {
  if (!ring.length) return [0, 0];
  let twiceArea = 0;
  let x = 0;
  let y = 0;

  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    const factor = a[0] * b[1] - b[0] * a[1];
    twiceArea += factor;
    x += (a[0] + b[0]) * factor;
    y += (a[1] + b[1]) * factor;
  }

  if (Math.abs(twiceArea) < 1e-12) {
    return [
      ring.reduce((sum, point) => sum + point[0], 0) / ring.length,
      ring.reduce((sum, point) => sum + point[1], 0) / ring.length,
    ];
  }

  return [x / (3 * twiceArea), y / (3 * twiceArea)];
};

const LAND_USE_COLORS = {
  Residential: "#f89a1c",
  "Residential Plot": "#f89a1c",
  Commercial: "#9fd3eb",
  "Commercial Plot": "#9fd3eb",
  Condominium: "#d5acd2",
  "Green Belt": "#65d7a4",
  "Green Area": "#65d7a4",
  Park: "#65d7a4",
  Mosque: "#f8f07e",
  Masjid: "#f8f07e",
  "Grand Mosque": "#f8f07e",
  "RUDA Office": "#62d9aa",
  "Public Use": "#efa4aa",
  "Public Building": "#efa4aa",
  Utility: "#efa4aa",
  Canal: "#9fd3eb",
  Passage: "#ffffff",
  Road: "#ffffff",
};

const getFeatureColor = (feature) => {
  const p = feature?.properties || {};
  const label = firstValue(
    p.land_use,
    p.landuse,
    p.plot_category,
    p.category,
    p.name,
    p.type,
  );
  const key = Object.keys(LAND_USE_COLORS).find((item) =>
    label.toLowerCase().includes(item.toLowerCase()),
  );
  return key ? LAND_USE_COLORS[key] : "#eef2f5";
};

const getPlotLabel = (feature) => {
  const p = feature?.properties || {};
  return firstValue(p.plot_no, p.plotno, p.plot_number, p.name, feature?.id);
};


const getFeatureDetails = (feature) => {
  const p = feature?.properties || {};

  return {
    plotNo: firstValue(
      p.plot_no,
      p.plotno,
      p.plot_number,
      p.pl_no,
      feature?.id,
    ),
    area: firstValue(
      p.plot_area,
      p.area,
      p.total_area,
      p.area_sqft,
      p.area_sft,
    ),
    category: firstValue(
      p.plot_category,
      p.category,
      p.type,
      p.land_use,
      p.landuse,
      p.name,
    ),
    dimension: firstValue(
      p.dimension,
      p.dimensions,
      p.plot_dimension,
    ),
    roadFt: firstValue(
      p.rd_ft,
      p.road_ft,
      p.road_width,
      p.road_wide,
      p.row_width,
    ),
    roadFacing: firstValue(
      p.rd_facing,
      p.road_facing,
      p.facing,
      p.street_road_no,
      p.street_no,
      p.road_no,
      p.road_name,
    ),
  };
};

const drawUniformPlotNumber = (
  ctx,
  text,
  ring,
  project,
  {
    fontSize = 15,
    fillStyle = "#0b35d5",
    haloWidth = 2.5,
  } = {},
) => {
  const value = String(text || "").trim();
  if (!value || ring.length < 3) return;

  const placement = getInteriorLabelPosition(ring, project);
  if (placement.radius < 2.2) return;

  let finalFontSize = fontSize;

  // All plot numbers start from the same size. Only genuinely tiny plots
  // reduce the size enough to stay within their own boundary.
  const availableWidth = Math.max(placement.radius * 1.85, 8);
  ctx.font = `700 ${finalFontSize}px Arial`;

  while (
    finalFontSize > 8 &&
    ctx.measureText(value).width > availableWidth
  ) {
    finalFontSize -= 0.5;
    ctx.font = `700 ${finalFontSize}px Arial`;
  }

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(placement.projectedRing[0][0], placement.projectedRing[0][1]);
  placement.projectedRing.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
  ctx.closePath();
  ctx.clip();

  ctx.font = `700 ${finalFontSize}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = haloWidth;
  ctx.strokeStyle = "rgba(255,255,255,0.98)";
  ctx.strokeText(value, placement.x, placement.y);
  ctx.fillStyle = fillStyle;
  ctx.fillText(value, placement.x, placement.y);
  ctx.restore();
};

const drawDetailedSelectedPlotLabel = (
  ctx,
  details,
  ring,
  project,
) => {
  const placement = getInteriorLabelPosition(ring, project);
  if (placement.radius < 5) return;

  const lines = [
    { text: details.plotNo, size: 36, weight: 700, color: "#0b35d5" },
    {
      text: firstValue(details.plotArea, details.plotSize),
      size: 20,
      weight: 600,
      color: "#1f2937",
    },
    {
      text: firstValue(details.landUse, details.plotCategory),
      size: 15,
      weight: 600,
      color: "#1f2937",
    },
    {
      text: details.dimension,
      size: 13,
      weight: 500,
      color: "#374151",
    },
    {
      text: details.roadFt ? `${details.roadFt} ft Road` : "",
      size: 13,
      weight: 500,
      color: "#374151",
    },
  ].filter((line) => line.text);

  const lineHeights = lines.map((line) => line.size * 1.08);
  const totalHeight = lineHeights.reduce((sum, value) => sum + value, 0);
  let cursorY = placement.y - totalHeight / 2;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(placement.projectedRing[0][0], placement.projectedRing[0][1]);
  placement.projectedRing.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
  ctx.closePath();
  ctx.clip();

  lines.forEach((line, index) => {
    cursorY += lineHeights[index] / 2;
    ctx.font = `${line.weight} ${line.size}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(2.5, line.size * 0.12);
    ctx.strokeStyle = "rgba(255,255,255,0.98)";
    ctx.strokeText(String(line.text), placement.x, cursorY);
    ctx.fillStyle = line.color;
    ctx.fillText(String(line.text), placement.x, cursorY);
    cursorY += lineHeights[index] / 2;
  });

  ctx.restore();
};

const getTransform = (bounds, width, height, padding) => {
  const dataWidth = Math.max(bounds.maxX - bounds.minX, 1e-9);
  const dataHeight = Math.max(bounds.maxY - bounds.minY, 1e-9);
  const usableWidth = Math.max(width - padding * 2, 1);
  const usableHeight = Math.max(height - padding * 2, 1);
  const scale = Math.min(usableWidth / dataWidth, usableHeight / dataHeight);
  const offsetX = padding + (usableWidth - dataWidth * scale) / 2;
  const offsetY = padding + (usableHeight - dataHeight * scale) / 2;

  return ([x, y]) => [
    offsetX + (x - bounds.minX) * scale,
    height - (offsetY + (y - bounds.minY) * scale),
  ];
};

const drawPolygon = (ctx, ring, project, fill, stroke, lineWidth = 2) => {
  if (ring.length < 3) return;
  const first = project(ring[0]);
  ctx.beginPath();
  ctx.moveTo(first[0], first[1]);
  ring.slice(1).forEach((point) => {
    const projected = project(point);
    ctx.lineTo(projected[0], projected[1]);
  });
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
};

const drawNorthArrowCanvas = (ctx, x, y, size) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "#111111";
  ctx.fillStyle = "#111111";
  ctx.lineWidth = Math.max(2, size * 0.025);

  ctx.beginPath();
  ctx.moveTo(0, -size * 0.45);
  ctx.lineTo(-size * 0.12, size * 0.12);
  ctx.lineTo(0, size * 0.04);
  ctx.lineTo(size * 0.12, size * 0.12);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, -size * 0.42);
  ctx.lineTo(0, size * 0.42);
  ctx.moveTo(-size * 0.42, 0);
  ctx.lineTo(size * 0.42, 0);
  ctx.stroke();

  ctx.font = `700 ${Math.round(size * 0.18)}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("N", 0, -size * 0.58);
  ctx.fillText("S", 0, size * 0.58);
  ctx.fillText("W", -size * 0.58, 0);
  ctx.fillText("E", size * 0.58, 0);
  ctx.restore();
};


const drawWrappedCanvasText = (
  ctx,
  lines,
  x,
  y,
  fontSize,
  color = "#111111",
) => {
  const filtered = lines.filter(Boolean);
  const lineHeight = fontSize * 1.12;
  const startY = y - ((filtered.length - 1) * lineHeight) / 2;

  filtered.forEach((line, index) => {
    ctx.font = `${index === 0 ? 700 : 600} ${fontSize}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(3, fontSize * 0.14);
    ctx.strokeStyle = "rgba(255,255,255,0.98)";
    ctx.strokeText(String(line), x, startY + index * lineHeight);
    ctx.fillStyle = index === 0 ? color : "#263238";
    ctx.fillText(String(line), x, startY + index * lineHeight);
  });
};

const drawClientOverviewLabel = (ctx, feature, ring, project) => {
  const p = feature?.properties || {};
  const placement = getInteriorLabelPosition(ring, project);
  if (placement.radius < 4) return;

  const plotNo = firstValue(
    p.plot_no,
    p.plotno,
    p.plot_number,
    p.name,
    feature?.id,
  );
  const category = firstValue(
    p.land_use,
    p.landuse,
    p.plot_category,
    p.category,
    p.name,
    p.type,
  );
  const area = firstValue(p.plot_area, p.area, p.area_sqft, p.area_sft);

  const isLandUse =
    placement.radius >= 18 &&
    /park|green|commercial|mosque|masjid|ruda office|public|utility|canal|condominium/i.test(
      category,
    );

  if (isLandUse) {
    drawWrappedCanvasText(
      ctx,
      [
        /mosque|masjid/i.test(category) ? "Grand Mosque" : category,
        area,
      ],
      placement.x,
      placement.y,
      Math.max(12, Math.min(24, placement.radius * 0.45)),
      "#111111",
    );
    return;
  }

  drawUniformPlotNumber(ctx, plotNo, ring, project, {
    fontSize: 17,
    fillStyle: "#0b35d5",
    haloWidth: 2.5,
  });
};

const drawAdjacentClientLabel = (ctx, feature, ring, project) => {
  const p = feature?.properties || {};
  const placement = getInteriorLabelPosition(ring, project);
  if (placement.radius < 11) return;

  const plotNo = firstValue(
    p.plot_no,
    p.plotno,
    p.plot_number,
    p.name,
    feature?.id,
  );

  drawWrappedCanvasText(
    ctx,
    [plotNo, "Adjacent", "Plot"],
    placement.x,
    placement.y,
    Math.max(15, Math.min(24, placement.radius * 0.48)),
    "#111111",
  );
};

const drawRoadLabelForPartPlan = (
  ctx,
  details,
  selectedRing,
  project,
  width,
  height,
  mode,
) => {
  if (!["partOverview", "part"].includes(mode)) return;

  const points = selectedRing.map(project);
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const bottomY = Math.max(...ys);

  const roadName = firstValue(details.streetRoadNo, details.roadFacing);
  if (!roadName && !details.roadFt) return;

  const label = roadName
    ? /street|road/i.test(roadName)
      ? roadName
      : `Street ${roadName}`
    : "Road";

  const x = Math.min(width - 150, Math.max(150, centerX));
  const y = Math.min(height - 75, bottomY + (mode === "part" ? 95 : 55));

  ctx.save();
  ctx.font = `700 ${mode === "part" ? 30 : 24}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = 7;
  ctx.strokeStyle = "rgba(255,255,255,0.98)";
  ctx.strokeText(label, x, y);
  ctx.fillStyle = "#111111";
  ctx.fillText(label, x, y);

  if (details.roadFt) {
    const widthText = `${details.roadFt} Feet ROW`;
    ctx.font = `600 ${mode === "part" ? 21 : 18}px Arial`;
    ctx.lineWidth = 5;
    ctx.strokeText(widthText, x, y + (mode === "part" ? 34 : 27));
    ctx.fillText(widthText, x, y + (mode === "part" ? 34 : 27));
  }
  ctx.restore();
};

export const createPlanCanvas = async ({
  selectedFeature,
  contextGeojson = EMPTY_FC,
  details = {},
  mode = "site",
  width = 1600,
  height = 1050,
  selectedFill = "#f2b4e3",
  selectedStroke = "#111111",
  watermark = true,
  showDimensions = true,
  showVertexLabels = true,
  showContextLabels = true,
  northArrow = true,
}) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const features = getContextFeatures(selectedFeature, contextGeojson, mode);
  const selectedRing = getGeometryRing(selectedFeature?.geometry);
  const dimensionRing = simplifyPlotRing(selectedRing);

  // Main site plan is always framed from the selected plot itself. This keeps
  // the plot large and readable even when the context collection contains the
  // complete scheme. The location inset still uses the full project extent.
  const selectedBounds = boundsOfFeature(selectedFeature);
  const fullSchemeBounds = getBounds(
    contextGeojson?.features?.length ? contextGeojson.features : features,
  );
  const contextBounds = getBounds(features.length ? features : [selectedFeature]);
  const bounds =
    mode === "location"
      ? expandBounds(fullSchemeBounds, 0.025)
      : mode === "partOverview"
        ? expandBounds(contextBounds, 0.01)
        : mode === "part"
          ? expandBounds(contextBounds, 0.005)
          : expandBounds(selectedBounds, 2.15);

  if (!bounds || selectedRing.length < 3) {
    ctx.fillStyle = "#666666";
    ctx.font = "28px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Plot geometry is not available.", width / 2, height / 2);
    return canvas;
  }

  const padding =
    mode === "location"
      ? 18
      : mode === "partOverview"
        ? 8
        : mode === "part"
          ? 8
          : 95;
  const project = getTransform(bounds, width, height, padding);

  if (watermark) {
    const { watermark: watermarkImage } = await loadPrintAssets();
    if (watermarkImage) {
      ctx.save();
      ctx.globalAlpha = 0.1;
      const wmSize = Math.min(width, height) * 0.7;
      ctx.drawImage(
        watermarkImage,
        (width - wmSize) / 2,
        (height - wmSize) / 2,
        wmSize,
        wmSize,
      );
      ctx.restore();
    }
  }

  features.forEach((feature) => {
    const ring = getGeometryRing(feature?.geometry);
    if (ring.length < 3 || feature === selectedFeature) return;

    drawPolygon(
      ctx,
      ring,
      project,
      mode === "location" || mode === "partOverview"
        ? getFeatureColor(feature)
        : mode === "part"
          ? "rgba(255,255,255,0.99)"
          : "rgba(245,247,250,0.84)",
      mode === "location" ? "#9aa4af" : "#aeb6bf",
      mode === "location" ? 1.4 : mode === "part" ? 2.2 : 2,
    );

    if (showContextLabels) {
      if (mode === "partOverview") {
        drawClientOverviewLabel(ctx, feature, ring, project);
      } else if (mode === "part") {
        drawAdjacentClientLabel(ctx, feature, ring, project);
      } else if (["site", "location"].includes(mode)) {
        drawUniformPlotNumber(
          ctx,
          getPlotLabel(feature),
          ring,
          project,
          {
            fontSize: mode === "location" ? 15 : 16,
            fillStyle: "#0b35d5",
          },
        );
      }
    }
  });

  drawPolygon(
    ctx,
    selectedRing,
    project,
    selectedFill,
    selectedStroke,
    mode === "location"
      ? 7
      : mode === "partOverview"
        ? 10
        : mode === "part"
          ? 11
          : 7,
  );

  const selectedCenter = project(polygonCentroid(selectedRing));
  const selectedProjectedBox = getProjectedRingBox(selectedRing, project);

  if (mode === "location" || mode === "partOverview") {
    drawUniformPlotNumber(
      ctx,
      details.plotNo,
      selectedRing,
      project,
      {
        fontSize: mode === "partOverview" ? 24 : 17,
        fillStyle: "#0637ff",
        haloWidth: 4,
      },
    );
  } else if (mode === "part") {
    drawDetailedSelectedPlotLabel(
      ctx,
      details,
      selectedRing,
      project,
    );
  } else {
    drawCanvasLabel(
      ctx,
      details.plotNo,
      selectedCenter[0],
      selectedCenter[1] - selectedProjectedBox.height * 0.09,
      selectedProjectedBox.width * 0.62,
      selectedProjectedBox.height * 0.34,
      {
        maxFontSize: 52,
        minFontSize: 24,
        fontWeight: 700,
        fillStyle: "#173d82",
      },
    );

    drawCanvasLabel(
      ctx,
      firstValue(details.plotSize, details.plotArea),
      selectedCenter[0],
      selectedCenter[1] + selectedProjectedBox.height * 0.17,
      selectedProjectedBox.width * 0.80,
      selectedProjectedBox.height * 0.22,
      {
        maxFontSize: 28,
        minFontSize: 14,
        fontWeight: 600,
        fillStyle: "#202020",
      },
    );
  }

  drawRoadLabelForPartPlan(
    ctx,
    details,
    selectedRing,
    project,
    width,
    height,
    mode,
  );

  if (showDimensions && ["site", "part"].includes(mode)) {
    dimensionRing.forEach((point, index) => {
      const next = dimensionRing[(index + 1) % dimensionRing.length];
      const a = project(point);
      const b = project(next);
      const midX = (a[0] + b[0]) / 2;
      const midY = (a[1] + b[1]) / 2;
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      let angle = Math.atan2(dy, dx);
      if (angle > Math.PI / 2 || angle < -Math.PI / 2) angle += Math.PI;
      const dimension = formatFeet(distanceMeters(point, next));

      const length = Math.max(Math.hypot(dx, dy), 1);
      const nx = -dy / length;
      const ny = dx / length;
      const towardCenter =
        (selectedCenter[0] - midX) * nx + (selectedCenter[1] - midY) * ny;
      const outsideDirection = towardCenter > 0 ? -1 : 1;

      const sidePixelLength = Math.hypot(dx, dy);
      const dimensionFont =
        mode === "part"
          ? Math.max(24, Math.min(34, sidePixelLength * 0.19))
          : Math.max(15, Math.min(21, sidePixelLength * 0.16));
      const offset =
        mode === "part"
          ? Math.max(46, dimensionFont * 1.85)
          : Math.max(29, dimensionFont * 1.65);

      ctx.save();
      ctx.translate(
        midX + nx * offset * outsideDirection,
        midY + ny * offset * outsideDirection,
      );
      ctx.rotate(angle);
      ctx.font = `700 ${dimensionFont}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";
      ctx.lineWidth = Math.max(4.5, dimensionFont * 0.22);
      ctx.strokeStyle = "rgba(255,255,255,0.99)";
      ctx.strokeText(dimension, 0, 0);
      ctx.fillStyle = "#161616";
      ctx.fillText(dimension, 0, 0);
      ctx.restore();
    });
  }

  if (showVertexLabels && mode === "site") {
    const cornerCenter = project(polygonCentroid(dimensionRing));

    dimensionRing.slice(0, 8).forEach((point, index) => {
      const [x, y] = project(point);
      const vx = x - cornerCenter[0];
      const vy = y - cornerCenter[1];
      const vectorLength = Math.max(Math.hypot(vx, vy), 1);
      const labelDistance = 22;
      const labelX = x + (vx / vectorLength) * labelDistance;
      const labelY = y + (vy / vectorLength) * labelDistance;

      ctx.fillStyle = "#20c63a";
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#07580f";
      ctx.lineWidth = 2;
      ctx.stroke();

      const vertexLabel = String.fromCharCode(65 + index);
      ctx.font = "700 18px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";
      ctx.lineWidth = 5;
      ctx.strokeStyle = "rgba(255,255,255,0.99)";
      ctx.strokeText(vertexLabel, labelX, labelY);
      ctx.fillStyle = "#8a2e17";
      ctx.fillText(vertexLabel, labelX, labelY);
    });
  }

  if (mode === "site" && (details.roadFt || details.streetRoadNo || details.roadFacing)) {
    const roadText = firstValue(
      details.streetRoadNo && details.roadFt
        ? `${details.streetRoadNo} - ${details.roadFt} Feet Wide Road`
        : "",
      details.streetRoadNo,
      details.roadFacing,
      details.roadFt ? `${details.roadFt} Feet Wide Road` : "",
    );
    ctx.fillStyle = "#444444";
    ctx.font = "600 27px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(roadText, 55, height - 60);
  }

  if (northArrow) {
    drawNorthArrowCanvas(ctx, 100, 105, mode === "location" ? 100 : 112);
  }

  return canvas;
};

const wgs84ToUtm = (lng, lat) => {
  if (Math.abs(lng) > 180 || Math.abs(lat) > 90) {
    return { easting: lng, northing: lat, zone: "" };
  }

  const a = 6378137;
  const eccSquared = 0.00669438;
  const k0 = 0.9996;
  const zoneNumber = Math.floor((lng + 180) / 6) + 1;
  const longOrigin = (zoneNumber - 1) * 6 - 180 + 3;
  const eccPrimeSquared = eccSquared / (1 - eccSquared);

  const latRad = degToRad(lat);
  const longRad = degToRad(lng);
  const longOriginRad = degToRad(longOrigin);

  const n = a / Math.sqrt(1 - eccSquared * Math.sin(latRad) ** 2);
  const t = Math.tan(latRad) ** 2;
  const c = eccPrimeSquared * Math.cos(latRad) ** 2;
  const A = Math.cos(latRad) * (longRad - longOriginRad);

  const m =
    a *
    ((1 -
      eccSquared / 4 -
      (3 * eccSquared ** 2) / 64 -
      (5 * eccSquared ** 3) / 256) *
      latRad -
      ((3 * eccSquared) / 8 +
        (3 * eccSquared ** 2) / 32 +
        (45 * eccSquared ** 3) / 1024) *
      Math.sin(2 * latRad) +
      ((15 * eccSquared ** 2) / 256 + (45 * eccSquared ** 3) / 1024) *
      Math.sin(4 * latRad) -
      ((35 * eccSquared ** 3) / 3072) * Math.sin(6 * latRad));

  let easting =
    k0 *
    n *
    (A +
      ((1 - t + c) * A ** 3) / 6 +
      ((5 - 18 * t + t ** 2 + 72 * c - 58 * eccPrimeSquared) * A ** 5) /
      120) +
    500000;

  let northing =
    k0 *
    (m +
      n *
      Math.tan(latRad) *
      (A ** 2 / 2 +
        ((5 - t + 9 * c + 4 * c ** 2) * A ** 4) / 24 +
        ((61 - 58 * t + t ** 2 + 600 * c - 330 * eccPrimeSquared) * A ** 6) /
        720));

  if (lat < 0) northing += 10000000;
  easting = Math.round(easting * 1000) / 1000;
  northing = Math.round(northing * 1000) / 1000;

  return { easting, northing, zone: zoneNumber };
};

export const getCornerCoordinates = (geometry) =>
  simplifyPlotRing(getGeometryRing(geometry))
    .slice(0, 8)
    .map((coord, index) => {
      const lng = Number(coord[0]);
      const lat = Number(coord[1]);
      const utm = wgs84ToUtm(lng, lat);
      return {
        label: String.fromCharCode(65 + index),
        lat,
        lng,
        ...utm,
      };
    });

const pointSegmentDistanceMeters = (point, a, b) => {
  const referenceLat = degToRad(point[1]);
  const scaleX = 111320 * Math.cos(referenceLat);
  const scaleY = 110540;

  const px = point[0] * scaleX;
  const py = point[1] * scaleY;
  const ax = a[0] * scaleX;
  const ay = a[1] * scaleY;
  const bx = b[0] * scaleX;
  const by = b[1] * scaleY;

  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  if (!lengthSquared) return Math.hypot(px - ax, py - ay);

  const t = Math.max(
    0,
    Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared),
  );
  const x = ax + t * dx;
  const y = ay + t * dy;
  return Math.hypot(px - x, py - y);
};

const findNearestPlot = (midpoint, selectedFeature, contextGeojson) => {
  let best = null;
  (contextGeojson?.features || []).forEach((feature) => {
    if (feature === selectedFeature) return;
    const selectedId = firstValue(
      selectedFeature?.id,
      selectedFeature?.properties?.gid,
      selectedFeature?.properties?.plot_no,
    );
    const featureId = firstValue(
      feature?.id,
      feature?.properties?.gid,
      feature?.properties?.plot_no,
    );
    if (selectedId && featureId && selectedId === featureId) return;

    const ring = getGeometryRing(feature?.geometry);
    for (let i = 0; i < ring.length; i += 1) {
      const distance = pointSegmentDistanceMeters(
        midpoint,
        ring[i],
        ring[(i + 1) % ring.length],
      );
      if (!best || distance < best.distance) {
        best = { distance, feature };
      }
    }
  });

  return best && best.distance <= 8 ? best.feature : null;
};

export const getPlotSides = (parcel, contextGeojson, details) => {
  const ring = getGeometryRing(parcel?.geometry).slice(0, 4);
  const explicitLengths = [
    details.rightLength,
    details.leftLength,
    details.frontLength,
    details.backLength,
  ];
  const explicitBounds = [
    details.rightBoundedBy,
    details.leftBoundedBy,
    details.frontBoundedBy,
    details.backBoundedBy,
  ];
  const labels = ["Right Side", "Left Side", "Front Side", "Back Side"];

  return labels.map((label, index) => {
    const a = ring[index] || ring[0];
    const b = ring[(index + 1) % Math.max(ring.length, 1)] || a;
    const midpoint = a && b ? [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] : null;
    const neighbor = midpoint
      ? findNearestPlot(midpoint, parcel, contextGeojson)
      : null;
    const neighborPlotNo = getPlotLabel(neighbor);

    let boundedBy = firstValue(
      explicitBounds[index],
      neighborPlotNo ? `Plot No. ${neighborPlotNo}` : "",
    );

    if (!boundedBy && label === "Front Side" && details.roadFt) {
      boundedBy = `Road Wide ${details.roadFt}'`;
    }

    return {
      label,
      length: firstValue(
        explicitLengths[index],
        a && b ? formatFeet(distanceMeters(a, b)) : "",
      ),
      boundedBy,
    };
  });
};

export const drawNorthArrowPdf = (doc, x, y, size = 15) => {
  doc.setDrawColor(15, 15, 15);
  doc.setFillColor(15, 15, 15);
  doc.setLineWidth(0.45);
  doc.line(x, y - size, x, y + size);
  doc.line(x - size, y, x + size, y);
  doc.triangle(
    x,
    y - size,
    x - size * 0.24,
    y - size * 0.12,
    x + size * 0.24,
    y - size * 0.12,
    "F",
  );
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("N", x, y - size - 2, { align: "center" });
  doc.text("S", x, y + size + 4, { align: "center" });
  doc.text("W", x - size - 3, y + 1, { align: "center" });
  doc.text("E", x + size + 3, y + 1, { align: "center" });
};

export const drawUnderlinedValue = (
  doc,
  label,
  value,
  x,
  y,
  labelWidth,
  lineWidth,
  options = {},
) => {
  const fontSize = options.fontSize || 9;
  doc.setFont("helvetica", options.boldLabel === false ? "normal" : "bold");
  doc.setFontSize(fontSize);
  doc.setTextColor(15, 15, 15);
  doc.text(label, x, y);
  const lineX = x + labelWidth;
  doc.line(lineX, y + 0.8, lineX + lineWidth, y + 0.8);
  if (value) {
    doc.setFont("helvetica", "normal");
    const maxTextWidth = lineWidth - 1;
    const text = String(value);
    const fitted =
      doc.getTextWidth(text) <= maxTextWidth
        ? text
        : `${text.slice(0, Math.max(1, Math.floor(text.length * 0.8)))}...`;
    doc.text(fitted, lineX + 1, y - 0.5);
  }
};

export const canvasAsPng = (canvas) =>
  canvas
    ? {
      dataUrl: canvas.toDataURL("image/png"),
      width: canvas.width,
      height: canvas.height,
    }
    : null;

export const normalizeAreaText = (details) => {
  const numeric = numericValue(details.plotArea, details.shapeArea);
  if (numeric !== null && !/[a-zA-Z]/.test(String(details.plotArea || ""))) {
    return `${numeric.toLocaleString(undefined, { maximumFractionDigits: 2 })} Sq Ft.`;
  }
  return firstValue(details.plotArea, details.plotSize);
};

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
    landUse: firstValue(p.type, p.land_use, p.landuse, p.name, p.plot_category),
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
  const neighborhoodBounds = expandBounds(selectedBounds, 1.35);
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
    .slice(0, 14)
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
  Residential: "#f8a12b",
  "Residential Plot": "#f8a12b",
  Commercial: "#a9d8ef",
  "Commercial Plot": "#a9d8ef",
  "Green Belt": "#7bdcb5",
  Park: "#79dfa9",
  Mosque: "#f5ef7b",
  "Public Use": "#f5ef7b",
  Road: "#ffffff",
};

const getFeatureColor = (feature) => {
  const p = feature?.properties || {};
  const label = firstValue(p.type, p.land_use, p.name, p.plot_category);
  return LAND_USE_COLORS[label] || "#e7edf3";
};

const getPlotLabel = (feature) => {
  const p = feature?.properties || {};
  return firstValue(p.plot_no, p.plotno, p.plot_number, p.name, feature?.id);
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

  // Main site plan is always framed from the selected plot itself. This keeps
  // the plot large and readable even when the context collection contains the
  // complete scheme. The location inset still uses the full project extent.
  const selectedBounds = boundsOfFeature(selectedFeature);
  const fullSchemeBounds = getBounds(
    contextGeojson?.features?.length ? contextGeojson.features : features,
  );
  const bounds =
    mode === "location"
      ? expandBounds(fullSchemeBounds, 0.08)
      : expandBounds(selectedBounds, 2.15);

  if (!bounds || selectedRing.length < 3) {
    ctx.fillStyle = "#666666";
    ctx.font = "28px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Plot geometry is not available.", width / 2, height / 2);
    return canvas;
  }

  const padding = mode === "location" ? 48 : 95;
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
      mode === "location" ? getFeatureColor(feature) : "rgba(245,247,250,0.84)",
      mode === "location" ? "#a8b0b8" : "#aeb6bf",
      mode === "location" ? 1.2 : 2,
    );

    if (showContextLabels) {
      const label = getPlotLabel(feature);
      const box = boundsOfFeature(feature);
      if (label && box) {
        const projectedMin = project([box.minX, box.minY]);
        const projectedMax = project([box.maxX, box.maxY]);
        const pixelWidth = Math.abs(projectedMax[0] - projectedMin[0]);
        const pixelHeight = Math.abs(projectedMax[1] - projectedMin[1]);

        // Suppress labels that cannot fit inside their polygon. This prevents
        // the dense text collisions visible in the previous PDF.
        if (pixelWidth >= 42 && pixelHeight >= 25) {
          const center = project(polygonCentroid(ring));
          const fontSize = Math.max(16, Math.min(25, pixelWidth * 0.18));
          ctx.fillStyle = "#334a72";
          ctx.font = `600 ${fontSize}px Arial`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(label, center[0], center[1], Math.max(28, pixelWidth - 8));
        }
      }
    }
  });

  drawPolygon(
    ctx,
    selectedRing,
    project,
    selectedFill,
    selectedStroke,
    mode === "location" ? 5 : 7,
  );

  const selectedCenter = project(polygonCentroid(selectedRing));
  const selectedBox = boundsOfFeature(selectedFeature);
  const selectedProjectedMin = selectedBox
    ? project([selectedBox.minX, selectedBox.minY])
    : selectedCenter;
  const selectedProjectedMax = selectedBox
    ? project([selectedBox.maxX, selectedBox.maxY])
    : selectedCenter;
  const selectedPixelWidth = Math.max(
    1,
    Math.abs(selectedProjectedMax[0] - selectedProjectedMin[0]),
  );
  const selectedPixelHeight = Math.max(
    1,
    Math.abs(selectedProjectedMax[1] - selectedProjectedMin[1]),
  );

  // In the location inset, use only a clean highlighted marker. Text inside a
  // scheme-wide inset becomes unreadable and was overlapping the selected plot.
  if (mode === "location") {
    ctx.save();
    ctx.fillStyle = "#0637d9";
    ctx.beginPath();
    ctx.arc(selectedCenter[0], selectedCenter[1], 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  } else {
    const plotLabel = firstValue(details.plotNo);
    const areaLabel = firstValue(details.plotSize, details.plotArea);

    const plotFont = Math.max(
      25,
      Math.min(54, selectedPixelWidth * 0.34, selectedPixelHeight * 0.26),
    );
    const areaFont = Math.max(
      17,
      Math.min(34, selectedPixelWidth * 0.22, selectedPixelHeight * 0.16),
    );

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";

    if (plotLabel) {
      ctx.font = `700 ${plotFont}px Arial`;
      ctx.lineWidth = Math.max(4, plotFont * 0.12);
      ctx.strokeStyle = "rgba(255,255,255,0.96)";
      ctx.strokeText(
        String(plotLabel),
        selectedCenter[0],
        selectedCenter[1] - areaFont * 0.48,
        selectedPixelWidth * 0.72,
      );
      ctx.fillStyle = "#173d82";
      ctx.fillText(
        String(plotLabel),
        selectedCenter[0],
        selectedCenter[1] - areaFont * 0.48,
        selectedPixelWidth * 0.72,
      );
    }

    if (areaLabel) {
      ctx.font = `600 ${areaFont}px Arial`;
      ctx.lineWidth = Math.max(3, areaFont * 0.12);
      ctx.strokeStyle = "rgba(255,255,255,0.96)";
      ctx.strokeText(
        String(areaLabel),
        selectedCenter[0],
        selectedCenter[1] + plotFont * 0.52,
        selectedPixelWidth * 0.82,
      );
      ctx.fillStyle = "#222222";
      ctx.fillText(
        String(areaLabel),
        selectedCenter[0],
        selectedCenter[1] + plotFont * 0.52,
        selectedPixelWidth * 0.82,
      );
    }
  }

  if (showDimensions) {
    selectedRing.forEach((point, index) => {
      const next = selectedRing[(index + 1) % selectedRing.length];
      const a = project(point);
      const b = project(next);
      const midX = (a[0] + b[0]) / 2;
      const midY = (a[1] + b[1]) / 2;
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      let angle = Math.atan2(dy, dx);
      if (angle > Math.PI / 2 || angle < -Math.PI / 2) angle += Math.PI;
      const dimension = formatFeet(distanceMeters(point, next));

      // Place dimensions outside the plot rather than over its centre label.
      const length = Math.max(Math.hypot(dx, dy), 1);
      const nx = -dy / length;
      const ny = dx / length;
      const polygonCenter = selectedCenter;
      const towardCenter =
        (polygonCenter[0] - midX) * nx + (polygonCenter[1] - midY) * ny;
      const outsideDirection = towardCenter > 0 ? -1 : 1;
      const offset = mode === "location" ? 12 : 34;
      const dimensionFont = mode === "location" ? 17 : 21;

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
      ctx.lineWidth = Math.max(4, dimensionFont * 0.18);
      ctx.strokeStyle = "rgba(255,255,255,0.98)";
      ctx.strokeText(dimension, 0, 0);
      ctx.fillStyle = "#222222";
      ctx.fillText(dimension, 0, 0);
      ctx.restore();
    });
  }

  if (showVertexLabels) {
    selectedRing.slice(0, 8).forEach((point, index) => {
      const [x, y] = project(point);
      ctx.fillStyle = "#20c63a";
      ctx.beginPath();
      ctx.arc(x, y, mode === "location" ? 7 : 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#07580f";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#8a2e17";
      ctx.font = `700 ${mode === "location" ? 17 : 20}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.lineJoin = "round";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(255,255,255,0.98)";
      const vertexLabel = String.fromCharCode(65 + index);
      ctx.strokeText(vertexLabel, x, y - 15);
      ctx.fillText(vertexLabel, x, y - 15);
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
  getGeometryRing(geometry)
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

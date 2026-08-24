import { jsPDF } from "jspdf";
import {
  buildPlotDetails,
  createPdfPreviewWindow,
  drawUnderlinedValue,
  getCircularLogoDataUrl,
  getGeometryRing,
  getPlotSides,
  loadPrintAssets,
  normalizeAreaText,
  openPdfPreview,
  valueOrDash,
} from "./printUtils";

const MM_PER_POINT = 0.3528;
const THEME = [30, 58, 95];

const normalizeText = (value, fallback = "") => {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value).trim();
};

const drawUnderline = (doc, x1, x2, y, lineWidth = 0.2) => {
  doc.setLineWidth(lineWidth);
  doc.line(x1, y, x2, y);
};

const drawCircularLogo = (doc, image, cx, cy, radius, logoSize) => {
  if (!image) return;
  const dataUrl = getCircularLogoDataUrl(image, 300);
  if (!dataUrl) return;
  doc.addImage(
    dataUrl,
    "PNG",
    cx - logoSize / 2,
    cy - logoSize / 2,
    logoSize,
    logoSize,
    undefined,
    "FAST",
  );
};

const drawSectionHeader = (doc, x, y, width, title) => {
  const height = 6.5;
  doc.setFillColor(...THEME);
  doc.setDrawColor(...THEME);
  doc.rect(x, y, width, height, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text(title, x + 2.5, y + 4.5);
  doc.setTextColor(15, 15, 15);
  return y + height;
};

const drawInlineRuns = (
  doc,
  runs,
  x,
  y,
  maxWidth,
  { fontSize = 8.3, lineHeightFactor = 1.28, defaultFont = "helvetica" } = {},
) => {
  const lineHeight = fontSize * lineHeightFactor * MM_PER_POINT;
  const words = [];

  runs.forEach((run) => {
    const parts = normalizeText(run.text).split(/\s+/).filter(Boolean);
    parts.forEach((part) => {
      words.push({
        text: part,
        bold: Boolean(run.bold),
        underline: Boolean(run.underline),
      });
    });
  });

  doc.setFontSize(fontSize);
  let cursorX = x;
  let cursorY = y;

  words.forEach((word) => {
    doc.setFont(defaultFont, word.bold ? "bold" : "normal");
    const wordWidth = doc.getTextWidth(word.text);
    const spaceWidth = doc.getTextWidth(" ");

    if (cursorX !== x && cursorX + wordWidth > x + maxWidth) {
      cursorX = x;
      cursorY += lineHeight;
    }

    doc.text(word.text, cursorX, cursorY);

    if (word.underline) {
      drawUnderline(doc, cursorX, cursorX + wordWidth, cursorY + 0.5, 0.18);
    }

    cursorX += wordWidth + spaceWidth;
  });

  doc.setFont(defaultFont, "normal");
  return cursorY;
};

// ----------------------------------------------------------------------
// Justified paragraph helper — wraps text to words-per-line, then spreads
// extra space evenly between words so both edges align (last line of a
// paragraph is left-aligned, matching normal typographic convention).
// ----------------------------------------------------------------------
const wrapWordsToLines = (doc, text, maxWidth) => {
  const words = normalizeText(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = [];
  let currentWidth = 0;
  const spaceWidth = doc.getTextWidth(" ");

  words.forEach((word) => {
    const wordWidth = doc.getTextWidth(word);
    const testWidth =
      current.length === 0 ? wordWidth : currentWidth + spaceWidth + wordWidth;

    if (testWidth > maxWidth && current.length > 0) {
      lines.push(current);
      current = [word];
      currentWidth = wordWidth;
    } else {
      current.push(word);
      currentWidth = testWidth;
    }
  });

  if (current.length) lines.push(current);
  return lines;
};

const drawJustifiedParagraph = (
  doc,
  text,
  x,
  y,
  maxWidth,
  {
    fontSize = 7.6,
    lineHeightFactor = 1.15,
    font = "helvetica",
    color = [20, 20, 20],
  } = {},
) => {
  doc.setFont(font, "normal");
  doc.setFontSize(fontSize);
  doc.setTextColor(...color);

  const lineHeight = fontSize * lineHeightFactor * MM_PER_POINT;
  const lines = wrapWordsToLines(doc, text, maxWidth);
  let cursorY = y;

  lines.forEach((words, index) => {
    const isLastLine = index === lines.length - 1;

    if (words.length === 1 || isLastLine) {
      doc.text(words.join(" "), x, cursorY);
    } else {
      const wordsWidth = words.reduce(
        (sum, word) => sum + doc.getTextWidth(word),
        0,
      );
      const gapCount = words.length - 1;
      const spaceWidth = (maxWidth - wordsWidth) / gapCount;
      let cursorX = x;

      words.forEach((word, wordIndex) => {
        doc.text(word, cursorX, cursorY);
        cursorX +=
          doc.getTextWidth(word) +
          (wordIndex < words.length - 1 ? spaceWidth : 0);
      });
    }

    cursorY += lineHeight;
  });

  doc.setTextColor(15, 15, 15);
  return { endY: cursorY - lineHeight, lineCount: lines.length, lineHeight };
};

const drawNumberedTerms = (doc, terms, x, y, maxWidth, fontSize = 7.8) => {
  const numberWidth = 6.2;
  const termGap = 0.45;
  let cursorY = y;

  terms.forEach((term, index) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(fontSize);
    doc.setTextColor(15, 15, 15);
    doc.text(`${index + 1}.`, x, cursorY);

    const { endY, lineHeight } = drawJustifiedParagraph(
      doc,
      term,
      x + numberWidth,
      cursorY,
      maxWidth - numberWidth,
      { fontSize, lineHeightFactor: 1.1 },
    );

    cursorY = endY + lineHeight + termGap;
  });

  return cursorY - termGap;
};

// ----------------------------------------------------------------------
// Boundary details table — structured columns instead of loose text runs.
// ----------------------------------------------------------------------
const drawBoundaryTable = (doc, sides, x, y, width) => {
  const headerHeight = 6.6;
  const rowHeight = 9.6;
  const rows = sides.slice(0, 4);

  const colWidths = {
    idx: 8,
    side: 27,
    length: 21,
  };
  colWidths.bounded = width - colWidths.idx - colWidths.side - colWidths.length;

  const colX = {
    idx: x,
    side: x + colWidths.idx,
    length: x + colWidths.idx + colWidths.side,
    bounded: x + colWidths.idx + colWidths.side + colWidths.length,
  };

  // Header row
  doc.setFillColor(230, 235, 240);
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.25);
  doc.rect(x, y, width, headerHeight, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.8);
  doc.setTextColor(30, 58, 95);
  doc.text("#", colX.idx + colWidths.idx / 2, y + 4.5, { align: "center" });
  doc.text("Side", colX.side + colWidths.side / 2, y + 4.5, {
    align: "center",
  });
  doc.text("Length", colX.length + colWidths.length / 2, y + 4.5, {
    align: "center",
  });
  doc.text("Bounded By", colX.bounded + colWidths.bounded / 2, y + 4.5, {
    align: "center",
  });

  // Data rows
  let rowTop = y + headerHeight;
  rows.forEach((side, index) => {
    if (index % 2 === 1) {
      doc.setFillColor(248, 248, 248);
      doc.rect(x, rowTop, width, rowHeight, "F");
    }

    const textY = rowTop + rowHeight / 2 + 1.3;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.4);
    doc.setTextColor(30, 58, 95);
    doc.text(String(index + 1), colX.idx + colWidths.idx / 2, textY, {
      align: "center",
    });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(20, 20, 20);
    doc.text(valueOrDash(side.label), colX.side + 1.6, textY);

    doc.setFont("helvetica", "bold");
    doc.text(
      valueOrDash(side.length),
      colX.length + colWidths.length / 2,
      textY,
      { align: "center" },
    );

    doc.setFont("helvetica", "normal");
    const boundedFitted = doc.splitTextToSize(
      valueOrDash(side.boundedBy),
      colWidths.bounded - 3,
    )[0];
    doc.text(boundedFitted, colX.bounded + 1.6, textY);

    rowTop += rowHeight;
  });

  const tableBottom = y + headerHeight + rows.length * rowHeight;

  // Grid lines
  doc.setDrawColor(185, 185, 185);
  doc.setLineWidth(0.22);
  for (let i = 0; i <= rows.length; i += 1) {
    const lineY = y + headerHeight + i * rowHeight;
    doc.line(x, lineY, x + width, lineY);
  }
  [
    colWidths.idx,
    colWidths.idx + colWidths.side,
    colWidths.idx + colWidths.side + colWidths.length,
  ].forEach((offset) => {
    doc.line(x + offset, y, x + offset, tableBottom);
  });

  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.32);
  doc.rect(x, y, width, tableBottom - y);
  doc.setTextColor(15, 15, 15);

  return tableBottom;
};

const getProjectedSketchPoints = (ring, x, y, width, height) => {
  if (!Array.isArray(ring) || ring.length < 3) {
    return [
      [x + width * 0.25, y + height * 0.12],
      [x + width * 0.83, y + height * 0.3],
      [x + width * 0.68, y + height * 0.88],
      [x + width * 0.12, y + height * 0.69],
    ];
  }

  const cleanRing =
    ring.length > 1 &&
    ring[0][0] === ring[ring.length - 1][0] &&
    ring[0][1] === ring[ring.length - 1][1]
      ? ring.slice(0, -1)
      : ring;

  const xs = cleanRing.map((point) => point[0]);
  const ys = cleanRing.map((point) => point[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const dataWidth = Math.max(maxX - minX, 1e-9);
  const dataHeight = Math.max(maxY - minY, 1e-9);
  const scale = Math.min(width / dataWidth, height / dataHeight) * 0.8;
  const scaledWidth = dataWidth * scale;
  const scaledHeight = dataHeight * scale;
  const offsetX = x + (width - scaledWidth) / 2;
  const offsetY = y + (height - scaledHeight) / 2;

  return cleanRing.map(([lng, lat]) => [
    offsetX + (lng - minX) * scale,
    offsetY + scaledHeight - (lat - minY) * scale,
  ]);
};

const drawPlotSketch = (doc, parcel, details, sides, x, y, width, height) => {
  doc.setDrawColor(...THEME);
  doc.setLineWidth(0.4);
  doc.setFillColor(255, 255, 255);
  doc.rect(x, y, width, height, "FD");

  doc.setFillColor(...THEME);
  doc.rect(x, y, width, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.6);
  doc.setTextColor(255, 255, 255);
  doc.text("PLOT SKETCH", x + width / 2, y + 4.1, { align: "center" });
  doc.setTextColor(30, 30, 30);

  const pad = 7;
  const innerX = x + pad;
  const innerY = y + 8;
  const innerWidth = width - pad * 2;
  const innerHeight = height - 8 - pad;

  const ring = getGeometryRing(parcel?.geometry);
  const points = getProjectedSketchPoints(
    ring,
    innerX,
    innerY,
    innerWidth,
    innerHeight,
  );

  doc.setDrawColor(40, 40, 40);
  doc.setFillColor(214, 82, 155);
  doc.setLineWidth(0.5);

  if (points.length >= 3) {
    const vectors = [];
    for (let index = 1; index < points.length; index += 1) {
      vectors.push([
        points[index][0] - points[index - 1][0],
        points[index][1] - points[index - 1][1],
      ]);
    }
    vectors.push([
      points[0][0] - points[points.length - 1][0],
      points[0][1] - points[points.length - 1][1],
    ]);

    doc.lines(vectors, points[0][0], points[0][1], [1, 1], "FD", true);
  }

  const centerX =
    points.reduce((sum, point) => sum + point[0], 0) / points.length;
  const centerY =
    points.reduce((sum, point) => sum + point[1], 0) / points.length;

  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.text(valueOrDash(details.plotNo), centerX, centerY - 0.2, {
    align: "center",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.2);
  doc.text(
    normalizeText(details.plotSize || normalizeAreaText(details), ""),
    centerX,
    centerY + 4.4,
    { align: "center" },
  );

  const cornerDotRadius = 1.05;

  const sideLabels = sides.slice(0, Math.min(sides.length, points.length));

  points.forEach((point, index) => {
    const vx = point[0] - centerX;
    const vy = point[1] - centerY;
    const vLength = Math.max(Math.hypot(vx, vy), 1e-6);
    const labelX = point[0] + (vx / vLength) * 5;
    const labelY = point[1] + (vy / vLength) * 5;

    doc.setFillColor(34, 197, 94);
    doc.setDrawColor(6, 95, 45);
    doc.setLineWidth(0.25);
    doc.circle(point[0], point[1], cornerDotRadius, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.4);
    doc.setTextColor(140, 45, 20);
    doc.text(String.fromCharCode(65 + index), labelX, labelY, {
      align: "center",
    });
  });

  doc.setTextColor(20, 20, 20);

  sideLabels.forEach((side, index) => {
    const start = points[index];
    const end = points[(index + 1) % points.length];
    const middleX = (start[0] + end[0]) / 2;
    const middleY = (start[1] + end[1]) / 2;

    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const edgeLength = Math.max(Math.hypot(dx, dy), 1e-6);

    let normalX = -dy / edgeLength;
    let normalY = dx / edgeLength;

    // Robust outward direction: pick the side farther from polygon center
    const testDist = 3;
    const distPos = Math.hypot(
      middleX + normalX * testDist - centerX,
      middleY + normalY * testDist - centerY,
    );
    const distNeg = Math.hypot(
      middleX - normalX * testDist - centerX,
      middleY - normalY * testDist - centerY,
    );

    if (distNeg > distPos) {
      normalX = -normalX;
      normalY = -normalY;
    }

    const labelOffset = 3.4;
    let labelX = middleX + normalX * labelOffset;
    let labelY = middleY + normalY * labelOffset;

    let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (angle > 90 || angle < -90) angle += 180;

    const label = normalizeText(side.length, "");

    if (label) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.6);

      const clampedX = Math.max(
        innerX + 3,
        Math.min(labelX, innerX + innerWidth - 3),
      );
      const clampedY = Math.max(
        innerY + 3,
        Math.min(labelY, innerY + innerHeight - 3),
      );

      doc.text(label, clampedX, clampedY, {
        align: "center",
        angle: -angle,
      });
    }
  });

  const roadLabel = normalizeText(
    details.streetRoadNo || details.roadFacing,
    details.roadFt ? `${details.roadFt} ft wide road` : "",
  );

  if (roadLabel) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.2);
    doc.setTextColor(80, 80, 80);
    doc.text(roadLabel, x + width - 2, y + height - 1.5, {
      align: "right",
    });
    doc.setTextColor(20, 20, 20);
  }
};

export const printPossessionCertificate = async ({
  parcel,
  filters = {},
  contextGeojson,
}) => {
  if (!parcel) {
    alert("Please select a plot first.");
    return;
  }

  const previewWindow = createPdfPreviewWindow("Possession Certificate");
  if (!previewWindow) return;

  try {
    const details = buildPlotDetails(parcel, filters);
    const { gopLogo, rudaLogo } = await loadPrintAssets();
    const sides = getPlotSides(parcel, contextGeojson, details);

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    const margin = 10;
    const contentWidth = pageWidth - margin * 2;
    const rightEdge = pageWidth - margin;
    const navy = THEME;

    const totalArea = normalizeAreaText(details);
    const areaText = normalizeText(totalArea, "-");
    const fileReference = normalizeText(
      details.fileReference || details.registrationNo || details.applicationNo,
      "",
    );
    const possessionDate = normalizeText(
      details.possessionDate || details.documentDate,
      "",
    );
    const cnic = normalizeText(details.cnic);
    const owner = normalizeText(details.owner, "");
    const postalAddress = normalizeText(details.postalAddress, "");
    const streetNo = normalizeText(details.streetRoadNo, "________");
    const roadWidth = normalizeText(details.roadFt, "________");
    const landUse = normalizeText(
      details.landUse || details.plotCategory,
      "-",
    ).toUpperCase();
    const extraLand = normalizeText(
      details.excessArea || details.extraLand || details.additionalArea,
      "",
    );

    // ------------------------------------------------------------------
    // THEME BAR
    // ------------------------------------------------------------------
    doc.setFillColor(...navy);
    doc.rect(0, 0, pageWidth, 1.8, "F");

    doc.setTextColor(15, 15, 15);
    doc.setDrawColor(45, 45, 45);
    doc.setLineWidth(0.2);

    // ------------------------------------------------------------------
    // HEADER — matches the official Site Plan layout: round logos,
    // authority name, "Government of the Punjab", project name, and a
    // navy document-type badge (now reading "POSSESSION CERTIFICATE").
    // ------------------------------------------------------------------
    const gopLogoSize = 23;
    const rudaLogoSize = 22;

    if (gopLogo) {
      const cx = margin + 6 + gopLogoSize / 2;
      const cy = 5 + gopLogoSize / 2;
      drawCircularLogo(doc, gopLogo, cx, cy, gopLogoSize / 2, gopLogoSize);
    }
    if (rudaLogo) {
      const cx = rightEdge - rudaLogoSize / 2 - 6;
      const cy = 6 + rudaLogoSize / 2;
      drawCircularLogo(doc, rudaLogo, cx, cy, rudaLogoSize / 2, rudaLogoSize);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(...navy);
    doc.text("RAVI URBAN DEVELOPMENT AUTHORITY", pageWidth / 2, 11, {
      align: "center",
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("Government of the Punjab", pageWidth / 2, 15.5, {
      align: "center",
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 15, 15);
    doc.text(
      valueOrDash(details.project, "CHAHAR BAGH PHASE-1").toUpperCase(),
      pageWidth / 2,
      20.5,
      { align: "center" },
    );

    const badgeW = 58;
    const badgeH = 7.5;
    const badgeX = (pageWidth - badgeW) / 2;
    const badgeY = 23.5;
    doc.setFillColor(...navy);
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.2);
    doc.setTextColor(255, 255, 255);
    doc.text("POSSESSION CERTIFICATE", pageWidth / 2, badgeY + 5, {
      align: "center",
    });
    doc.setTextColor(15, 15, 15);

    // ------------------------------------------------------------------
    // PLOT & OWNER INFORMATION — same field styling & placement as the
    // Site Plan (drawUnderlinedValue), properly aligned to the margins.
    // ------------------------------------------------------------------
    let sectionBottom = drawSectionHeader(
      doc,
      margin,
      34,
      contentWidth,
      "PLOT & OWNER INFORMATION",
    );

    const infoLeft = margin + 2;
    const infoRight = rightEdge - 2;
    const rowWidth = infoRight - infoLeft;
    const infoTop = sectionBottom + 1;

    // Row 1: File Reference No (left) + Dated (right, ends at infoRight)
    const dateLabelX = infoLeft + rowWidth * 0.72;
    drawUnderlinedValue(
      doc,
      "File Reference No:",
      fileReference,
      infoLeft,
      infoTop + 5,
      36,
      dateLabelX - 4 - (infoLeft + 36),
      { fontSize: 8.6 },
    );
    drawUnderlinedValue(
      doc,
      "Dated:",
      possessionDate,
      dateLabelX,
      infoTop + 5,
      13,
      infoRight - (dateLabelX + 13),
      { fontSize: 8.6 },
    );

    // Row 2: Owner Name (left) + CNIC (right, when available)
    const ownerRowEnd = cnic ? infoLeft + rowWidth * 0.66 : infoRight;
    drawUnderlinedValue(
      doc,
      "Owner Name:",
      owner,
      infoLeft,
      infoTop + 12.5,
      27,
      ownerRowEnd - 4 - (infoLeft + 27),
      { fontSize: 8.6 },
    );
    if (cnic) {
      drawUnderlinedValue(
        doc,
        "CNIC:",
        cnic,
        infoLeft + rowWidth * 0.66,
        infoTop + 12.5,
        13,
        infoRight - (infoLeft + rowWidth * 0.66 + 13),
        { fontSize: 8.6 },
      );
    }

    // Row 3: Postal Address (full width)
    drawUnderlinedValue(
      doc,
      "Postal Address:",
      postalAddress,
      infoLeft,
      infoTop + 19.5,
      32,
      infoRight - (infoLeft + 32),
      { fontSize: 8.6 },
    );

    // ------------------------------------------------------------------
    // CERTIFICATION PARAGRAPH — unchanged wording/logic, larger font.
    // ------------------------------------------------------------------
    const certificationY = infoTop + 27;

    const areaAlreadyHasUnit = /sq\s*ft|sqft|sft|kanal|marla/i.test(areaText);
    const certifiedRuns = [
      { text: "It is Certified that possession of Plot No" },
      { text: valueOrDash(details.plotNo), bold: true, underline: true },
      { text: "Block" },
      { text: valueOrDash(details.block), bold: true, underline: true },
      { text: "measuring area of" },
      { text: areaText, bold: true, underline: true },
      ...(!areaAlreadyHasUnit
        ? [{ text: "Sqft", bold: true, underline: true }]
        : []),
      { text: "Street No" },
      { text: streetNo, bold: true, underline: true },
      { text: "Road wide" },
      { text: `${roadWidth} ft`, bold: true, underline: true },
      { text: "wide Road and Land Use" },
      { text: landUse, bold: true, underline: true },
      { text: "has been handed over to the allottee / attorney on" },
      {
        text: possessionDate || "______________",
        bold: true,
        underline: true,
      },
      { text: "as per following details:" },
    ];

    const certificationEndY = drawInlineRuns(
      doc,
      certifiedRuns,
      margin,
      certificationY,
      contentWidth,
      { fontSize: 9.6, lineHeightFactor: 1.28 },
    );

    // ------------------------------------------------------------------
    // BOUNDARY DETAILS (table) + PLOT SKETCH (enlarged)
    // ------------------------------------------------------------------
    const boundaryHeaderY = certificationEndY + 6;
    sectionBottom = drawSectionHeader(
      doc,
      margin,
      boundaryHeaderY,
      contentWidth,
      "BOUNDARY DETAILS & PLOT SKETCH",
    );

    const sidesTop = sectionBottom + 6;
    const sketchWidth = 84;
    const sketchHeight = 80;
    const sketchX = pageWidth - margin - sketchWidth;
    const sketchY = sidesTop - 5;

    const tableX = margin;
    const tableWidth = sketchX - 6 - margin;

    const tableBottom = drawBoundaryTable(
      doc,
      sides,
      tableX,
      sketchY,
      tableWidth,
    );

    drawPlotSketch(
      doc,
      parcel,
      details,
      sides,
      sketchX,
      sketchY,
      sketchWidth,
      sketchHeight,
    );

    const sketchBottom = sketchY + sketchHeight;

    // ------------------------------------------------------------------
    // TOTAL AREA / EXTRA LAND — moved under the boundary table (left
    // column), stacked for a clean, consistently-aligned pair of fields.
    // ------------------------------------------------------------------
    const totalsLabelWidth = 30;
    const totalsLineWidth = tableWidth - totalsLabelWidth;

    const totalAreaY = tableBottom + 8;
    drawUnderlinedValue(
      doc,
      "Total Area:",
      areaText,
      tableX,
      totalAreaY,
      totalsLabelWidth,
      totalsLineWidth,
      { fontSize: 9.8 },
    );

    const extraLandY = totalAreaY + 8.5;
    drawUnderlinedValue(
      doc,
      "Extra Land:",
      extraLand,
      tableX,
      extraLandY,
      totalsLabelWidth,
      totalsLineWidth,
      { fontSize: 9.8 },
    );

    // ------------------------------------------------------------------
    // DD DEMARCATION / DIRECTOR LAND — stays below the sketch, two equal
    // columns so both label+line pairs line up, with generous room for
    // an actual signature.
    // ------------------------------------------------------------------
    const signaturesY = Math.max(sketchBottom, extraLandY + 8) + 12;

    const sigColGap = 8;
    const sigColWidth = (contentWidth - sigColGap) / 2;
    const sigLabelWidth = 36;

    drawUnderlinedValue(
      doc,
      "DD Demarcation:",
      "",
      margin,
      signaturesY,
      sigLabelWidth,
      sigColWidth - sigLabelWidth,
      { fontSize: 9.4 },
    );
    drawUnderlinedValue(
      doc,
      "Director Land:",
      "",
      margin + sigColWidth + sigColGap,
      signaturesY,
      sigLabelWidth,
      sigColWidth - sigLabelWidth,
      { fontSize: 9.4 },
    );

    // ------------------------------------------------------------------
    // TERMS AND CONDITIONS — larger, justified text; all 8 points fit
    // above the next section (no more overlap with the heading below).
    // ------------------------------------------------------------------
    const termsHeaderY = signaturesY + 8;
    sectionBottom = drawSectionHeader(
      doc,
      margin,
      termsHeaderY,
      contentWidth,
      "TERMS AND CONDITIONS",
    );

    const terms = [
      "By accepting this Provisional Possession Certificate, I confirm that I have personally inspected the plot and am satisfied that it is free from any unauthorized occupation or encroachment.",
      "I agree to adhere to all building Regulations and Bylaws established by the Ravi Urban Development Authority (RUDA). I will construct any building on the plot according to the drawings that have been officially approved by RUDA.",
      "RUDA reserves the right to change/amend due to technical reasons at any stage.",
      "The Provisional Possession Certificate is valid till issued payment plan time frame.",
      "Chamfer area is part of the plot but will not be included in the boundary of the plot.",
      "On expiry, re-validation of possession will be required after the payment of re-validation charges & Non utilization charges.",
      "If any outstanding payments due to RUDA are not made within the specified payment period, RUDA retains the right to cancel the Intimation, Allotment, and this Provisional Possession Certificate.",
      "This Possession Certificate is provisional. Water, sewerage, and electrical connections will not be provided until all outstanding dues owed to RUDA have been fully paid.",
      "I agree to comply with and abide by these Terms and Conditions, as well as any other Bylaws, Rules & Regulations, issued by RUDA relating to the Intimation, Allocation, Allotment, and Possession of this plot.",
    ];

    const termsEndY = drawNumberedTerms(
      doc,
      terms,
      margin,
      sectionBottom + 5,
      contentWidth,
      8,
    );

    // ------------------------------------------------------------------
    // POSSESSION TAKEN OVER — site-plan-style field styling (bold navy
    // labels, clean underline), placed right after the terms end.
    // ------------------------------------------------------------------
    const takeoverHeaderY = termsEndY + 4;

    sectionBottom = drawSectionHeader(
      doc,
      margin,
      takeoverHeaderY,
      contentWidth,
      "POSSESSION TAKEN OVER BY ALLOTTEE / ATTORNEY",
    );

    const firstLineY = sectionBottom + 7;
    const secondLineY = sectionBottom + 14;

    const takeoverField = (label, x, y, labelWidth, lineWidth) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.3);
      doc.setTextColor(...navy);
      doc.text(label, x, y);
      const startX = x + doc.getTextWidth(label) + 2;
      doc.setDrawColor(120, 120, 120);
      doc.setLineWidth(0.28);
      doc.line(startX, y + 1, startX + lineWidth - (startX - x), y + 1);
      doc.setTextColor(15, 15, 15);
    };

    takeoverField("NAME:", margin, firstLineY, 14, 60);
    takeoverField(
      "THUMB & SIGNATURE:",
      margin + 92,
      firstLineY,
      41,
      contentWidth - 92,
    );

    takeoverField("CNIC:", margin, secondLineY, 14, 60);
    takeoverField("DATED:", margin + 92, secondLineY, 10, contentWidth - 92);

    // ------------------------------------------------------------------
    // FOOTER
    // ------------------------------------------------------------------
    doc.setDrawColor(...navy);
    doc.setLineWidth(0.5);
    doc.line(margin, 286, pageWidth - margin, 286);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Generated: ${new Date().toLocaleDateString("en-GB")} | RUDA Possession Certificate System | This is a computer-generated document.`,
      pageWidth / 2,
      290,
      { align: "center" },
    );

    openPdfPreview(
      doc,
      `Possession Certificate - Plot ${details.plotNo || ""}`,
      previewWindow,
    );
  } catch (error) {
    previewWindow.close();
    console.error("Possession certificate generation failed", error);
    alert(
      "Failed to generate the possession certificate. Please check the plot data and try again.",
    );
  }
};

export default printPossessionCertificate;

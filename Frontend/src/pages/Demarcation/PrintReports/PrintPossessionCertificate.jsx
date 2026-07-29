import { jsPDF } from "jspdf";
import {
  buildPlotDetails,
  createPdfPreviewWindow,
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

const getTextWidthWithSpacing = (doc, text, charSpace = 0) =>
  doc.getTextWidth(text) + charSpace * Math.max(text.length - 1, 0);

const drawFittedCenteredHeading = (
  doc,
  text,
  centerX,
  y,
  {
    maxWidth,
    startFontSize,
    minFontSize = 8,
    charSpace = 0,
    bold = true,
    color = null,
  } = {},
) => {
  doc.setFont("helvetica", bold ? "bold" : "normal");
  let fontSize = startFontSize;

  doc.setFontSize(fontSize);
  let renderedWidth = getTextWidthWithSpacing(doc, text, charSpace);

  while (fontSize > minFontSize && renderedWidth > maxWidth) {
    fontSize -= 0.3;
    doc.setFontSize(fontSize);
    renderedWidth = getTextWidthWithSpacing(doc, text, charSpace);
  }

  if (color) doc.setTextColor(...color);

  const startX = centerX - renderedWidth / 2;
  doc.text(text, startX, y, { charSpace });

  return fontSize;
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

const drawFieldLine = (
  doc,
  label,
  value,
  x,
  y,
  {
    labelWidth,
    lineWidth,
    fontSize = 8.5,
    boldValue = true,
    underlineValue = false,
  },
) => {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(fontSize);
  doc.text(label, x, y);

  const valueX = x + labelWidth;
  const availableWidth = lineWidth;
  const safeValue = normalizeText(value);

  if (safeValue) {
    doc.setFont("helvetica", boldValue ? "bold" : "normal");
    const fittedValue = doc.splitTextToSize(safeValue, availableWidth)[0] || "";
    doc.text(fittedValue, valueX, y);
  }

  if (underlineValue) {
    drawUnderline(doc, valueX, valueX + availableWidth, y + 0.5, 0.18);
  }

  doc.setFont("helvetica", "normal");
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
  const scale = Math.min(width / dataWidth, height / dataHeight) * 0.80;
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
  doc.rect(x, y, width, 5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.6);
  doc.setTextColor(255, 255, 255);
  doc.text("PLOT SKETCH", x + width / 2, y + 3.4, { align: "center" });
  doc.setTextColor(30, 30, 30);

  const pad = 6;
  const innerX = x + pad;
  const innerY = y + 7;
  const innerWidth = width - pad * 2;
  const innerHeight = height - 7 - pad;

  const ring = getGeometryRing(parcel?.geometry);
  const points = getProjectedSketchPoints(ring, innerX, innerY, innerWidth, innerHeight);

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
  doc.setFontSize(10.5);
  doc.text(valueOrDash(details.plotNo), centerX, centerY - 0.5, {
    align: "center",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.text(
    normalizeText(details.plotSize || normalizeAreaText(details), ""),
    centerX,
    centerY + 3.6,
    { align: "center" },
  );

  const maxLabelOffset = 2.8;
  const cornerDotRadius = 0.9;

  const sideLabels = sides.slice(0, Math.min(sides.length, points.length));

  points.forEach((point, index) => {
    const vx = point[0] - centerX;
    const vy = point[1] - centerY;
    const vLength = Math.max(Math.hypot(vx, vy), 1e-6);
    const labelX = point[0] + (vx / vLength) * 4.2;
    const labelY = point[1] + (vy / vLength) * 4.2;

    doc.setFillColor(34, 197, 94);
    doc.setDrawColor(6, 95, 45);
    doc.setLineWidth(0.25);
    doc.circle(point[0], point[1], cornerDotRadius, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.2);
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

    // ✅ ROBUST OUTWARD DIRECTION: pick the side farther from polygon center
    const testDist = 3;
    const distPos = Math.hypot(
      middleX + normalX * testDist - centerX,
      middleY + normalY * testDist - centerY
    );
    const distNeg = Math.hypot(
      middleX - normalX * testDist - centerX,
      middleY - normalY * testDist - centerY
    );

    if (distNeg > distPos) {
      normalX = -normalX;
      normalY = -normalY;
    }

    // ✅ FIXED 3 mm offset for every edge — consistent and clean
    const labelOffset = 3.0;
    let labelX = middleX + normalX * labelOffset;
    let labelY = middleY + normalY * labelOffset;

    let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (angle > 90 || angle < -90) angle += 180;

    const label = normalizeText(side.length, "");

    if (label) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.4);

      // ✅ ACTUALLY USE THE CLAMPED VALUES (bug in your current code)
      const clampedX = Math.max(innerX + 3, Math.min(labelX, innerX + innerWidth - 3));
      const clampedY = Math.max(innerY + 3, Math.min(labelY, innerY + innerHeight - 3));

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
    doc.setFontSize(5.2);
    doc.setTextColor(80, 80, 80);
    doc.text(roadLabel, x + width - 2, y + height - 1.3, {
      align: "right",
    });
    doc.setTextColor(20, 20, 20);
  }
};

const drawNumberedTerms = (doc, terms, x, y, maxWidth) => {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.15);

  let cursorY = y;
  terms.forEach((term, index) => {
    const numberText = `${index + 1}.`;
    const numberWidth = 6;
    const lines = doc.splitTextToSize(term, maxWidth - numberWidth);

    doc.text(numberText, x, cursorY);
    doc.text(lines, x + numberWidth, cursorY, { lineHeightFactor: 1.08 });
    cursorY += lines.length * 2.75 + 0.7;
  });

  return cursorY;
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
    const pageHeight = doc.internal.pageSize.getHeight();

    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    const navy = THEME;

    const totalArea = normalizeAreaText(details);
    const areaText = normalizeText(totalArea, "-");
    const fileReference = normalizeText(
      details.fileReference ||
        details.registrationNo ||
        details.applicationNo,
      "",
    );
    const possessionDate = normalizeText(
      details.possessionDate || details.documentDate,
      "",
    );
    const cnic = normalizeText(details.cnic);
    const owner = normalizeText(details.owner, "-");
    const postalAddress = normalizeText(details.postalAddress, "-");
    const streetNo = normalizeText(details.streetRoadNo, "________");
    const roadWidth = normalizeText(details.roadFt, "________");
    const landUse = normalizeText(
      details.landUse || details.plotCategory,
      "-",
    ).toUpperCase();
    const extraLand = normalizeText(
      details.excessArea || details.extraLand || details.additionalArea,
      "-",
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
    // HEADER — round logos (circular-clipped), navy accents
    // ------------------------------------------------------------------
    const logoSize = 22;
    const frameRadius = 12;
    const logoY = 6;

    if (gopLogo) {
      const cx = margin + 2 + frameRadius;
      const cy = logoY + frameRadius;
      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(...navy);
      doc.setLineWidth(0.4);
      doc.ellipse(cx, cy, frameRadius, frameRadius, "FD");
      drawCircularLogo(doc, gopLogo, cx, cy, frameRadius - 0.4, logoSize);
    }

    if (rudaLogo) {
      const cx = pageWidth - margin - 2 - frameRadius;
      const cy = logoY + frameRadius;
      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(...navy);
      doc.setLineWidth(0.4);
      doc.ellipse(cx, cy, frameRadius, frameRadius, "FD");
      drawCircularLogo(doc, rudaLogo, cx, cy, frameRadius - 0.4, logoSize);
    }

    const leftLogoEdge = margin + 2 + frameRadius * 2;
    const rightLogoEdge = pageWidth - margin - 2 - frameRadius * 2;
    const headingMaxWidth = rightLogoEdge - leftLogoEdge - 6;

    doc.setTextColor(...navy);

    drawFittedCenteredHeading(
      doc,
      "RAVI URBAN DEVELOPMENT AUTHORITY",
      pageWidth / 2,
      16,
      {
        maxWidth: headingMaxWidth,
        startFontSize: 15.1,
        minFontSize: 9.5,
        charSpace: 0.75,
        color: navy,
      },
    );
    doc.setDrawColor(...navy);
    drawUnderline(
      doc,
      pageWidth / 2 - headingMaxWidth / 2 + 3,
      pageWidth / 2 + headingMaxWidth / 2 - 3,
      17,
      0.45,
    );

    drawFittedCenteredHeading(
      doc,
      "POSSESSION CERTIFICATE",
      pageWidth / 2,
      24,
      {
        maxWidth: headingMaxWidth,
        startFontSize: 14.1,
        minFontSize: 9,
        charSpace: 1.75,
        color: navy,
      },
    );
    drawUnderline(
      doc,
      pageWidth / 2 - headingMaxWidth / 2 + 8,
      pageWidth / 2 + headingMaxWidth / 2 - 8,
      25.5,
      0.4,
    );

    drawFittedCenteredHeading(
      doc,
      valueOrDash(details.project, "CHAHAR BAGH (PHASE-1)").toUpperCase(),
      pageWidth / 2,
      33,
      {
        maxWidth: headingMaxWidth,
        startFontSize: 11.6,
        minFontSize: 8,
        charSpace: 1.95,
        bold: true,
        color: [15, 15, 15],
      },
    );

    doc.setTextColor(15, 15, 15);
    doc.setDrawColor(45, 45, 45);
    doc.setLineWidth(0.2);

    // ------------------------------------------------------------------
    // PLOT & OWNER INFORMATION
    // ------------------------------------------------------------------
    let sectionBottom = drawSectionHeader(
      doc,
      margin,
      37,
      contentWidth,
      "PLOT & OWNER INFORMATION",
    );

    const infoTop = sectionBottom + 6;

    drawFieldLine(doc, "File Reference No:", fileReference, margin, infoTop, {
      labelWidth: 39,
      lineWidth: 68,
      fontSize: 9.6,
      underlineValue: true,
    });

    drawFieldLine(
      doc,
      "Dated:",
      possessionDate,
      pageWidth - margin - 63,
      infoTop,
      {
        labelWidth: 14,
        lineWidth: 49,
        fontSize: 9.6,
        boldValue: false,
        underlineValue: true,
      },
    );

      const ownerLabelWidth = 26;
    const ownerLineWidth = cnic
      ? contentWidth - ownerLabelWidth - 45
      : contentWidth - ownerLabelWidth;

    drawFieldLine(doc, "Owner Name:", owner, margin, infoTop + 10, {
      labelWidth: ownerLabelWidth,
      lineWidth: ownerLineWidth,
      fontSize: 9.7,
      boldValue: true,
      underlineValue: true,
    });

    if (cnic) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.7);
      doc.text(`(${cnic})`, margin + ownerLabelWidth + ownerLineWidth + 4, infoTop + 10);
      doc.setFont("helvetica", "normal");
    }

    drawFieldLine(doc, "Postal Address:", postalAddress, margin, infoTop + 20, {
      labelWidth: 32,
      lineWidth: contentWidth - 32,
      fontSize: 9.4,
      boldValue: false,
      underlineValue: true,
    });

    // ------------------------------------------------------------------
    // CERTIFICATION PARAGRAPH
    // ------------------------------------------------------------------
    const certificationY = infoTop + 32;

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
      { fontSize: 9.3, lineHeightFactor: 1.24 },
    );

    // ------------------------------------------------------------------
    // BOUNDARY DETAILS + PLOT SKETCH
    // ------------------------------------------------------------------
    const boundaryHeaderY = certificationEndY + 7;
    sectionBottom = drawSectionHeader(
      doc,
      margin,
      boundaryHeaderY,
      contentWidth,
      "BOUNDARY DETAILS & PLOT SKETCH",
    );

    const sidesTop = sectionBottom + 7;
    const sketchWidth = 72;
    const sketchHeight = 68;
    const sketchX = pageWidth - margin - sketchWidth;
    const sketchY = sidesTop - 5;

        const tableRight = sketchX - 6;
    const sideNameX = margin + 8;
    const lengthX = margin + 42;
    const boundedLabelX = margin + 64;
    const boundedValueX = margin + 86;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.1);

    sides.slice(0, 4).forEach((side, index) => {
      const y = sidesTop + index * 7.2;
      doc.text(`${index + 1}.`, margin, y);
      doc.text(valueOrDash(side.label), sideNameX, y);
      doc.text(valueOrDash(side.length), lengthX, y);
      doc.text("Bounded by", boundedLabelX, y);

      const boundedValue = doc.splitTextToSize(
        valueOrDash(side.boundedBy),
        Math.max(20, tableRight - boundedValueX),
      )[0];

      doc.text(boundedValue, boundedValueX, y);
    });

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

    // ------------------------------------------------------------------
    // TOTAL AREA / EXTRA LAND / OFFICIAL SIGNATURES
    // ------------------------------------------------------------------
    const totalsY = sketchY + sketchHeight + 7;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.8);
    doc.text("Total Area:", margin, totalsY);
    doc.text(areaText, margin + 28, totalsY);
    drawUnderline(doc, margin + 28, margin + 68, totalsY + 1, 0.25);

    doc.text("Extra Land:", margin + 103, totalsY);
    doc.text(extraLand, margin + 132, totalsY);
    drawUnderline(doc, margin + 132, pageWidth - margin, totalsY + 1, 0.25);

    const signaturesY = totalsY + 17;
    doc.setFontSize(9.2);
    doc.text("DD Demarcation:", margin, signaturesY);
    drawUnderline(doc, margin + 40, margin + 86, signaturesY + 1, 0.28);

    doc.text("Director Land:", margin + 105, signaturesY);
    drawUnderline(doc, margin + 139, pageWidth - margin, signaturesY + 1, 0.28);

    // ------------------------------------------------------------------
    // TERMS AND CONDITIONS
    // ------------------------------------------------------------------
    const termsHeaderY = signaturesY + 10;
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
      sectionBottom + 6,
      contentWidth,
    );

    // ------------------------------------------------------------------
    // POSSESSION TAKEN OVER
    // ------------------------------------------------------------------
    const takeoverHeaderY = Math.min(
      Math.max(termsEndY + 6, 258),
      pageHeight - 45,
    );

    sectionBottom = drawSectionHeader(
      doc,
      margin,
      takeoverHeaderY,
      contentWidth,
      "POSSESSION TAKEN OVER BY ALLOTTEE / ATTORNEY",
    );

    const firstLineY = sectionBottom + 9;
    const secondLineY = sectionBottom + 18;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.2);
    doc.text("NAME:", margin, firstLineY);
    drawUnderline(doc, margin + 14, margin + 72, firstLineY + 1, 0.28);

    doc.text("THUMB & SIGNATURE:", margin + 92, firstLineY);
    drawUnderline(doc, margin + 141, pageWidth - margin, firstLineY + 1, 0.28);

    doc.text("CNIC:", margin, secondLineY);
    drawUnderline(doc, margin + 14, margin + 72, secondLineY + 1, 0.28);

    doc.text("DATED:", margin + 95, secondLineY);
    drawUnderline(doc, margin + 114, pageWidth - margin, secondLineY + 1, 0.28);

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
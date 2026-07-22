import { jsPDF } from "jspdf";
import {
  buildPlotDetails,
  createPdfPreviewWindow,
  getGeometryRing,
  getPlotSides,
  loadPrintAssets,
  normalizeAreaText,
  openPdfPreview,
  valueOrDash,
} from "./printUtils";

const MM_PER_POINT = 0.3528;

const normalizeText = (value, fallback = "") => {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value).trim();
};

const drawUnderline = (doc, x1, x2, y, lineWidth = 0.2) => {
  doc.setLineWidth(lineWidth);
  doc.line(x1, y, x2, y);
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
      drawUnderline(doc, cursorX, cursorX + wordWidth, cursorY + 0.75, 0.18);
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

    if (underlineValue) {
      const renderedWidth = Math.min(
        doc.getTextWidth(fittedValue),
        availableWidth,
      );
      drawUnderline(doc, valueX, valueX + renderedWidth, y + 0.8, 0.18);
    }
  } else {
    drawUnderline(doc, valueX, valueX + availableWidth, y + 0.8, 0.18);
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
  const scale = Math.min(width / dataWidth, height / dataHeight) * 0.78;
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
  const ring = getGeometryRing(parcel?.geometry);
  const points = getProjectedSketchPoints(ring, x, y, width, height);

  doc.setDrawColor(75, 75, 75);
  doc.setFillColor(214, 82, 155);
  doc.setLineWidth(0.35);

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
  doc.setFontSize(5.2);
  doc.text(`P-${valueOrDash(details.plotNo)}`, centerX, centerY + 0.6, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(4.3);

  const sideLabels = sides.slice(0, Math.min(sides.length, points.length));
  sideLabels.forEach((side, index) => {
    const start = points[index];
    const end = points[(index + 1) % points.length];
    const middleX = (start[0] + end[0]) / 2;
    const middleY = (start[1] + end[1]) / 2;
    const angle =
      (Math.atan2(end[1] - start[1], end[0] - start[0]) * 180) / Math.PI;
    const label = normalizeText(side.length, "");

    if (label) {
      doc.text(label, middleX, middleY - 1.2, {
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
    doc.setFontSize(4.4);
    doc.text(roadLabel, x + width - 1, y + height - 1, {
      align: "right",
      angle: 52,
    });
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
    const totalArea = normalizeAreaText(details);

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;

    doc.setTextColor(20, 20, 20);
    doc.setDrawColor(35, 35, 35);
    doc.setLineWidth(0.2);

    // Header logos: Government of Punjab on the left and RUDA on the right.
    if (gopLogo) {
      doc.addImage(gopLogo, "PNG", margin + 1, 8, 25, 25, undefined, "FAST");
    }
    if (rudaLogo) {
      doc.addImage(
        rudaLogo,
        "PNG",
        pageWidth - margin - 24,
        8,
        24,
        24,
        undefined,
        "FAST",
      );
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13.2);
    doc.text("RAVI URBAN DEVELOPMENT AUTHORITY", pageWidth / 2, 14.5, {
      align: "center",
      charSpace: 0.7,
    });
    drawUnderline(doc, pageWidth / 2 - 51, pageWidth / 2 + 51, 15.7, 0.35);

    doc.setFontSize(12.5);
    doc.text("POSSESSION CERTIFICATE", pageWidth / 2, 22.5, {
      align: "center",
      charSpace: 1.4,
    });
    drawUnderline(doc, pageWidth / 2 - 36, pageWidth / 2 + 36, 23.7, 0.32);

    doc.setFontSize(10.2);
    doc.text(
      valueOrDash(details.project, "CHAHAR BAGH (PHASE-1)").toUpperCase(),
      pageWidth / 2,
      30,
      { align: "center", charSpace: 1.7 },
    );

    const fileReference =
      details.fileReferenceNo ||
      details.registrationNo ||
      details.applicationNo;
    const possessionDate = details.possessionDate || details.documentDate;
    const cnic = normalizeText(details.cnic);

    drawFieldLine(doc, "File Reference No:", fileReference, margin, 42, {
      labelWidth: 34,
      lineWidth: 50,
      fontSize: 8.4,
      underlineValue: true,
    });

    drawFieldLine(doc, "Dated:", possessionDate, pageWidth - margin - 47, 42, {
      labelWidth: 12,
      lineWidth: 35,
      fontSize: 8.4,
      boldValue: false,
      underlineValue: false,
    });

    const ownerRuns = [
      { text: "Owner Name:" },
      { text: valueOrDash(details.owner), bold: true },
    ];
    if (cnic) ownerRuns.push({ text: `(${cnic})`, bold: true });
    drawInlineRuns(doc, ownerRuns, margin, 51, contentWidth, { fontSize: 8.4 });

    drawInlineRuns(
      doc,
      [
        { text: "Postal Address:" },
        {
          text: valueOrDash(details.postalAddress),
        },
      ],
      margin,
      59,
      contentWidth,
      { fontSize: 8.2, lineHeightFactor: 1.2 },
    );

    const streetNo = normalizeText(
      details.streetNo || details.streetRoadNo,
      "________",
    );
    const roadWidth = normalizeText(details.roadFt, "________");

    drawInlineRuns(
      doc,
      [
        { text: "It is Certified that possession of Plot No" },
        { text: valueOrDash(details.plotNo), bold: true, underline: true },
        { text: "Block" },
        { text: valueOrDash(details.block), bold: true, underline: true },
        { text: "measuring area of" },
        { text: valueOrDash(totalArea), bold: true, underline: true },
        { text: "Sqft, Street No" },
        { text: streetNo, bold: true, underline: true },
        { text: "Road wide" },
        { text: `${roadWidth} ft`, bold: true, underline: true },
        { text: "wide Road and Land Use" },
        { text: valueOrDash(details.landUse), bold: true, underline: true },
        { text: "has been handed over to the allottee / attorney on" },
        {
          text: possessionDate || "______________",
          bold: true,
          underline: true,
        },
        { text: "as per following details:" },
      ],
      margin,
      69,
      contentWidth,
      { fontSize: 8.25, lineHeightFactor: 1.22 },
    );

    const sidesTop = 86;
    const sideNameX = margin + 6;
    const lengthX = margin + 43;
    const boundedLabelX = margin + 72;
    const boundedValueX = margin + 105;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.2);

    sides.slice(0, 4).forEach((side, index) => {
      const y = sidesTop + index * 6.5;
      doc.text(`${index + 1}.`, margin, y);
      doc.text(valueOrDash(side.label), sideNameX, y);
      doc.text(valueOrDash(side.length), lengthX, y);
      doc.text("Bounded by", boundedLabelX, y);
      doc.text(valueOrDash(side.boundedBy), boundedValueX, y);
    });

    drawPlotSketch(
      doc,
      parcel,
      details,
      sides,
      pageWidth - margin - 37,
      82,
      35,
      31,
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.8);
    doc.text("Total Area:", margin, 119);
    doc.text(valueOrDash(totalArea), margin + 27, 119);
    drawUnderline(doc, margin + 27, margin + 52, 120, 0.2);

    const extraLand =
      details.extraLand || details.excessArea || details.additionalArea;
    doc.text("Extra Land:", margin + 94, 119);
    doc.text(valueOrDash(extraLand), margin + 122, 119);
    drawUnderline(doc, margin + 122, margin + 151, 120, 0.2);

    doc.setFontSize(8.4);
    doc.text("DD Demarcation:", margin, 132);
    drawUnderline(doc, margin + 37, margin + 72, 133, 0.23);

    doc.text("Director Land:", margin + 101, 132);
    drawUnderline(doc, margin + 132, pageWidth - margin, 133, 0.23);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.4);
    doc.text("Terms and Conditions", margin, 147);
    drawUnderline(doc, margin, margin + 42, 148.2, 0.28);

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

    const termsEndY = drawNumberedTerms(doc, terms, margin, 157, contentWidth);

    const takeoverY = Math.min(Math.max(termsEndY + 4, 258), 267);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.9);
    doc.text("POSSESSION TAKEN OVER BY ALLOTTEE / ATTORNEY", margin, takeoverY);

    const firstLineY = takeoverY + 11;
    const secondLineY = takeoverY + 23;

    doc.setFontSize(8.5);
    doc.text("NAME:", margin, firstLineY);
    drawUnderline(doc, margin + 12, margin + 59, firstLineY + 0.8, 0.23);

    doc.text("THUMB & SIGNATURE:", margin + 84, firstLineY);
    drawUnderline(
      doc,
      margin + 128,
      pageWidth - margin,
      firstLineY + 0.8,
      0.23,
    );

    doc.text("CNIC:", margin, secondLineY);
    drawUnderline(doc, margin + 12, margin + 59, secondLineY + 0.8, 0.23);

    doc.text("DATED:", margin + 87, secondLineY);
    drawUnderline(doc, margin + 105, margin + 154, secondLineY + 0.8, 0.23);

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

import { jsPDF } from "jspdf";
import {
  addImageContained,
  buildPlotDetails,
  canvasAsPng,
  createPlanCanvas,
  createPdfPreviewWindow,
  drawUnderlinedValue,
  getCornerCoordinates,
  loadPrintAssets,
  normalizeAreaText,
  openPdfPreview,
  valueOrDash,
  getCircularLogoDataUrl,
} from "./printUtils";

const PRINT_LAYOUT = {
  gopLogoSize: 23,
  rudaLogoSize: 22,
  // Slightly tighter framing for the site-plan drawing. The small left pan
  // keeps the selected plot clear of the location/coordinate overlays.
  mainMapZoom: 1.9,
  mainMapPanX: -110,
  mainMapPanY: 10,
  // A little extra zoom makes the location map easier to read without
  // changing its box size or the surrounding layout.
  insetMapZoom: 3.2,
  insetMapPanX: 0,
  insetMapPanY: 0,
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
const createZoomedCanvas = (sourceCanvas, zoom = 1, panX = 0, panY = 0) => {
  if (!sourceCanvas || typeof document === "undefined") return sourceCanvas;

  const safeZoom = Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = sourceCanvas.width;
  outputCanvas.height = sourceCanvas.height;

  const context = outputCanvas.getContext("2d");
  if (!context) return sourceCanvas;

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, outputCanvas.width, outputCanvas.height);

  context.save();
  context.translate(
    outputCanvas.width / 2 + panX,
    outputCanvas.height / 2 + panY,
  );
  context.scale(safeZoom, safeZoom);
  context.drawImage(
    sourceCanvas,
    -sourceCanvas.width / 2,
    -sourceCanvas.height / 2,
  );
  context.restore();

  return outputCanvas;
};

/* ---------- NEW LAYOUT HELPERS ---------- */

const drawSectionHeader = (doc, x, y, width, title) => {
  const height = 6.5;
  doc.setFillColor(30, 58, 95);
  doc.setDrawColor(30, 58, 95);
  doc.rect(x, y, width, height, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text(title, x + 2.5, y + 4.5);
  doc.setTextColor(15, 15, 15);
  return y + height;
};

const drawSignatureBox = (doc, title, subtitle, x, y, width, height) => {
  doc.setDrawColor(30, 58, 95);
  doc.setLineWidth(0.35);
  doc.rect(x, y, width, height);

  doc.setFillColor(245, 247, 250);
  doc.rect(x, y, width, 8, "F");
  doc.line(x, y + 8, x + width, y + 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 58, 95);
  doc.text(title, x + width / 2, y + 5.5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text(subtitle, x + width / 2, y + 12, { align: "center" });

  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.25);

  const lineX = x + 5;
  const lineEnd = x + width - 5;
  const baseY = y + 18;
  const gap = 5.8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);

  const drawFieldLine = (label, fieldY) => {
    doc.text(label, lineX, fieldY);
    const startX = lineX + doc.getTextWidth(label) + 3;
    doc.line(startX, fieldY + 0.6, lineEnd, fieldY + 0.6);
  };

  drawFieldLine("Name:", baseY);
  drawFieldLine("Designation:", baseY + gap);
  drawFieldLine("Signature:", baseY + gap * 2);
};

const drawCoordinateTable = (doc, coordinates, details, x, y, width) => {
  const rows = coordinates.slice(0, 4);
  const titleHeight = 6;
  const headerHeight = 5.5;
  const rowHeight = 6;
  const totalHeight = titleHeight + headerHeight + rows.length * rowHeight;
  const columns = [11, 27, width - 38];

  doc.setFillColor(255, 255, 255);
  doc.rect(x, y, width, totalHeight, "F");

  doc.setFillColor(30, 58, 95);
  doc.setDrawColor(30, 58, 95);
  doc.rect(x, y, width, titleHeight, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(
    `COORDINATES  —  Plot ${valueOrDash(details.plotNo)}, Block ${valueOrDash(details.block)}`,
    x + width / 2,
    y + 4.2,
    { align: "center" },
  );

  const headerY = y + titleHeight;
  doc.setFillColor(230, 235, 240);
  doc.setDrawColor(180, 180, 180);
  doc.rect(x, headerY, width, headerHeight, "FD");

  doc.setFontSize(7);
  doc.setTextColor(40, 40, 40);
  doc.text("Corner", x + columns[0] / 2, headerY + 3.8, { align: "center" });
  doc.text("Easting (m)", x + columns[0] + columns[1] / 2, headerY + 3.8, {
    align: "center",
  });
  doc.text(
    "Northing (m)",
    x + columns[0] + columns[1] + columns[2] / 2,
    headerY + 3.8,
    { align: "center" },
  );

  let cursor = x;
  columns.slice(0, -1).forEach((columnWidth) => {
    cursor += columnWidth;
    doc.line(cursor, y + titleHeight, cursor, y + totalHeight);
  });

  rows.forEach((coordinate, index) => {
    const rowTop = y + titleHeight + headerHeight + index * rowHeight;
    if (index % 2 === 1) {
      doc.setFillColor(248, 248, 248);
      doc.rect(x, rowTop, width, rowHeight, "F");
    }
    const textY = rowTop + 3.9;
    doc.setFont("times", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(20, 20, 20);
    doc.text(coordinate.label, x + columns[0] / 2, textY, { align: "center" });
    doc.text(
      coordinate.easting.toFixed(3),
      x + columns[0] + columns[1] / 2,
      textY,
      { align: "center" },
    );
    doc.text(
      coordinate.northing.toFixed(3),
      x + columns[0] + columns[1] + columns[2] / 2,
      textY,
      { align: "center" },
    );
  });

  // Draw the complete table grid after the alternating row fills so every
  // separator remains visible (including the B/D row boundaries).
  doc.setDrawColor(175, 175, 175);
  doc.setLineWidth(0.22);
  for (let index = 0; index <= rows.length; index += 1) {
    const lineY = y + titleHeight + headerHeight + index * rowHeight;
    doc.line(x, lineY, x + width, lineY);
  }

  let gridX = x;
  columns.slice(0, -1).forEach((columnWidth) => {
    gridX += columnWidth;
    doc.line(gridX, y + titleHeight, gridX, y + totalHeight);
  });

  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.3);
  doc.rect(x, y, width, totalHeight);
};

/* ---------- MAIN EXPORT ---------- */

export const printSitePlan = async ({
  parcel,
  filters = {},
  contextGeojson,
}) => {
  if (!parcel) {
    alert("Please select a plot first.");
    return;
  }

  const previewWindow = createPdfPreviewWindow("Site Plan");
  if (!previewWindow) return;

  try {
    const details = buildPlotDetails(parcel, filters);
    const { gopLogo, rudaLogo } = await loadPrintAssets();

    const [mainCanvas, insetCanvas] = await Promise.all([
      createPlanCanvas({
        selectedFeature: parcel,
        contextGeojson,
        details,
        mode: "site",
        width: 2100,
        height: 1380,
        selectedFill: "#eba4d8",
        selectedStroke: "#252525",
        watermark: true,
        showDimensions: true,
        showVertexLabels: true,
        showContextLabels: true,
        northArrow: true,
      }),
      createPlanCanvas({
        selectedFeature: parcel,
        contextGeojson,
        details,
        mode: "location",
        width: 1200,
        height: 760,
        selectedFill: "#f000ba",
        selectedStroke: "#17256f",
        watermark: false,
        showDimensions: false,
        showVertexLabels: false,
        showContextLabels: false,
        northArrow: false,
      }),
    ]);

    const zoomedMainCanvas = createZoomedCanvas(
      mainCanvas,
      PRINT_LAYOUT.mainMapZoom,
      PRINT_LAYOUT.mainMapPanX,
      PRINT_LAYOUT.mainMapPanY,
    );
    const zoomedInsetCanvas = createZoomedCanvas(
      insetCanvas,
      PRINT_LAYOUT.insetMapZoom,
      PRINT_LAYOUT.insetMapPanX,
      PRINT_LAYOUT.insetMapPanY,
    );

    const mainImage = canvasAsPng(zoomedMainCanvas);
    const insetImage = canvasAsPng(zoomedInsetCanvas);
    const coordinates = getCornerCoordinates(parcel.geometry).slice(0, 4);

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

    doc.setTextColor(15, 15, 15);
    doc.setDrawColor(85, 85, 85);
    doc.setLineWidth(0.28);

    /* ===== HEADER ===== */
    doc.setFillColor(30, 58, 95);
    doc.rect(0, 0, pageWidth, 1.8, "F");

    if (gopLogo) {
      const cx = margin + 6 + PRINT_LAYOUT.gopLogoSize / 2;
      const cy = 5 + PRINT_LAYOUT.gopLogoSize / 2;
      drawCircularLogo(
        doc,
        gopLogo,
        cx,
        cy,
        PRINT_LAYOUT.gopLogoSize / 2,
        PRINT_LAYOUT.gopLogoSize,
      );
    }
    if (rudaLogo) {
      const cx = rightEdge - PRINT_LAYOUT.rudaLogoSize / 2 - 6;
      const cy = 6 + PRINT_LAYOUT.rudaLogoSize / 2;
      drawCircularLogo(
        doc,
        rudaLogo,
        cx,
        cy,
        PRINT_LAYOUT.rudaLogoSize / 2,
        PRINT_LAYOUT.rudaLogoSize,
      );
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(30, 58, 95);
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

    const badgeW = 42;
    const badgeH = 7.5;
    const badgeX = (pageWidth - badgeW) / 2;
    const badgeY = 23.5;
    doc.setFillColor(30, 58, 95);
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text("OFFICIAL SITE PLAN", pageWidth / 2, badgeY + 5, {
      align: "center",
    });
    doc.setTextColor(15, 15, 15);

    /* ===== PLOT INFORMATION ===== */
    let sectionY = 33;
    sectionY = drawSectionHeader(
      doc,
      margin,
      sectionY,
      contentWidth,
      "PLOT & OWNER INFORMATION",
    );

    const infoTop = sectionY + 1;
    const infoLeft = margin + 2;
    const infoRight = rightEdge - 2;
    const rowWidth = infoRight - infoLeft;
    const colGap = 4;

    // ----- Row 1: File Reference No (left) + Date (right, ends at infoRight) -----
    const dateLabelX = infoLeft + rowWidth * 0.72;
    drawUnderlinedValue(
      doc,
      "File Reference No:",
      details.fileReference,
      infoLeft,
      infoTop + 5,
      36,
      dateLabelX - colGap - (infoLeft + 36),
      { fontSize: 8.5 },
    );
    drawUnderlinedValue(
      doc,
      "Date:",
      details.documentDate,
      dateLabelX,
      infoTop + 5,
      13,
      infoRight - (dateLabelX + 13),
      { fontSize: 8.5 },
    );

    // ----- Row 2: Name of Owner (full width, ends at infoRight) -----
    drawUnderlinedValue(
      doc,
      "Name of Owner:",
      details.owner,
      infoLeft,
      infoTop + 14,
      30,
      infoRight - (infoLeft + 30),
      { fontSize: 8.5 },
    );

    // ----- Row 3: Plot No / Street-Road No / Block / Phase — 4 equal columns -----
    const row3Cols = 4;
    const row3ColWidth = rowWidth / row3Cols;
    const row3X = [0, 1, 2, 3].map((i) => infoLeft + row3ColWidth * i);
    const row3End = [
      row3X[1] - colGap,
      row3X[2] - colGap,
      row3X[3] - colGap,
      infoRight,
    ];

    drawUnderlinedValue(
      doc,
      "Plot No:",
      details.plotNo,
      row3X[0],
      infoTop + 23,
      15,
      row3End[0] - (row3X[0] + 15),
      { fontSize: 8.5 },
    );
    drawUnderlinedValue(
      doc,
      "Street/Road No:",
      details.streetRoadNo || details.roadFt,
      row3X[1],
      infoTop + 23,
      27,
      row3End[1] - (row3X[1] + 27),
      { fontSize: 8.5 },
    );
    drawUnderlinedValue(
      doc,
      "Block:",
      details.block,
      row3X[2],
      infoTop + 23,
      13,
      row3End[2] - (row3X[2] + 13),
      { fontSize: 8.5 },
    );
    drawUnderlinedValue(
      doc,
      "Phase:",
      details.phase,
      row3X[3],
      infoTop + 23,
      13,
      row3End[3] - (row3X[3] + 13),
      { fontSize: 8.5 },
    );

    // ----- Row 4: Plot Size / Plot Category — 2 equal columns -----
    const row4ColWidth = rowWidth / 2;
    const row4X = [infoLeft, infoLeft + row4ColWidth];
    const row4End = [row4X[1] - colGap, infoRight];

    drawUnderlinedValue(
      doc,
      "Plot Size:",
      details.plotSize || normalizeAreaText(details),
      row4X[0],
      infoTop + 32,
      20,
      row4End[0] - (row4X[0] + 20),
      { fontSize: 8.5 },
    );
    drawUnderlinedValue(
      doc,
      "Plot Category:",
      details.plotCategory,
      row4X[1],
      infoTop + 32,
      26,
      row4End[1] - (row4X[1] + 26),
      { fontSize: 8.5 },
    );
    // Note box
    const noteY = infoTop + 38.5;
    doc.setFillColor(255, 245, 245);
    doc.setDrawColor(198, 40, 40);
    doc.setLineWidth(0.3);
    doc.rect(margin + 1, noteY, contentWidth - 2, 6, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(198, 40, 40);
    doc.text(
      "IMPORTANT: This document is valid for six (06) months from the date of issue. Any alteration renders it invalid.",
      pageWidth / 2,
      noteY + 4.2,
      { align: "center" },
    );
    doc.setTextColor(15, 15, 15);

    const infoBottom = noteY + 9;

    /* ===== SITE PLAN DRAWING ===== */
    const planTop = infoBottom + 1;
    const planHeight = 116;
    sectionY = drawSectionHeader(
      doc,
      margin,
      planTop,
      contentWidth,
      "SITE PLAN DRAWING",
    );

    doc.setDrawColor(160, 160, 160);
    doc.setLineWidth(0.3);
    doc.rect(margin, sectionY, contentWidth, planHeight - 6.5);

    if (mainImage) {
      addImageContained(
        doc,
        mainImage.dataUrl,
        mainImage.width,
        mainImage.height,
        margin + 2,
        sectionY + 2,
        contentWidth - 4,
        planHeight - 10.5,
      );
    }

    if (insetImage) {
      const insetW = 50;
      const insetH = 36;
      const insetX = rightEdge - insetW - 5;
      const insetY = sectionY + 4;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(30, 58, 95);
      doc.setLineWidth(0.5);
      doc.rect(insetX, insetY, insetW, insetH, "FD");

      doc.setFillColor(30, 58, 95);
      doc.rect(insetX, insetY, insetW, 5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text("LOCATION MAP", insetX + insetW / 2, insetY + 3.5, {
        align: "center",
      });
      doc.setTextColor(15, 15, 15);

      addImageContained(
        doc,
        insetImage.dataUrl,
        insetImage.width,
        insetImage.height,
        insetX + 1,
        insetY + 6,
        insetW - 2,
        insetH - 7,
      );
    }

    drawCoordinateTable(
      doc,
      coordinates,
      details,
      rightEdge - 70,
      sectionY + planHeight - 42,
      67,
    );

    const planBottom = planTop + planHeight;

    /* ===== CERTIFICATION ===== */
    const certTop = planBottom + 2;
    sectionY = drawSectionHeader(
      doc,
      margin,
      certTop,
      contentWidth,
      "OFFICIAL CERTIFICATION",
    );

    const boxW = (contentWidth - 5) / 3;
    const signatureBoxY = sectionY + 1;
    const signatureBoxHeight = 32;

    drawSignatureBox(
      doc,
      "PREPARED BY",
      "Land Surveyor",
      margin + 1,
      signatureBoxY,
      boxW,
      signatureBoxHeight,
    );
    drawSignatureBox(
      doc,
      "CHECKED BY",
      "DD Demarcation",
      margin + 2 + boxW,
      signatureBoxY,
      boxW,
      signatureBoxHeight,
    );
    drawSignatureBox(
      doc,
      "APPROVED BY",
      "DD GIS / Director",
      margin + 3 + boxW * 2,
      signatureBoxY,
      boxW,
      signatureBoxHeight,
    );

    const certBottom = signatureBoxY + signatureBoxHeight;

    /* ===== HANDOVER ===== */
    // Keep a small visual gap below the certification boxes.
    const handTop = certBottom + 3;
    const handHeight = 28;
    sectionY = drawSectionHeader(
      doc,
      margin,
      handTop,
      contentWidth,
      "DOCUMENT HANDOVER ACKNOWLEDGEMENT",
    );

    const handY = sectionY + 4;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    doc.text(
      "I hereby acknowledge that I have received the original Site Plan for the above-mentioned plot from RUDA.",
      margin + 3,
      handY,
    );
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 15, 15);

    const row1Y = handY + 7;
    const halfW = contentWidth / 2;
    const stampW = 28;
    const stampH = 16;
    const stampX = rightEdge - stampW - 4;
    const stampY = handY + 2;
    const rightFieldEnd = stampX - 4;

    // Move the CNIC / Mobile column slightly left for better balance.
    const rightLabelX = margin + halfW - 1;
    const rightValueX = margin + halfW + 18;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 58, 95);
    doc.text("Handed To:", margin + 3, row1Y);
    doc.text("CNIC No:", rightLabelX, row1Y);
    doc.setTextColor(15, 15, 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(valueOrDash(details.owner), margin + 22, row1Y);
    doc.text(valueOrDash(details.cnic), rightValueX, row1Y);
    doc.setDrawColor(120, 120, 120);
    doc.setLineWidth(0.25);
    doc.line(margin + 22, row1Y + 0.8, margin + halfW - 5, row1Y + 0.8);
    doc.line(rightValueX, row1Y + 0.8, rightFieldEnd, row1Y + 0.8);

    // Date is now on the second row (where Recipient Signature used to be).
    const row2Y = row1Y + 7;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 95);
    doc.text("Date:", margin + 3, row2Y);
    doc.text("Mobile No:", rightLabelX, row2Y);
    doc.setTextColor(15, 15, 15);
    doc.line(margin + 14, row2Y + 0.8, margin + halfW - 5, row2Y + 0.8);
    doc.line(rightValueX, row2Y + 0.8, rightFieldEnd, row2Y + 0.8);

    // Recipient Signature is now on the third row (where Date used to be).
    const row3Y = row2Y + 7;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 95);
    doc.text("Recipient Signature:", margin + 3, row3Y);
    doc.setTextColor(15, 15, 15);
    doc.line(margin + 32, row3Y + 0.8, margin + halfW - 5, row3Y + 0.8);

    // Keep the stamp in its own reserved area so it never overlaps CNIC/mobile.
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.setLineDashPattern([2, 2], 0);
    doc.rect(stampX, stampY, stampW, stampH);
    doc.setLineDashPattern([], 0);
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text("Official Stamp", stampX + stampW / 2, stampY + 9, {
      align: "center",
    });

    /* ===== FOOTER ===== */
    doc.setDrawColor(30, 58, 95);
    doc.setLineWidth(0.5);
    doc.line(margin, 286, rightEdge, 286);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Generated: ${new Date().toLocaleDateString("en-GB")} | RUDA Site Plan System | This is a computer-generated document.`,
      pageWidth / 2,
      290,
      { align: "center" },
    );

    openPdfPreview(
      doc,
      `Site Plan - Plot ${details.plotNo || ""}`,
      previewWindow,
    );
  } catch (error) {
    previewWindow.close();
    console.error("Site plan generation failed", error);
    alert(
      "Failed to generate the site plan. Please check the selected plot data and try again.",
    );
  }
};

export default printSitePlan;

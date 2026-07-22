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
} from "./printUtils";

// Easy print-layout controls. Adjust these values whenever you need more or less zoom.
const PRINT_LAYOUT = {
  gopLogoSize: 23,
  rudaLogoSize: 22,

  // 1 = original size, values greater than 1 zoom in.
  mainMapZoom: 1.7,
  mainMapPanX: 0,
  mainMapPanY: 20,

  insetMapZoom: 1.3,
  insetMapPanX: 0,
  insetMapPanY: 0,
};

/**
 * Zooms and repositions an already-rendered plan canvas without requiring
 * any change inside printUtils/createPlanCanvas. Pan values are in pixels.
 */
const createZoomedCanvas = (sourceCanvas, zoom = 1, panX = 0, panY = 0) => {
  if (!sourceCanvas || typeof document === "undefined") return sourceCanvas;

  const safeZoom = Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = sourceCanvas.width;
  outputCanvas.height = sourceCanvas.height;

  const context = outputCanvas.getContext("2d");
  if (!context) return sourceCanvas;

  // Keep any cropped area white so the PDF background remains clean.
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

const drawCoordinateTable = (doc, coordinates, details, x, y, width) => {
  const rows = coordinates.slice(0, 4);
  const titleHeight = 5;
  const headerHeight = 5;
  const rowHeight = 5;
  const totalHeight = titleHeight + headerHeight + rows.length * rowHeight;
  const columns = [10, 27, width - 37];

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(105, 105, 105);
  doc.setLineWidth(0.2);
  doc.rect(x, y, width, totalHeight, "FD");

  doc.setFont("times", "bold");
  doc.setFontSize(7.2);
  doc.text(
    `Plot ${details.plotNo || ""}, Block ${details.block || ""}`,
    x + width / 2,
    y + 3.6,
    {
      align: "center",
    },
  );
  doc.line(x, y + titleHeight, x + width, y + titleHeight);

  let cursor = x;
  columns.slice(0, -1).forEach((columnWidth) => {
    cursor += columnWidth;
    doc.line(cursor, y + titleHeight, cursor, y + totalHeight);
  });

  doc.setFontSize(6.5);
  doc.text("Name", x + columns[0] / 2, y + titleHeight + 3.5, {
    align: "center",
  });
  doc.text(
    "Easting (m)",
    x + columns[0] + columns[1] / 2,
    y + titleHeight + 3.5,
    {
      align: "center",
    },
  );
  doc.text(
    "Northing (m)",
    x + columns[0] + columns[1] + columns[2] / 2,
    y + titleHeight + 3.5,
    { align: "center" },
  );
  doc.line(
    x,
    y + titleHeight + headerHeight,
    x + width,
    y + titleHeight + headerHeight,
  );

  rows.forEach((coordinate, index) => {
    const rowTop = y + titleHeight + headerHeight + index * rowHeight;
    const textY = rowTop + 3.55;
    doc.setFont("times", "normal");
    doc.setFontSize(6.6);
    doc.text(coordinate.label, x + columns[0] / 2, textY, { align: "center" });
    doc.text(
      coordinate.easting.toFixed(3),
      x + columns[0] + columns[1] / 2,
      textY,
      {
        align: "center",
      },
    );
    doc.text(
      coordinate.northing.toFixed(3),
      x + columns[0] + columns[1] + columns[2] / 2,
      textY,
      { align: "center" },
    );
    doc.line(x, rowTop + rowHeight, x + width, rowTop + rowHeight);
  });
};

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
    const margin = 11;
    const contentWidth = pageWidth - margin * 2;

    doc.setTextColor(15, 15, 15);
    doc.setDrawColor(85, 85, 85);
    doc.setLineWidth(0.28);

    // Header matching the approved paper site-plan format.
    if (gopLogo) {
      doc.addImage(
        gopLogo,
        "PNG",
        margin + 9,
        6,
        PRINT_LAYOUT.gopLogoSize,
        PRINT_LAYOUT.gopLogoSize,
        undefined,
        "FAST",
      );
    }
    if (rudaLogo) {
      doc.addImage(
        rudaLogo,
        "PNG",
        pageWidth - margin - PRINT_LAYOUT.rudaLogoSize - 8,
        7,
        PRINT_LAYOUT.rudaLogoSize,
        PRINT_LAYOUT.rudaLogoSize,
        undefined,
        "FAST",
      );
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15.5);
    doc.text("RAVI URBAN DEVELOPMENT AUTHORITY", pageWidth / 2, 12.5, {
      align: "center",
    });
    doc.setFontSize(14.2);
    doc.text(
      valueOrDash(details.project, "CHAHAR BAGH PHASE-1").toUpperCase(),
      pageWidth / 2,
      20.5,
      { align: "center" },
    );
    doc.setFontSize(14.5);
    doc.text("SITE PLAN", pageWidth / 2, 28.5, { align: "center" });

    const infoTop = 34;
    const infoHeight = 48;
    doc.rect(margin, infoTop, contentWidth, infoHeight);

    drawUnderlinedValue(
      doc,
      "Date:",
      details.documentDate,
      pageWidth - margin - 50,
      infoTop + 7,
      13,
      31,
      { fontSize: 8.8 },
    );

    drawUnderlinedValue(
      doc,
      "File Reference No:",
      details.fileReference,
      margin + 5,
      infoTop + 17,
      36,
      46,
      { fontSize: 8.8 },
    );
    drawUnderlinedValue(
      doc,
      "Name of Owner:",
      details.owner,
      margin + 91,
      infoTop + 17,
      34,
      52,
      { fontSize: 8.8 },
    );

    drawUnderlinedValue(
      doc,
      "Plot No:",
      details.plotNo,
      margin + 5,
      infoTop + 29,
      18,
      19,
      {
        fontSize: 8.8,
      },
    );
    drawUnderlinedValue(
      doc,
      "St/Road No:",
      details.streetRoadNo || details.roadFt,
      margin + 45,
      infoTop + 29,
      24,
      27,
      { fontSize: 8.8 },
    );
    drawUnderlinedValue(
      doc,
      "Block:",
      details.block,
      margin + 101,
      infoTop + 29,
      15,
      18,
      {
        fontSize: 8.8,
      },
    );
    drawUnderlinedValue(
      doc,
      "Phase:",
      details.phase,
      margin + 145,
      infoTop + 29,
      15,
      20,
      {
        fontSize: 8.8,
      },
    );

    drawUnderlinedValue(
      doc,
      "Plot Size:",
      details.plotSize || normalizeAreaText(details),
      margin + 5,
      infoTop + 40,
      20,
      32,
      { fontSize: 8.8 },
    );
    drawUnderlinedValue(
      doc,
      "Plot Category:",
      details.plotCategory,
      margin + 92,
      infoTop + 40,
      30,
      54,
      { fontSize: 8.8 },
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.6);
    doc.setTextColor(196, 50, 43);
    doc.text("Note:", pageWidth / 2 - 31, infoTop + 46, { align: "right" });
    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "normal");
    doc.text(
      "(This document is valid for six (06) months)",
      pageWidth / 2 - 29,
      infoTop + 46,
    );

    // Large, readable plot drawing area.
    const planTop = infoTop + infoHeight;
    const planHeight = 137;
    doc.rect(margin, planTop, contentWidth, planHeight);

    if (mainImage) {
      addImageContained(
        doc,
        mainImage.dataUrl,
        mainImage.width,
        mainImage.height,
        margin + 3,
        planTop + 3,
        contentWidth - 6,
        planHeight - 6,
      );
    }

    // Full-scheme inset in the upper-right, without plot-number clutter.
    if (insetImage) {
      const insetWidth = 50;
      const insetHeight = 36;
      const insetX = pageWidth - margin - insetWidth - 4;
      const insetY = planTop + 5;
      doc.setFillColor(255, 255, 255);
      doc.setLineWidth(0.35);
      doc.rect(insetX, insetY, insetWidth, insetHeight, "FD");
      addImageContained(
        doc,
        insetImage.dataUrl,
        insetImage.width,
        insetImage.height,
        insetX + 1,
        insetY + 1,
        insetWidth - 2,
        insetHeight - 2,
      );
    }

    drawCoordinateTable(
      doc,
      coordinates,
      details,
      pageWidth - margin - 69,
      planTop + planHeight - 35,
      65,
    );

    // Approval/signature section aligned to the supplied official site plan.
    const approvalTop = planTop + planHeight;
    const approvalHeight = 50;
    doc.rect(margin, approvalTop, contentWidth, approvalHeight);

    const leftLabelX = margin + 8;
    const leftLineX = margin + 52;
    const leftLineEnd = margin + 104;
    const rightLabelX = margin + 111;
    const rightLineX = margin + 151;
    const rightLineEnd = pageWidth - margin - 7;

    const drawApprovalField = (label, value, labelX, lineX, lineEnd, y) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.2);
      doc.setTextColor(15, 15, 15);
      doc.text(label, labelX, y);
      doc.setLineWidth(0.28);
      doc.line(lineX, y + 0.8, lineEnd, y + 0.8);

      if (value) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.8);
        const maxWidth = lineEnd - lineX - 2;
        const fitted =
          doc.getTextWidth(String(value)) <= maxWidth
            ? String(value)
            : `${String(value).slice(0, 25)}...`;
        doc.text(fitted, lineX + 1, y - 0.5);
      }
    };

    drawApprovalField(
      "Land Surveyor-1",
      "",
      leftLabelX,
      leftLineX,
      leftLineEnd,
      approvalTop + 12,
    );
    drawApprovalField(
      "DD Demarcation",
      "",
      rightLabelX,
      rightLineX,
      rightLineEnd,
      approvalTop + 12,
    );
    drawApprovalField(
      "DD GIS",
      "",
      leftLabelX,
      leftLineX,
      leftLineEnd,
      approvalTop + 25,
    );

    drawApprovalField(
      "Site Plan Handed to:",
      details.owner,
      leftLabelX,
      margin + 62,
      margin + 112,
      approvalTop + 40,
    );
    drawApprovalField(
      "CNIC No:",
      details.cnic,
      margin + 116,
      margin + 138,
      rightLineEnd,
      approvalTop + 40,
    );

    const handoverTop = approvalTop + approvalHeight;
    const handoverHeight = 20;
    doc.rect(margin, handoverTop, contentWidth, handoverHeight);

    drawApprovalField(
      "Signature:",
      "",
      leftLabelX,
      margin + 32,
      leftLineEnd,
      handoverTop + 12,
    );
    drawApprovalField(
      "Mobile No:",
      "",
      margin + 116,
      margin + 143,
      rightLineEnd,
      handoverTop + 12,
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

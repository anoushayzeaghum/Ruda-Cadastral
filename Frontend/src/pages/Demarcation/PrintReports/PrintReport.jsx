import { jsPDF } from "jspdf";
import {
  addImageContained,
  buildPlotDetails,
  canvasAsPng,
  captureDemarcationMap,
  createPdfPreviewWindow,
  createPlanCanvas,
  getCircularLogoDataUrl,
  getCornerCoordinates,
  loadPrintAssets,
  openPdfPreview,
  valueOrDash,
} from "./printUtils";

const NAVY = [30, 58, 95];

const drawCircularLogo = (doc, image, cx, cy, logoSize) => {
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

const formatGeneratedDate = (date = new Date()) => {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const printableValue = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

// Slightly zoom the generated plot snapshot while keeping the same output size.
// This makes the selected plot and surrounding plot labels easier to read without
// changing the report layout or any other report section.
const zoomSnapshotCanvas = (sourceCanvas, zoom = 1.26) => {
  if (!sourceCanvas || zoom <= 1) return sourceCanvas;

  const zoomedCanvas = document.createElement("canvas");
  zoomedCanvas.width = sourceCanvas.width;
  zoomedCanvas.height = sourceCanvas.height;

  const ctx = zoomedCanvas.getContext("2d");
  if (!ctx) return sourceCanvas;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, zoomedCanvas.width, zoomedCanvas.height);

  const cropWidth = sourceCanvas.width / zoom;
  const cropHeight = sourceCanvas.height / zoom;
  const cropX = (sourceCanvas.width - cropWidth) / 2;
  const cropY = (sourceCanvas.height - cropHeight) / 2;

  ctx.drawImage(
    sourceCanvas,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    zoomedCanvas.width,
    zoomedCanvas.height,
  );

  return zoomedCanvas;
};

export const printReport = async ({ parcel, filters = {}, contextGeojson }) => {
  if (!parcel) {
    alert("Please select a plot first.");
    return;
  }

  const previewWindow = createPdfPreviewWindow("Plot Demarcation Report");
  if (!previewWindow) return;

  try {
    const details = buildPlotDetails(parcel, filters);
    const { gopLogo, rudaLogo } = await loadPrintAssets();
    const cornerCoords = getCornerCoordinates(parcel.geometry);

    // Build a dedicated square-ish plot snapshot instead of capturing the
    // current map viewport. This keeps the selected plot centered, highlighted,
    // and surrounded by its nearest plots regardless of the user's map zoom.
    let mapCapture = null;
    try {
      const snapshotCanvas = await createPlanCanvas({
        selectedFeature: parcel,
        contextGeojson,
        details,
        mode: "site",
        width: 1200,
        height: 1200,
        selectedFill: "#f4a7dc",
        selectedStroke: "#7b1f63",
        watermark: false,
        showDimensions: false,
        showVertexLabels: false,
        showContextLabels: true,
        northArrow: true,
      });

      // Apply a small centered zoom so plot 183 and the neighbouring plot
      // numbers are visibly larger in the final PDF snapshot.
      const zoomedSnapshotCanvas = zoomSnapshotCanvas(snapshotCanvas);
      mapCapture = canvasAsPng(zoomedSnapshotCanvas);
    } catch (snapshotError) {
      console.warn("Dedicated plot snapshot generation failed", snapshotError);
    }

    // Preserve the previous behavior as a safe fallback.
    if (!mapCapture) {
      mapCapture = await captureDemarcationMap();
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 8;
    const contentWidth = pageWidth - marginX * 2;
    const rightEdge = pageWidth - marginX;

    doc.setDrawColor(120, 120, 120);
    doc.setLineWidth(0.25);

    const drawSectionHeader = (x, rowY, width, height, title) => {
      doc.setFillColor(...NAVY);
      doc.setDrawColor(...NAVY);
      doc.rect(x, rowY, width, height, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.2);
      doc.setTextColor(255, 255, 255);
      doc.text(String(title).toUpperCase(), x + 2, rowY + height - 2.1);
    };

    const drawSimpleCell = (
      x,
      rowY,
      width,
      height,
      text,
      align = "left",
      isHeader = false,
    ) => {
      if (isHeader) {
        doc.setFillColor(230, 235, 240);
        doc.rect(x, rowY, width, height, "FD");
      } else {
        doc.rect(x, rowY, width, height);
      }

      doc.setFont("helvetica", isHeader ? "bold" : "normal");
      doc.setFontSize(isHeader ? 7.1 : 7.2);
      doc.setTextColor(
        isHeader ? 30 : 35,
        isHeader ? 58 : 35,
        isHeader ? 95 : 35,
      );

      const value = printableValue(text) || "-";
      const lines = doc.splitTextToSize(value, width - 3);
      doc.text(
        lines.slice(0, 1),
        align === "center" ? x + width / 2 : x + 1.5,
        rowY + height / 2 + 1.2,
        align === "center" ? { align: "center" } : undefined,
      );
    };

    /* ===== HEADER ===== */
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, pageWidth, 1.8, "F");

    const logoSizeLeft = 23;
    const logoSizeRight = 22;

    if (gopLogo) {
      drawCircularLogo(
        doc,
        gopLogo,
        marginX + 5 + logoSizeLeft / 2,
        5 + logoSizeLeft / 2,
        logoSizeLeft,
      );
    }

    if (rudaLogo) {
      drawCircularLogo(
        doc,
        rudaLogo,
        rightEdge - 5 - logoSizeRight / 2,
        5.5 + logoSizeRight / 2,
        logoSizeRight,
      );
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(...NAVY);
    doc.text("RAVI URBAN DEVELOPMENT AUTHORITY", pageWidth / 2, 10.5, {
      align: "center",
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("Government of Punjab", pageWidth / 2, 15.2, {
      align: "center",
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(25, 25, 25);
    doc.text(
      valueOrDash(details.project, "PROJECT").toUpperCase(),
      pageWidth / 2,
      20.3,
      { align: "center" },
    );

    const badgeWidth = 60;
    const badgeHeight = 7.5;
    const badgeX = (pageWidth - badgeWidth) / 2;
    const badgeY = 23.2;
    doc.setFillColor(...NAVY);
    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.3);
    doc.setTextColor(255, 255, 255);
    doc.text("PLOT DEMARCATION REPORT", pageWidth / 2, badgeY + 5, {
      align: "center",
    });

    /* ===== PLOT BOUNDARY DETAILS ===== */
    let y = 35;
    const sectionHeaderHeight = 7;
    drawSectionHeader(
      marginX,
      y,
      contentWidth,
      sectionHeaderHeight,
      "Plot Boundary Details",
    );
    y += sectionHeaderHeight;

    const detailLabelWidth = 30;
    const detailValueWidth = contentWidth / 2 - detailLabelWidth;
    const detailRowHeight = 8;

    const drawTableCell = ({
      x,
      rowY,
      width,
      height,
      text,
      isLabel = false,
    }) => {
      doc.rect(x, rowY, width, height);
      doc.setFont("helvetica", isLabel ? "bold" : "normal");
      doc.setTextColor(isLabel ? 30 : 35, isLabel ? 58 : 35, isLabel ? 95 : 35);

      const value = printableValue(text);
      if (!value) return;

      let fontSize = isLabel ? 7.4 : 7.2;
      const minFontSize = isLabel ? 6.2 : 5.8;
      doc.setFontSize(fontSize);
      while (doc.getTextWidth(value) > width - 3 && fontSize > minFontSize) {
        fontSize -= 0.2;
        doc.setFontSize(fontSize);
      }

      let displayText = value;
      if (doc.getTextWidth(displayText) > width - 3) {
        while (
          displayText.length > 1 &&
          doc.getTextWidth(`${displayText}...`) > width - 3
        ) {
          displayText = displayText.slice(0, -1);
        }
        displayText = `${displayText}...`;
      }

      doc.text(displayText, x + 1.5, rowY + height / 2 + 1.1);
    };

    const drawDetailRow = (leftLabel, leftValue, rightLabel, rightValue) => {
      drawTableCell({
        x: marginX,
        rowY: y,
        width: detailLabelWidth,
        height: detailRowHeight,
        text: leftLabel,
        isLabel: true,
      });
      drawTableCell({
        x: marginX + detailLabelWidth,
        rowY: y,
        width: detailValueWidth,
        height: detailRowHeight,
        text: leftValue,
      });
      drawTableCell({
        x: marginX + detailLabelWidth + detailValueWidth,
        rowY: y,
        width: detailLabelWidth,
        height: detailRowHeight,
        text: rightLabel,
        isLabel: true,
      });
      drawTableCell({
        x: marginX + detailLabelWidth * 2 + detailValueWidth,
        rowY: y,
        width: detailValueWidth,
        height: detailRowHeight,
        text: rightValue,
      });
      y += detailRowHeight;
    };

    // These fields map directly to the Plot model / PlotSerializer values.
    drawDetailRow("Project", details.project, "Block", details.block);
    drawDetailRow("Plot No.", details.plotNo, "Land Use", details.landUse);
    drawDetailRow(
      "Plot Area",
      details.plotArea,
      "Dimension",
      details.dimension,
    );
    drawDetailRow("Road Ft", details.roadFt, "Road Facing", details.roadFacing);
    drawDetailRow("Park Front", details.parkFront, "Storey", details.storey);
    drawDetailRow(
      "Possession",
      details.possession,
      "Poss. Status",
      details.possessionStatus,
    );
    drawDetailRow("Canceled", details.canceled, "Site Plan", details.sitePlan);
    drawDetailRow(
      "Unique ID",
      details.uniqueId,
      "TR Sr No",
      details.transferSrNo,
    );
    drawDetailRow(
      "TR Plot No",
      details.transferPlotNo,
      "TR Category",
      details.transferCategory,
    );
    drawDetailRow("Owner", details.owner, "Remarks", details.remarks);

    /* ===== SNAPSHOT + COORDINATES ===== */
    y += 4; // requested visual gap between the two main report sections

    const leftWidth = contentWidth / 2;
    const rightWidth = contentWidth - leftWidth;
    const lowerHeaderHeight = 7;
    const lowerBodyHeight = 97;

    drawSectionHeader(
      marginX,
      y,
      leftWidth,
      lowerHeaderHeight,
      "Selected Plot Snapshot",
    );
    drawSectionHeader(
      marginX + leftWidth,
      y,
      rightWidth,
      lowerHeaderHeight,
      "Demarcation Coordinates",
    );
    y += lowerHeaderHeight;

    doc.setDrawColor(120, 120, 120);
    doc.rect(marginX, y, leftWidth, lowerBodyHeight);
    doc.rect(marginX + leftWidth, y, rightWidth, lowerBodyHeight);

    if (mapCapture) {
      addImageContained(
        doc,
        mapCapture.dataUrl,
        mapCapture.width,
        mapCapture.height,
        marginX + 1.4,
        y + 1.4,
        leftWidth - 2.8,
        lowerBodyHeight - 2.8,
      );
    } else {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(110, 110, 110);
      doc.text(
        "Plot snapshot is not available.",
        marginX + leftWidth / 2,
        y + lowerBodyHeight / 2,
        { align: "center" },
      );
    }

    const coordinateX = marginX + leftWidth;
    let coordinateY = y;
    const coordinateRowHeight = 7;

    const pointColumn = 13;
    const eastingColumn = 34;
    const northingColumn = rightWidth - pointColumn - eastingColumn;

    const drawCoordinateRow = (
      rowY,
      point,
      easting,
      northing,
      isHeader = false,
    ) => {
      drawSimpleCell(
        coordinateX,
        rowY,
        pointColumn,
        coordinateRowHeight,
        point,
        "center",
        isHeader,
      );
      drawSimpleCell(
        coordinateX + pointColumn,
        rowY,
        eastingColumn,
        coordinateRowHeight,
        easting,
        "left",
        isHeader,
      );
      drawSimpleCell(
        coordinateX + pointColumn + eastingColumn,
        rowY,
        northingColumn,
        coordinateRowHeight,
        northing,
        "left",
        isHeader,
      );
    };

    drawCoordinateRow(
      coordinateY,
      "Point",
      "Easting (m)",
      "Northing (m)",
      true,
    );
    coordinateY += coordinateRowHeight;

    cornerCoords.slice(0, 8).forEach((item) => {
      drawCoordinateRow(
        coordinateY,
        item.label,
        Number.isFinite(item.easting) ? item.easting.toFixed(3) : "-",
        Number.isFinite(item.northing) ? item.northing.toFixed(3) : "-",
      );
      coordinateY += coordinateRowHeight;
    });

    // Additional coordinate metadata requested by the user.
    const crsGap = 3;
    const crsHeaderHeight = 6.5;
    const crsRowHeight = 6;
    const lowerBodyBottom = y + lowerBodyHeight;
    const crsRows = 4;
    const crsBlockHeight = crsHeaderHeight + crsRows * crsRowHeight;
    let crsY = coordinateY + crsGap;

    // If an unusually complex plot has many vertices, keep the CRS block inside
    // the available panel rather than letting it overlap the outer border.
    crsY = Math.min(crsY, lowerBodyBottom - crsBlockHeight - 1);

    drawSectionHeader(
      coordinateX + 1,
      crsY,
      rightWidth - 2,
      crsHeaderHeight,
      "Coordinate Reference System",
    );

    const zone = cornerCoords.find((item) => Number.isFinite(item.zone))?.zone;
    const firstLat = cornerCoords.find((item) =>
      Number.isFinite(item.lat),
    )?.lat;
    const hemisphere = Number.isFinite(firstLat) && firstLat < 0 ? "S" : "N";
    const utmEpsg = zone
      ? `${hemisphere === "N" ? 32600 + zone : 32700 + zone}`
      : "";

    const drawCrsRow = (label, value, rowIndex) => {
      const rowTop = crsY + crsHeaderHeight + rowIndex * crsRowHeight;
      const labelWidth = 29;
      drawSimpleCell(
        coordinateX + 1,
        rowTop,
        labelWidth,
        crsRowHeight,
        label,
        "left",
        true,
      );
      drawSimpleCell(
        coordinateX + 1 + labelWidth,
        rowTop,
        rightWidth - 2 - labelWidth,
        crsRowHeight,
        value,
      );
    };

    drawCrsRow("Datum", "WGS 1984", 0);
    drawCrsRow("Source CRS", "WGS 84 (EPSG:4326)", 1);
    drawCrsRow(
      "Grid CRS",
      zone
        ? `UTM Zone ${zone}${hemisphere}${utmEpsg ? ` (EPSG:${utmEpsg})` : ""}`
        : "UTM",
      2,
    );
    drawCrsRow("Units", "Metres", 3);

    y += lowerBodyHeight + 4;

    /* ===== DISCLAIMER ===== */
    const disclaimerHeaderHeight = 7;
    const disclaimerBodyHeight = 15;
    drawSectionHeader(
      marginX,
      y,
      contentWidth,
      disclaimerHeaderHeight,
      "Disclaimer",
    );
    y += disclaimerHeaderHeight;

    doc.rect(marginX, y, contentWidth, disclaimerBodyHeight);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.8);
    doc.setTextColor(35, 35, 35);
    doc.text(
      doc.splitTextToSize(
        "This plot demarcation report is generated from plot boundary data and is subject to field verification, official record validation, and applicable RUDA rules and regulations.",
        contentWidth - 4,
      ),
      marginX + 2,
      y + 5,
    );

    /* ===== FOOTER ===== */
    const footerLineY = pageHeight - 13;
    const footerTextY = pageHeight - 8.5;
    doc.setDrawColor(...NAVY);
    doc.setLineWidth(0.5);
    doc.line(marginX, footerLineY, rightEdge, footerLineY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.3);
    doc.setTextColor(90, 90, 90);
    doc.text(
      `Generated: ${formatGeneratedDate()} | RUDA Site Plan System | This is a computer-generated document`,
      pageWidth / 2,
      footerTextY,
      { align: "center" },
    );

    openPdfPreview(
      doc,
      `Plot Demarcation Report - Plot ${details.plotNo || ""}`,
      previewWindow,
    );
  } catch (error) {
    previewWindow.close();
    console.error("Print report failed", error);
    alert("Failed to generate the demarcation report. Please try again.");
  }
};

export default printReport;

import { jsPDF } from "jspdf";
import {
  addImageContained,
  buildPlotDetails,
  captureDemarcationMap,
  createPdfPreviewWindow,
  getCornerCoordinates,
  loadPrintAssets,
  openPdfPreview,
  valueOrDash,
  canvasAsPng,         
  createPlanCanvas,
} from "./printUtils";

export const printReport = async ({ parcel, filters = {}, contextGeojson }) => {
  if (!parcel) {
    alert("Please select a plot first.");
    return;
  }

  const previewWindow = createPdfPreviewWindow("Plot Demarcation Report");
  if (!previewWindow) return;

  try {
    const details = buildPlotDetails(parcel, filters);
    const mapCapture = await captureDemarcationMap();
    const { gopLogo, rudaLogo } = await loadPrintAssets();
    const cornerCoords = getCornerCoordinates(parcel.geometry);

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 8;
    const contentWidth = pageWidth - marginX * 2;
    let y = 8;

    /* THEME: top navy bar (same position as site plan, does not shift anything) */
    doc.setFillColor(30, 58, 95);
    doc.rect(0, 0, pageWidth, 1.8, "F");

    const drawSectionHeader = (x, rowY, width, height, title) => {
      doc.setFillColor(30, 58, 95);
      doc.setDrawColor(30, 58, 95);
      doc.rect(x, rowY, width, height, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(255, 255, 255);
      doc.text(String(title).toUpperCase(), x + 2, rowY + height - 2.2);
    };

    const drawSimpleCell = (x, rowY, width, height, text, align = "left", isHeader = false) => {
      if (isHeader) {
        doc.setFillColor(230, 235, 240);
        doc.rect(x, rowY, width, height, "FD");
      } else {
        doc.rect(x, rowY, width, height);
      }
      doc.setFont("helvetica", isHeader ? "bold" : "normal");
      doc.setFontSize(8.2);
      doc.setTextColor(isHeader ? 30 : 35, isHeader ? 58 : 35, isHeader ? 95 : 35);
      const lines = doc.splitTextToSize(String(text || "-"), width - 3);
      doc.text(
        lines,
        align === "center" ? x + width / 2 : x + 1.5,
        rowY + 4.2,
        align === "center" ? { align: "center" } : undefined,
      );
    };

    doc.setDrawColor(120, 120, 120);
    doc.setLineWidth(0.25);

        if (gopLogo) {
      addImageContained(
        doc,
        gopLogo,
        gopLogo.width,
        gopLogo.height,
        marginX + 2,
        y + 1,
        24,
        24,
        "PNG",
      );
    }
    if (rudaLogo) {
      addImageContained(
        doc,
        rudaLogo,
        rudaLogo.width,
        rudaLogo.height,
        marginX + contentWidth - 28,
        y + 1,
        24,
        24,
        "PNG",
      );
    }

    /* THEME: navy bold title, grey subtitle */
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 95);
    doc.setFontSize(24);
    doc.text("PLOT DEMARCATION REPORT", pageWidth / 2, y + 14, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(18);
    doc.setTextColor(100, 100, 100);
    doc.text("Ravi Urban Development Authority", pageWidth / 2, y + 24, {
      align: "center",
    });
    y += 38;

    drawSectionHeader(marginX, y, contentWidth, 8, "Plot Boundary Details");
    y += 8;

    const detailLabelWidth = 30;
    const detailValueWidth = contentWidth / 2 - detailLabelWidth;
    const detailRowHeight = 8;

    const drawTableCell = ({ x, rowY, width, height, text, isLabel = false }) => {
      doc.rect(x, rowY, width, height);
      doc.setFont("helvetica", isLabel ? "bold" : "normal");
      doc.setFontSize(isLabel ? 7.7 : 7.5);
      /* THEME: navy labels, dark grey values */
      doc.setTextColor(isLabel ? 30 : 35, isLabel ? 58 : 35, isLabel ? 95 : 35);
      const lines = doc.splitTextToSize(String(text || "-"), width - 3);
      doc.text(lines.slice(0, 2), x + 1.5, rowY + 4.8);
    };

    const drawDetailRow = (
      leftLabel,
      leftValue,
      rightLabel,
      rightValue,
      rowHeight = detailRowHeight,
    ) => {
      drawTableCell({
        x: marginX,
        rowY: y,
        width: detailLabelWidth,
        height: rowHeight,
        text: leftLabel,
        isLabel: true,
      });
      drawTableCell({
        x: marginX + detailLabelWidth,
        rowY: y,
        width: detailValueWidth,
        height: rowHeight,
        text: leftValue,
      });
      drawTableCell({
        x: marginX + detailLabelWidth + detailValueWidth,
        rowY: y,
        width: detailLabelWidth,
        height: rowHeight,
        text: rightLabel,
        isLabel: true,
      });
      drawTableCell({
        x: marginX + detailLabelWidth * 2 + detailValueWidth,
        rowY: y,
        width: detailValueWidth,
        height: rowHeight,
        text: rightValue,
      });
      y += rowHeight;
    };

    const drawFullDetailRow = (label, value, rowHeight = detailRowHeight) => {
      drawTableCell({
        x: marginX,
        rowY: y,
        width: detailLabelWidth,
        height: rowHeight,
        text: label,
        isLabel: true,
      });
      drawTableCell({
        x: marginX + detailLabelWidth,
        rowY: y,
        width: contentWidth - detailLabelWidth,
        height: rowHeight,
        text: value,
      });
      y += rowHeight;
    };

    drawDetailRow("Project", valueOrDash(details.project), "Block", valueOrDash(details.block));
    drawDetailRow("Plot No.", valueOrDash(details.plotNo), "Landuse", valueOrDash(details.landUse));
    drawDetailRow("Plot Area", valueOrDash(details.plotArea), "Dimension", valueOrDash(details.dimension));
    drawDetailRow("Road Ft", valueOrDash(details.roadFt), "Road Facing", valueOrDash(details.roadFacing));
    drawDetailRow("Park Front", valueOrDash(details.parkFront), "Storey", valueOrDash(details.storey));
    drawDetailRow("Possession", valueOrDash(details.possession), "Poss. Status", valueOrDash(details.possessionStatus));
    drawDetailRow("Canceled", valueOrDash(details.canceled), "Site Plan", valueOrDash(details.sitePlan));
    drawDetailRow("Unique ID", valueOrDash(details.uniqueId), "TR Sr No", valueOrDash(details.transferSrNo));
    drawDetailRow("TR Plot No", valueOrDash(details.transferPlotNo), "TR Category", valueOrDash(details.transferCategory), 10);
    drawFullDetailRow("Owner", valueOrDash(details.owner), 12);
    drawFullDetailRow("Remarks", valueOrDash(details.remarks), 9);

    const leftWidth = contentWidth * 0.53;
    const rightWidth = contentWidth - leftWidth;
    const lowerHeaderHeight = 8;
    const lowerBodyHeight = 92;

    drawSectionHeader(marginX, y, leftWidth, lowerHeaderHeight, "Selected Plot Snapshot");
    drawSectionHeader(
      marginX + leftWidth,
      y,
      rightWidth,
      lowerHeaderHeight,
      "Demarcation Coordinates",
    );
    y += lowerHeaderHeight;

    doc.rect(marginX, y, leftWidth, lowerBodyHeight);
    doc.rect(marginX + leftWidth, y, rightWidth, lowerBodyHeight);

    if (mapCapture) {
      addImageContained(
        doc,
        mapCapture.dataUrl,
        mapCapture.width,
        mapCapture.height,
        marginX + 1.2,
        y + 1.2,
        leftWidth - 2.4,
        lowerBodyHeight - 2.4,
      );
    } else {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(110, 110, 110);
      doc.text("Map snapshot is not available.", marginX + leftWidth / 2, y + lowerBodyHeight / 2, {
        align: "center",
      });
    }

    const coordinateX = marginX + leftWidth;
    let coordinateY = y;
    const coordinateRowHeight = 8;

    const drawCoordinateRow = (rowY, point, easting, northing, isHeader = false) => {
      drawSimpleCell(coordinateX, rowY, 14, coordinateRowHeight, point, "center", isHeader);
      drawSimpleCell(coordinateX + 14, rowY, 35, coordinateRowHeight, easting, "left", isHeader);
      drawSimpleCell(
        coordinateX + 49,
        rowY,
        rightWidth - 49,
        coordinateRowHeight,
        northing,
        "left",
        isHeader,
      );
    };

    /* THEME: styled header row for coordinates */
    drawCoordinateRow(coordinateY, "Point", "Easting (m)", "Northing (m)", true);
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

    y += lowerBodyHeight + 4;
    drawSectionHeader(marginX, y, contentWidth, 8, "Disclaimer");
    y += 8;

    doc.rect(marginX, y, contentWidth, 26);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.2);
    doc.setTextColor(35, 35, 35);
    doc.text(
      doc.splitTextToSize(
        "This plot demarcation report is generated from plot boundary data and is subject to field verification, official record validation, and applicable RUDA rules and regulations.",
        contentWidth - 4,
      ),
      marginX + 2,
      y + 6,
    );

    openPdfPreview(doc, `Plot Demarcation Report - Plot ${details.plotNo || ""}`, previewWindow);
  } catch (error) {
    previewWindow.close();
    console.error("Print report failed", error);
    alert("Failed to generate the demarcation report. Please try again.");
  }
};

export default printReport;
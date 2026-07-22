import { jsPDF } from "jspdf";
import {
  addImageContained,
  buildPlotDetails,
  canvasAsPng,
  createPlanCanvas,
  createPdfPreviewWindow,
  drawNorthArrowPdf,
  drawUnderlinedValue,
  getCornerCoordinates,
  loadPrintAssets,
  normalizeAreaText,
  openPdfPreview,
  valueOrDash,
} from "./printUtils";

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
    const { gopLogo, rudaLogo, watermark } = await loadPrintAssets();
    const [mainCanvas, insetCanvas] = await Promise.all([
      createPlanCanvas({
        selectedFeature: parcel,
        contextGeojson,
        details,
        mode: "site",
        width: 1500,
        height: 1050,
        selectedFill: "#efb6e7",
        selectedStroke: "#111111",
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
        width: 900,
        height: 600,
        selectedFill: "#f000ba",
        selectedStroke: "#111111",
        watermark: false,
        showDimensions: false,
        showVertexLabels: false,
        showContextLabels: false,
        northArrow: false,
      }),
    ]);

    const mainImage = canvasAsPng(mainCanvas);
    const insetImage = canvasAsPng(insetCanvas);
    const coordinates = getCornerCoordinates(parcel.geometry).slice(0, 8);

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;

    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(95, 95, 95);
    doc.setLineWidth(0.25);

    if (gopLogo) {
      doc.addImage(gopLogo, "PNG", margin + 1, 5, 31, 31, undefined, "FAST");
    }
    if (rudaLogo) {
      doc.addImage(
        rudaLogo,
        "PNG",
        pageWidth - margin - 29,
        6,
        27,
        27,
        undefined,
        "FAST",
      );
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16.5);
    doc.text("RAVI URBAN DEVELOPMENT AUTHORITY", pageWidth / 2, 13, {
      align: "center",
    });
    doc.setFontSize(14.5);
    doc.text(valueOrDash(details.project, "CHAHAR BAGH PHASE-1").toUpperCase(), pageWidth / 2, 21, {
      align: "center",
    });
    doc.setFontSize(15.5);
    doc.text("SITE PLAN", pageWidth / 2, 29, { align: "center" });

    const infoTop = 35;
    const infoHeight = 55;
    doc.rect(margin, infoTop, contentWidth, infoHeight);

    drawUnderlinedValue(
      doc,
      "Date:",
      details.documentDate,
      pageWidth - margin - 42,
      infoTop + 7,
      12,
      30,
      { fontSize: 9.5 },
    );

    drawUnderlinedValue(
      doc,
      "File Reference No:",
      details.fileReference,
      margin + 3,
      infoTop + 18,
      37,
      42,
      { fontSize: 9.2 },
    );
    drawUnderlinedValue(
      doc,
      "Name of Owner:",
      details.owner,
      margin + 92,
      infoTop + 18,
      34,
      53,
      { fontSize: 9.2 },
    );

    drawUnderlinedValue(
      doc,
      "Plot No:",
      details.plotNo,
      margin + 3,
      infoTop + 31,
      17,
      18,
      { fontSize: 9.2 },
    );
    drawUnderlinedValue(
      doc,
      "St/Road No:",
      details.streetRoadNo || details.roadFt,
      margin + 39,
      infoTop + 31,
      24,
      27,
      { fontSize: 9.2 },
    );
    drawUnderlinedValue(
      doc,
      "Block:",
      details.block,
      margin + 93,
      infoTop + 31,
      14,
      18,
      { fontSize: 9.2 },
    );
    drawUnderlinedValue(
      doc,
      "Phase:",
      details.phase,
      margin + 137,
      infoTop + 31,
      14,
      19,
      { fontSize: 9.2 },
    );

    drawUnderlinedValue(
      doc,
      "Plot Size:",
      details.plotSize || normalizeAreaText(details),
      margin + 3,
      infoTop + 42,
      19,
      29,
      { fontSize: 9.2 },
    );
    drawUnderlinedValue(
      doc,
      "Plot Category:",
      details.plotCategory,
      margin + 95,
      infoTop + 42,
      29,
      46,
      { fontSize: 9.2 },
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.2);
    doc.setTextColor(235, 25, 25);
    doc.text("Note:", pageWidth / 2 - 24, infoTop + 51, { align: "right" });
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.text("(This document is valid for three (03) months)", pageWidth / 2 - 22, infoTop + 51);

    const planTop = infoTop + infoHeight;
    const planHeight = 111;
    doc.rect(margin, planTop, contentWidth, planHeight);

    const innerX = margin + 18;
    const innerY = planTop + 1;
    const innerWidth = contentWidth - 34;
    const innerHeight = planHeight - 8;

    if (mainImage) {
      addImageContained(
        doc,
        mainImage.dataUrl,
        mainImage.width,
        mainImage.height,
        innerX,
        innerY,
        innerWidth,
        innerHeight,
      );
    }

    // Reference document uses a faint RUDA watermark across the plan.
    if (watermark) {
      doc.addImage(
        watermark,
        "PNG",
        pageWidth / 2 - 43,
        planTop + 26,
        86,
        86,
        undefined,
        "FAST",
      );
    }

    if (insetImage) {
      const insetWidth = 35;
      const insetHeight = 27;
      const insetX = pageWidth - margin - insetWidth - 2;
      const insetY = planTop + 2;
      doc.setFillColor(255, 255, 255);
      doc.rect(insetX, insetY, insetWidth, insetHeight, "FD");
      addImageContained(
        doc,
        insetImage.dataUrl,
        insetImage.width,
        insetImage.height,
        insetX + 0.8,
        insetY + 0.8,
        insetWidth - 1.6,
        insetHeight - 1.6,
      );
    }

    // Add a precise coordinate table in the bottom-right of the plan area.
    const tableWidth = 76;
    const tableX = pageWidth - margin - tableWidth - 2;
    const tableY = planTop + planHeight - 22;
    const rowHeight = 4.1;
    const rows = Math.max(2, Math.min(4, Math.ceil(coordinates.length / 2)));

    doc.setFillColor(255, 255, 255);
    doc.rect(tableX, tableY, tableWidth, rowHeight * (rows + 2), "FD");
    doc.setFont("times", "bold");
    doc.setFontSize(6.8);
    doc.text(`Plot ${details.plotNo || ""} Coordinates`, tableX + tableWidth / 2, tableY + 3.1, {
      align: "center",
    });
    doc.line(tableX, tableY + rowHeight, tableX + tableWidth, tableY + rowHeight);

    const col = [8, 20, 21, 8, 19];
    let cursor = tableX;
    col.slice(0, -1).forEach((width) => {
      cursor += width;
      doc.line(cursor, tableY + rowHeight, cursor, tableY + rowHeight * (rows + 2));
    });

    doc.setFont("times", "bold");
    doc.setFontSize(5.7);
    const headers = ["Name", "Easting (m)", "Northing (m)", "Name", "Easting / Northing (m)"];
    cursor = tableX;
    headers.forEach((header, index) => {
      const width = col[index];
      doc.text(header, cursor + width / 2, tableY + rowHeight * 1.75, { align: "center" });
      cursor += width;
    });
    doc.line(tableX, tableY + rowHeight * 2, tableX + tableWidth, tableY + rowHeight * 2);

    for (let row = 0; row < rows; row += 1) {
      const left = coordinates[row];
      const right = coordinates[row + rows];
      const yy = tableY + rowHeight * (row + 2.75);
      doc.setFont("times", "normal");
      doc.setFontSize(5.6);
      if (left) {
        doc.text(left.label, tableX + 4, yy, { align: "center" });
        doc.text(left.easting.toFixed(2), tableX + 18, yy, { align: "center" });
        doc.text(left.northing.toFixed(2), tableX + 38.5, yy, { align: "center" });
      }
      if (right) {
        doc.text(right.label, tableX + 53, yy, { align: "center" });
        doc.text(
          `${right.easting.toFixed(1)} / ${right.northing.toFixed(1)}`,
          tableX + 66.5,
          yy,
          { align: "center" },
        );
      }
      doc.line(
        tableX,
        tableY + rowHeight * (row + 3),
        tableX + tableWidth,
        tableY + rowHeight * (row + 3),
      );
    }

    drawNorthArrowPdf(doc, margin + 27, planTop + 14, 6.5);

    const signaturesTop = planTop + planHeight;
    const signaturesHeight = 44;
    doc.rect(margin, signaturesTop, contentWidth, signaturesHeight);

    const signatureRows = [
      ["Land Surveyor-1", "Rep. NESPAK"],
      ["Rep. Engineering.", "Rep. A&UP"],
      ["Rep. D&BC", "DD GIS"],
      ["DD Demarcation", "Director Land"],
    ];

    signatureRows.forEach(([leftLabel, rightLabel], index) => {
      const yy = signaturesTop + 9 + index * 8.5;
      drawUnderlinedValue(doc, leftLabel, "", margin + 5, yy, 38, 43, { fontSize: 9 });
      drawUnderlinedValue(doc, rightLabel, "", margin + 108, yy, 32, 46, { fontSize: 9 });
    });

    const confirmationTop = signaturesTop + signaturesHeight;
    const confirmationHeight = 17;
    doc.rect(margin, confirmationTop, contentWidth, confirmationHeight);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("Subsequent Confirmation", margin, confirmationTop + 5.5);
    doc.line(margin, confirmationTop + 6.3, margin + 55, confirmationTop + 6.3);
    doc.setFont("helvetica", "normal");
    doc.text("Confirmed / Not Confirmed", margin, confirmationTop + 13.2);
    drawUnderlinedValue(doc, "ED Land", "", pageWidth - margin - 73, confirmationTop + 13.5, 20, 49, {
      fontSize: 9.5,
    });

    const handoverTop = confirmationTop + confirmationHeight;
    const handoverHeight = 11;
    doc.rect(margin, handoverTop, contentWidth, handoverHeight);
    drawUnderlinedValue(
      doc,
      "Possession Handed to:",
      details.owner,
      margin + 5,
      handoverTop + 7,
      43,
      48,
      { fontSize: 9.5 },
    );
    drawUnderlinedValue(
      doc,
      "CNIC No:",
      details.cnic,
      margin + 103,
      handoverTop + 7,
      18,
      53,
      { fontSize: 9.5 },
    );

    const undertakingTop = handoverTop + handoverHeight + 2;
    const undertakingHeight = pageHeight - undertakingTop - 4;
    doc.rect(margin + 3, undertakingTop, contentWidth - 6, undertakingHeight);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.2);
    doc.text("Undertaking:", margin + 6, undertakingTop + 6);
    doc.setFont("helvetica", "normal");
    doc.text(
      doc.splitTextToSize(
        "I will not indulge in an unauthorized encroachment and violation of society Bylaws. Original state will be restored in the event of any default besides penal action imposed by managing committee under the Bylaws.",
        contentWidth - 33,
      ),
      margin + 28,
      undertakingTop + 6,
      { lineHeightFactor: 1.18 },
    );

    openPdfPreview(doc, `Site Plan - Plot ${details.plotNo || ""}`, previewWindow);
  } catch (error) {
    previewWindow.close();
    console.error("Site plan generation failed", error);
    alert("Failed to generate the site plan. Please check the selected plot data and try again.");
  }
};

export default printSitePlan;

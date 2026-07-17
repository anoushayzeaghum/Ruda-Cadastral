import { jsPDF } from "jspdf";
import {
  buildPlotDetails,
  createPdfPreviewWindow,
  drawUnderlinedValue,
  getGeometryRing,
  getPlotSides,
  loadPrintAssets,
  normalizeAreaText,
  openPdfPreview,
  valueOrDash,
} from "./printUtils";

const drawPlotSketch = (doc, parcel, details, sides, x, y, width, height) => {
  const ring = getGeometryRing(parcel?.geometry);

  // Grid proportions matching the template's bordered box layout:
  // a top row (top-side label), a bottom row (bottom-side label),
  // and left/right columns (left/right-side labels) framing the plot.
  const topH = height * 0.16;
  const bottomH = height * 0.16;
  const sideW = width * 0.22;

  const plotX = x + sideW + 0.6;
  const plotY = y + topH + 0.6;
  const plotWidth = width - sideW * 2 - 1.2;
  const plotHeight = height - topH - bottomH - 1.2;

  doc.setDrawColor(20, 20, 20);
  doc.setLineWidth(0.3);

  // Outer border + grid separators, like the template's boxed sketch
  doc.rect(x, y, width, height);
  doc.line(x, y + topH, x + width, y + topH);
  doc.line(x, y + height - bottomH, x + width, y + height - bottomH);
  doc.line(x + sideW, y + topH, x + sideW, y + height - bottomH);
  doc.line(
    x + width - sideW,
    y + topH,
    x + width - sideW,
    y + height - bottomH,
  );

  doc.setLineWidth(0.35);
  if (ring.length >= 3) {
    const xs = ring.map((point) => point[0]);
    const ys = ring.map((point) => point[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const dataWidth = Math.max(maxX - minX, 1e-9);
    const dataHeight = Math.max(maxY - minY, 1e-9);
    const scale = Math.min(plotWidth / dataWidth, plotHeight / dataHeight);
    const offsetX = plotX + (plotWidth - dataWidth * scale) / 2;
    const offsetY = plotY + (plotHeight - dataHeight * scale) / 2;
    const project = ([lng, lat]) => [
      offsetX + (lng - minX) * scale,
      offsetY + plotHeight - (lat - minY) * scale,
    ];

    for (let index = 0; index < ring.length; index += 1) {
      const start = project(ring[index]);
      const end = project(ring[(index + 1) % ring.length]);
      doc.line(start[0], start[1], end[0], end[1]);
    }
  } else {
    doc.rect(plotX, plotY, plotWidth, plotHeight);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.4);
  doc.text(
    `Plot No. ${valueOrDash(details.plotNo)}`,
    x + width / 2,
    y + height / 2 + 1,
    {
      align: "center",
    },
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.2);
  doc.text(sides[3]?.boundedBy || "", x + width / 2, y + topH / 2 + 1, {
    align: "center",
  });
  doc.text(
    sides[2]?.boundedBy || "",
    x + width / 2,
    y + height - bottomH / 2 + 1,
    {
      align: "center",
    },
  );
  doc.text(sides[1]?.boundedBy || "", x + sideW / 2, y + height / 2, {
    angle: 90,
    align: "center",
  });
  doc.text(sides[0]?.boundedBy || "", x + width - sideW / 2, y + height / 2, {
    angle: 90,
    align: "center",
  });
};

// Renders a paragraph built from { text, emphasis } runs, wrapping words
// across lines while keeping bold+underline styling on the emphasized runs
// (matches the template, where plot no / area / road / block / land use /
// date are bold and underlined inline within the certification sentence).
const drawEmphasizedParagraph = (
  doc,
  segments,
  x,
  y,
  maxWidth,
  fontSize,
  lineHeightFactor = 1.35,
) => {
  const lineHeight = fontSize * lineHeightFactor * 0.3528; // pt -> mm

  doc.setFont("helvetica", "normal");
  doc.setFontSize(fontSize);
  const spaceWidth = doc.getTextWidth(" ");

  const words = [];
  segments.forEach((segment) => {
    segment.text.split(" ").forEach((word) => {
      if (word.length) words.push({ text: word, emphasis: !!segment.emphasis });
    });
  });

  let cursorX = x;
  let cursorY = y;

  words.forEach((word) => {
    doc.setFont("helvetica", word.emphasis ? "bold" : "normal");
    const wordWidth = doc.getTextWidth(word.text);

    if (cursorX + wordWidth > x + maxWidth) {
      cursorX = x;
      cursorY += lineHeight;
    }

    doc.text(word.text, cursorX, cursorY);
    if (word.emphasis) {
      doc.setLineWidth(0.2);
      doc.line(cursorX, cursorY + 0.8, cursorX + wordWidth, cursorY + 0.8);
    }

    cursorX += wordWidth + spaceWidth;
  });

  doc.setFont("helvetica", "normal");
  return cursorY + lineHeight;
};

const drawSignatureBlock = (doc, heading, x, y, width) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.2);
  doc.text(heading, x, y);
  doc.line(x, y + 1, x + width, y + 1);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.4);
  doc.text("Name:", x, y + 11);
  doc.line(x + 31, y + 11.8, x + width, y + 11.8);
  doc.text("SIGNATURE:", x, y + 21);
  doc.line(x + 31, y + 21.8, x + width, y + 21.8);
  doc.text("DATE:", x, y + 31);
  doc.line(x + 31, y + 31.8, x + width, y + 31.8);
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
    const { gopLogo, rudaLogo, watermark } = await loadPrintAssets();
    const sides = getPlotSides(parcel, contextGeojson, details);
    const totalArea = normalizeAreaText(details);

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 11;

    if (watermark) {
      doc.addImage(
        watermark,
        "PNG",
        pageWidth / 2 - 72,
        55,
        144,
        144,
        undefined,
        "FAST",
      );
    }

    if (rudaLogo) {
      doc.addImage(rudaLogo, "PNG", margin, 5, 27, 27, undefined, "FAST");
    }
    if (gopLogo) {
      doc.addImage(
        gopLogo,
        "PNG",
        pageWidth - margin - 25,
        5,
        25,
        25,
        undefined,
        "FAST",
      );
    }

    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(25, 25, 25);
    doc.setLineWidth(0.25);

    doc.setFont("times", "bold");
    doc.setFontSize(15.5);
    doc.text("RAVI URBAN DEVELOPMENT AUTHORITY", pageWidth / 2, 14, {
      align: "center",
    });
    doc.setFontSize(14);
    doc.text("POSSESSION CERTIFICATE", pageWidth / 2, 21, { align: "center" });
    doc.line(pageWidth / 2 - 37, 22, pageWidth / 2 + 37, 22);
    doc.setFontSize(10.5);
    doc.text(
      valueOrDash(details.project, "CHAHAR BAGH (PHASE-1)").toUpperCase(),
      pageWidth / 2,
      28,
      {
        align: "center",
        charSpace: 1.2,
      },
    );

    drawUnderlinedValue(
      doc,
      "Registration #",
      details.registrationNo,
      margin,
      35,
      31,
      20,
      {
        fontSize: 8.5,
        boldLabel: false,
      },
    );
    drawUnderlinedValue(
      doc,
      "Dated:",
      details.possessionDate || details.documentDate,
      pageWidth - margin - 42,
      35,
      14,
      24,
      {
        fontSize: 8.5,
        boldLabel: false,
      },
    );
    drawUnderlinedValue(
      doc,
      "Application #",
      details.applicationNo,
      margin,
      43,
      31,
      20,
      {
        fontSize: 8.5,
        boldLabel: false,
      },
    );
    drawUnderlinedValue(doc, "Owner Name:", details.owner, margin, 51, 31, 48, {
      fontSize: 8.5,
      boldLabel: false,
    });
    drawUnderlinedValue(
      doc,
      "Postal Address:",
      details.postalAddress,
      margin,
      59,
      31,
      pageWidth - margin * 2 - 31,
      {
        fontSize: 8.5,
        boldLabel: false,
      },
    );

    const possessionDate =
      details.possessionDate || details.documentDate || "__________";
    const roadText = details.roadFt
      ? `Road wide ${details.roadFt} Feet`
      : details.streetRoadNo || details.roadFacing || "__________";

    drawEmphasizedParagraph(
      doc,
      [
        { text: "Certified that possession of plot No" },
        { text: `${valueOrDash(details.plotNo)},`, emphasis: true },
        { text: "measuring" },
        { text: valueOrDash(totalArea), emphasis: true },
        { text: "street No" },
        { text: `${roadText},`, emphasis: true },
        { text: valueOrDash(details.block), emphasis: true },
        { text: "Block and Land Use" },
        { text: valueOrDash(details.landUse), emphasis: true },
        { text: "has been handed over to the allottee / attorney on" },
        { text: possessionDate, emphasis: true },
        { text: "as per sketch shown below:" },
      ],
      margin,
      67,
      pageWidth - margin * 2,
      9.5,
      1.35,
    );

    const sidesTop = 86;
    const sideLabelX = margin + 8;
    const sideLengthX = margin + 52;
    const boundedX = margin + 88;
    const boundedValueX = margin + 124;

    doc.setFontSize(8.4);
    sides.forEach((side, index) => {
      const yy = sidesTop + index * 7;
      doc.text(`${index + 1}.`, margin, yy);
      doc.text(side.label, sideLabelX, yy);
      doc.text(valueOrDash(side.length), sideLengthX, yy);
      doc.text("Bounded by", boundedX, yy);
      doc.text(valueOrDash(side.boundedBy), boundedValueX, yy);
    });

    drawPlotSketch(
      doc,
      parcel,
      details,
      sides,
      pageWidth - margin - 37,
      sidesTop - 5,
      37,
      36,
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text("Total Area", margin, 118);
    doc.setFont("helvetica", "bold");
    doc.text(valueOrDash(totalArea), margin + 44, 118);
    doc.line(margin + 44, 119, margin + 69, 119);

    doc.setFont("helvetica", "normal");
    doc.text("Excess Area:", margin + 92, 118);
    doc.setFont("helvetica", "bold");
    doc.text(valueOrDash(details.excessArea), margin + 137, 118);
    doc.line(margin + 137, 119, margin + 163, 119);

    doc.setFont("helvetica", "normal");
    doc.text("Champher Area", margin, 126);
    if (details.chamferArea) {
      doc.text(details.chamferArea, margin + 35, 126);
    }

    drawSignatureBlock(doc, "SURVEY INCHARGE", margin, 136, 78);
    drawSignatureBlock(
      doc,
      "DEPUTY DIRECTOR DEMARCATION",
      pageWidth / 2 + 10,
      136,
      85,
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.4);
    const directorTitle = "DIRECTOR LAND ACQUISITION & ESTATE MANAGEMENT";
    doc.text(directorTitle, pageWidth / 2, 177, { align: "center" });
    doc.line(pageWidth / 2 - 58, 178, pageWidth / 2 + 58, 178);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.4);
    doc.text("Name:", pageWidth / 2 - 47, 187);
    doc.line(pageWidth / 2 - 17, 187.8, pageWidth / 2 + 36, 187.8);
    doc.text("SIGNATURE:", pageWidth / 2 - 47, 197);
    doc.line(pageWidth / 2 - 17, 197.8, pageWidth / 2 + 36, 197.8);
    doc.text("DATE:", pageWidth / 2 - 47, 207);
    doc.line(pageWidth / 2 - 17, 207.8, pageWidth / 2 + 36, 207.8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.8);
    doc.text("SURVEY & POSSESSION DEPARTMENT REMARKS:", margin, 217);
    doc.line(margin + 95, 217.8, pageWidth - margin, 217.8);

    const notes = [
      "I, personally inspected the plot to my Satisfaction and is clear of encroachment.",
      "I shall abide by Building By-Laws of RUDA i.e Approval of Building Plan etc.",
      "The location, number, size and type of the Plot are final, however, RUDA reserves the right to change/amend due to the technical reasons at any stage.",
      "Champher area is part of the plot but will not be included in the boundary of the plot.",
      "Possession letter is valid for three years from date of readiness, after that re-validation charges will be applied.",
      "On expiry, re-validation of possession will be required after the payment of re-validation charges & Non utilization charges of entire project.",
      "Three years are given for construction after collection of possession upon payment of all due charges for all projects.",
    ];

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.4);
    let noteY = 231;
    notes.forEach((note, index) => {
      const lines = doc.splitTextToSize(
        `${index + 1}. ${note}`,
        pageWidth - margin * 2,
      );
      if (index === 4) doc.setTextColor(255, 184, 36);
      else doc.setTextColor(0, 0, 0);
      doc.text(lines, margin, noteY, { lineHeightFactor: 1.16 });
      noteY += lines.length * 3.2 + 0.7;
    });

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.4);
    doc.text("POSSESSION TAKEN OVER BY ALLOTTEE / ATTORNEY", margin, 270);

    drawUnderlinedValue(doc, "NAME:", details.owner, margin, 279, 15, 51, {
      fontSize: 9.2,
    });
    drawUnderlinedValue(
      doc,
      "THUMB & SIGNATURE:",
      "",
      pageWidth / 2 + 2,
      279,
      43,
      50,
      {
        fontSize: 9.2,
      },
    );
    drawUnderlinedValue(doc, "CNIC:", details.cnic, margin, 290, 15, 51, {
      fontSize: 9.2,
    });
    drawUnderlinedValue(
      doc,
      "DATED:",
      details.possessionDate || details.documentDate,
      pageWidth / 2 + 39,
      290,
      17,
      39,
      {
        fontSize: 9.2,
      },
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

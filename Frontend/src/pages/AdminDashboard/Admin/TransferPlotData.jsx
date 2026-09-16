import { useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Check,
  FileText,
  Map,
  Printer,
  Save,
  Send,
  UploadCloud,
  X,
} from "lucide-react";
import { jsPDF } from "jspdf";
import AdminPage from "../dashboard/AdminPage";
import {
  buildPlotDetails,
  createPdfPreviewWindow,
  getCircularLogoDataUrl,
  loadPrintAssets,
  openPdfPreview,
  valueOrDash,
} from "../../Demarcation/PrintReports/printUtils";

const THEME = [30, 58, 95];
const TEXT = [28, 28, 28];
const MUTED = [92, 103, 116];

const normalizeText = (value, fallback = "") => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return fallback;
  }
  return String(value).trim();
};

const todayDisplay = () => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${d.getFullYear()}`;
};

const relationText = (relationType, relationName) => {
  const type = normalizeText(relationType);
  const name = normalizeText(relationName);
  if (!type && !name) return "";
  if (!name) return type;
  return `${type} ${name}`;
};

const drawCircularLogo = (doc, image, cx, cy, size) => {
  if (!image) return;
  const dataUrl = getCircularLogoDataUrl(image, 300);
  if (!dataUrl) return;
  doc.addImage(
    dataUrl,
    "PNG",
    cx - size / 2,
    cy - size / 2,
    size,
    size,
    undefined,
    "FAST",
  );
};

const drawContainedLogo = (doc, image, cx, cy, boxWidth, boxHeight) => {
  if (!image) return;
  const iw = image.naturalWidth || image.width || boxWidth;
  const ih = image.naturalHeight || image.height || boxHeight;
  const scale = Math.min(boxWidth / iw, boxHeight / ih);
  const drawWidth = iw * scale;
  const drawHeight = ih * scale;
  doc.addImage(
    image,
    "PNG",
    cx - drawWidth / 2,
    cy - drawHeight / 2,
    drawWidth,
    drawHeight,
    undefined,
    "FAST",
  );
};

const drawFittedText = (
  doc,
  text,
  x,
  y,
  maxWidth,
  {
    fontSize = 8,
    minFontSize = 6,
    align = "left",
    fontStyle = "normal",
    color = TEXT,
  } = {},
) => {
  const safeText = normalizeText(text, "-");
  let size = fontSize;
  doc.setFont("helvetica", fontStyle);
  doc.setTextColor(...color);

  while (size > minFontSize) {
    doc.setFontSize(size);
    if (doc.getTextWidth(safeText) <= maxWidth) break;
    size -= 0.2;
  }

  doc.setFontSize(size);
  doc.text(safeText, x, y, { align });
};

const drawWrapped = (
  doc,
  text,
  x,
  y,
  maxWidth,
  {
    fontSize = 7.7,
    lineHeight = 3.45,
    fontStyle = "normal",
    color = TEXT,
  } = {},
) => {
  doc.setFont("helvetica", fontStyle);
  doc.setFontSize(fontSize);
  doc.setTextColor(...color);
  const lines = doc.splitTextToSize(normalizeText(text), maxWidth);
  doc.text(lines, x, y, { lineHeightFactor: lineHeight / (fontSize * 0.3528) });
  return y + Math.max(0, lines.length - 1) * lineHeight;
};

const drawKeyValue = (
  doc,
  label,
  value,
  x,
  y,
  width,
  { labelWidth = 27, fontSize = 7.4 } = {},
) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(fontSize);
  doc.setTextColor(...MUTED);
  doc.text(label, x, y);

  const valueX = x + labelWidth;
  const maxValueWidth = Math.max(8, width - labelWidth);
  drawFittedText(doc, value, valueX, y, maxValueWidth, {
    fontSize,
    minFontSize: 5.8,
    fontStyle: "bold",
    color: TEXT,
  });
};

const drawTableKeyValue = (
  doc,
  label,
  value,
  x,
  y,
  width,
  { labelWidth = 29, fontSize = 6.9 } = {},
) => {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(fontSize);
  doc.setTextColor(...THEME);
  doc.text(label, x, y);

  const valueX = x + labelWidth;
  const maxValueWidth = Math.max(8, width - labelWidth);
  drawFittedText(doc, value, valueX, y, maxValueWidth, {
    fontSize,
    minFontSize: 5.8,
    fontStyle: "normal",
    color: TEXT,
  });
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const loadBrowserImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const cropImageForPdf = async (
  file,
  crop = {},
  outputWidth = 1400,
  outputHeight = 760,
) => {
  if (!file) return null;

  const src = await fileToDataUrl(file);
  const img = await loadBrowserImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const zoom = Math.max(1, Number(crop.zoom) || 1);
  const panX = Math.max(-100, Math.min(100, Number(crop.x) || 0));
  const panY = Math.max(-100, Math.min(100, Number(crop.y) || 0));

  const baseScale = Math.max(
    outputWidth / img.width,
    outputHeight / img.height,
  );
  const scale = baseScale * zoom;
  const drawWidth = img.width * scale;
  const drawHeight = img.height * scale;

  const overflowX = Math.max(0, drawWidth - outputWidth);
  const overflowY = Math.max(0, drawHeight - outputHeight);

  const drawX = -overflowX / 2 + (panX / 100) * (overflowX / 2);
  const drawY = -overflowY / 2 + (panY / 100) * (overflowY / 2);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, outputWidth, outputHeight);
  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

  return canvas.toDataURL("image/jpeg", 0.93);
};

// Create a small Mapbox satellite snapshot for the selected plot. The selected
// parcel boundary is the only vector overlay drawn on top of the imagery.
const getMapboxAccessToken = () =>
  normalizeText(
    import.meta.env?.VITE_MAPBOX_ACCESS_TOKEN ||
      import.meta.env?.VITE_MAPBOX_TOKEN ||
      window?.MAPBOX_ACCESS_TOKEN ||
      window?.mapboxgl?.accessToken,
  );

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const isLngLatCoordinate = (coord) =>
  Array.isArray(coord) &&
  coord.length >= 2 &&
  Number.isFinite(Number(coord[0])) &&
  Number.isFinite(Number(coord[1])) &&
  Math.abs(Number(coord[0])) <= 180 &&
  Math.abs(Number(coord[1])) <= 90;

const geometryHasLngLatCoordinates = (geometry) => {
  if (!geometry?.coordinates) return false;

  const walk = (coordinates) => {
    if (!Array.isArray(coordinates)) return false;
    if (isLngLatCoordinate(coordinates)) return true;
    return coordinates.some((item) => walk(item));
  };

  return walk(geometry.coordinates);
};

const createPlotSatelliteSnapshot = async (parcel) => {
  const geometry = parcel?.geometry;
  const accessToken = getMapboxAccessToken();

  if (!geometry || !accessToken || !geometryHasLngLatCoordinates(geometry)) {
    return null;
  }

  const overlay = {
    type: "Feature",
    properties: {
      stroke: "#ff1744",
      "stroke-width": 4,
      "stroke-opacity": 1,
      fill: "#ff1744",
      "fill-opacity": 0,
    },
    geometry,
  };

  const encodedOverlay = encodeURIComponent(JSON.stringify(overlay));
  const url =
    `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/` +
    `geojson(${encodedOverlay})/auto/700x420@2x` +
    `?padding=65&access_token=${encodeURIComponent(accessToken)}`;

  try {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Mapbox snapshot failed: ${response.status}`);
    return await blobToDataUrl(await response.blob());
  } catch (error) {
    console.warn("Could not create Mapbox plot snapshot", error);
    return null;
  }
};

const formatInputDate = (value) => {
  const raw = normalizeText(value);
  if (!raw) return "-";
  const [year, month, day] = raw.split("-");
  if (!year || !month || !day) return raw;
  return `${day}-${month}-${year}`;
};

const drawPhotoBox = (
  doc,
  image,
  x,
  y,
  width,
  height,
  leftTitle,
  rightTitle,
) => {
  const headerHeight = 6;
  const imageTop = y + headerHeight;
  const imageHeight = height - headerHeight;

  doc.setDrawColor(72, 72, 72);
  doc.setLineWidth(0.3);
  doc.rect(x, y, width, height);
  doc.line(x + width / 2, y, x + width / 2, y + headerHeight);
  doc.line(x, imageTop, x + width, imageTop);

  doc.setFillColor(...THEME);
  doc.rect(x, y, width, headerHeight, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.1);
  doc.setTextColor(255, 255, 255);
  doc.text(leftTitle, x + width / 4, y + 4.1, { align: "center" });
  doc.text(rightTitle, x + (width * 3) / 4, y + 4.1, { align: "center" });
  doc.setTextColor(...TEXT);

  if (image) {
    doc.addImage(
      image,
      "JPEG",
      x + 0.45,
      imageTop + 0.45,
      width - 0.9,
      imageHeight - 0.9,
      undefined,
      "FAST",
    );
  }
};

const drawThumbSignatureBox = (doc, x, y, width, roleLabel) => {
  const thumbWidth = 31;
  const height = 15;

  doc.setDrawColor(72, 72, 72);
  doc.setLineWidth(0.3);
  doc.rect(x, y, width, height);
  doc.line(x + thumbWidth, y, x + thumbWidth, y + height);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.3);
  doc.setTextColor(...MUTED);
  doc.text("Thumb Impression", x + thumbWidth / 2, y + height - 2, {
    align: "center",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.4);
  doc.setTextColor(...TEXT);
  doc.text(
    `Signature of ${roleLabel}`,
    x + thumbWidth + (width - thumbWidth) / 2,
    y + height - 2,
    {
      align: "center",
    },
  );
};

const drawPartyInfo = (doc, x, y, width, party, title) => {
  // Keep every value in the party card on the exact same vertical start line.
  const innerX = x + 2.5;
  const innerWidth = width - 5;
  const valueStart = 28;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.4);
  doc.setTextColor(...THEME);
  doc.text(title, innerX, y);

  drawKeyValue(doc, "Mr./Ms:", party.name, innerX, y + 5.3, innerWidth, {
    labelWidth: valueStart,
    fontSize: 6.9,
  });
  drawKeyValue(
    doc,
    "S/O,D/O,W/O:",
    relationText(party.relationType, party.relationName),
    innerX,
    y + 10,
    innerWidth,
    { labelWidth: valueStart, fontSize: 6.9 },
  );
  drawKeyValue(doc, "CNIC NO:", party.cnic, innerX, y + 14.7, innerWidth, {
    labelWidth: valueStart,
    fontSize: 6.9,
  });
  drawKeyValue(
    doc,
    `Multiple ${title}:`,
    party.multiple,
    innerX,
    y + 19.4,
    innerWidth,
    {
      labelWidth: valueStart,
      fontSize: 6.9,
    },
  );
};

const generateTransferLetterPdf = async ({
  parcel,
  filters = {},
  detailsOverride = {},
  transferData,
}) => {
  const builtDetails = parcel ? buildPlotDetails(parcel, filters) : {};
  const details = { ...builtDetails, ...detailsOverride };
  const previewWindow = transferData.previewWindow;

  try {
    const [
      { gopLogo, rudaLogo },
      sellerPhoto,
      buyerPhoto,
      ownerPhoto,
      plotMapSnapshot,
    ] = await Promise.all([
      loadPrintAssets(),
      cropImageForPdf(
        transferData.sellerImage,
        transferData.sellerCrop,
        1802,
        1000,
      ),
      cropImageForPdf(
        transferData.buyerImage,
        transferData.buyerCrop,
        1802,
        1000,
      ),
      cropImageForPdf(
        transferData.ownerImage,
        transferData.ownerCrop,
        1242,
        1000,
      ),
      createPlotSatelliteSnapshot(parcel),
    ]);

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
    const rightEdge = pageWidth - margin;
    const dateText = todayDisplay();

    doc.setFillColor(...THEME);
    doc.rect(0, 0, pageWidth, 1.8, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.2);
    doc.setTextColor(...MUTED);
    doc.text("ORIGINAL COPY", pageWidth / 2, 5.1, { align: "center" });
    const logoY = 17.3;
    drawContainedLogo(doc, gopLogo, margin + 11.5, logoY, 24.5, 22.5);
    drawCircularLogo(doc, rudaLogo, rightEdge - 11, logoY, 21.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14.8);
    doc.setTextColor(...THEME);
    doc.text("RAVI URBAN DEVELOPMENT AUTHORITY", pageWidth / 2, 11.2, {
      align: "center",
    });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.7);
    doc.setTextColor(...MUTED);
    // doc.text("Government of the Punjab", pageWidth / 2, 15.8, {
    //   align: "center",
    // });

    drawFittedText(
      doc,
      valueOrDash(details.project),
      pageWidth / 2,
      17.8,
      115,
      { fontSize: 9.6, minFontSize: 7.2, align: "center", fontStyle: "bold" },
    );

    const badgeW = 50;
    const badgeH = 7.5;
    const badgeX = (pageWidth - badgeW) / 2;
    const badgeY = 21.2;
    doc.setFillColor(...THEME);
    doc.setDrawColor(...THEME);
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.8);
    doc.setTextColor(255, 255, 255);
    doc.text("TRANSFER LETTER", pageWidth / 2, badgeY + 5.1, {
      align: "center",
    });
    doc.setTextColor(...TEXT);

    const metaY = 33.8;
    doc.setFontSize(7.4);
    drawKeyValue(
      doc,
      "Transfer Letter No:",
      transferData.letterNo,
      margin,
      metaY,
      108,
      {
        labelWidth: 34,
        fontSize: 7.4,
      },
    );
    const dateValueWidth = 28;
    const dateLabelWidth = 12;
    const dateX = rightEdge - dateLabelWidth - dateValueWidth + 14;
    drawKeyValue(
      doc,
      "DATE:",
      dateText,
      dateX,
      metaY,
      dateLabelWidth + dateValueWidth,
      {
        labelWidth: dateLabelWidth,
        fontSize: 7.4,
      },
    );

    const detailsHeaderY = 37.4;
    const detailsHeaderH = 6.5;
    doc.setFillColor(...THEME);
    doc.setDrawColor(...THEME);
    doc.rect(margin, detailsHeaderY, contentWidth, detailsHeaderH, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.2);
    doc.setTextColor(255, 255, 255);
    doc.text("TRANSFER & PLOT INFORMATION", margin + 2.5, detailsHeaderY + 4.5);
    doc.setTextColor(...TEXT);

    const boxTop = detailsHeaderY + detailsHeaderH;
    const boxHeight = 39.5;
    doc.setDrawColor(168, 177, 188);
    doc.setLineWidth(0.25);
    doc.rect(margin, boxTop, contentWidth, boxHeight);

    const rows = [
      [
        ["Transfer No.", transferData.transferNo],
        ["OWC No.", transferData.owcNo],
      ],
      [
        ["Scheme / Project", details.project],
        ["Block", details.block],
      ],
      [
        ["Phase", details.phase],
        ["Plot No.", details.plotNo],
      ],
      [
        ["Plot Area", details.plotArea],
        ["Plot Type", details.landUse],
      ],
      [
        ["Road Facing", details.roadFacing],
        ["TR Plot No.", details.transferPlotNo],
      ],
      [
        ["TR Category", details.transferCategory],
        ["Transfer Mode", transferData.transferMode],
      ],
      [
        ["Building Period", transferData.buildingPeriod],
        ["Expiry Date", formatInputDate(transferData.buildingExpiryDate)],
      ],
      [
        [
          "Completion Date",
          formatInputDate(transferData.buildingCompletionDate),
        ],
        ["Unique ID", details.uniqueId],
      ],
    ];

    const rowHeight = boxHeight / rows.length;

    // Fixed vertical separator positions between each label and its value.
    // These align the table into four clear columns:
    // LABEL | VALUE | LABEL | VALUE
    const leftLabelSeparatorX = margin + 31;
    const rightLabelSeparatorX = pageWidth / 2 + 28;

    rows.forEach((row, index) => {
      const rowTop = boxTop + index * rowHeight;

      // Keep every row pure white so there is no alternating row shading.
      doc.setFillColor(255, 255, 255);
      doc.rect(margin, rowTop, contentWidth, rowHeight, "F");

      // Light horizontal separators between rows.
      doc.setDrawColor(190, 198, 208);
      doc.setLineWidth(0.22);
      if (index > 0) {
        doc.line(margin, rowTop, rightEdge, rowTop);
      }

      // Slightly darker center divider between the left and right halves.
      doc.setDrawColor(120, 135, 150);
      doc.setLineWidth(0.28);
      doc.line(pageWidth / 2, rowTop, pageWidth / 2, rowTop + rowHeight);

      // Vertical separator between label and value on the left half.
      doc.setDrawColor(150, 160, 172);
      doc.setLineWidth(0.22);
      doc.line(
        leftLabelSeparatorX,
        rowTop,
        leftLabelSeparatorX,
        rowTop + rowHeight,
      );

      // Vertical separator between label and value on the right half.
      doc.line(
        rightLabelSeparatorX,
        rowTop,
        rightLabelSeparatorX,
        rowTop + rowHeight,
      );

      const textY = rowTop + 3.35;

      drawTableKeyValue(
        doc,
        row[0][0],
        row[0][1],
        margin + 2,
        textY,
        contentWidth / 2 - 4,
        {
          labelWidth: 31,
          fontSize: 6.9,
        },
      );

      drawTableKeyValue(
        doc,
        row[1][0],
        row[1][1],
        pageWidth / 2 + 2,
        textY,
        contentWidth / 2 - 4,
        {
          labelWidth: 28,
          fontSize: 6.9,
        },
      );
    });

    // Draw the outer border last so the table left/right edges stay
    // clean and slightly darker than the internal grid lines.
    doc.setDrawColor(70, 85, 105);
    doc.setLineWidth(0.4);
    doc.rect(margin, boxTop, contentWidth, boxHeight);

    const separatorY = boxTop + boxHeight + 4.0;
    const paraY = separatorY + 4.2;
    doc.setDrawColor(...THEME);
    doc.setLineWidth(0.45);
    doc.line(margin, separatorY, rightEdge, separatorY);
    const originalRelation = relationText(
      transferData.originalRelationType,
      transferData.originalRelationName,
    );
    const previousRef = transferData.previousRefNo
      ? ` vide allotment / exemption letter / recovery memo No. ${transferData.previousRefNo}.`
      : ".";
    const paragraph = `The title of the plot cited above is hereby transferred in the name of the buyer below, in view of verification of record, on the same terms & conditions as it was held by original allottee / exemptee ${transferData.originalAllotteeName} ${originalRelation}${previousRef}`;

    const paragraphEnd = drawWrapped(
      doc,
      paragraph,
      margin,
      paraY,
      contentWidth,
      {
        fontSize: 7.5,
        lineHeight: 3.45,
      },
    );

    // Start the verification photos directly after the transfer paragraph.
    // The extra blue "TRANSFER PARTY VERIFICATION" heading is intentionally removed.
    const photosY = paragraphEnd + 4.8;
    const photoGap = 4;
    const photoWidth = (contentWidth - photoGap) / 2;
    const photoHeight = 58;

    drawPhotoBox(
      doc,
      sellerPhoto,
      margin,
      photosY,
      photoWidth,
      photoHeight,
      "Seller",
      "Identification Officer",
    );
    drawPhotoBox(
      doc,
      buyerPhoto,
      margin + photoWidth + photoGap,
      photosY,
      photoWidth,
      photoHeight,
      "Buyer",
      "Identification Officer",
    );

    const thumbY = photosY + photoHeight;
    drawThumbSignatureBox(doc, margin, thumbY, photoWidth, "Seller");
    drawThumbSignatureBox(
      doc,
      margin + photoWidth + photoGap,
      thumbY,
      photoWidth,
      "Buyer",
    );

    const partyInfoY = thumbY + 20.5;
    const partyWidth = photoWidth;
    const partyCardHeight = 25;
    doc.setDrawColor(187, 195, 205);
    doc.setLineWidth(0.25);
    doc.rect(margin, partyInfoY - 3.8, partyWidth, partyCardHeight);
    doc.rect(
      margin + partyWidth + photoGap,
      partyInfoY - 3.8,
      partyWidth,
      partyCardHeight,
    );
    drawPartyInfo(
      doc,
      margin,
      partyInfoY,
      partyWidth,
      {
        name: transferData.sellerName,
        relationType: transferData.sellerRelationType,
        relationName: transferData.sellerRelationName,
        cnic: transferData.sellerCnic,
        multiple: transferData.multipleSeller,
      },
      "Seller",
    );
    drawPartyInfo(
      doc,
      margin + partyWidth + photoGap,
      partyInfoY,
      partyWidth,
      {
        name: transferData.buyerName,
        relationType: transferData.buyerRelationType,
        relationName: transferData.buyerRelationName,
        cnic: transferData.buyerCnic,
        multiple: transferData.multipleBuyer,
      },
      "Buyer",
    );

    const ownerY = partyInfoY + 24.5;
    const ownerHeight = 44;
    const ownerMapGap = 3;
    const ownerDetailsWidth = 121;
    const ownerMapX = margin + ownerDetailsWidth + ownerMapGap;
    const ownerMapWidth = rightEdge - ownerMapX;

    // Left: existing new-owner information, narrowed only enough to make room
    // for the requested plot-location satellite snapshot on the right.
    doc.setFillColor(247, 249, 252);
    doc.rect(margin, ownerY, ownerDetailsWidth, ownerHeight, "F");
    doc.setDrawColor(145, 156, 170);
    doc.setLineWidth(0.3);
    doc.rect(margin, ownerY, ownerDetailsWidth, ownerHeight);
    doc.setFillColor(...THEME);
    doc.rect(margin, ownerY, ownerDetailsWidth, 6.2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.2);
    doc.setTextColor(255, 255, 255);
    doc.text("NEW OWNER", margin + 2.2, ownerY + 4.3);
    doc.setTextColor(...TEXT);

    const ownerPhotoX = margin + 3;
    const ownerPhotoY = ownerY + 8.3;
    const ownerPhotoW = 42;
    const ownerPhotoH = 34;
    doc.setDrawColor(110, 110, 110);
    doc.rect(ownerPhotoX, ownerPhotoY, ownerPhotoW, ownerPhotoH);
    if (ownerPhoto) {
      doc.addImage(
        ownerPhoto,
        "JPEG",
        ownerPhotoX + 0.45,
        ownerPhotoY + 0.45,
        ownerPhotoW - 0.9,
        ownerPhotoH - 0.9,
        undefined,
        "FAST",
      );
    }

    // New-owner details — same fields and row layout as before.
    const ownerInfoX = ownerPhotoX + ownerPhotoW + 6;
    const ownerInfoWidth = margin + ownerDetailsWidth - ownerInfoX - 3;
    const ownerInfoTop = ownerY + 11.7;
    const ownerRowGap = 5.15;
    const ownerLabelWidth = 30;

    const ownerItems = [
      ["Mr./Ms:", transferData.buyerName],
      [
        "S/O,D/O,W/O:",
        relationText(
          transferData.buyerRelationType,
          transferData.buyerRelationName,
        ),
      ],
      ["CNIC NO:", transferData.buyerCnic],
      ["Transfer No:", transferData.transferNo],
      ["Plot No:", details.plotNo],
      ["Transfer Mode:", transferData.transferMode],
    ];

    ownerItems.forEach(([label, value], index) => {
      drawKeyValue(
        doc,
        label,
        value,
        ownerInfoX,
        ownerInfoTop + index * ownerRowGap,
        ownerInfoWidth,
        {
          labelWidth: ownerLabelWidth,
          fontSize: 6.9,
        },
      );
    });

    // Right: Mapbox satellite snapshot with only the selected plot boundary.
    doc.setFillColor(247, 249, 252);
    doc.rect(ownerMapX, ownerY, ownerMapWidth, ownerHeight, "F");
    doc.setDrawColor(145, 156, 170);
    doc.setLineWidth(0.3);
    doc.rect(ownerMapX, ownerY, ownerMapWidth, ownerHeight);
    doc.setFillColor(...THEME);
    doc.rect(ownerMapX, ownerY, ownerMapWidth, 6.2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.2);
    doc.setTextColor(255, 255, 255);
    doc.text("PLOT LOCATION", ownerMapX + 2.2, ownerY + 4.3);

    const mapImageX = ownerMapX + 1.2;
    const mapImageY = ownerY + 7.4;
    const mapImageW = ownerMapWidth - 2.4;
    const mapImageH = ownerHeight - 8.6;

    if (plotMapSnapshot) {
      const plotMapFormat = plotMapSnapshot.startsWith("data:image/png")
        ? "PNG"
        : "JPEG";
      doc.addImage(
        plotMapSnapshot,
        plotMapFormat,
        mapImageX,
        mapImageY,
        mapImageW,
        mapImageH,
        undefined,
        "FAST",
      );
    } else {
      doc.setFillColor(242, 244, 247);
      doc.rect(mapImageX, mapImageY, mapImageW, mapImageH, "F");
      doc.setDrawColor(190, 198, 208);
      doc.rect(mapImageX, mapImageY, mapImageW, mapImageH);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(...MUTED);
      doc.text(
        "Satellite map unavailable",
        ownerMapX + ownerMapWidth / 2,
        ownerY + 24,
        {
          align: "center",
        },
      );
    }
    doc.setTextColor(...TEXT);

    const footerY = ownerY + ownerHeight + 7;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.2);
    doc.setTextColor(...TEXT);
    doc.text("Copies forwarded to:", margin + 1, footerY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.9);
    doc.text("1. Director Town Planning.", margin + 6, footerY + 5);
    doc.text("2. Director Land / Estate Officer.", margin + 6, footerY + 10);
    doc.text("3. Seller.", margin + 6, footerY + 15);

    const signatureX = 111;
    const signatureY = footerY - 1;
    const signatureW = rightEdge - signatureX;
    const signatureH = 24;
    doc.setDrawColor(...THEME);
    doc.setLineWidth(0.35);
    doc.rect(signatureX, signatureY, signatureW, signatureH);
    doc.setFillColor(247, 249, 252);
    doc.rect(signatureX, signatureY, signatureW, 6, "F");
    doc.line(
      signatureX,
      signatureY + 6,
      signatureX + signatureW,
      signatureY + 6,
    );
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(...THEME);
    doc.text(
      "Signature of Transfer Officer",
      signatureX + signatureW / 2,
      signatureY + 4.2,
      {
        align: "center",
      },
    );
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.1);
    doc.setTextColor(...THEME);
    doc.text(
      "Deputy Director Land / Authorized Officer",
      signatureX + signatureW / 2,
      signatureY + signatureH + 5,
      {
        align: "center",
      },
    );

    doc.setDrawColor(...THEME);
    doc.setLineWidth(0.5);
    doc.line(margin, 286, rightEdge, 286);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Generated: ${new Date().toLocaleDateString("en-GB")} | RUDA Transfer Letter System | This is a computer-generated document.`,
      pageWidth / 2,
      290,
      { align: "center" },
    );

    openPdfPreview(
      doc,
      `Transfer Letter - Plot ${details.plotNo || ""}`,
      previewWindow,
    );
  } catch (error) {
    if (previewWindow && !previewWindow.closed) previewWindow.close();
    console.error("Transfer letter generation failed", error);
    alert(
      "Failed to generate the transfer letter. Please check the entered details and uploaded photographs and try again.",
    );
  }
};

const cleanInputValue = (value) => {
  const text = normalizeText(value);
  return text === "-" ? "" : text;
};

const Input = ({ label, required, ...props }) => (
  <label className="block min-w-0">
    <span className="mb-1 block text-[9px] font-semibold text-slate-500">
      {label}
      {required ? <span className="text-red-500"> *</span> : null}
    </span>
    <input
      {...props}
      className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[11px] text-slate-700 outline-none transition focus:border-[#0B7A3B] dark:border-white/10 dark:bg-white/5 dark:text-white"
    />
  </label>
);

const Select = ({ label, required, children, ...props }) => (
  <label className="block min-w-0">
    <span className="mb-1 block text-[9px] font-semibold text-slate-500">
      {label}
      {required ? <span className="text-red-500"> *</span> : null}
    </span>
    <select
      {...props}
      className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[11px] text-slate-700 outline-none transition focus:border-[#0B7A3B] dark:border-white/10 dark:bg-[#0d1b15] dark:text-white"
    >
      {children}
    </select>
  </label>
);

const Section = ({ number, title, subtitle, children }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-white/10 dark:bg-[#0d1b15]">
    <div className="mb-3 flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-sm font-black text-emerald-800">
        {number}
      </span>
      <div>
        <h2 className="text-xs font-semibold text-[#10203a] dark:text-white">
          {title}
        </h2>
        <p className="text-[9px] text-slate-400">{subtitle}</p>
      </div>
    </div>
    {children}
  </section>
);

const UploadBox = ({
  label,
  required,
  file,
  onChange,
  accept = "image/*,.pdf",
}) => {
  const inputRef = useRef(null);

  return (
    <div>
      <div className="mb-1 text-[9px] font-semibold text-slate-500">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => onChange(event.target.files?.[0] || null)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`flex h-[62px] w-full flex-col items-center justify-center rounded-lg border border-dashed px-2 text-center text-[9px] transition ${
          file
            ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10"
            : "border-slate-300 bg-slate-50 text-slate-500 hover:border-[#0B7A3B] dark:border-white/15 dark:bg-white/5"
        }`}
      >
        {file ? (
          <>
            <Check size={16} className="mb-1 text-[#0B7A3B]" />
            <span className="max-w-full truncate font-semibold">
              {file.name}
            </span>
          </>
        ) : (
          <>
            <UploadCloud size={16} className="mb-1 text-[#0B7A3B]" />
            Click to upload
          </>
        )}
      </button>
    </div>
  );
};

export default function TransferPlotData({
  parcel: parcelProp,
  filters: filtersProp,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const parcel =
    parcelProp ||
    location.state?.parcel ||
    location.state?.selectedPlot ||
    location.state?.plot ||
    location.state?.feature ||
    null;
  const filters = filtersProp || location.state?.filters || {};

  const sourceDetails = useMemo(() => {
    if (!parcel) return {};
    try {
      return buildPlotDetails(parcel, filters);
    } catch (error) {
      console.warn("Could not read selected plot details", error);
      return {};
    }
  }, [parcel, filters]);

  const [plot, setPlot] = useState(() => ({
    project: cleanInputValue(sourceDetails.project),
    block: cleanInputValue(sourceDetails.block),
    phase: cleanInputValue(sourceDetails.phase),
    plotNo: cleanInputValue(sourceDetails.plotNo),
    plotArea: cleanInputValue(sourceDetails.plotArea),
    plotType: cleanInputValue(sourceDetails.landUse),
    roadFacing: cleanInputValue(sourceDetails.roadFacing),
    transferPlotNo: cleanInputValue(sourceDetails.transferPlotNo),
    transferCategory: cleanInputValue(sourceDetails.transferCategory),
    uniqueId: cleanInputValue(sourceDetails.uniqueId),
  }));

  const currentOwner = cleanInputValue(sourceDetails.owner);

  const [form, setForm] = useState(() => ({
    letterNo: "",
    owcNo: "",
    transferNo: cleanInputValue(sourceDetails.transferSrNo),
    transferMode: "Normal",
    buildingPeriod: "",
    buildingExpiryDate: "",
    buildingCompletionDate: "",
    previousRefNo: "",

    originalAllotteeName: currentOwner,
    originalRelationType: "S/O",
    originalRelationName: "",

    sellerName: currentOwner,
    sellerRelationType: "S/O",
    sellerRelationName: "",
    sellerCnic: "",
    multipleSeller: "No",

    buyerName: "",
    buyerRelationType: "S/O",
    buyerRelationName: "",
    buyerCnic: "",
    multipleBuyer: "No",

    plotPrice: "",
    notes: "",
    declaration: true,
  }));

  const [files, setFiles] = useState({
    sellerPhoto: null,
    buyerPhoto: null,
    ownerPhoto: null,
    sellerCnicDoc: null,
    buyerCnicDoc: null,
    transferDeed: null,
  });

  const setFormField = (key, value) =>
    setForm((previous) => ({ ...previous, [key]: value }));
  const setPlotField = (key, value) =>
    setPlot((previous) => ({ ...previous, [key]: value }));
  const setFileField = (key, value) =>
    setFiles((previous) => ({ ...previous, [key]: value }));

  const validateForLetter = () => {
    const required = [
      [plot.project, "Project / Scheme"],
      [plot.block, "Block"],
      [plot.plotNo, "Plot No."],
      [form.letterNo, "Transfer Letter No."],
      [form.owcNo, "OWC No."],
      [form.transferNo, "Transfer No."],
      [form.transferMode, "Transfer Mode"],
      [form.originalAllotteeName, "Original Allottee Name"],
      [form.originalRelationName, "Original Allottee Father / Husband Name"],
      [form.sellerName, "Seller Name"],
      [form.sellerRelationName, "Seller Father / Husband Name"],
      [form.sellerCnic, "Seller CNIC"],
      [form.buyerName, "Buyer Name"],
      [form.buyerRelationName, "Buyer Father / Husband Name"],
      [form.buyerCnic, "Buyer CNIC"],
    ];

    const missing = required.filter(([value]) => !normalizeText(value));
    if (missing.length) {
      alert(
        `Please complete: ${missing.map(([, label]) => label).join(", ")}.`,
      );
      return false;
    }

    if (!files.sellerPhoto || !files.buyerPhoto || !files.ownerPhoto) {
      alert(
        "Please upload Seller + Identification Officer, Buyer + Identification Officer, and New Owner photographs.",
      );
      return false;
    }

    if (!form.declaration) {
      alert("Please confirm that the provided information is accurate.");
      return false;
    }

    return true;
  };

  const buildTransferData = (previewWindow) => ({
    letterNo: normalizeText(form.letterNo),
    owcNo: normalizeText(form.owcNo),
    transferNo: normalizeText(form.transferNo),
    transferMode: normalizeText(form.transferMode, "Normal"),
    buildingPeriod: normalizeText(form.buildingPeriod),
    buildingExpiryDate: normalizeText(form.buildingExpiryDate),
    buildingCompletionDate: normalizeText(form.buildingCompletionDate),
    previousRefNo: normalizeText(form.previousRefNo),
    originalAllotteeName: normalizeText(form.originalAllotteeName),
    originalRelationType: normalizeText(form.originalRelationType),
    originalRelationName: normalizeText(form.originalRelationName),
    sellerName: normalizeText(form.sellerName),
    sellerRelationType: normalizeText(form.sellerRelationType),
    sellerRelationName: normalizeText(form.sellerRelationName),
    sellerCnic: normalizeText(form.sellerCnic),
    multipleSeller: normalizeText(form.multipleSeller, "No"),
    buyerName: normalizeText(form.buyerName),
    buyerRelationType: normalizeText(form.buyerRelationType),
    buyerRelationName: normalizeText(form.buyerRelationName),
    buyerCnic: normalizeText(form.buyerCnic),
    multipleBuyer: normalizeText(form.multipleBuyer, "No"),
    sellerImage: files.sellerPhoto,
    buyerImage: files.buyerPhoto,
    ownerImage: files.ownerPhoto,
    sellerCrop: { zoom: 1, x: 0, y: 0 },
    buyerCrop: { zoom: 1, x: 0, y: 0 },
    ownerCrop: { zoom: 1, x: 0, y: 0 },
    previewWindow,
  });

  const handlePrintTransferLetter = async () => {
    if (!validateForLetter()) return;

    const previewWindow = createPdfPreviewWindow("Transfer Letter");
    if (!previewWindow) return;

    await generateTransferLetterPdf({
      parcel,
      filters,
      detailsOverride: {
        project: normalizeText(plot.project),
        block: normalizeText(plot.block),
        phase: normalizeText(plot.phase),
        plotNo: normalizeText(plot.plotNo),
        plotArea: normalizeText(plot.plotArea),
        landUse: normalizeText(plot.plotType),
        roadFacing: normalizeText(plot.roadFacing),
        transferPlotNo: normalizeText(plot.transferPlotNo),
        transferCategory: normalizeText(plot.transferCategory),
        uniqueId: normalizeText(plot.uniqueId),
        owner: normalizeText(form.sellerName),
      },
      transferData: buildTransferData(previewWindow),
    });
  };

  const handleSaveDraft = () => {
    const draft = {
      plot,
      form,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem("ruda-transfer-plot-draft", JSON.stringify(draft));
    alert("Transfer letter draft saved on this browser.");
  };

  const handleSendForApproval = () => {
    if (!validateForLetter()) return;
    const draft = {
      plot,
      form,
      status: "ready-for-approval",
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem("ruda-transfer-plot-draft", JSON.stringify(draft));
    alert(
      "Transfer data is complete and saved locally. Connect this button to your approval API when the backend endpoint is available.",
    );
  };

  const selectedPlotItems = [
    ["Plot No", plot.plotNo],
    ["Project", plot.project],
    ["Block", plot.block],
    ["Plot Type", plot.plotType],
    ["Plot Area", plot.plotArea],
    ["Current Owner", form.sellerName],
  ];

  const summaryItems = [
    ["Plot No", plot.plotNo],
    ["Project", plot.project],
    ["Block", plot.block],
    ["Plot Type", plot.plotType],
    ["Plot Area", plot.plotArea],
    ["Current Owner", form.sellerName],
    ["New Owner", form.buyerName || "Not entered"],
  ];

  const applicationComplete = Boolean(
    plot.project &&
    plot.block &&
    plot.plotNo &&
    form.letterNo &&
    form.owcNo &&
    form.transferNo &&
    form.sellerName &&
    form.sellerCnic &&
    form.buyerName &&
    form.buyerCnic,
  );
  const photosComplete = Boolean(
    files.sellerPhoto && files.buyerPhoto && files.ownerPhoto,
  );

  return (
    <AdminPage>
      <div className="mx-auto max-w-[1680px] p-3 md:p-5">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-black font-semibold text-[#10203a] dark:text-white md:text-2xl">
              Transfer Plot Data
            </h1>
            <p className="text-[12px] text-slate-400">
              Plot Management / Plot Details / Transfer Plot Data
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/plot-management/details")}
            className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-bold text-slate-600 sm:flex dark:border-white/10 dark:bg-[#0d1b15] dark:text-white"
          >
            <Map size={14} /> View Plot
          </button>
        </div>

        <div className="grid gap-3 xl:grid-cols-[1fr_260px]">
          <div className="space-y-3">
            <section className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-white/10 dark:bg-[#0d1b15]">
              <div className="mb-3 flex items-center gap-2">
                <FileText size={16} className="text-[#0B7A3B]" />
                <h2 className="text-xs font-semibold text-[#10203a] dark:text-white">
                  Selected Plot
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
                {selectedPlotItems.map(([key, value]) => (
                  <div key={key}>
                    <div className="text-[10px] uppercase tracking-wide text-slate-400">
                      {key}
                    </div>
                    <div className="mt-1 text-[12px] font-bold text-slate-700 dark:text-white">
                      {value || "—"}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <Section
              number="1"
              title="Transfer Information"
              subtitle="Transfer-letter and selected plot details"
            >
              <div className="grid gap-2 md:grid-cols-4">
                <Input
                  label="Transfer Letter No."
                  required
                  value={form.letterNo}
                  onChange={(event) =>
                    setFormField("letterNo", event.target.value)
                  }
                  placeholder="Enter letter number"
                />
                <Input
                  label="OWC No."
                  required
                  value={form.owcNo}
                  onChange={(event) =>
                    setFormField("owcNo", event.target.value)
                  }
                  placeholder="Enter OWC number"
                />
                <Input
                  label="Transfer No."
                  required
                  value={form.transferNo}
                  onChange={(event) =>
                    setFormField("transferNo", event.target.value)
                  }
                  placeholder="Enter transfer number"
                />
                <Input
                  label="Transfer Mode"
                  required
                  value={form.transferMode}
                  onChange={(event) =>
                    setFormField("transferMode", event.target.value)
                  }
                  placeholder="e.g. Normal"
                />
              </div>

              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                <Input
                  label="Scheme / Project"
                  required
                  value={plot.project}
                  onChange={(e) => setPlotField("project", e.target.value)}
                />
                <Input
                  label="Block"
                  required
                  value={plot.block}
                  onChange={(e) => setPlotField("block", e.target.value)}
                />
                <Input
                  label="Phase"
                  value={plot.phase}
                  onChange={(e) => setPlotField("phase", e.target.value)}
                />
                <Input
                  label="Plot No."
                  required
                  value={plot.plotNo}
                  onChange={(e) => setPlotField("plotNo", e.target.value)}
                />
                <Input
                  label="Plot Area"
                  value={plot.plotArea}
                  onChange={(e) => setPlotField("plotArea", e.target.value)}
                />
              </div>

              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                <Input
                  label="Plot Type"
                  value={plot.plotType}
                  onChange={(e) => setPlotField("plotType", e.target.value)}
                />
                <Input
                  label="Road Facing"
                  value={plot.roadFacing}
                  onChange={(e) => setPlotField("roadFacing", e.target.value)}
                />
                <Input
                  label="TR Plot No."
                  value={plot.transferPlotNo}
                  onChange={(e) =>
                    setPlotField("transferPlotNo", e.target.value)
                  }
                />
                <Input
                  label="TR Category"
                  value={plot.transferCategory}
                  onChange={(e) =>
                    setPlotField("transferCategory", e.target.value)
                  }
                />
                <Input
                  label="Unique ID"
                  value={plot.uniqueId}
                  onChange={(e) => setPlotField("uniqueId", e.target.value)}
                />
              </div>
            </Section>

            <Section
              number="2"
              title="Current Owner Details"
              subtitle="Original allottee / previous title holder and seller information"
            >
              <div className="grid gap-2 md:grid-cols-3">
                <Input
                  label="Original Allottee Name"
                  required
                  value={form.originalAllotteeName}
                  onChange={(e) =>
                    setFormField("originalAllotteeName", e.target.value)
                  }
                />
                <Select
                  label="Original Allottee Relation"
                  value={form.originalRelationType}
                  onChange={(e) =>
                    setFormField("originalRelationType", e.target.value)
                  }
                >
                  <option value="S/O">S/O</option>
                  <option value="D/O">D/O</option>
                  <option value="W/O">W/O</option>
                </Select>
                <Input
                  label="Father / Husband Name"
                  required
                  value={form.originalRelationName}
                  onChange={(e) =>
                    setFormField("originalRelationName", e.target.value)
                  }
                />
              </div>

              <div className="mt-2 grid gap-2 md:grid-cols-3 xl:grid-cols-5">
                <Input
                  label="Seller Name"
                  required
                  value={form.sellerName}
                  onChange={(e) => setFormField("sellerName", e.target.value)}
                />
                <Select
                  label="Seller Relation"
                  value={form.sellerRelationType}
                  onChange={(e) =>
                    setFormField("sellerRelationType", e.target.value)
                  }
                >
                  <option value="S/O">S/O</option>
                  <option value="D/O">D/O</option>
                  <option value="W/O">W/O</option>
                </Select>
                <Input
                  label="Father / Husband Name"
                  required
                  value={form.sellerRelationName}
                  onChange={(e) =>
                    setFormField("sellerRelationName", e.target.value)
                  }
                />
                <Input
                  label="CNIC No."
                  required
                  value={form.sellerCnic}
                  onChange={(e) => setFormField("sellerCnic", e.target.value)}
                  placeholder="XXXXX-XXXXXXX-X"
                />
                <Select
                  label="Multiple Seller"
                  value={form.multipleSeller}
                  onChange={(e) =>
                    setFormField("multipleSeller", e.target.value)
                  }
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </Select>
              </div>
            </Section>

            <Section
              number="3"
              title="New Owner Details"
              subtitle="Buyer / new owner information"
            >
              <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-5">
                <Input
                  label="Buyer Name"
                  required
                  value={form.buyerName}
                  onChange={(e) => setFormField("buyerName", e.target.value)}
                  placeholder="New owner name"
                />
                <Select
                  label="Buyer Relation"
                  value={form.buyerRelationType}
                  onChange={(e) =>
                    setFormField("buyerRelationType", e.target.value)
                  }
                >
                  <option value="S/O">S/O</option>
                  <option value="D/O">D/O</option>
                  <option value="W/O">W/O</option>
                </Select>
                <Input
                  label="Father / Husband Name"
                  required
                  value={form.buyerRelationName}
                  onChange={(e) =>
                    setFormField("buyerRelationName", e.target.value)
                  }
                />
                <Input
                  label="CNIC No."
                  required
                  value={form.buyerCnic}
                  onChange={(e) => setFormField("buyerCnic", e.target.value)}
                  placeholder="XXXXX-XXXXXXX-X"
                />
                <Select
                  label="Multiple Buyer"
                  value={form.multipleBuyer}
                  onChange={(e) =>
                    setFormField("multipleBuyer", e.target.value)
                  }
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </Select>
              </div>
            </Section>

            <Section
              number="4"
              title="Supporting Documents"
              subtitle="The first three photographs are used directly in the printed transfer letter"
            >
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <UploadBox
                  label="Seller + Identification Officer"
                  required
                  accept="image/*"
                  file={files.sellerPhoto}
                  onChange={(file) => setFileField("sellerPhoto", file)}
                />
                <UploadBox
                  label="Buyer + Identification Officer"
                  required
                  accept="image/*"
                  file={files.buyerPhoto}
                  onChange={(file) => setFileField("buyerPhoto", file)}
                />
                <UploadBox
                  label="New Owner Photograph"
                  required
                  accept="image/*"
                  file={files.ownerPhoto}
                  onChange={(file) => setFileField("ownerPhoto", file)}
                />
                <UploadBox
                  label="Current Owner CNIC"
                  file={files.sellerCnicDoc}
                  onChange={(file) => setFileField("sellerCnicDoc", file)}
                />
                <UploadBox
                  label="New Owner CNIC"
                  file={files.buyerCnicDoc}
                  onChange={(file) => setFileField("buyerCnicDoc", file)}
                />
                <UploadBox
                  label="Transfer Deed"
                  file={files.transferDeed}
                  onChange={(file) => setFileField("transferDeed", file)}
                />
              </div>
            </Section>

            <Section
              number="5"
              title="Review & Submission"
              subtitle="Building information, previous reference and final declaration"
            >
              <div className="grid gap-2 md:grid-cols-4">
                <Input
                  label="Building Period"
                  value={form.buildingPeriod}
                  onChange={(e) =>
                    setFormField("buildingPeriod", e.target.value)
                  }
                  placeholder="e.g. 3 Years"
                />
                <Input
                  label="Building Expiry Date"
                  type="date"
                  value={form.buildingExpiryDate}
                  onChange={(e) =>
                    setFormField("buildingExpiryDate", e.target.value)
                  }
                />
                <Input
                  label="Building Completion Date"
                  type="date"
                  value={form.buildingCompletionDate}
                  onChange={(e) =>
                    setFormField("buildingCompletionDate", e.target.value)
                  }
                />
                <Input
                  label="Previous Allotment / Exemption Ref. No."
                  value={form.previousRefNo}
                  onChange={(e) =>
                    setFormField("previousRefNo", e.target.value)
                  }
                  placeholder="Optional reference"
                />
              </div>

              <div className="mt-2 grid gap-2 lg:grid-cols-[1fr_1.2fr_1.1fr] lg:items-end">
                <Input
                  label="Plot Price / Consideration (PKR)"
                  value={form.plotPrice}
                  onChange={(e) => setFormField("plotPrice", e.target.value)}
                  placeholder="Enter plot price"
                />
                <Input
                  label="Additional Notes (Optional)"
                  value={form.notes}
                  onChange={(e) => setFormField("notes", e.target.value)}
                  placeholder="Notes / remarks"
                />
                <label className="flex min-h-9 items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 text-[9px] text-emerald-800">
                  <input
                    type="checkbox"
                    checked={form.declaration}
                    onChange={(e) =>
                      setFormField("declaration", e.target.checked)
                    }
                    className="accent-[#0B7A3B]"
                  />
                  I confirm that the provided information is accurate.
                </label>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => navigate("/plot-management/details")}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-bold text-slate-600 dark:border-white/10 dark:text-white"
                >
                  <X size={13} /> Cancel
                </button>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-bold text-slate-600 dark:border-white/10 dark:text-white"
                  >
                    <Save size={13} /> Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={handleSendForApproval}
                    className="flex items-center gap-2 rounded-lg border border-[#0B7A3B]/25 bg-emerald-50 px-3 py-2 text-[12px] font-bold text-[#0B7A3B]"
                  >
                    <Send size={13} /> Send for Approval
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintTransferLetter}
                    className="flex items-center gap-2 rounded-lg bg-[#0B7A3B] px-4 py-2 text-[12px] font-bold text-white"
                  >
                    <Printer size={13} /> Generate / Print Letter
                  </button>
                </div>
              </div>
            </Section>
          </div>

          <aside className="space-y-3">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0d1b15]">
              <h3 className="text-xs font-semibold text-[#10203a] dark:text-white">
                Transfer Summary
              </h3>
              <div className="mt-3 space-y-2 text-[12px]">
                {summaryItems.map(([key, value]) => (
                  <div
                    key={key}
                    className="flex gap-2 border-b border-slate-100 pb-2 dark:border-white/5"
                  >
                    <span className="flex-1 text-slate-400">{key}</span>
                    <span className="text-right font-bold text-slate-700 dark:text-white">
                      {value || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0d1b15]">
              <h3 className="text-xs font-semibold text-[#10203a] dark:text-white">
                Process Checklist
              </h3>
              <div className="mt-3 space-y-2 text-[12px]">
                {[
                  ["Complete transfer application", applicationComplete],
                  ["Upload required photographs", photosComplete],
                  ["Verify information", form.declaration],
                  ["Generate transfer letter", false],
                  ["Department review", false],
                  ["Final approval", false],
                ].map(([label, done]) => (
                  <div key={label} className="flex items-center gap-2">
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                        done
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-slate-300 text-transparent"
                      }`}
                    >
                      {done ? <Check size={10} /> : "·"}
                    </span>
                    <span className="text-slate-500">{label}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0d1b15]">
              <h3 className="text-xs font-semibold text-[#10203a] dark:text-white">
                Approval Workflow
              </h3>
              <div className="mt-3 space-y-3 text-[12px]">
                {[
                  "Application Submission",
                  "Department Review",
                  "Legal Verification",
                  "Final Approval",
                ].map((step, index) => (
                  <div key={step} className="flex gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 font-black text-emerald-800">
                      {index + 1}
                    </span>
                    <div>
                      <div className="font-bold text-slate-700 dark:text-white">
                        {step}
                      </div>
                      <div className="text-[9px] text-slate-400">Pending</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AdminPage>
  );
}

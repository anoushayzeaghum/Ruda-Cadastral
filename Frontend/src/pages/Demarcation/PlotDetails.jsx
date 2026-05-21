import React from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export default function PlotDetails({ parcel = null }) {
  const p = parcel?.properties ?? {};

  const fields = [
    {
      label: "Division",
      value:
        p.division_name ||
        p.division ||
        p.division_name_en ||
        p.division_i ||
        "Lahore",
    },
    {
      label: "District",
      value:
        p.district_name ||
        p.district ||
        p.district_name_en ||
        p.district_i ||
        "Sheikhupura",
    },
    {
      label: "Tehsil",
      value:
        p.tehsil_name ||
        p.tehsil ||
        p.tehsil_name_en ||
        p.tehsil_i ||
        "Ferozwala",
    },
    {
      label: "Mouza",
      value: p.mouza_name || p.mouza || p.mouza_name_en || p.mouza_id || "-",
    },
    {
      label: "Type",
      value: p.type || p.landuse || p.land_type || "MU",
    },
    {
      label: "Khasra",
      value:
        p.k ??
        p.K ??
        p.khasra ??
        p.khasra_no ??
        p.khasra_id ??
        p.karam ??
        p.karam_no ??
        "-",
    },
    {
      label: "Karam",
      value: p.karam ?? p.karam_no ?? p.karam_value ?? "-",
    },
    {
      label: "Area",
      value: p._area_acres
        ? `${p._area_acres.toFixed(2)} Acres`
        : p._area_m2
          ? `${p._area_m2} m²`
          : (p.area ?? "-"),
    },
  ];

  const safeValue = (...values) => {
    for (const value of values) {
      if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
      ) {
        return String(value);
      }
    }
    return "-";
  };

  const reportDetails = {
    town: safeValue(
      p.town,
      p.town_name,
      p.scheme,
      p.scheme_name,
      p.society,
      p.society_name,
      "RUDA Zone",
    ),
    block: safeValue(p.block, p.block_name, p.sector, p.phase, "-"),
    plotNo: safeValue(
      p.plotno,
      p.plot_no,
      p.plot_number,
      p.khasra,
      p.khasra_no,
      p.khasra_id,
      p.murabba,
      p.murabba_no,
      p.murabba_id,
      parcel?.id,
      "0",
    ),
    division: safeValue(
      p.division_name,
      p.division,
      p.division_name_en,
      p.division_i,
      "Lahore",
    ),
    district: safeValue(
      p.district_name,
      p.district,
      p.district_name_en,
      p.district_i,
      "Sheikhupura",
    ),
    tehsil: safeValue(
      p.tehsil_name,
      p.tehsil,
      p.tehsil_name_en,
      p.tehsil_i,
      "Ferozwala",
    ),
    landuse: safeValue(p.landuse, p.type, p.land_type, "MU"),
    societyType: safeValue(
      p.society_type,
      p.societytyp,
      p.society_name,
      p.society,
      "Residential / Planned Development",
    ),
    mouza: safeValue(p.mouza_name, p.mouza, p.mouza_name_en, p.mouza_id, "-"),
    area: safeValue(
      p._area_acres ? `${p._area_acres.toFixed(2)} Acres` : null,
      p._area_m2 ? `${p._area_m2} m²` : null,
      p.area,
      "-",
    ),
  };

  const applicantInfo = {
    applicantName: safeValue(
      p.owner_name,
      p.applicant_name,
      p.applicant,
      p.client_name,
      "Applicant",
    ),
    mobileNo: safeValue(
      p.mobile,
      p.phone,
      p.contact_no,
      p.contact,
      "0300-3425163", // dummy number
    ),
    date: new Date().toLocaleDateString("en-GB"),
    applicantId: safeValue(
      p.applicant_id,
      p.owner_id,
      p.cnic,
      p.reference_no,
      safeValue(parcel?.id, "N/A"),
    ),
    email: safeValue(
      p.email,
      p.owner_email,
      p.applicant_email,
      "applicant@gmail.com", // dummy email
    ),
  };

  const getCornerCoordinates = (geometry) => {
    if (!geometry) return [];

    let coords = [];
    if (geometry.type === "Polygon") {
      coords = geometry.coordinates?.[0] || [];
    } else if (geometry.type === "MultiPolygon") {
      coords = geometry.coordinates?.[0]?.[0] || [];
    }

    if (coords.length > 1) {
      const first = coords[0];
      const last = coords[coords.length - 1];
      if (first[0] === last[0] && first[1] === last[1]) {
        coords = coords.slice(0, coords.length - 1);
      }
    }

    return coords.slice(0, 4).map((coord, index) => ({
      label: String.fromCharCode(65 + index),
      lat: Number(coord[1]),
      lng: Number(coord[0]),
    }));
  };

  const getMapElement = () =>
    document.querySelector(".mapboxgl-canvas") ||
    document.querySelector(".mapboxgl-map") ||
    document.querySelector("canvas");

  const loadImage = (src) =>
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });

  const loadFirstAvailableImage = async (sources = []) => {
    for (const src of sources) {
      const img = await loadImage(src);
      if (img) return img;
    }
    return null;
  };

  const handlePrintReport = async () => {
    if (!parcel) return;

    const mapCanvas = document.querySelector(".mapboxgl-canvas");
    const mapElement = mapCanvas || getMapElement();

    if (!mapElement) {
      alert("Unable to find the map area for report generation.");
      return;
    }

    const controls = Array.from(
      document.querySelectorAll(
        ".mapboxgl-ctrl, .mapboxgl-ctrl-top-left, .mapboxgl-ctrl-top-right, .mapboxgl-ctrl-bottom-left, .mapboxgl-ctrl-bottom-right",
      ),
    );

    controls.forEach((ctrl) => {
      ctrl.dataset.originalDisplay = ctrl.style.display || "";
      ctrl.style.display = "none";
    });

    try {
      let imageData;

      if (mapCanvas && typeof mapCanvas.toDataURL === "function") {
        try {
          imageData = mapCanvas.toDataURL("image/png");
        } catch (error) {
          console.warn(
            "Canvas toDataURL failed, falling back to html2canvas",
            error,
          );
        }
      }

      if (!imageData) {
        const canvas = await html2canvas(mapElement, {
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          scale: 2,
        });
        imageData = canvas.toDataURL("image/png");
      }

      const [gopLogo, rudaLogo] = await Promise.all([
        loadFirstAvailableImage([`${window.location.origin}/gop_logo.png`]),
        loadFirstAvailableImage([
          `${window.location.origin}/Ruda_logo.jpg`,
          `${window.location.origin}/Ruda_logo.jpg`,
          `${window.location.origin}/ruda_logo.jpg`,
          `${window.location.origin}/ruda_logo.jpg`,
        ]),
      ]);

      const cornerCoords = getCornerCoordinates(parcel.geometry);

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const marginX = 8;
      const marginY = 8;
      const contentX = marginX;
      const contentY = marginY;
      const contentWidth = pageWidth - marginX * 2;
      const contentHeight = pageHeight - marginY * 2;

      const borderColor = [120, 120, 120];
      const sectionHeaderFill = [176, 196, 222];
      const sectionHeaderText = [0, 0, 0];
      const titleBlue = [0, 70, 140];

      doc.setDrawColor(...borderColor);
      doc.setLineWidth(0.25);

      const drawSectionHeader = (x, y, w, h, title) => {
        doc.setFillColor(...sectionHeaderFill);
        doc.rect(x, y, w, h, "F");
        doc.rect(x, y, w, h);
        doc.setFont("times", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(...sectionHeaderText);
        doc.text(String(title).toUpperCase(), x + 2, y + h - 2.2);
      };

      const drawCell = (x, y, w, h, label, value, options = {}) => {
        const labelW = options.labelW ?? Math.min(28, w * 0.28);
        const valueW = w - labelW;

        doc.rect(x, y, labelW, h);
        doc.rect(x + labelW, y, valueW, h);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(35, 35, 35);

        const labelLines = doc.splitTextToSize(
          String(label || ""),
          labelW - 2.5,
        );
        const valueLines = doc.splitTextToSize(
          String(value || "-"),
          valueW - 2.5,
        );

        doc.text(labelLines, x + 1.5, y + 4.2);
        doc.text(valueLines, x + labelW + 1.5, y + 4.2);
      };

      const drawSimpleCell = (x, y, w, h, text, align = "left") => {
        doc.rect(x, y, w, h);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(35, 35, 35);

        const lines = doc.splitTextToSize(String(text || "-"), w - 3);
        if (align === "center") {
          doc.text(lines, x + w / 2, y + 4.2, { align: "center" });
        } else {
          doc.text(lines, x + 1.5, y + 4.2);
        }
      };

      let y = contentY;

      // HEADER
      const headerHeight = 30;
      const titleY1 = y + 14;
      const titleY2 = y + 24;

      if (gopLogo) {
        try {
          doc.addImage(
            gopLogo,
            "PNG",
            contentX + 2,
            y + 1,
            28,
            26,
            undefined,
            "FAST",
          );
        } catch (e) {
          console.warn("Failed to place GOP logo", e);
        }
      }

      if (rudaLogo) {
        try {
          doc.addImage(
            rudaLogo,
            "WEBP",
            contentX + contentWidth - 28 - 2,
            y + 1,
            26,
            26,
            undefined,
            "FAST",
          );
        } catch (e) {
          try {
            doc.addImage(
              rudaLogo,
              "PNG",
              contentX + contentWidth - 28 - 2,
              y + 1,
              28,
              14,
              undefined,
              "FAST",
            );
          } catch (err) {
            console.warn("Failed to place RUDA logo", err);
          }
        }
      }

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...titleBlue);
      doc.setFontSize(24);
      doc.text(
        "PLOT DEMARCATION REPORT",
        contentX + contentWidth / 2,
        titleY1,
        {
          align: "center",
        },
      );
      doc.setFontSize(18);
      doc.text(
        "Ravi Urban Development Authority",
        contentX + contentWidth / 2,
        titleY2,
        {
          align: "center",
        },
      );

      y += headerHeight + 8;

      // APPLICANT INFO
      const sectionH = 8;
      drawSectionHeader(
        contentX,
        y,
        contentWidth,
        sectionH,
        "Applicant Information",
      );
      y += sectionH;

      const applicantRowH = 8;
      const appCols = [
        27,
        75,
        22,
        30,
        20,
        contentWidth - (27 + 75 + 22 + 30 + 20),
      ];

      let x = contentX;
      drawSimpleCell(x, y, appCols[0], applicantRowH, "Name");
      x += appCols[0];
      drawSimpleCell(
        x,
        y,
        appCols[1],
        applicantRowH,
        applicantInfo.applicantName,
      );
      x += appCols[1];
      drawSimpleCell(x, y, appCols[2], applicantRowH, "Mobile No.");
      x += appCols[2];
      drawSimpleCell(x, y, appCols[3], applicantRowH, applicantInfo.mobileNo);
      x += appCols[3];
      drawSimpleCell(x, y, appCols[4], applicantRowH, "Date");
      x += appCols[4];
      drawSimpleCell(x, y, appCols[5], applicantRowH, applicantInfo.date);
      y += applicantRowH;

      x = contentX;
      drawSimpleCell(x, y, appCols[0], applicantRowH, "Applicant ID");
      x += appCols[0];
      drawSimpleCell(
        x,
        y,
        appCols[1],
        applicantRowH,
        applicantInfo.applicantId,
      );
      x += appCols[1];
      drawSimpleCell(x, y, appCols[2], applicantRowH, "Email");
      x += appCols[2];
      drawSimpleCell(
        x,
        y,
        contentWidth - (appCols[0] + appCols[1] + appCols[2]),
        applicantRowH,
        applicantInfo.email,
      );
      y += applicantRowH;

      // PROJECT DETAILS
      drawSectionHeader(contentX, y, contentWidth, sectionH, "Project Details");
      y += sectionH;

      const rowH = 8;
      const colWidths = [
        27,
        75,
        22,
        30,
        20,
        contentWidth - (27 + 75 + 22 + 30 + 20),
      ];

      // Row 1
      x = contentX;
      drawSimpleCell(x, y, colWidths[0], rowH, "Town");
      x += colWidths[0];
      drawSimpleCell(x, y, colWidths[1], rowH, reportDetails.town);
      x += colWidths[1];
      drawSimpleCell(x, y, colWidths[2], rowH, "Block");
      x += colWidths[2];
      drawSimpleCell(x, y, colWidths[3], rowH, reportDetails.block);
      x += colWidths[3];
      drawSimpleCell(x, y, colWidths[4], rowH, "Plot No.");
      x += colWidths[4];
      drawSimpleCell(x, y, colWidths[5], rowH, reportDetails.plotNo);
      y += rowH;

      // Row 2
      x = contentX;
      drawSimpleCell(x, y, colWidths[0], rowH, "Division");
      x += colWidths[0];
      drawSimpleCell(x, y, colWidths[1], rowH, reportDetails.division);
      x += colWidths[1];
      drawSimpleCell(x, y, colWidths[2], rowH, "District");
      x += colWidths[2];
      drawSimpleCell(x, y, colWidths[3], rowH, reportDetails.district);
      x += colWidths[3];
      drawSimpleCell(x, y, colWidths[4], rowH, "Tehsil");
      x += colWidths[4];
      drawSimpleCell(x, y, colWidths[5], rowH, reportDetails.tehsil);
      y += rowH;

      // Row 3
      x = contentX;
      drawSimpleCell(x, y, colWidths[0], rowH, "Landuse");
      x += colWidths[0];
      drawSimpleCell(x, y, colWidths[1], rowH, reportDetails.landuse);
      x += colWidths[1];
      drawSimpleCell(x, y, colWidths[2], rowH, "Mouza");
      x += colWidths[2];
      drawSimpleCell(x, y, colWidths[3], rowH, reportDetails.mouza);
      x += colWidths[3];
      drawSimpleCell(x, y, colWidths[4], rowH, "Area");
      x += colWidths[4];
      drawSimpleCell(x, y, colWidths[5], rowH, reportDetails.area);
      y += rowH;

      // Row 4
      drawCell(
        contentX,
        y,
        contentWidth,
        rowH,
        "Society Type",
        reportDetails.societyType,
        { labelW: 27 },
      );
      y += rowH + 4;

      // LOWER HALF: MAP LEFT / COORDINATES RIGHT
      const gap = 0;
      const leftW = (contentWidth - gap) * 0.53;
      const rightW = contentWidth - leftW - gap;
      const lowerHeaderH = 8;
      const lowerBodyH = Math.min(92, contentHeight - (y - contentY) - 6);

      drawSectionHeader(
        contentX,
        y,
        leftW,
        lowerHeaderH,
        "Selected Plot Snapshot",
      );
      drawSectionHeader(
        contentX + leftW + gap,
        y,
        rightW,
        lowerHeaderH,
        "Demarcation Coordinates",
      );
      y += lowerHeaderH;

      doc.rect(contentX, y, leftW, lowerBodyH);
      doc.rect(contentX + leftW + gap, y, rightW, lowerBodyH);

      if (imageData) {
        doc.addImage(
          imageData,
          "PNG",
          contentX + 1.2,
          y + 1.2,
          leftW - 2.4,
          lowerBodyH - 2.4,
          undefined,
          "FAST",
        );
      }

      const coordX = contentX + leftW + gap;
      let cy = y;
      const coordRowH = 8;
      const coordCols = [16, 34, rightW - 16 - 34];

      const drawCoordRow = (rowY, point, lat, lng) => {
        let cx = coordX;
        drawSimpleCell(cx, rowY, coordCols[0], coordRowH, point, "center");
        cx += coordCols[0];
        drawSimpleCell(cx, rowY, coordCols[1], coordRowH, lat);
        cx += coordCols[1];
        drawSimpleCell(cx, rowY, coordCols[2], coordRowH, lng);
      };

      drawCoordRow(cy, "Point", "Latitude", "Longitude");
      cy += coordRowH;

      if (cornerCoords.length > 0) {
        cornerCoords.forEach((item) => {
          const lat =
            typeof item.lat === "number" && Number.isFinite(item.lat)
              ? item.lat.toFixed(6)
              : "-";
          const lng =
            typeof item.lng === "number" && Number.isFinite(item.lng)
              ? item.lng.toFixed(6)
              : "-";
          drawCoordRow(cy, item.label, lat, lng);
          cy += coordRowH;
        });
      } else {
        drawSimpleCell(
          coordX,
          cy,
          rightW,
          coordRowH,
          "No demarcation coordinates available.",
        );
        cy += coordRowH;
      }

      // EXTRA INFO (instead of empty rows)
      const extraRows = [
        ["Coordinate System", "WGS 84 (EPSG:4326)"],
        ["Units", "Decimal Degrees"],
        ["Area", String(reportDetails.area || "-")],
        ["Mouza", String(reportDetails.mouza || "-")],
        ["Landuse", String(reportDetails.landuse || "-")],
        ["Note", "Subject to field verification"],
      ];

      const infoRowH = 8;
      const infoCol1 = 34;
      const infoCol2 = rightW - infoCol1;

      cy += 2;

      extraRows.forEach(([label, value]) => {
        if (cy + infoRowH <= y + lowerBodyH) {
          drawSimpleCell(coordX, cy, infoCol1, infoRowH, label);
          drawSimpleCell(coordX + infoCol1, cy, infoCol2, infoRowH, value);
          cy += infoRowH;
        }
      });

      y += lowerBodyH + 4;

      // DISCLAIMER AND SIGNATURE
      const disclaimerHeaderH = 8;
      const disclaimerBodyH = 32;
      const signatureRowH = 12;

      drawSectionHeader(
        contentX,
        y,
        contentWidth,
        disclaimerHeaderH,
        "Disclaimer",
      );
      y += disclaimerHeaderH;

      // Main disclaimer box
      doc.rect(contentX, y, contentWidth, disclaimerBodyH);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.3);
      doc.setTextColor(35, 35, 35);

      const disclaimerLines = [
        "1. We hereby acknowledge that absence of surveyor and contractor/consultant at site during the agreed/scheduled site inspection will be subject to imposing relevant penalties in compliance with RUDA inspection procedures.",
        "2. We hereby confirm that all information and documents provided in this application comply with applicable rules, regulations and standards.",
        "3. If any delay occurs due to incorrect information provided by us in the submitted application, we hold ourselves solely responsible for the delay.",
        "4. We are liable for any legal obligations which may occur due to invalid / tampered documents being submitted along with this application.",
      ];

      let disclaimerTextY = y + 5;
      disclaimerLines.forEach((line) => {
        const wrapped = doc.splitTextToSize(line, contentWidth - 4);
        doc.text(wrapped, contentX + 2, disclaimerTextY);
        disclaimerTextY += wrapped.length * 4.2;
      });

      y += disclaimerBodyH;

      // Signature row
      doc.rect(contentX, y, contentWidth / 2, signatureRowH);
      doc.rect(contentX + contentWidth / 2, y, contentWidth / 2, signatureRowH);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Signature", contentX + 2, y + 8);
      doc.text("Date", contentX + contentWidth / 2 + 2, y + 8);

      y += signatureRowH;

      // FOOTER INFO BLOCK
      const footerTopGap = 6;
      y += footerTopGap;

      const footerHeight = 18;
      const footerY = y;

      const footerCol1 = 64;
      const footerCol2 = 50;
      const footerCol3 = 42;
      const footerCol4 = contentWidth - (footerCol1 + footerCol2 + footerCol3);

      const footerX1 = contentX;
      const footerX2 = footerX1 + footerCol1;
      const footerX3 = footerX2 + footerCol2;
      const footerX4 = footerX3 + footerCol3;

      // vertical separators only
      doc.setDrawColor(...borderColor);
      doc.setLineWidth(0.25);
      doc.line(footerX2, footerY, footerX2, footerY + footerHeight);
      doc.line(footerX3, footerY, footerX3, footerY + footerHeight);
      doc.line(footerX4, footerY, footerX4, footerY + footerHeight);

      // left block
      doc.setFont("helvetica", "normal");
      doc.setTextColor(110, 110, 110);

      doc.setFontSize(7.3);
      doc.text("Ravi Urban Development Authority", footerX1 + 1.5, footerY + 8);
      doc.text(
        "151 - Abu Bakar Block, Garden Town, Lahore",
        footerX1 + 1.5,
        footerY + 12,
      );
      doc.text("Punjab, Pakistan", footerX1 + 1.5, footerY + 16);

      // middle-left block
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.3);
      doc.setTextColor(90, 90, 90);
      doc.text("T. +92 (42) 99333531-6", footerX2 + 1.5, footerY + 8);
      doc.text("CS. 042-111-11 (RUDA) 7832", footerX2 + 1.5, footerY + 12);
      doc.text("E. info@ruda.gov.pk", footerX2 + 1.5, footerY + 16);

      // middle-right block
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.3);
      doc.setTextColor(90, 90, 90);
      doc.text("Customer Service", footerX3 + 1.5, footerY + 8);
      doc.text("customerservices@ruda.gov.pk", footerX3 + 1.5, footerY + 12);
      doc.text("www.ruda.gov.pk", footerX3 + 1.5, footerY + 16);

      // right block
      doc.setFont("times", "bold");
      doc.setFontSize(28);
      doc.setTextColor(95, 95, 95);
      doc.text("RUDA", footerX4 + footerCol4 / 2, footerY + 13, {
        align: "center",
      });

      const reportId = safeValue(
        p.plotno,
        p.plot_no,
        p.plot_number,
        p.khasra,
        p.khasra_no,
        p.murabba,
        p.murabba_no,
        parcel?.id,
        "plot",
      ).replace(/\s+/g, "_");

      doc.save(`Plot_Report_${reportId}.pdf`);
    } catch (err) {
      console.error("Print report failed", err);
      alert("Failed to generate demarcation report. Please try again.");
    } finally {
      controls.forEach((ctrl) => {
        ctrl.style.display = ctrl.dataset.originalDisplay || "";
        delete ctrl.dataset.originalDisplay;
      });
    }
  };

  return (
    <div className="bg-white border border-[#b8c2cc] shadow-[0_0_0_1px_rgba(0,0,0,0.02)] flex flex-col min-h-0 max-h-[355px]">
      <div className="h-[62px] border-b border-[#d4dbe2] px-4 flex items-center justify-between gap-3">
        <h2 className="text-[17px] font-bold uppercase tracking-wide text-[#5b5b5b]">
          Plot Details
        </h2>

        {parcel && (
          <button
            onClick={handlePrintReport}
            className="text-[12px] font-semibold tracking-wider text-white bg-green-700 px-2 py-2 rounded hover:bg-[#165c2d] transition"
            type="button"
          >
            Print Report
          </button>
        )}
      </div>

      <div className="p-4 h-full overflow-auto">
        {!parcel && (
          <div className="flex h-full items-center justify-center text-gray-400 text-sm">
            No plot selected.
          </div>
        )}

        {parcel && (
          <div className="space-y-3">
            {fields.map((f) => (
              <div
                key={f.label}
                className="flex justify-between items-center p-2 bg-gray-50 rounded"
              >
                <div className="text-sm text-gray-600">{f.label}</div>
                <div className="font-medium text-sm text-gray-800 text-right ml-3">
                  {String(f.value)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

import commercialPlot12Pdf from "../../assets/Commercial Plot-12.pdf";
import commercialPlot13Pdf from "../../assets/Commercial Plot-13.pdf";
import commercialPlot14Pdf from "../../assets/Commercial Plot-14.pdf";

const officialDemarcationPdfs = {
  12: commercialPlot12Pdf,
  13: commercialPlot13Pdf,
  14: commercialPlot14Pdf,
};

const safeValue = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "")
      return String(value);
  }
  return "-";
};

const getPlotPdfKey = (plotNo) => {
  const match = String(plotNo || "").match(/\d+/);
  return match ? match[0] : "";
};

const getCornerCoordinates = (geometry) => {
  if (!geometry) return [];

  let coords = [];
  if (geometry.type === "Polygon") coords = geometry.coordinates?.[0] || [];
  if (geometry.type === "MultiPolygon") coords = geometry.coordinates?.[0]?.[0] || [];

  if (coords.length > 1) {
    const first = coords[0];
    const last = coords[coords.length - 1];
    if (first?.[0] === last?.[0] && first?.[1] === last?.[1])
      coords = coords.slice(0, -1);
  }

  return coords.slice(0, 4).map((coord, index) => ({
    label: String.fromCharCode(65 + index),
    lat: Number(coord[1]),
    lng: Number(coord[0]),
  }));
};

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

export default function PlotDetails({ parcel = null, filters = {} }) {
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const p = parcel?.properties || {};

  const details = {
    project: safeValue(filters.projectName, p.project, p.project_name, p.project_id),
    block: safeValue(p.block, filters.block),
    plotNo: safeValue(p.plot_no, p.plotno, p.plot_number, parcel?.id),
    landUse: safeValue(p.type, p.land_use, p.name),
    plotArea: safeValue(p.plot_area, p.area),
    dimension: safeValue(p.dimension),
    roadFt: safeValue(p.rd_ft),
    roadFacing: safeValue(p.rd_facing),
    parkFront: safeValue(p.parkfront),
    storey: safeValue(p.storey),
    possession: safeValue(p.possession),
    possessionStatus: safeValue(p.poss_st),
    canceled: safeValue(p.canceled),
    sitePlan: safeValue(p.site_plan),
    uniqueId: safeValue(p.unique_id),
    transferSrNo: safeValue(p.tr_srno),
    owner: safeValue(p.tr_own),
    transferPlotNo: safeValue(p.tr_p_no),
    transferCategory: safeValue(p.tr_cate),
    remarks: safeValue(p.remarks),
    shapeArea: safeValue(p.shape_area),
    shapeLength: safeValue(p.shape_leng),
  };

  const fields = [
    ["Project", details.project],
    ["Block", details.block],
    ["Plot No", details.plotNo],
    ["Plot Type / Landuse", details.landUse],
    ["Plot Area", details.plotArea],
    ["Dimension", details.dimension],
    ["Road Width", details.roadFt],
    ["Road Facing", details.roadFacing],
    ["Park Front", details.parkFront],
    ["Storey", details.storey],
    ["Possession", details.possession],
    ["Possession Status", details.possessionStatus],
    ["Canceled", details.canceled],
    ["Site Plan", details.sitePlan],
    ["Unique ID", details.uniqueId],
    ["Owner", details.owner],
    ["Transfer Plot No", details.transferPlotNo],
    ["Transfer Category", details.transferCategory],
    ["Remarks", details.remarks],
  ];

  const handlePrintOfficialDemarcation = () => {
    const plotKey = getPlotPdfKey(details.plotNo);
    const pdfUrl = officialDemarcationPdfs[plotKey];

    if (!pdfUrl) {
      alert("Official demarcation is not available for this plot.");
      return;
    }

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      alert("Please allow popups to print official demarcation.");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Official Demarcation Plot ${plotKey}</title>
          <style>
            html, body {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              overflow: hidden;
            }
            iframe {
              width: 100%;
              height: 100%;
              border: none;
            }
          </style>
        </head>
        <body>
          <iframe src="${pdfUrl}" onload="setTimeout(() => { window.focus(); window.print(); }, 800)"></iframe>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const handlePrintReport = async () => {
    setShowPrintOptions(false);
    if (!parcel) return;

    const mapCanvas = document.querySelector(".mapboxgl-canvas");
    const mapElement =
      mapCanvas || document.querySelector(".mapboxgl-map") || document.querySelector("canvas");

    if (!mapElement) {
      alert("Unable to find the map area for report generation.");
      return;
    }

    const controls = Array.from(
      document.querySelectorAll(
        ".mapboxgl-ctrl, .mapboxgl-ctrl-top-left, .mapboxgl-ctrl-top-right, .mapboxgl-ctrl-bottom-left, .mapboxgl-ctrl-bottom-right"
      )
    );

    controls.forEach((ctrl) => {
      ctrl.dataset.originalDisplay = ctrl.style.display || "";
      ctrl.style.display = "none";
    });

    try {
      let imageData = null;

      if (mapCanvas && typeof mapCanvas.toDataURL === "function") {
        try {
          imageData = mapCanvas.toDataURL("image/png");
        } catch (error) {
          console.warn("Canvas toDataURL failed, falling back to html2canvas", error);
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
          `${window.location.origin}/Ruda_logo.png`,
          `${window.location.origin}/ruda_logo.jpg`,
          `${window.location.origin}/ruda_logo.png`,
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
      const marginX = 8;
      const contentWidth = pageWidth - marginX * 2;
      let y = 8;

      const drawSectionHeader = (x, rowY, w, h, title) => {
        doc.setFillColor(176, 196, 222);
        doc.rect(x, rowY, w, h, "F");
        doc.rect(x, rowY, w, h);
        doc.setFont("times", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(0, 0, 0);
        doc.text(String(title).toUpperCase(), x + 2, rowY + h - 2.2);
      };

      const drawSimpleCell = (x, rowY, w, h, text, align = "left") => {
        doc.rect(x, rowY, w, h);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.2);
        doc.setTextColor(35, 35, 35);
        const lines = doc.splitTextToSize(String(text || "-"), w - 3);
        doc.text(
          lines,
          align === "center" ? x + w / 2 : x + 1.5,
          rowY + 4.2,
          align === "center" ? { align: "center" } : undefined
        );
      };

      doc.setDrawColor(120, 120, 120);
      doc.setLineWidth(0.25);

      if (gopLogo) doc.addImage(gopLogo, "PNG", marginX + 2, y + 1, 24, 24, undefined, "FAST");

      if (rudaLogo) {
        try {
          doc.addImage(rudaLogo, "PNG", marginX + contentWidth - 28, y + 1, 24, 24, undefined, "FAST");
        } catch {
          doc.addImage(rudaLogo, "JPEG", marginX + contentWidth - 28, y + 1, 24, 24, undefined, "FAST");
        }
      }

      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 70, 140);
      doc.setFontSize(24);
      doc.text("PLOT DEMARCATION REPORT", pageWidth / 2, y + 14, { align: "center" });
      doc.setFontSize(18);
      doc.text("Ravi Urban Development Authority", pageWidth / 2, y + 24, { align: "center" });
      y += 38;

      drawSectionHeader(marginX, y, contentWidth, 8, "Plot Boundary Details");
      y += 8;

      const detailLabelW = 30;
      const detailValueW = contentWidth / 2 - detailLabelW;
      const detailRowH = 8;

      const drawTableCell = ({ x, rowY, w, h, text, isLabel = false }) => {
        doc.rect(x, rowY, w, h);
        doc.setFont("helvetica", isLabel ? "bold" : "normal");
        doc.setFontSize(isLabel ? 7.7 : 7.5);
        doc.setTextColor(35, 35, 35);
        const lines = doc.splitTextToSize(String(text || "-"), w - 3);
        doc.text(lines.slice(0, 2), x + 1.5, rowY + 4.8);
      };

      const drawDetailRow = (leftLabel, leftValue, rightLabel, rightValue, rowH = detailRowH) => {
        drawTableCell({ x: marginX, rowY: y, w: detailLabelW, h: rowH, text: leftLabel, isLabel: true });
        drawTableCell({ x: marginX + detailLabelW, rowY: y, w: detailValueW, h: rowH, text: leftValue });
        drawTableCell({ x: marginX + detailLabelW + detailValueW, rowY: y, w: detailLabelW, h: rowH, text: rightLabel, isLabel: true });
        drawTableCell({ x: marginX + detailLabelW * 2 + detailValueW, rowY: y, w: detailValueW, h: rowH, text: rightValue });
        y += rowH;
      };

      const drawFullDetailRow = (label, value, rowH = detailRowH) => {
        drawTableCell({ x: marginX, rowY: y, w: detailLabelW, h: rowH, text: label, isLabel: true });
        drawTableCell({ x: marginX + detailLabelW, rowY: y, w: contentWidth - detailLabelW, h: rowH, text: value });
        y += rowH;
      };

      drawDetailRow("Project", details.project, "Block", details.block);
      drawDetailRow("Plot No.", details.plotNo, "Landuse", details.landUse);
      drawDetailRow("Plot Area", details.plotArea, "Dimension", details.dimension);
      drawDetailRow("Road Ft", details.roadFt, "Road Facing", details.roadFacing);
      drawDetailRow("Park Front", details.parkFront, "Storey", details.storey);
      drawDetailRow("Possession", details.possession, "Poss. Status", details.possessionStatus);
      drawDetailRow("Canceled", details.canceled, "Site Plan", details.sitePlan);
      drawDetailRow("Unique ID", details.uniqueId, "TR Sr No", details.transferSrNo);
      drawDetailRow("TR Plot No", details.transferPlotNo, "TR Category", details.transferCategory, 10);
      drawFullDetailRow("Owner", details.owner, 12);
      drawFullDetailRow("Remarks", details.remarks, 9);

      const leftW = contentWidth * 0.53;
      const rightW = contentWidth - leftW;
      const lowerHeaderH = 8;
      const lowerBodyH = 92;

      drawSectionHeader(marginX, y, leftW, lowerHeaderH, "Selected Plot Snapshot");
      drawSectionHeader(marginX + leftW, y, rightW, lowerHeaderH, "Demarcation Coordinates");
      y += lowerHeaderH;

      doc.rect(marginX, y, leftW, lowerBodyH);
      doc.rect(marginX + leftW, y, rightW, lowerBodyH);

      if (imageData)
        doc.addImage(imageData, "PNG", marginX + 1.2, y + 1.2, leftW - 2.4, lowerBodyH - 2.4, undefined, "FAST");

      const coordX = marginX + leftW;
      let cy = y;
      const coordRowH = 8;

      const drawCoordRow = (rowY, point, lat, lng) => {
        drawSimpleCell(coordX, rowY, 16, coordRowH, point, "center");
        drawSimpleCell(coordX + 16, rowY, 34, coordRowH, lat);
        drawSimpleCell(coordX + 50, rowY, rightW - 50, coordRowH, lng);
      };

      drawCoordRow(cy, "Point", "Latitude", "Longitude");
      cy += coordRowH;

      cornerCoords.forEach((item) => {
        drawCoordRow(
          cy,
          item.label,
          Number.isFinite(item.lat) ? item.lat.toFixed(6) : "-",
          Number.isFinite(item.lng) ? item.lng.toFixed(6) : "-"
        );
        cy += coordRowH;
      });

      y += lowerBodyH + 4;
      drawSectionHeader(marginX, y, contentWidth, 8, "Disclaimer");
      y += 8;

      doc.rect(marginX, y, contentWidth, 26);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.2);
      doc.setTextColor(35, 35, 35);
      doc.text(
        doc.splitTextToSize(
          "This plot demarcation report is generated from plot boundary data and is subject to field verification, official record validation, and applicable RUDA rules and regulations.",
          contentWidth - 4
        ),
        marginX + 2,
        y + 6
      );

      const reportId = safeValue(details.plotNo, parcel?.id, "plot").replace(/\s+/g, "_");
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
          <div className="relative">
            <button
              onClick={() => setShowPrintOptions((prev) => !prev)}
              className="text-[12px] font-semibold tracking-wider text-white bg-green-700 px-3 py-2 rounded hover:bg-[#165c2d] transition"
              type="button"
            >
              Print
            </button>

            {showPrintOptions && (
              <div className="absolute right-0 top-[38px] z-50 w-[210px] bg-white border border-gray-300 rounded shadow-lg overflow-hidden">
                <button
                  type="button"
                  onClick={handlePrintReport}
                  className="w-full text-left px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-100"
                >
                  Print Report
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowPrintOptions(false);
                    handlePrintOfficialDemarcation();
                  }}
                  className="w-full text-left px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-100"
                >
                  Print Official Demarcation
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 h-full overflow-auto">
        {!parcel ? (
          <div className="flex h-full items-center justify-center text-gray-400 text-sm">
            No plot selected.
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map(([label, value]) => (
              <div key={label} className="flex justify-between items-start gap-3 p-2 bg-gray-50 rounded">
                <div className="text-sm text-gray-600 shrink-0">{label}</div>
                <div className="font-medium text-sm text-gray-800 text-right whitespace-pre-line break-words">
                  {String(value)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
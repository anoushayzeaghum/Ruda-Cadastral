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
        "-",
    },
    {
      label: "District",
      value:
        p.district_name ||
        p.district ||
        p.district_name_en ||
        p.district_i ||
        "-",
    },
    {
      label: "Tehsil",
      value: p.tehsil_name || p.tehsil || p.tehsil_name_en || p.tehsil_i || "-",
    },
    {
      label: "Mouza",
      value: p.mouza_name || p.mouza || p.mouza_name_en || p.mouza_id || "-",
    },
    { label: "Type", value: p.type || p.landuse || p.land_type || "-" },
    {
      label: "K",
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

  const reportDetails = [
    {
      label: "Town",
      value: safeValue(
        p.town,
        p.town_name,
        p.scheme,
        p.scheme_name,
        p.society,
        p.society_name,
      ),
    },
    {
      label: "Block",
      value: safeValue(p.block, p.block_name, p.sector, p.phase),
    },
    {
      label: "Plot No",
      value: safeValue(
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
      ),
    },
    {
      label: "Division",
      value: safeValue(
        p.division_name,
        p.division,
        p.division_name_en,
        p.division_i,
      ),
    },
    {
      label: "District",
      value: safeValue(
        p.district_name,
        p.district,
        p.district_name_en,
        p.district_i,
      ),
    },
    {
      label: "Tehsil",
      value: safeValue(p.tehsil_name, p.tehsil, p.tehsil_name_en, p.tehsil_i),
    },
    {
      label: "Landuse",
      value: safeValue(p.landuse, p.type, p.land_type),
    },
    {
      label: "Society Type",
      value: safeValue(p.society_type, p.societytyp, p.society_name, p.society),
    },
  ];

  const legendItems = [
    { label: "Residential", color: "#19a9e5" },
    { label: "Commercial", color: "#000000" },
    { label: "Parking", color: "#ffc107" },
    { label: "Recreational Facility", color: "#283593" },
    { label: "Illegal", color: "#e53935" },
    { label: "Public Building", color: "#ff5722" },
    { label: "Park", color: "#8bc34a" },
    { label: "Religious Building", color: "#9575cd" },
    { label: "Village", color: "#ff9800" },
    { label: "Educational", color: "#0b2948" },
    { label: "Graveyard", color: "#9c27b0" },
    { label: "Open Space", color: "#cddc39" },
    { label: "Health Facility", color: "#0f5b12" },
    { label: "Religious", color: "#673ab7" },
    { label: "Encroachment", color: "#795548" },
    { label: "Nullah", color: "#18b6c9" },
    { label: "Road", color: "#9e9e9e" },
    { label: "Others", color: "#607d8b" },
    { label: "Unclassified", color: "#bdbdbd" },
  ];

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
        loadImage(`${window.location.origin}/gop_logo.png`),
        loadImage(`${window.location.origin}/Ruda_logo.jpg`),
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

      const margin = 5;
      const contentX = margin;
      const contentY = 5;
      const contentWidth = pageWidth - margin * 2;
      const contentHeight = pageHeight - margin * 2;

      const sectionHeaderFill = [225, 225, 240];
      const borderColor = [70, 70, 70];

      const drawSectionHeader = (x, y, w, h, title) => {
        doc.setFillColor(...sectionHeaderFill);
        doc.rect(x, y, w, h, "F");
        doc.setDrawColor(...borderColor);
        doc.rect(x, y, w, h);
        doc.setFont("times", "normal");
        doc.setFontSize(10.5);
        doc.setTextColor(0, 0, 0);
        doc.text(title, x + 2, y + h - 2.1);
      };

      doc.setDrawColor(...borderColor);
      doc.setLineWidth(0.3);

      let y = contentY;

      const headerHeight = 32;
      const sectionTitleHeight = 6.5;
      const snapshotHeight = 120;
      const detailsHeaderHeight = 6.5;
      const detailsBodyHeight = 47;
      const legendHeaderHeight = 6.5;
      const legendBodyHeight = 38;

      // const totalUsedHeight =
      //   headerHeight +
      //   sectionTitleHeight +
      //   snapshotHeight +
      //   detailsHeaderHeight +
      //   detailsBodyHeight +
      //   legendHeaderHeight +
      //   legendBodyHeight;

      // const extraVertical = contentHeight - totalUsedHeight;
      // if (extraVertical > 0) {
      //   y += extraVertical / 2;
      // }

      const headerY = y;
      const leftBoxW = 26;
      const rightBoxW = 26;
      const centerBoxX = contentX + leftBoxW;
      const centerBoxW = contentWidth - leftBoxW - rightBoxW;

      const logoTop = headerY + 1.5;
      const gopW = 24;
      const gopH = 22;
      const rudaW = 22;
      const rudaH = 22;

      if (gopLogo) {
        try {
          const gopX = contentX + 2;
          doc.addImage(
            gopLogo,
            "PNG",
            gopX,
            logoTop,
            gopW,
            gopH,
            undefined,
            "FAST",
          );
        } catch (e) {
          console.warn("Failed to place GOP logo", e);
        }
      }

      if (rudaLogo) {
        try {
          const rudaX = contentX + contentWidth - rudaW - 2;
          doc.addImage(
            rudaLogo,
            "WEBP",
            rudaX,
            logoTop,
            rudaW,
            rudaH,
            undefined,
            "FAST",
          );
        } catch (e) {
          try {
            const rudaX = contentX + contentWidth - rudaW - 2;
            doc.addImage(
              rudaLogo,
              "PNG",
              rudaX,
              logoTop,
              rudaW,
              rudaH,
              undefined,
              "FAST",
            );
          } catch (err) {
            console.warn("Failed to place RUDA logo", err);
          }
        }
      }

      doc.setFont("times", "normal");
      doc.setFontSize(24);
      doc.setTextColor(0, 0, 0);
      doc.text(
        "PLOT DEMARCATION REPORT",
        centerBoxX + centerBoxW / 2,
        headerY + 16,
        {
          align: "center",
          maxWidth: centerBoxW - 6,
        },
      );

      y += headerHeight;

      drawSectionHeader(
        contentX,
        y,
        contentWidth,
        sectionTitleHeight,
        "Selected Plot Snapshot",
      );
      y += sectionTitleHeight;

      doc.rect(contentX, y, contentWidth, snapshotHeight);
      if (imageData) {
        doc.addImage(
          imageData,
          "PNG",
          contentX + 0.8,
          y + 0.8,
          contentWidth - 1.6,
          snapshotHeight - 1.6,
          undefined,
          "FAST",
        );
      }
      y += snapshotHeight;

      const leftW = contentWidth / 2;
      const rightW = contentWidth / 2;

      drawSectionHeader(
        contentX,
        y,
        leftW,
        detailsHeaderHeight,
        "Plot Details",
      );
      drawSectionHeader(
        contentX + leftW,
        y,
        rightW,
        detailsHeaderHeight,
        "Demarcation Coordinates",
      );
      y += detailsHeaderHeight;

      doc.rect(contentX, y, leftW, detailsBodyHeight);
      doc.rect(contentX + leftW, y, rightW, detailsBodyHeight);

      doc.setFont("times", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(0, 0, 0);

      let leftTextY = y + 5.5;
      reportDetails.forEach((item) => {
        const line = `${item.label}: ${item.value}`;
        const wrapped = doc.splitTextToSize(line, leftW - 4);
        doc.text(wrapped, contentX + 2, leftTextY);
        leftTextY += wrapped.length * 4.2;
      });

      let rightTextY = y + 5.5;
      cornerCoords.forEach((item) => {
        const lat =
          typeof item.lat === "number" && Number.isFinite(item.lat)
            ? item.lat.toFixed(6)
            : "-";
        const lng =
          typeof item.lng === "number" && Number.isFinite(item.lng)
            ? item.lng.toFixed(6)
            : "-";

        doc.text(
          `${item.label}: Lat ${lat}, Lng ${lng}`,
          contentX + leftW + 2,
          rightTextY,
        );
        rightTextY += 5;
      });

      if (cornerCoords.length === 0) {
        doc.text(
          "No demarcation coordinates available.",
          contentX + leftW + 2,
          rightTextY,
        );
      }

      y += detailsBodyHeight;

      drawSectionHeader(
        contentX,
        y,
        contentWidth,
        legendHeaderHeight,
        "Landuse Legend",
      );
      y += legendHeaderHeight;

      doc.rect(contentX, y, contentWidth, legendBodyHeight);

      const legendCols = 4;
      const colWidth = contentWidth / legendCols;
      const rowHeight = 7;

      doc.setFont("times", "normal");
      doc.setFontSize(8.8);

      legendItems.forEach((item, index) => {
        const col = index % legendCols;
        const row = Math.floor(index / legendCols);

        const cellX = contentX + col * colWidth;
        const cellY = y + 4 + row * rowHeight;

        const hex = item.color.replace("#", "");
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        doc.setFillColor(r, g, b);
        doc.rect(cellX + 3, cellY - 1.5, 4, 4, "F");

        doc.setTextColor(0, 0, 0);
        const wrapped = doc.splitTextToSize(item.label, colWidth - 11);
        doc.text(wrapped, cellX + 9, cellY + 1.5);
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
            className="text-[12px] font-semibold  tracking-wider text-white bg-green-700 px-2 py-2 rounded hover:bg-[#162544] transition"
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

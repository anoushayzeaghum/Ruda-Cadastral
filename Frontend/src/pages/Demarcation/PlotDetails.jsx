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
    { label: "Karam", value: p.karam ?? p.karam_no ?? p.karam_value ?? "-" },
    {
      label: "Area",
      value: p._area_acres
        ? `${p._area_acres.toFixed(2)} Acres`
        : p._area_m2
          ? `${p._area_m2} m²`
          : (p.area ?? "-"),
    },
  ];

  const plotDetails = [
    { label: "Division", value: p.division_name || p.division || p.division_name_en || p.division_i || "-" },
    { label: "District", value: p.district_name || p.district || p.district_name_en || p.district_i || "-" },
    { label: "Tehsil", value: p.tehsil_name || p.tehsil || p.tehsil_name_en || p.tehsil_i || "-" },
    { label: "Mouza", value: p.mouza_name || p.mouza || p.mouza_name_en || p.mouza_id || "-" },
    {
      label: "Plot No",
      value:
        p.plotno || p.plot_no || p.khasra || p.khasra_no || p.khasra_id || p.murabba || p.murabba_no || p.murabba_id || parcel?.id || "-",
    },
    { label: "Landuse", value: p.landuse || p.type || p.land_type || "-" },
    {
      label: "Society Type",
      value: p.society_type || p.societytyp || p.society_name || p.society || "-",
    },
  ];

  const legendItems = [
    { label: "Residential", color: "#03a9f4" },
    { label: "Commercial", color: "#000000" },
    { label: "Parking", color: "#ffc107" },
    { label: "Recreational Facility", color: "#1f3567" },
    { label: "Illegal", color: "#e53935" },
    { label: "Public Building", color: "#ff5722" },
    { label: "Park", color: "#8bc34a" },
    { label: "Religious Building", color: "#9575cd" },
    { label: "Village", color: "#ff9800" },
    { label: "Educational", color: "#092841" },
    { label: "Graveyard", color: "#9c27b0" },
    { label: "Open Space", color: "#cddc39" },
    { label: "Health Facility", color: "#0f4911" },
    { label: "Religious", color: "#673ab7" },
    { label: "Encroachment", color: "#795548" },
    { label: "Nullah", color: "#00bcd4" },
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
      lat: coord[1],
      lng: coord[0],
    }));
  };

  const getMapElement = () =>
    document.querySelector(".mapboxgl-canvas") ||
    document.querySelector(".mapboxgl-map") ||
    document.querySelector("canvas");

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

      const cornerCoords = getCornerCoordinates(parcel.geometry);
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 12;
      let y = 12;

      const logo = new Image();
      logo.crossOrigin = "anonymous";
      logo.src = `${window.location.origin}/Combinedlogos.png`;

      const drawPdf = (logoSrc) => {
        const contentWidth = pageWidth - margin * 2;
        const headerHeight = 28;
        const snapshotHeight = 90;
        const columnGap = 10;
        const columnWidth = (contentWidth - columnGap) / 2;
        const detailsBoxHeight = 72;

        doc.setFillColor(238, 239, 245);
        doc.rect(margin, y, contentWidth, headerHeight, "F");
        if (logoSrc) {
          try {
            doc.addImage(logoSrc, "PNG", margin + 4, y + 4, 34, 20, undefined, "FAST");
          } catch (ignored) {
            // ignore logo issues
          }
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.setTextColor(33, 33, 33);
        doc.text("PLOT DEMARCATION REPORT", pageWidth / 2, y + 18, { align: "center" });
        y += headerHeight + 8;

        doc.setFillColor(226, 229, 244);
        doc.rect(margin, y, contentWidth, 9, "F");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(33, 33, 33);
        doc.text("Selected Plot Snapshot", margin + 3, y + 6);
        y += 12;

        doc.setDrawColor(96, 125, 139);
        doc.setLineWidth(0.4);
        doc.rect(margin, y, contentWidth, snapshotHeight);
        if (imageData) {
          doc.addImage(imageData, "PNG", margin + 1, y + 1, contentWidth - 2, snapshotHeight - 2, undefined, "FAST");
        }
        y += snapshotHeight + 12;

        doc.setFillColor(226, 229, 244);
        doc.rect(margin, y, columnWidth, 9, "F");
        doc.rect(margin + columnWidth + columnGap, y, columnWidth, 9, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Plot Details", margin + 3, y + 6);
        doc.text("Demarcation Coordinates", margin + columnWidth + columnGap + 3, y + 6);
        y += 11;

        doc.setDrawColor(96, 125, 139);
        doc.setLineWidth(0.4);
        doc.rect(margin, y, columnWidth, detailsBoxHeight);
        doc.rect(margin + columnWidth + columnGap, y, columnWidth, detailsBoxHeight);

        let detailY = y + 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        plotDetails.forEach((item) => {
          doc.text(`${item.label}:`, margin + 4, detailY);
          doc.text(String(item.value || "-"), margin + 30, detailY, { maxWidth: columnWidth - 34 });
          detailY += 7;
        });

        let coordY = y + 8;
        cornerCoords.forEach((item) => {
          doc.text(
            `${item.label}: Lat ${item.lat?.toFixed(6) || "-"}`,
            margin + columnWidth + columnGap + 4,
            coordY,
            { maxWidth: columnWidth - 8 },
          );
          coordY += 7;
          doc.text(
            `Lng ${item.lng?.toFixed(6) || "-"}`,
            margin + columnWidth + columnGap + 4,
            coordY,
            { maxWidth: columnWidth - 8 },
          );
          coordY += 9;
        });

        y += detailsBoxHeight + 12;
        doc.setFillColor(226, 229, 244);
        doc.rect(margin, y, contentWidth, 9, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Landuse Legend", margin + 3, y + 6);
        y += 11;

        const legendCols = 4;
        const legendColWidth = contentWidth / legendCols;
        const legendRowHeight = 10;
        const legendRows = Math.ceil(legendItems.length / legendCols);
        doc.setDrawColor(96, 125, 139);
        doc.rect(margin, y, contentWidth, legendRows * legendRowHeight + 6);

        legendItems.forEach((item, index) => {
          const col = index % legendCols;
          const row = Math.floor(index / legendCols);
          const x = margin + col * legendColWidth;
          const rowTop = y + 4 + row * legendRowHeight;

          doc.setFillColor(item.color);
          doc.rect(x + 3, rowTop - 1, 4, 4, "F");
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(33, 33, 33);
          doc.text(item.label, x + 10, rowTop + 2, { maxWidth: legendColWidth - 12 });
        });

        doc.save(
          `Plot_Report_${String(
            p.khasra || p.khasra_no || p.murabba || p.murabba_no || parcel?.id || "plot",
          ).replace(/\s+/g, "_")}.pdf`,
        );
      };

      logo.onload = () => drawPdf(logo.src);
      logo.onerror = () => drawPdf(null);
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
    <div className="bg-white border border-[#b8c2cc] shadow-[0_0_0_1px_rgba(0,0,0,0.02)] flex flex-col min-h-0 max-h-[260px]">
      <div className="h-[56px] border-b border-[#d4dbe2] px-4 flex items-center justify-between gap-3">
        <h2 className="text-[17px] font-bold uppercase tracking-wide text-[#5b5b5b]">
          Plot Details
        </h2>
        {parcel && (
          <button
            onClick={handlePrintReport}
            className="text-[12px] font-semibold uppercase tracking-wider text-white bg-[#1f3559] px-3 py-2 rounded hover:bg-[#162544] transition"
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
                <div className="font-medium text-sm text-gray-800">
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

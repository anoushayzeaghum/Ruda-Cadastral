import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  X,
  GripVertical,
  Maximize2,
  Minimize2,
  Download,
  Loader2,
} from "lucide-react";
import { jsPDF } from "jspdf";

const BOUNDS = [
  [74.42562653088396, 31.60509230706726],
  [74.43545280361002, 31.6112165411359],
];

/** Keep the Chahar Bagh study site prominent — not the wider surroundings */
const STUDY_FIT = { padding: 24, maxZoom: 17.5, duration: 0 };

const EXPANDED_PANEL_CLASS =
  "fixed z-[70] inset-x-0 mx-auto flex flex-col overflow-hidden rounded-xl border border-[#13593f] bg-[#06291f] shadow-2xl"
  + " w-[min(860px,96vw)]"
  + " top-[64px] bottom-[16px]";

const IMAGERY = [
  {
    id: "jan2023",
    label: "AsBuilt Jan 2023",
    short: "Jan 2023",
    sourceId: "cd-jan2023-src",
    layerId: "cd-jan2023-lyr",
    url: "http://localhost:8081/data/Chahar_Bagh_Jan2023/{z}/{x}/{y}.png",
    color: "#a855f7",
  },
  {
    id: "june2023",
    label: "Ortho June 2023",
    short: "Jun 2023",
    sourceId: "cd-june2023-src",
    layerId: "cd-june2023-lyr",
    url: "http://localhost:8081/data/Chahar_Bagh_June2023/{z}/{x}/{y}.png",
    color: "#3b82f6",
  },
  {
    id: "nov2024",
    label: "Ortho Nov 2024",
    short: "Nov 2024",
    sourceId: "cd-nov2024-src",
    layerId: "cd-nov2024-lyr",
    url: "http://localhost:8081/data/Chahar_Bagh_Nov2024/{z}/{x}/{y}.png",
    color: "#ef4444",
  },
  {
    id: "apr2026",
    label: "Ortho Apr 2026",
    short: "Apr 2026",
    sourceId: "cd-apr2026-src",
    layerId: "cd-apr2026-lyr",
    url: "http://localhost:8081/data/Chaharbagh_Ortho/{z}/{x}/{y}.png",
    color: "#f59e0b",
  },
];

export default function ChangeDetection({ map, onClose }) {
  const containerRef = useRef(null);
  const containerLeftRef = useRef(null);
  const containerRightRef = useRef(null);

  const mapLeftRef = useRef(null);
  const mapRightRef = useRef(null);
  const mapLeftLoadedRef = useRef(false);
  const mapRightLoadedRef = useRef(false);

  const swipeRef = useRef(null);
  const isDraggingRef = useRef(false);

  const [leftIdx, setLeftIdx] = useState(0);
  const [rightIdx, setRightIdx] = useState(3);
  const [swipePos, setSwipePos] = useState(50);
  const [expanded, setExpanded] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportErr, setReportErr] = useState("");

  const handleClose = useCallback(() => {
    if (expanded) {
      setExpanded(false);
      return;
    }

    if (typeof onClose === "function") {
      onClose();
      return;
    }

    window.dispatchEvent(
      new CustomEvent("metaverse:close-tool", {
        detail: { tool: "changeDetection" },
      }),
    );
  }, [expanded, onClose]);


  // ── Helper: hex colour string → [r, g, b] ────────────────────────────────
  const hexToRgb = (hex) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];

  // ── Load image as base64 data-URL (works for same-origin assets) ──────────
  const loadImageAsDataURL = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        c.getContext("2d").drawImage(img, 0, 0);
        resolve(c.toDataURL("image/jpeg", 0.9));
      };
      img.onerror = reject;
      // cache-bust to avoid stale CORS issue in dev
      img.src = src + "?v=" + Date.now();
    });

  // ── Capture a Mapbox canvas snapshot ─────────────────────────────────────
  // Renders a temporary off-screen Mapbox map at 640×400 so tiles have time
  // to load before we call toDataURL. This avoids the tainted-canvas problem
  // caused by capturing the live (tiny, possibly hidden) panel maps.
  const captureMapSnapshot = (imageryItem) =>
    new Promise((resolve) => {
      // Create a temporary off-screen container
      const host = document.createElement("div");
      host.style.cssText =
        "position:fixed;left:-9999px;top:-9999px;width:640px;height:400px;visibility:hidden;";
      document.body.appendChild(host);

      let mm;
      let settled = false;
      const cleanup = () => {
        if (settled) return;
        settled = true;
        try { mm?.remove(); } catch (_) {}
        try { document.body.removeChild(host); } catch (_) {}
      };

      // Safety timeout — give up after 12 s
      const bailout = setTimeout(() => {
        cleanup();
        resolve(null);
      }, 12000);

      try {
        mm = new mapboxgl.Map({
          container: host,
          style: "mapbox://styles/mapbox/satellite-streets-v12",
          center: [74.43, 31.608],
          zoom: 15,
          interactive: false,
          attributionControl: false,
          preserveDrawingBuffer: true,
          fadeDuration: 0,
          transformRequest: (url) => ({ url }),
        });

        mm.on("load", () => {
          mm.addSource("snap-src", {
            type: "raster",
            tiles: [imageryItem.url],
            tileSize: 256,
          });
          mm.addLayer({
            id: "snap-lyr",
            type: "raster",
            source: "snap-src",
            layout: { visibility: "visible" },
          });
          mm.fitBounds(BOUNDS, { padding: 12, maxZoom: 17.5, duration: 0 });
        });

        // Wait for the map + tiles to fully settle
        const tryCapture = () => {
          if (settled) return;
          // Extra rAF ticks so WebGL flushes to the drawing buffer
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              clearTimeout(bailout);
              let dataURL = null;
              try {
                dataURL = mm.getCanvas().toDataURL("image/jpeg", 0.88);
              } catch (_) {
                dataURL = null;
              }
              cleanup();
              resolve(dataURL);
            }),
          );
        };

        // idle fires when all tiles have been painted
        mm.once("idle", () => {
          // Give tile textures an extra 800 ms to upload to GPU
          setTimeout(tryCapture, 800);
        });
      } catch (err) {
        clearTimeout(bailout);
        cleanup();
        resolve(null);
      }
    });

  // ── Generate and download the PDF report ─────────────────────────────────
  const downloadReport = useCallback(async () => {
    if (reporting) return;
    setReporting(true);
    setReportErr("");

    try {
      const leftItem = IMAGERY[leftIdx];
      const rightItem = IMAGERY[rightIdx];
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const timeStr = now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Load assets in parallel
      const [logoDataURL, leftSnapshot, rightSnapshot] = await Promise.all([
        loadImageAsDataURL("/Ruda_logo.jpg").catch(() => null),
        captureMapSnapshot(leftItem),
        captureMapSnapshot(rightItem),
      ]);

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const PW = doc.internal.pageSize.getWidth(); // 210
      const PH = doc.internal.pageSize.getHeight(); // 297

      // ── Colour palette ────────────────────────────────────────────────────
      const DARK = [17, 24, 39];
      const GREEN = [141, 211, 111];
      const MID = [32, 39, 54];
      const WHITE = [255, 255, 255];
      const MUTED = [160, 175, 200];

      // ── Layout constants ──────────────────────────────────────────────────
      const MARGIN = 10; // left/right page margin
      const COL_W = PW - MARGIN * 2; // usable width  (190 mm)
      const LABEL_X = MARGIN + 4; // row label x
      const VALUE_X = MARGIN + 55; // row value x  (wider gap)
      const ROW_H = 6.5; // height per data row
      const BOX_PAD = { top: 8, bottom: 6 }; // inner padding top/bottom
      const SEC_GAP = 7; // gap between sections

      // ── Helper: draw a labelled info box ─────────────────────────────────
      // rows: [[label, value], ...]
      // Returns the y after the box.
      const drawInfoBox = (title, rows, startY) => {
        const innerH = BOX_PAD.top + rows.length * ROW_H + BOX_PAD.bottom;
        doc.setFillColor(...MID);
        doc.roundedRect(MARGIN, startY, COL_W, innerH, 2, 2, "F");

        // Section title
        doc.setTextColor(...GREEN);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.text(title, LABEL_X, startY + BOX_PAD.top - 1);

        // Rows
        rows.forEach(([label, value], i) => {
          const ry = startY + BOX_PAD.top + 3.5 + i * ROW_H;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(...MUTED);
          doc.text(label + ":", LABEL_X, ry);
          doc.setTextColor(...WHITE);
          // truncate / wrap long values to fit within page
          const maxW = PW - VALUE_X - MARGIN - 2;
          const lines = doc.splitTextToSize(value, maxW);
          doc.text(lines[0], VALUE_X, ry); // always single line per row
        });

        return startY + innerH + SEC_GAP;
      };

      // ── HEADER BAND ───────────────────────────────────────────────────────
      doc.setFillColor(...DARK);
      doc.rect(0, 0, PW, 34, "F");

      if (logoDataURL) {
        doc.addImage(logoDataURL, "JPEG", MARGIN, 5, 22, 22);
      }

      const txX = logoDataURL ? MARGIN + 26 : MARGIN;
      doc.setTextColor(...WHITE);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text("RUDA GIS METAVERSE", txX, 14);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...MUTED);
      doc.text("Change Detection Report", txX, 21);
      doc.text("Generated: " + dateStr + "  |  " + timeStr, txX, 27);

      // Accent bar
      doc.setFillColor(...GREEN);
      doc.rect(0, 34, PW, 1.5, "F");

      let curY = 42;

      // ── COMPARISON SUMMARY ────────────────────────────────────────────────
      curY = drawInfoBox(
        "COMPARISON SUMMARY",
        [
          ["Project", "Chahar Bagh Phase 1, Lahore"],
          ["Left Image", leftItem.label],
          ["Right Image", rightItem.label],
          ["Analysis Type", "Visual Drone Imagery Comparison"],
          ["Swipe Position", Math.round(swipePos) + "% from left"],
          ["Report Date", dateStr],
        ],
        curY,
      );

      // ── IMAGERY SNAPSHOTS HEADING ─────────────────────────────────────────
      doc.setTextColor(...GREEN);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text("IMAGERY SNAPSHOTS", MARGIN, curY + 5);
      curY += 10;

      // Two side-by-side snapshot panels
      const panelW = (COL_W - 4) / 2; // width of each panel
      const snapH = panelW * 0.62; // height of snapshot image
      const panelH = 8 + snapH; // total panel height (badge + image)

      // ── Left panel ──
      doc.setFillColor(...MID);
      doc.roundedRect(MARGIN, curY, panelW, panelH, 2, 2, "F");

      doc.setFillColor(...hexToRgb(leftItem.color));
      doc.roundedRect(MARGIN + 2, curY + 2, panelW - 4, 5.5, 1, 1, "F");
      doc.setTextColor(...WHITE);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("LEFT: " + leftItem.label, MARGIN + panelW / 2, curY + 5.8, {
        align: "center",
      });

      if (leftSnapshot) {
        doc.addImage(
          leftSnapshot,
          "JPEG",
          MARGIN + 2,
          curY + 8,
          panelW - 4,
          snapH,
        );
      } else {
        doc.setFillColor(25, 35, 50);
        doc.rect(MARGIN + 2, curY + 8, panelW - 4, snapH, "F");
        doc.setTextColor(...MUTED);
        doc.setFontSize(7);
        doc.text(
          "No snapshot available",
          MARGIN + panelW / 2,
          curY + 8 + snapH / 2,
          { align: "center" },
        );
      }

      // ── Right panel ──
      const rX = MARGIN + panelW + 4;
      doc.setFillColor(...MID);
      doc.roundedRect(rX, curY, panelW, panelH, 2, 2, "F");

      doc.setFillColor(...hexToRgb(rightItem.color));
      doc.roundedRect(rX + 2, curY + 2, panelW - 4, 5.5, 1, 1, "F");
      doc.setTextColor(...WHITE);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("RIGHT: " + rightItem.label, rX + panelW / 2, curY + 5.8, {
        align: "center",
      });

      if (rightSnapshot) {
        doc.addImage(
          rightSnapshot,
          "JPEG",
          rX + 2,
          curY + 8,
          panelW - 4,
          snapH,
        );
      } else {
        doc.setFillColor(25, 35, 50);
        doc.rect(rX + 2, curY + 8, panelW - 4, snapH, "F");
        doc.setTextColor(...MUTED);
        doc.setFontSize(7);
        doc.text(
          "No snapshot available",
          rX + panelW / 2,
          curY + 8 + snapH / 2,
          { align: "center" },
        );
      }

      curY += panelH + SEC_GAP;

      // ── OBSERVATIONS ──────────────────────────────────────────────────────
      const obsLines = [
        "Comparison between " +
          leftItem.label +
          " (left) and " +
          rightItem.label +
          " (right).",
        "Visual inspection reveals changes in site development, earthwork, construction",
        "activity and vegetation coverage across the surveyed time periods.",
        "The swipe comparison tool was positioned at " +
          Math.round(swipePos) +
          "% from the left",
        "edge for a balanced side-by-side visual analysis.",
        "Further quantitative analysis (NDVI, pixel differencing) may be conducted",
        "using dedicated GIS or remote sensing software.",
      ];

      const obsInnerH = BOX_PAD.top + obsLines.length * ROW_H + BOX_PAD.bottom;
      doc.setFillColor(...MID);
      doc.roundedRect(MARGIN, curY, COL_W, obsInnerH, 2, 2, "F");

      doc.setTextColor(...GREEN);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text("OBSERVATIONS & NOTES", LABEL_X, curY + BOX_PAD.top - 1);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...WHITE);
      obsLines.forEach((line, i) => {
        doc.text(
          (i === 0 || i === 2 || i === 5 ? "- " : "  ") + line,
          LABEL_X,
          curY + BOX_PAD.top + 3.5 + i * ROW_H,
        );
      });

      curY += obsInnerH + SEC_GAP;

      // ── SITE INFORMATION ──────────────────────────────────────────────────
      // Use ASCII-safe characters: no degree symbol, no en-dash
      curY = drawInfoBox(
        "SITE INFORMATION",
        [
          ["Site Name", "Chahar Bagh Phase 1"],
          ["Location", "Lahore, Punjab, Pakistan"],
          ["Bounds (E)", "74.4256 E - 74.4355 E"],
          ["Bounds (N)", "31.6051 N - 31.6112 N"],
          ["Data Source", "RUDA Drone Survey Programme"],
        ],
        curY,
      );

      // ── FOOTER ────────────────────────────────────────────────────────────
      doc.setFillColor(...DARK);
      doc.rect(0, PH - 13, PW, 13, "F");
      doc.setFillColor(...GREEN);
      doc.rect(0, PH - 13, PW, 1, "F");
      doc.setTextColor(...MUTED);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text(
        "Ravi Urban Development Authority (RUDA)  |  GIS Metaverse Platform  |  Confidential",
        PW / 2,
        PH - 5.5,
        { align: "center" },
      );
      doc.text("Page 1 of 1", PW - MARGIN, PH - 5.5, { align: "right" });

      // ── SAVE ─────────────────────────────────────────────────────────────
      const safeName = (s) =>
        s.replace(/\s+/g, "").replace(/[^a-zA-Z0-9_-]/g, "");
      doc.save(
        "RUDA_ChangeDetection_" +
          safeName(leftItem.short) +
          "_vs_" +
          safeName(rightItem.short) +
          "_" +
          now.getFullYear() +
          ".pdf",
      );
    } catch (err) {
      console.error("Report generation error:", err);
      setReportErr("Report failed: " + (err?.message || String(err)));
    } finally {
      setReporting(false);
    }
  }, [reporting, leftIdx, rightIdx, swipePos]);

  // ── Resize both Mapbox instances when the container size changes ───────────
  const applyStudyFocus = useCallback(() => {
    mapLeftRef.current?.fitBounds(BOUNDS, STUDY_FIT);
    mapRightRef.current?.fitBounds(BOUNDS, STUDY_FIT);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const resize = () => {
      mapLeftRef.current?.resize();
      mapRightRef.current?.resize();
      applyStudyFocus();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(el);

    // Fire multiple times to catch CSS transition end (300ms) + tile load
    const t1 = setTimeout(resize, 50);
    const t2 = setTimeout(resize, 200);
    const t3 = setTimeout(resize, 400);
    const t4 = setTimeout(resize, 700);

    return () => {
      ro.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [expanded, applyStudyFocus]);

  // Initialize both maps
  useEffect(() => {
    if (!containerLeftRef.current || !containerRightRef.current) return;
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

    const mLeft = new mapboxgl.Map({
      container: containerLeftRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [74.43, 31.608],
      zoom: 15,
      interactive: false,
      attributionControl: false,
      preserveDrawingBuffer: true,
    });

    const mRight = new mapboxgl.Map({
      container: containerRightRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [74.43, 31.608],
      zoom: 15,
      interactive: false,
      attributionControl: false,
      preserveDrawingBuffer: true,
    });

    // Sync helper
    let isSyncing = false;
    const sync = (src, dest) => {
      if (isSyncing) return;
      isSyncing = true;
      dest.jumpTo({
        center: src.getCenter(),
        zoom: src.getZoom(),
        bearing: src.getBearing(),
        pitch: src.getPitch(),
      });
      isSyncing = false;
    };

    mLeft.on("move", () => sync(mLeft, mRight));
    mRight.on("move", () => sync(mRight, mLeft));

    mLeft.on("load", () => {
      mapLeftLoadedRef.current = true;
      IMAGERY.forEach((item) => {
        mLeft.addSource(item.sourceId, {
          type: "raster",
          tiles: [item.url],
          tileSize: 256,
        });
        mLeft.addLayer({
          id: item.layerId,
          type: "raster",
          source: item.sourceId,
          layout: { visibility: "none" },
        });
      });
      mLeft.setLayoutProperty(
        IMAGERY[leftIdx].layerId,
        "visibility",
        "visible",
      );
      mLeft.fitBounds(BOUNDS, STUDY_FIT);
    });

    mRight.on("load", () => {
      mapRightLoadedRef.current = true;
      IMAGERY.forEach((item) => {
        mRight.addSource(item.sourceId, {
          type: "raster",
          tiles: [item.url],
          tileSize: 256,
        });
        mRight.addLayer({
          id: item.layerId,
          type: "raster",
          source: item.sourceId,
          layout: { visibility: "none" },
        });
      });
      mRight.setLayoutProperty(
        IMAGERY[rightIdx].layerId,
        "visibility",
        "visible",
      );
      mRight.fitBounds(BOUNDS, STUDY_FIT);
    });

    mapLeftRef.current = mLeft;
    mapRightRef.current = mRight;

    return () => {
      mapLeftLoadedRef.current = false;
      mapRightLoadedRef.current = false;
      mLeft.remove();
      mRight.remove();
      mapLeftRef.current = null;
      mapRightRef.current = null;
    };
  }, []);

  // Update left map layer visibility
  useEffect(() => {
    const ml = mapLeftRef.current;
    if (!ml || !mapLeftLoadedRef.current) return;
    IMAGERY.forEach((item, i) => {
      try {
        const vis = i === leftIdx ? "visible" : "none";
        ml.setLayoutProperty(item.layerId, "visibility", vis);
      } catch (e) {
        // ignore
      }
    });
  }, [leftIdx]);

  // Update right map layer visibility
  useEffect(() => {
    const mr = mapRightRef.current;
    if (!mr || !mapRightLoadedRef.current) return;
    IMAGERY.forEach((item, i) => {
      try {
        const vis = i === rightIdx ? "visible" : "none";
        mr.setLayoutProperty(item.layerId, "visibility", vis);
      } catch (e) {
        // ignore
      }
    });
  }, [rightIdx]);

  // Handle swipe dragging
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    isDraggingRef.current = true;
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSwipePos(pct);
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // Global mouse/touch listeners for dragging
  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleMouseMove);
    window.addEventListener("touchend", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleMouseMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <>
      {/* ── Expanded overlay backdrop ── */}
      {expanded && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
          onClick={() => setExpanded(false)}
        />
      )}

      {/* ── Panel / overlay container ── */}
      <div
        className={`text-[12px] ${expanded ? EXPANDED_PANEL_CLASS : "flex flex-col"}`}
      >
        {/* Header — always visible */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#343c4c] px-4 py-3 font-bold">
          <span>Change Detection</span>
          <div className="flex items-center gap-1">
            {/* Download report */}
            <button
              type="button"
              title={reporting ? "Generating report…" : "Download PDF Report"}
              onClick={downloadReport}
              disabled={reporting}
              className="flex h-6 w-6 items-center justify-center rounded text-white/50 hover:text-white hover:bg-[#2a3548] transition disabled:cursor-not-allowed"
            >
              {reporting ? (
                <Loader2 size={13} className="animate-spin text-[#8fd36f]" />
              ) : (
                <Download size={13} />
              )}
            </button>
            {/* Expand / shrink */}
            <button
              type="button"
              title={expanded ? "Shrink viewer" : "Expand viewer"}
              onClick={() => setExpanded((e) => !e)}
              className="flex h-6 w-6 items-center justify-center rounded text-white/50 hover:text-white hover:bg-[#2a3548] transition"
            >
              {expanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
            <button
              type="button"
              title={expanded ? "Close expanded viewer" : "Close panel"}
              onClick={handleClose}
              className="flex h-6 w-6 items-center justify-center rounded text-white/50 hover:text-white hover:bg-[#2a3548] transition"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        <div
          className={`p-3 ${expanded ? "min-h-0 flex-1 flex flex-col overflow-y-auto overscroll-contain" : ""}`}
        >
          <p className="text-white/60 mb-3 text-[11px]">
            Compare two drone images side-by-side.
            {/* Drag the swipe handle to reveal changes between time periods. */}
          </p>

          {/* Left / Right selectors */}
          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <div className="text-[10px] text-white/40 mb-1 font-semibold">
                LEFT IMAGE
              </div>
              <select
                value={leftIdx}
                onChange={(e) => setLeftIdx(Number(e.target.value))}
                className="w-full bg-[#232b3a] border border-[#3b4558] rounded px-2 py-1.5 text-[11px] text-white outline-none"
              >
                {IMAGERY.map((item, i) => (
                  <option key={item.id} value={i} disabled={i === rightIdx}>
                    {item.short}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-white/40 mb-1 font-semibold">
                RIGHT IMAGE
              </div>
              <select
                value={rightIdx}
                onChange={(e) => setRightIdx(Number(e.target.value))}
                className="w-full bg-[#232b3a] border border-[#3b4558] rounded px-2 py-1.5 text-[11px] text-white outline-none"
              >
                {IMAGERY.map((item, i) => (
                  <option key={item.id} value={i} disabled={i === leftIdx}>
                    {item.short}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Swipe comparison map — fills all remaining space when expanded */}
          <div
            ref={containerRef}
            className={`relative mb-3 select-none overflow-hidden rounded-md border border-[#3b4558] transition-all duration-300 ${expanded ? "flex-1 min-h-0" : "shrink-0"}`}
            style={{
              height: expanded ? undefined : "200px",
              width: "100%",
            }}
          >
            {/* Map A (Left image) */}
            <div
              ref={containerLeftRef}
              style={{ position: "absolute", inset: 0 }}
            />

            {/* Map B (Right image) — clipped */}
            <div
              ref={containerRightRef}
              style={{
                position: "absolute",
                inset: 0,
                clipPath: `inset(0 0 0 ${swipePos}%)`,
              }}
            />

            {/* Swipe divider line */}
            <div
              className="absolute top-0 bottom-0 z-10"
              style={{
                left: `${swipePos}%`,
                transform: "translateX(-50%)",
                width: "3px",
                background: "#fff",
                boxShadow: "0 0 8px rgba(0,0,0,0.5)",
              }}
            />

            {/* Draggable handle */}
            <div
              ref={swipeRef}
              onMouseDown={handleMouseDown}
              onTouchStart={handleMouseDown}
              className="absolute z-20 cursor-ew-resize flex items-center justify-center"
              style={{
                left: `${swipePos}%`,
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "#fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                border: "2px solid #8fd36f",
              }}
            >
              <GripVertical size={14} color="#333" />
            </div>

            {/* Left label */}
            <div
              className="absolute top-2 left-2 px-2 py-1 rounded text-[10px] font-bold text-white shadow-lg z-10"
              style={{ backgroundColor: IMAGERY[leftIdx].color + "cc" }}
            >
              {IMAGERY[leftIdx].short}
            </div>

            {/* Right label */}
            <div
              className="absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-bold text-white shadow-lg z-10"
              style={{ backgroundColor: IMAGERY[rightIdx].color + "cc" }}
            >
              {IMAGERY[rightIdx].short}
            </div>
          </div>

          {/* Swipe slider control */}
          <div className="mb-2">
            <div className="text-[10px] text-white/40 mb-1 font-semibold">
              SWIPE POSITION
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={swipePos}
              onChange={(e) => setSwipePos(Number(e.target.value))}
              className="w-full h-[4px] rounded-full appearance-none cursor-pointer accent-[#8fd36f]"
              style={{
                background: `linear-gradient(to right, ${IMAGERY[leftIdx].color} ${swipePos}%, ${IMAGERY[rightIdx].color} ${swipePos}%)`,
              }}
            />
            <div className="flex justify-between text-[10px] text-white/40 mt-1">
              <span style={{ color: IMAGERY[leftIdx].color }}>
                ← {IMAGERY[leftIdx].short}
              </span>
              <span style={{ color: IMAGERY[rightIdx].color }}>
                {IMAGERY[rightIdx].short} →
              </span>
            </div>
          </div>

          {/* Error */}
          {reportErr && (
            <div className="mb-2 text-[10px] text-red-400 px-1">
              {reportErr}
            </div>
          )}

          {/* Download report button */}
          <button
            type="button"
            onClick={downloadReport}
            disabled={reporting}
            className="w-full flex items-center justify-center gap-2 rounded-md border border-[#3b4558] bg-[#232b3a] px-3 py-2 text-[11px] font-semibold text-white/80 hover:bg-[#2c3648] hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {reporting ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Generating
                Report…
              </>
            ) : (
              <>
                <Download size={13} /> Download Change Detection Report (PDF)
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

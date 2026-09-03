import { useEffect, useRef, useState, useCallback, useMemo } from "react";
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
import { getDroneSourceId, getDroneLayerId } from "./droneProjectConfig";

const STUDY_FIT = { padding: 24, maxZoom: 17.5, duration: 0 };

const EXPANDED_PANEL_CLASS =
  "fixed z-[10002] inset-x-0 mx-auto flex flex-col overflow-hidden rounded-xl border border-[#13593f] bg-[#06291f] shadow-2xl" +
  " w-[min(860px,96vw)]" +
  " top-[16px] bottom-[16px]";

const EXPANDED_BACKDROP_CLASS =
  "fixed inset-0 z-[10001] bg-black/70 backdrop-blur-sm";

const safeName = (s) =>
  String(s ?? "")
    .replace(/\s+/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "");

export default function ChangeDetection({
  map: _map,
  filters,
  projectConfig,
  embedded,
  onClose,
  onExpandedChange,
}) {
  const projectId = String(filters?.projectId || "");
  const imagery = useMemo(() => {
    const raw = projectConfig?.imagery || [];
    return [...raw].sort(
      (a, b) =>
        new Date(a.captureDate).getTime() - new Date(b.captureDate).getTime(),
    );
  }, [projectConfig]);

  const bounds = projectConfig?.bounds || null;
  const center = projectConfig?.center || null;
  const projectName = projectConfig?.projectName || "Selected Project";
  const projectLocation = projectConfig?.location || "";
  const dataSource = projectConfig?.dataSource || "RUDA Drone Survey Programme";

  const hasValidBounds =
    Array.isArray(bounds) &&
    bounds.length === 2 &&
    Array.isArray(bounds[0]) &&
    Array.isArray(bounds[1]);

  // Build Mapbox-safe source/layer IDs per project
  const comparisonImagery = useMemo(
    () =>
      imagery.map((item) => ({
        ...item,
        sourceId: getDroneSourceId(projectId, item.id, "change"),
        layerId: getDroneLayerId(projectId, item.id, "change"),
        url: item.tileUrl,
        short: item.shortLabel || item.label,
      })),
    [projectId, imagery],
  );

  const containerRef = useRef(null);
  const containerLeftRef = useRef(null);
  const containerRightRef = useRef(null);

  const mapLeftRef = useRef(null);
  const mapRightRef = useRef(null);
  const mapLeftLoadedRef = useRef(false);
  const mapRightLoadedRef = useRef(false);
  const [mapsLoaded, setMapsLoaded] = useState(0); // increments to trigger visibility effects

  const swipeRef = useRef(null);
  const isDraggingRef = useRef(false);
  const operationSeqRef = useRef(0);
  const leftIdxRef = useRef(0);
  const rightIdxRef = useRef(0);
  const comparisonImageryRef = useRef([]);

  const [leftIdx, setLeftIdx] = useState(0);
  const [rightIdx, setRightIdx] = useState(() => Math.max(0, imagery.length - 1));

  // Keep refs in sync so map load callbacks always read the latest indices
  leftIdxRef.current = leftIdx;
  rightIdxRef.current = rightIdx;
  comparisonImageryRef.current = comparisonImagery;
  const [swipePos, setSwipePos] = useState(50);
  const [expanded, setExpanded] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportErr, setReportErr] = useState("");

  // Reset on project change
  useEffect(() => {
    setLeftIdx(0);
    setRightIdx(Math.max(0, imagery.length - 1));
    setSwipePos(50);
    setReportErr("");
    setMapsLoaded(0);
    operationSeqRef.current += 1;
  }, [projectId, imagery.length]);

  // If imagery arrives after mount (projectConfig loads async), fix rightIdx
  useEffect(() => {
    if (imagery.length > 1) {
      setRightIdx((prev) => {
        const last = imagery.length - 1;
        // Only correct if it's still pointing at same item as leftIdx (stuck at 0)
        return prev === 0 ? last : prev;
      });
    }
  }, [imagery.length]);

  const leftItem = comparisonImagery[leftIdx] || comparisonImagery[0];
  const rightItem =
    comparisonImagery[rightIdx] ||
    comparisonImagery[comparisonImagery.length - 1];

  useEffect(() => {
    if (typeof onExpandedChange !== "function") return;
    onExpandedChange(expanded);
    return () => onExpandedChange(false);
  }, [expanded, onExpandedChange]);

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

  // ── Helpers ───────────────────────────────────────────────────────────────
  const hexToRgb = (hex) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];

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
      img.src = src + "?v=" + Date.now();
    });

  const captureMapSnapshot = (imageryItem) =>
    new Promise((resolve) => {
      const snapCenter = center || [0, 20];
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

      const bailout = setTimeout(() => { cleanup(); resolve(null); }, 12000);

      try {
        mm = new mapboxgl.Map({
          container: host,
          style: "mapbox://styles/mapbox/satellite-streets-v12",
          center: snapCenter,
          zoom: 15,
          interactive: false,
          attributionControl: false,
          preserveDrawingBuffer: true,
          fadeDuration: 0,
        });

        mm.on("load", () => {
          mm.addSource("snap-src", {
            type: "raster",
            tiles: [imageryItem.url || imageryItem.tileUrl],
            tileSize: 256,
          });
          mm.addLayer({
            id: "snap-lyr",
            type: "raster",
            source: "snap-src",
            layout: { visibility: "visible" },
          });
          if (hasValidBounds) {
            mm.fitBounds(bounds, { padding: 12, maxZoom: 17.5, duration: 0 });
          }
        });

        const tryCapture = () => {
          if (settled) return;
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              clearTimeout(bailout);
              let dataURL = null;
              try { dataURL = mm.getCanvas().toDataURL("image/jpeg", 0.88); } catch (_) {}
              cleanup();
              resolve(dataURL);
            }),
          );
        };

        mm.once("idle", () => setTimeout(tryCapture, 800));
      } catch (err) {
        clearTimeout(bailout);
        cleanup();
        resolve(null);
      }
    });

  // ── PDF Report ────────────────────────────────────────────────────────────
  const downloadReport = useCallback(async () => {
    if (reporting) return;
    setReporting(true);
    setReportErr("");

    const seq = ++operationSeqRef.current;

    try {
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-GB", {
        year: "numeric", month: "long", day: "numeric",
      });
      const timeStr = now.toLocaleTimeString("en-GB", {
        hour: "2-digit", minute: "2-digit",
      });

      const [logoDataURL, leftSnapshot, rightSnapshot] = await Promise.all([
        loadImageAsDataURL("/Ruda_logo.jpg").catch(() => null),
        captureMapSnapshot(leftItem),
        captureMapSnapshot(rightItem),
      ]);

      if (seq !== operationSeqRef.current) return;

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const PW = doc.internal.pageSize.getWidth();
      const PH = doc.internal.pageSize.getHeight();

      const DARK = [17, 24, 39];
      const GREEN = [141, 211, 111];
      const MID = [32, 39, 54];
      const WHITE = [255, 255, 255];
      const MUTED = [160, 175, 200];
      const MARGIN = 10;
      const COL_W = PW - MARGIN * 2;
      const LABEL_X = MARGIN + 4;
      const VALUE_X = MARGIN + 55;
      const ROW_H = 6.5;
      const BOX_PAD = { top: 8, bottom: 6 };
      const SEC_GAP = 7;

      const drawInfoBox = (title, rows, startY) => {
        const innerH = BOX_PAD.top + rows.length * ROW_H + BOX_PAD.bottom;
        doc.setFillColor(...MID);
        doc.roundedRect(MARGIN, startY, COL_W, innerH, 2, 2, "F");
        doc.setTextColor(...GREEN);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.text(title, LABEL_X, startY + BOX_PAD.top - 1);
        rows.forEach(([label, value], i) => {
          const ry = startY + BOX_PAD.top + 3.5 + i * ROW_H;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(...MUTED);
          doc.text(label + ":", LABEL_X, ry);
          doc.setTextColor(...WHITE);
          const maxW = PW - VALUE_X - MARGIN - 2;
          const lines = doc.splitTextToSize(value, maxW);
          doc.text(lines[0], VALUE_X, ry);
        });
        return startY + innerH + SEC_GAP;
      };

      // Header
      doc.setFillColor(...DARK);
      doc.rect(0, 0, PW, 34, "F");
      if (logoDataURL) doc.addImage(logoDataURL, "JPEG", MARGIN, 5, 22, 22);
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
      doc.setFillColor(...GREEN);
      doc.rect(0, 34, PW, 1.5, "F");

      let curY = 42;

      curY = drawInfoBox("COMPARISON SUMMARY", [
        ["Project", projectName + (projectLocation ? ", " + projectLocation : "")],
        ["Left Image", leftItem.reportLabel || leftItem.label],
        ["Right Image", rightItem.reportLabel || rightItem.label],
        ["Analysis Type", "Visual Drone Image Comparison"],
        ["Swipe Position", Math.round(swipePos) + "% from left"],
        ["Report Date", dateStr],
      ], curY);

      // Snapshots heading
      doc.setTextColor(...GREEN);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text("IMAGERY SNAPSHOTS", MARGIN, curY + 5);
      curY += 10;

      const panelW = (COL_W - 4) / 2;
      const snapH = panelW * 0.62;
      const panelH = 8 + snapH;

      // Left panel
      doc.setFillColor(...MID);
      doc.roundedRect(MARGIN, curY, panelW, panelH, 2, 2, "F");
      doc.setFillColor(...hexToRgb(leftItem.color));
      doc.roundedRect(MARGIN + 2, curY + 2, panelW - 4, 5.5, 1, 1, "F");
      doc.setTextColor(...WHITE);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("LEFT: " + (leftItem.short || leftItem.label), MARGIN + panelW / 2, curY + 5.8, { align: "center" });
      if (leftSnapshot) {
        doc.addImage(leftSnapshot, "JPEG", MARGIN + 2, curY + 8, panelW - 4, snapH);
      } else {
        doc.setFillColor(25, 35, 50);
        doc.rect(MARGIN + 2, curY + 8, panelW - 4, snapH, "F");
        doc.setTextColor(...MUTED);
        doc.setFontSize(7);
        doc.text("No snapshot available", MARGIN + panelW / 2, curY + 8 + snapH / 2, { align: "center" });
      }

      // Right panel
      const rX = MARGIN + panelW + 4;
      doc.setFillColor(...MID);
      doc.roundedRect(rX, curY, panelW, panelH, 2, 2, "F");
      doc.setFillColor(...hexToRgb(rightItem.color));
      doc.roundedRect(rX + 2, curY + 2, panelW - 4, 5.5, 1, 1, "F");
      doc.setTextColor(...WHITE);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("RIGHT: " + (rightItem.short || rightItem.label), rX + panelW / 2, curY + 5.8, { align: "center" });
      if (rightSnapshot) {
        doc.addImage(rightSnapshot, "JPEG", rX + 2, curY + 8, panelW - 4, snapH);
      } else {
        doc.setFillColor(25, 35, 50);
        doc.rect(rX + 2, curY + 8, panelW - 4, snapH, "F");
        doc.setTextColor(...MUTED);
        doc.setFontSize(7);
        doc.text("No snapshot available", rX + panelW / 2, curY + 8 + snapH / 2, { align: "center" });
      }

      curY += panelH + SEC_GAP;

      // Observations
      const obsLines = [
        "Comparison between " + (leftItem.short || leftItem.label) + " (left) and " + (rightItem.short || rightItem.label) + " (right).",
        "Visual inspection reveals changes in site development, earthwork, construction",
        "activity and vegetation coverage across the surveyed time periods.",
        "The swipe comparison tool was positioned at " + Math.round(swipePos) + "% from the left",
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

      // Site information — fully dynamic
      const west = bounds?.[0]?.[0];
      const south = bounds?.[0]?.[1];
      const east = bounds?.[1]?.[0];
      const north = bounds?.[1]?.[1];

      curY = drawInfoBox("SITE INFORMATION", [
        ["Site Name", projectName],
        ["Location", projectLocation || "N/A"],
        ["Bounds (E)", west != null && east != null ? `${west} E - ${east} E` : "N/A"],
        ["Bounds (N)", south != null && north != null ? `${south} N - ${north} N` : "N/A"],
        ["Data Source", dataSource],
      ], curY);

      // Footer
      doc.setFillColor(...DARK);
      doc.rect(0, PH - 13, PW, 13, "F");
      doc.setFillColor(...GREEN);
      doc.rect(0, PH - 13, PW, 1, "F");
      doc.setTextColor(...MUTED);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text("Ravi Urban Development Authority (RUDA)  |  GIS Metaverse Platform  |  Confidential", PW / 2, PH - 5.5, { align: "center" });
      doc.text("Page 1 of 1", PW - MARGIN, PH - 5.5, { align: "right" });

      const projectSafeName = safeName(projectConfig?.projectCode || projectName || projectId);
      doc.save(
        `RUDA_ChangeDetection_${projectSafeName}_${safeName(leftItem.short || leftItem.label)}_vs_${safeName(rightItem.short || rightItem.label)}_${now.getFullYear()}.pdf`,
      );
    } catch (err) {
      console.error("[ChangeDetection] Report generation error:", err);
      setReportErr("Report failed: " + (err?.message || String(err)));
    } finally {
      setReporting(false);
    }
  }, [reporting, leftIdx, rightIdx, swipePos, leftItem, rightItem, projectId, projectName, projectLocation, dataSource, bounds, hasValidBounds, center, projectConfig]);

  // ── Resize both maps when container changes ───────────────────────────────
  const applyStudyFocus = useCallback(() => {
    if (hasValidBounds) {
      mapLeftRef.current?.fitBounds(bounds, STUDY_FIT);
      mapRightRef.current?.fitBounds(bounds, STUDY_FIT);
    }
  }, [bounds, hasValidBounds]);

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
    const t1 = setTimeout(resize, 50);
    const t2 = setTimeout(resize, 200);
    const t3 = setTimeout(resize, 400);
    const t4 = setTimeout(resize, 700);
    return () => {
      ro.disconnect();
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
    };
  }, [expanded, applyStudyFocus]);

  // ── Initialize both maps (re-runs when project changes) ──────────────────
  useEffect(() => {
    if (!containerLeftRef.current || !containerRightRef.current) return;
    if (!comparisonImagery.length) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
    const mapCenter = center || [0, 20];

    const mLeft = new mapboxgl.Map({
      container: containerLeftRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: mapCenter,
      zoom: 15,
      interactive: false,
      attributionControl: false,
      preserveDrawingBuffer: true,
    });

    const mRight = new mapboxgl.Map({
      container: containerRightRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: mapCenter,
      zoom: 15,
      interactive: false,
      attributionControl: false,
      preserveDrawingBuffer: true,
    });

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
      const items = comparisonImageryRef.current;
      items.forEach((item) => {
        mLeft.addSource(item.sourceId, { type: "raster", tiles: [item.url], tileSize: 256 });
        mLeft.addLayer({ id: item.layerId, type: "raster", source: item.sourceId, layout: { visibility: "none" } });
      });
      // Apply correct layer using ref (avoids stale closure on leftIdx)
      items.forEach((item, i) => {
        mLeft.setLayoutProperty(item.layerId, "visibility", i === leftIdxRef.current ? "visible" : "none");
      });
      if (hasValidBounds) mLeft.fitBounds(bounds, STUDY_FIT);
      setMapsLoaded((n) => n + 1);
    });

    mRight.on("load", () => {
      mapRightLoadedRef.current = true;
      const items = comparisonImageryRef.current;
      items.forEach((item) => {
        mRight.addSource(item.sourceId, { type: "raster", tiles: [item.url], tileSize: 256 });
        mRight.addLayer({ id: item.layerId, type: "raster", source: item.sourceId, layout: { visibility: "none" } });
      });
      // Apply correct layer using ref (avoids stale closure on rightIdx)
      items.forEach((item, i) => {
        mRight.setLayoutProperty(item.layerId, "visibility", i === rightIdxRef.current ? "visible" : "none");
      });
      if (hasValidBounds) mRight.fitBounds(bounds, STUDY_FIT);
      setMapsLoaded((n) => n + 1);
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
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Update left map layer visibility ─────────────────────────────────────
  useEffect(() => {
    const ml = mapLeftRef.current;
    if (!ml || !mapLeftLoadedRef.current) return;
    comparisonImagery.forEach((item, i) => {
      try {
        const vis = i === leftIdx ? "visible" : "none";
        ml.setLayoutProperty(item.layerId, "visibility", vis);
      } catch (_) {}
    });
  }, [leftIdx, comparisonImagery, mapsLoaded]);

  // ── Update right map layer visibility ────────────────────────────────────
  useEffect(() => {
    const mr = mapRightRef.current;
    if (!mr || !mapRightLoadedRef.current) return;
    comparisonImagery.forEach((item, i) => {
      try {
        const vis = i === rightIdx ? "visible" : "none";
        mr.setLayoutProperty(item.layerId, "visibility", vis);
      } catch (_) {}
    });
  }, [rightIdx, comparisonImagery, mapsLoaded]);

  // ── Swipe drag handlers ───────────────────────────────────────────────────
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

  // ── Minimum imagery guard ────────────────────────────────────────────────
  if (imagery.length < 2) {
    return (
      <div className="flex min-h-[80px] items-center justify-center p-4 text-center">
        <p className="text-[12px] text-white/50">
          At least two imagery dates are required for change detection.
        </p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {expanded && (
        <div className={EXPANDED_BACKDROP_CLASS} onClick={() => setExpanded(false)} />
      )}

      <div className={`text-[12px] ${expanded ? EXPANDED_PANEL_CLASS : "flex flex-col"}`}>
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#343c4c] px-4 py-3 font-bold">
          <span>Change Detection</span>
          <div className="flex items-center gap-1">
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

        <div className={`p-3 ${expanded ? "min-h-0 flex-1 flex flex-col overflow-y-auto overscroll-contain" : ""}`}>
          <p className="text-white/60 mb-3 text-[11px]">
            Compare two drone images side-by-side.
          </p>

          {/* Left / Right selectors */}
          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <div className="text-[10px] text-white/40 mb-1 font-semibold">LEFT IMAGE</div>
              <select
                value={leftIdx}
                onChange={(e) => setLeftIdx(Number(e.target.value))}
                className="w-full bg-[#232b3a] border border-[#3b4558] rounded px-2 py-1.5 text-[11px] text-white outline-none"
              >
                {comparisonImagery.map((item, i) => (
                  <option key={item.id} value={i} disabled={i === rightIdx}>
                    {item.short}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-white/40 mb-1 font-semibold">RIGHT IMAGE</div>
              <select
                value={rightIdx}
                onChange={(e) => setRightIdx(Number(e.target.value))}
                className="w-full bg-[#232b3a] border border-[#3b4558] rounded px-2 py-1.5 text-[11px] text-white outline-none"
              >
                {comparisonImagery.map((item, i) => (
                  <option key={item.id} value={i} disabled={i === leftIdx}>
                    {item.short}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Swipe comparison map */}
          <div
            ref={containerRef}
            className={`relative mb-3 select-none overflow-hidden rounded-md border border-[#3b4558] transition-all duration-300 ${expanded ? "flex-1 min-h-0" : "shrink-0"}`}
            style={{ height: expanded ? undefined : "200px", width: "100%" }}
          >
            <div ref={containerLeftRef} style={{ position: "absolute", inset: 0 }} />
            <div
              ref={containerRightRef}
              style={{ position: "absolute", inset: 0, clipPath: `inset(0 0 0 ${swipePos}%)` }}
            />
            <div
              className="absolute top-0 bottom-0 z-10"
              style={{ left: `${swipePos}%`, transform: "translateX(-50%)", width: "3px", background: "#fff", boxShadow: "0 0 8px rgba(0,0,0,0.5)" }}
            />
            <div
              ref={swipeRef}
              onMouseDown={handleMouseDown}
              onTouchStart={handleMouseDown}
              className="absolute z-20 cursor-ew-resize flex items-center justify-center"
              style={{ left: `${swipePos}%`, top: "50%", transform: "translate(-50%, -50%)", width: "28px", height: "28px", borderRadius: "50%", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.4)", border: "2px solid #8fd36f" }}
            >
              <GripVertical size={14} color="#333" />
            </div>
            {leftItem && (
              <div
                className="absolute top-2 left-2 px-2 py-1 rounded text-[10px] font-bold text-white shadow-lg z-10"
                style={{ backgroundColor: leftItem.color + "cc" }}
              >
                {leftItem.short}
              </div>
            )}
            {rightItem && (
              <div
                className="absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-bold text-white shadow-lg z-10"
                style={{ backgroundColor: rightItem.color + "cc" }}
              >
                {rightItem.short}
              </div>
            )}
          </div>

          {/* Swipe slider */}
          <div className="mb-2">
            <div className="text-[10px] text-white/40 mb-1 font-semibold">SWIPE POSITION</div>
            <input
              type="range"
              min="0"
              max="100"
              value={swipePos}
              onChange={(e) => setSwipePos(Number(e.target.value))}
              className="w-full h-[4px] rounded-full appearance-none cursor-pointer accent-[#8fd36f]"
              style={{ background: leftItem && rightItem ? `linear-gradient(to right, ${leftItem.color} ${swipePos}%, ${rightItem.color} ${swipePos}%)` : undefined }}
            />
            <div className="flex justify-between text-[10px] text-white/40 mt-1">
              {leftItem && <span style={{ color: leftItem.color }}>← {leftItem.short}</span>}
              {rightItem && <span style={{ color: rightItem.color }}>{rightItem.short} →</span>}
            </div>
          </div>

          {reportErr && (
            <div className="mb-2 text-[10px] text-red-400 px-1">{reportErr}</div>
          )}

          <button
            type="button"
            onClick={downloadReport}
            disabled={reporting}
            className="w-full flex items-center justify-center gap-2 rounded-md border border-[#3b4558] bg-[#232b3a] px-3 py-2 text-[11px] font-semibold text-white/80 hover:bg-[#2c3648] hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {reporting ? (
              <><Loader2 size={13} className="animate-spin" /> Generating Report…</>
            ) : (
              <><Download size={13} /> Download Change Detection Report (PDF)</>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

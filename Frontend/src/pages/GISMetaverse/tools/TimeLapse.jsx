import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Maximize2,
  Minimize2,
  Download,
  Loader2,
} from "lucide-react";
import { getDroneSourceId, getDroneLayerId } from "./droneProjectConfig";

const STUDY_FIT = { padding: 12, maxZoom: 17.5, duration: 0 };

const EXPANDED_PANEL_CLASS =
  "fixed z-[10002] inset-x-0 mx-auto flex flex-col overflow-hidden rounded-xl border border-[#13593f] bg-[#06291f] shadow-2xl" +
  " w-[min(860px,96vw)]" +
  " top-[16px] bottom-[16px]";

const EXPANDED_BACKDROP_CLASS =
  "fixed inset-0 z-[10001] bg-black/70 backdrop-blur-sm";

// ── Helpers ──────────────────────────────────────────────────────────────────
function waitIdle(mm) {
  return new Promise((resolve) => {
    if (!mm.isMoving() && !mm.isZooming() && !mm.isRotating()) {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    } else {
      mm.once("idle", () => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function canvasToImage(canvas) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = canvas.toDataURL("image/png");
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function TimeLapse({
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
  const hasValidBounds =
    Array.isArray(bounds) &&
    bounds.length === 2 &&
    Array.isArray(bounds[0]) &&
    Array.isArray(bounds[1]);

  // Build Mapbox-safe IDs per project
  const timeline = useMemo(
    () =>
      imagery.map((item) => ({
        ...item,
        sourceId: getDroneSourceId(projectId, item.id, "tl"),
        layerId: getDroneLayerId(projectId, item.id, "tl"),
        url: item.tileUrl,
        date: item.label,
      })),
    [projectId, imagery],
  );

  const miniMapRef = useRef(null);
  const containerRef = useRef(null);
  const mapLoadedRef = useRef(false);
  const recCanvasRef = useRef(null);

  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2000);
  const [expanded, setExpanded] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [recordError, setRecordError] = useState("");

  useEffect(() => {
    if (typeof onExpandedChange !== "function") return;
    onExpandedChange(expanded);
    return () => onExpandedChange(false);
  }, [expanded, onExpandedChange]);

  const handleClose = useCallback(() => {
    if (expanded) { setExpanded(false); return; }
    if (typeof onClose === "function") { onClose(); return; }
    window.dispatchEvent(new CustomEvent("metaverse:close-tool", { detail: { tool: "timeLapse" } }));
  }, [expanded, onClose]);

  // ── Show correct layer ────────────────────────────────────────────────────
  const showLayer = useCallback((index) => {
    const mm = miniMapRef.current;
    if (!mm || !mapLoadedRef.current) return;
    timeline.forEach((item, i) => {
      try {
        if (mm.getLayer(item.layerId)) {
          mm.setLayoutProperty(item.layerId, "visibility", i === index ? "visible" : "none");
        }
      } catch (_) {}
    });
  }, [timeline]);

  // ── Reset on project change ───────────────────────────────────────────────
  useEffect(() => {
    setPlaying(false);
    setCurrent(0);
    setRecordError("");
    setRecordProgress(0);
  }, [projectId]);

  // ── Init mini-map (re-init when project changes) ──────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    if (!timeline.length) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
    const mapCenter = center || [0, 20];

    const mm = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: mapCenter,
      zoom: 14,
      interactive: true,
      attributionControl: false,
      preserveDrawingBuffer: true,
    });

    mm.on("load", () => {
      mapLoadedRef.current = true;
      timeline.forEach((item, i) => {
        mm.addSource(item.sourceId, { type: "raster", tiles: [item.url], tileSize: 256 });
        mm.addLayer({ id: item.layerId, type: "raster", source: item.sourceId, layout: { visibility: i === 0 ? "visible" : "none" } });
      });
      if (hasValidBounds) mm.fitBounds(bounds, STUDY_FIT);
    });

    miniMapRef.current = mm;

    return () => {
      mapLoadedRef.current = false;
      mm.remove();
      miniMapRef.current = null;
    };
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyStudyFocus = useCallback(() => {
    if (hasValidBounds) miniMapRef.current?.fitBounds(bounds, STUDY_FIT);
  }, [bounds, hasValidBounds]);

  // Resize on expand/collapse
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const resize = () => {
      miniMapRef.current?.resize();
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

  // Layer visibility
  useEffect(() => { showLayer(current); }, [current, showLayer]);

  // Auto-play
  useEffect(() => {
    if (!playing || !timeline.length) return;
    const interval = setInterval(
      () => setCurrent((prev) => (prev + 1) % timeline.length),
      speed,
    );
    return () => clearInterval(interval);
  }, [playing, speed, timeline.length]);

  const goPrev = () =>
    setCurrent((c) => (c - 1 + timeline.length) % timeline.length);
  const goNext = () =>
    setCurrent((c) => (c + 1) % timeline.length);

  // ── Download as MP4 / WebM ────────────────────────────────────────────────
  const downloadMp4 = useCallback(async () => {
    const mm = miniMapRef.current;
    if (!mm || !mapLoadedRef.current || recording) return;

    setRecordError("");

    if (typeof MediaRecorder === "undefined") {
      setRecordError("MediaRecorder is not supported in this browser.");
      return;
    }

    const mimeType =
      ["video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"]
        .find((m) => MediaRecorder.isTypeSupported(m)) ?? "";

    if (!mimeType) {
      setRecordError("No supported video format found in this browser.");
      return;
    }

    setRecording(true);
    setRecordProgress(0);

    try {
      setPlaying(false);

      const FPS = 10;
      const slideSecs = speed / 1000;
      const framesPerSlide = Math.max(2, Math.round(slideSecs * FPS));

      const recCanvas = recCanvasRef.current;
      const mapCanvas = mm.getCanvas();
      recCanvas.width = mapCanvas.width;
      recCanvas.height = mapCanvas.height;
      const ctx = recCanvas.getContext("2d");

      const stream = recCanvas.captureStream(FPS);
      const chunks = [];
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6_000_000 });
      recorder.ondataavailable = (e) => { if (e.data?.size > 0) chunks.push(e.data); };
      recorder.start(100);

      const totalSteps = timeline.length * framesPerSlide;
      let stepsDone = 0;

      for (let i = 0; i < timeline.length; i++) {
        timeline.forEach((item, j) => {
          try {
            if (mm.getLayer(item.layerId)) {
              mm.setLayoutProperty(item.layerId, "visibility", j === i ? "visible" : "none");
            }
          } catch (_) {}
        });

        await waitIdle(mm);
        await sleep(300);

        let frameImg;
        try {
          frameImg = await canvasToImage(mapCanvas);
        } catch {
          stepsDone += framesPerSlide;
          setRecordProgress(Math.round((stepsDone / totalSteps) * 100));
          continue;
        }

        for (let f = 0; f < framesPerSlide; f++) {
          ctx.drawImage(frameImg, 0, 0, recCanvas.width, recCanvas.height);
          stepsDone++;
          setRecordProgress(Math.round((stepsDone / totalSteps) * 100));
          await sleep(1000 / FPS);
        }
      }

      await new Promise((resolve) => {
        recorder.onstop = resolve;
        recorder.stop();
      });

      const ext = mimeType.startsWith("video/mp4") ? "mp4" : "webm";
      const blob = new Blob(chunks, { type: mimeType });

      if (blob.size === 0) {
        setRecordError("Recording produced an empty file. Try a different browser.");
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const projectSafe = (projectConfig?.projectCode || projectId || "project")
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_-]/g, "");
      a.download = `timelapse_${projectSafe}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[TimeLapse] Recording error:", err);
      setRecordError(`Recording failed: ${err.message}`);
    } finally {
      showLayer(current);
      setRecording(false);
      setRecordProgress(0);
    }
  }, [recording, speed, current, showLayer, timeline, projectId, projectConfig]);

  // ── Minimum imagery guard ────────────────────────────────────────────────
  if (imagery.length < 2) {
    return (
      <div className="flex min-h-[80px] items-center justify-center p-4 text-center">
        <p className="text-[12px] text-white/50">
          At least two imagery dates are required for time lapse.
        </p>
      </div>
    );
  }

  const mapHeight = expanded ? undefined : "170px";
  const currentItem = timeline[current] || timeline[0];

  const content = (
    <div className={`p-3 ${expanded ? "min-h-0 flex-1 flex flex-col overflow-y-auto overscroll-contain" : ""}`}>
      <p className="text-white/60 mb-3 text-[11px]">
        View the construction captured progress through drone imagery.
      </p>

      {/* Mini Map */}
      <div
        className={`relative mb-3 overflow-hidden rounded-md border border-[#3b4558] transition-all duration-300 ${expanded ? "flex-1 min-h-0 shrink-0" : "shrink-0"}`}
        style={{ height: mapHeight }}
      >
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
        {currentItem && (
          <div
            className="absolute top-2 left-2 px-2 py-1 rounded text-[11px] font-bold text-white shadow-lg z-10"
            style={{ backgroundColor: currentItem.color + "cc" }}
          >
            {currentItem.date}
          </div>
        )}
      </div>

      {/* Timeline dots */}
      <div className="flex items-center justify-center gap-1 mb-3">
        {timeline.map((item, i) => (
          <button
            key={item.layerId}
            onClick={() => setCurrent(i)}
            className="flex flex-col items-center gap-1 px-2 py-1 rounded transition"
            style={{
              backgroundColor: i === current ? item.color + "22" : "transparent",
              border: i === current ? `1px solid ${item.color}` : "1px solid transparent",
            }}
          >
            <div
              className="w-3 h-3 rounded-full transition-transform"
              style={{ backgroundColor: item.color, transform: i === current ? "scale(1.3)" : "scale(1)" }}
            />
            <span
              className="text-[10px]"
              style={{ color: i === current ? "#fff" : "rgba(255,255,255,0.5)" }}
            >
              {item.date}
            </span>
          </button>
        ))}
      </div>

      {/* Playback controls */}
      <div className="flex items-center justify-center gap-3 mb-2">
        <button
          onClick={goPrev}
          className="p-1.5 rounded-md border border-[#3b4558] bg-[#232b3a] hover:bg-[#2c3648] text-white/80 hover:text-white transition"
          title="Previous"
        >
          <SkipBack size={14} />
        </button>

        <button
          onClick={() => setPlaying((p) => !p)}
          className="p-2 rounded-full border-2 transition"
          style={{
            borderColor: currentItem?.color || "#8fd36f",
            backgroundColor: playing ? (currentItem?.color || "#8fd36f") + "33" : "#232b3a",
            color: playing ? (currentItem?.color || "#8fd36f") : "#fff",
          }}
          title={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>

        <button
          onClick={goNext}
          className="p-1.5 rounded-md border border-[#3b4558] bg-[#232b3a] hover:bg-[#2c3648] text-white/80 hover:text-white transition"
          title="Next"
        >
          <SkipForward size={14} />
        </button>
      </div>

      {/* Speed control */}
      <div className="flex items-center justify-center gap-2 text-[11px] text-white/50">
        <span>Speed:</span>
        {[3000, 2000, 1000].map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`px-2 py-0.5 rounded text-[10px] transition ${
              speed === s
                ? "bg-[#8fd36f] text-[#1a1f2e] font-bold"
                : "bg-[#031a14] text-white/60 hover:bg-[#0c3d2d]"
            }`}
          >
            {s === 3000 ? "Slow" : s === 2000 ? "Normal" : "Fast"}
          </button>
        ))}
      </div>

      {recording && (
        <div className="mt-3 px-1">
          <div className="flex items-center justify-between mb-1 text-[10px] text-white/50">
            <span className="flex items-center gap-1">
              <Loader2 size={10} className="animate-spin text-[#8fd36f]" />
              Capturing frames… please wait
            </span>
            <span className="text-[#8fd36f] font-bold">{recordProgress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#2c3648] overflow-hidden">
            <div className="h-full rounded-full bg-[#8fd36f] transition-all duration-200" style={{ width: `${recordProgress}%` }} />
          </div>
        </div>
      )}

      {recordError && (
        <div className="mt-2 px-1 text-[10px] text-red-400">{recordError}</div>
      )}

      <div className="mt-3 px-1">
        <button
          type="button"
          onClick={downloadMp4}
          disabled={recording}
          className="w-full flex items-center justify-center gap-2 rounded-md border border-[#3b4558] bg-[#232b3a] px-3 py-2 text-[11px] font-semibold text-white/80 hover:bg-[#2c3648] hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {recording
            ? <><Loader2 size={13} className="animate-spin" /> Recording… {recordProgress}%</>
            : <><Download size={13} /> Download Timelapse (.mp4)</>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <canvas ref={recCanvasRef} style={{ display: "none" }} />

      {expanded && (
        <div className={EXPANDED_BACKDROP_CLASS} onClick={() => setExpanded(false)} />
      )}

      <div className={`text-[12px] ${expanded ? EXPANDED_PANEL_CLASS : "flex flex-col"}`}>
        <div className="flex shrink-0 items-center justify-between border-b border-[#343c4c] px-4 py-3 font-bold">
          <span>Time Lapse</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              title={recording ? `Recording… ${recordProgress}%` : "Download as MP4"}
              onClick={downloadMp4}
              disabled={recording}
              className="flex h-6 w-6 items-center justify-center rounded text-white/50 hover:text-white hover:bg-[#2a3548] transition disabled:cursor-not-allowed"
            >
              {recording
                ? <Loader2 size={13} className="animate-spin text-[#8fd36f]" />
                : <Download size={13} />}
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

        {content}
      </div>
    </>
  );
}

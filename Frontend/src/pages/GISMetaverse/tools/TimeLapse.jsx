import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  ChevronRight,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Maximize2,
  Minimize2,
  Download,
  Loader2,
} from "lucide-react";

const BOUNDS = [
  [74.42562653088396, 31.60509230706726],
  [74.43545280361002, 31.6112165411359],
];

const TIMELINE = [
  {
    label: "AsBuilt Jan 2023",
    date: "January 2023",
    sourceId: "tl-jan2023-src",
    layerId: "tl-jan2023-lyr",
    url: "http://localhost:8081/data/Chahar_Bagh_Jan2023/{z}/{x}/{y}.png",
    color: "#a855f7",
  },
  {
    label: "Ortho June 2023",
    date: "June 2023",
    sourceId: "tl-june2023-src",
    layerId: "tl-june2023-lyr",
    url: "http://localhost:8081/data/Chahar_Bagh_June2023/{z}/{x}/{y}.png",
    color: "#3b82f6",
  },
  {
    label: "Ortho Nov 2024",
    date: "November 2024",
    sourceId: "tl-nov2024-src",
    layerId: "tl-nov2024-lyr",
    url: "http://localhost:8081/data/Chahar_Bagh_Nov2024/{z}/{x}/{y}.png",
    color: "#ef4444",
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Wait for the map to reach a fully idle (non-moving, non-rendering) state. */
function waitIdle(mm) {
  return new Promise((resolve) => {
    if (!mm.isMoving() && !mm.isZooming() && !mm.isRotating()) {
      // already idle — wait two rAF ticks for WebGL to flush
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    } else {
      mm.once("idle", () => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Read a Mapbox canvas into a regular HTMLImageElement via toDataURL.
 *  Works even when preserveDrawingBuffer = true. */
function canvasToImage(canvas) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    // toDataURL only works when preserveDrawingBuffer:true
    img.src = canvas.toDataURL("image/png");
  });
}

export default function TimeLapse({ map }) {
  const miniMapRef   = useRef(null);
  const containerRef = useRef(null);
  const mapLoadedRef = useRef(false);
  // Hidden canvas used as the MediaRecorder source
  const recCanvasRef = useRef(null);

  const [current,        setCurrent]        = useState(0);
  const [playing,        setPlaying]        = useState(false);
  const [speed,          setSpeed]          = useState(2000);
  const [expanded,       setExpanded]       = useState(false);
  const [recording,      setRecording]      = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [recordError,    setRecordError]    = useState("");

  // ── Show the correct raster layer ────────────────────────────────────────
  const showLayer = useCallback((index) => {
    const mm = miniMapRef.current;
    if (!mm || !mapLoadedRef.current) return;
    TIMELINE.forEach((item, i) => {
      try {
        if (mm.getLayer(item.layerId)) {
          mm.setLayoutProperty(
            item.layerId,
            "visibility",
            i === index ? "visible" : "none",
          );
        }
      } catch (_) {}
    });
  }, []);

  // ── Init mini-map (preserveDrawingBuffer: true is REQUIRED for toDataURL) ─
  useEffect(() => {
    if (!containerRef.current || miniMapRef.current) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

    const mm = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [74.43, 31.608],
      zoom: 14,
      interactive: true,
      attributionControl: false,
      preserveDrawingBuffer: true,   // ← makes toDataURL work
    });

    mm.on("load", () => {
      mapLoadedRef.current = true;
      TIMELINE.forEach((item, i) => {
        mm.addSource(item.sourceId, {
          type: "raster",
          tiles: [item.url],
          tileSize: 256,
        });
        mm.addLayer({
          id: item.layerId,
          type: "raster",
          source: item.sourceId,
          layout: { visibility: i === 0 ? "visible" : "none" },
        });
      });
      mm.fitBounds(BOUNDS, { padding: 10, duration: 0 });
    });

    miniMapRef.current = mm;

    return () => {
      mapLoadedRef.current = false;
      mm.remove();
      miniMapRef.current = null;
    };
  }, []);

  // Resize mini-map when panel expands/collapses
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => miniMapRef.current?.resize());
    ro.observe(el);
    const t1 = setTimeout(() => miniMapRef.current?.resize(), 50);
    const t2 = setTimeout(() => miniMapRef.current?.resize(), 200);
    return () => { ro.disconnect(); clearTimeout(t1); clearTimeout(t2); };
  }, [expanded]);

  // ── Layer visibility ──────────────────────────────────────────────────────
  useEffect(() => { showLayer(current); }, [current, showLayer]);

  // ── Auto-play ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(
      () => setCurrent((prev) => (prev + 1) % TIMELINE.length),
      speed,
    );
    return () => clearInterval(interval);
  }, [playing, speed]);

  const goPrev = () => setCurrent((c) => (c - 1 + TIMELINE.length) % TIMELINE.length);
  const goNext = () => setCurrent((c) => (c + 1) % TIMELINE.length);

  // ── Download as MP4 / WebM ────────────────────────────────────────────────
  const downloadMp4 = useCallback(async () => {
    const mm = miniMapRef.current;
    if (!mm || !mapLoadedRef.current || recording) return;

    setRecordError("");

    // Check MediaRecorder support
    if (typeof MediaRecorder === "undefined") {
      setRecordError("MediaRecorder is not supported in this browser.");
      return;
    }

    // Pick the best supported MIME — prefer mp4, fall back to webm
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
      // Pause playback while recording
      setPlaying(false);

      const FPS = 10; // lower = smaller file, still smooth enough for timelapse
      // seconds each slide is held in the video
      const slideSecs = speed / 1000;
      const framesPerSlide = Math.max(2, Math.round(slideSecs * FPS));

      // Use a visible HTMLCanvasElement — OffscreenCanvas.captureStream is not
      // universally supported, but HTMLCanvasElement.captureStream() is fine.
      const recCanvas = recCanvasRef.current;
      const mapCanvas = mm.getCanvas();
      recCanvas.width  = mapCanvas.width;
      recCanvas.height = mapCanvas.height;
      const ctx = recCanvas.getContext("2d");

      const stream = recCanvas.captureStream(FPS);
      const chunks = [];
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 6_000_000,
      });
      recorder.ondataavailable = (e) => { if (e.data?.size > 0) chunks.push(e.data); };
      recorder.start(100); // collect data every 100 ms

      const totalSteps = TIMELINE.length * framesPerSlide;
      let stepsDone = 0;

      for (let i = 0; i < TIMELINE.length; i++) {
        // Switch to this layer
        TIMELINE.forEach((item, j) => {
          try {
            if (mm.getLayer(item.layerId)) {
              mm.setLayoutProperty(
                item.layerId,
                "visibility",
                j === i ? "visible" : "none",
              );
            }
          } catch (_) {}
        });

        // Wait for Mapbox to finish rendering this layer
        await waitIdle(mm);
        // Extra settle time so tile textures upload to GPU
        await sleep(300);

        // Capture one snapshot via toDataURL (needs preserveDrawingBuffer: true)
        let frameImg;
        try {
          frameImg = await canvasToImage(mapCanvas);
        } catch {
          // If toDataURL fails for any reason, skip this frame
          stepsDone += framesPerSlide;
          setRecordProgress(Math.round((stepsDone / totalSteps) * 100));
          continue;
        }

        // Paint that snapshot for `framesPerSlide` video frames
        for (let f = 0; f < framesPerSlide; f++) {
          ctx.drawImage(frameImg, 0, 0, recCanvas.width, recCanvas.height);
          stepsDone++;
          setRecordProgress(Math.round((stepsDone / totalSteps) * 100));
          await sleep(1000 / FPS);
        }
      }

      // Finalise
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
      a.download = `timelapse_chahar_bagh.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error("TimeLapse recording error:", err);
      setRecordError(`Recording failed: ${err.message}`);
    } finally {
      showLayer(current);
      setRecording(false);
      setRecordProgress(0);
    }
  }, [recording, speed, current, showLayer]);

  // ── Map height ────────────────────────────────────────────────────────────
  const mapHeight = expanded ? "500px" : "180px";

  // ── Content ───────────────────────────────────────────────────────────────
  const content = (
    <div className="p-3">
      <p className="text-white/60 mb-3 text-[11px]">
        View the construction captured progress through drone
        imagery. 
      </p>

      {/* Mini Map */}
      <div
        className="relative rounded-md overflow-hidden border border-[#3b4558] mb-3 transition-all duration-300"
        style={{ height: mapHeight }}
      >
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

        {/* Date badge */}
        <div
          className="absolute top-2 left-2 px-2 py-1 rounded text-[11px] font-bold text-white shadow-lg z-10"
          style={{ backgroundColor: TIMELINE[current].color + "cc" }}
        >
          {TIMELINE[current].date}
        </div>
      </div>

      {/* Timeline dots */}
      <div className="flex items-center justify-center gap-1 mb-3">
        {TIMELINE.map((item, i) => (
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
              style={{
                backgroundColor: item.color,
                transform: i === current ? "scale(1.3)" : "scale(1)",
              }}
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
            borderColor: TIMELINE[current].color,
            backgroundColor: playing ? TIMELINE[current].color + "33" : "#232b3a",
            color: playing ? TIMELINE[current].color : "#fff",
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
                : "bg-[#2c3648] text-white/60 hover:bg-[#344055]"
            }`}
          >
            {s === 3000 ? "Slow" : s === 2000 ? "Normal" : "Fast"}
          </button>
        ))}
      </div>

      {/* Recording progress */}
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
            <div
              className="h-full rounded-full bg-[#8fd36f] transition-all duration-200"
              style={{ width: `${recordProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {recordError && (
        <div className="mt-2 px-1 text-[10px] text-red-400">{recordError}</div>
      )}

      {/* Download button */}
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

      {/* Date Slider */}
      <div className="mt-4 border-t border-[#343c4c] pt-3">
        <div className="text-[11px] text-white/50 mb-2 font-semibold">Slide to Date</div>
        <input
          type="range"
          min="0"
          max={TIMELINE.length - 1}
          step="1"
          value={current}
          onChange={(e) => setCurrent(Number(e.target.value))}
          className="w-full h-[5px] rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${TIMELINE.map(
              (t, i) => `${t.color} ${(i / (TIMELINE.length - 1)) * 100}%`,
            ).join(", ")})`,
          }}
        />
        <div className="flex justify-between mt-1">
          {TIMELINE.map((item, i) => (
            <span
              key={item.layerId}
              className="text-[10px] font-semibold cursor-pointer transition"
              style={{ color: i === current ? item.color : "rgba(255,255,255,0.4)" }}
              onClick={() => setCurrent(i)}
            >
              {item.date}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Hidden canvas used purely as MediaRecorder source — never visible */}
      <canvas ref={recCanvasRef} style={{ display: "none" }} />

      {/* Backdrop when expanded */}
      {expanded && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
          onClick={() => setExpanded(false)}
        />
      )}

      {/* Panel */}
      <div
        className={`text-[12px] ${
          expanded
            ? "fixed z-[70] rounded-xl border border-[#3a4354] bg-[#202736] shadow-2xl overflow-hidden"
            : ""
        }`}
        style={
          expanded
            ? {
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "min(820px, 92vw)",
                maxHeight: "92vh",
                overflowY: "auto",
              }
            : {}
        }
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#343c4c] px-4 py-3 font-bold">
          <span>Time Lapse</span>

          <div className="flex items-center gap-1">
            {/* Quick download icon in header */}
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

            {/* Expand / shrink */}
            <button
              type="button"
              title={expanded ? "Shrink viewer" : "Expand viewer"}
              onClick={() => setExpanded((e) => !e)}
              className="flex h-6 w-6 items-center justify-center rounded text-white/50 hover:text-white hover:bg-[#2a3548] transition"
            >
              {expanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>

            <ChevronRight size={15} className="text-white/40 ml-1" />
          </div>
        </div>

        {content}
      </div>
    </>
  );
}


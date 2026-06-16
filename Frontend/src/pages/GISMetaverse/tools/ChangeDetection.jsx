import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { ChevronRight, GripVertical, Maximize2, Minimize2 } from "lucide-react";

const BOUNDS = [
  [74.42562653088396, 31.60509230706726],
  [74.43545280361002, 31.6112165411359],
];

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
];

export default function ChangeDetection({ map }) {
  const containerRef = useRef(null);
  const containerLeftRef = useRef(null);
  const containerRightRef = useRef(null);

  const mapLeftRef = useRef(null);
  const mapRightRef = useRef(null);
  const mapLeftLoadedRef = useRef(false);
  const mapRightLoadedRef = useRef(false);

  const swipeRef = useRef(null);
  const isDraggingRef = useRef(false);

  const [leftIdx,   setLeftIdx]   = useState(0);
  const [rightIdx,  setRightIdx]  = useState(2);
  const [swipePos,  setSwipePos]  = useState(50);
  const [expanded,  setExpanded]  = useState(false);

  // ── Resize both Mapbox instances when the container size changes ───────────
  // This fires both when expanded toggles AND when the CSS transition finishes,
  // so the canvas always fills its container correctly.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const resize = () => {
      mapLeftRef.current?.resize();
      mapRightRef.current?.resize();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(el);

    // Belt-and-suspenders: fire again after transition (300 ms) completes
    const t1 = setTimeout(resize, 50);
    const t2 = setTimeout(resize, 350);

    return () => {
      ro.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [expanded]);

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
    });

    const mRight = new mapboxgl.Map({
      container: containerRightRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [74.43, 31.608],
      zoom: 15,
      interactive: false,
      attributionControl: false,
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
      mLeft.fitBounds(BOUNDS, { padding: 10, duration: 0 });
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
      mRight.fitBounds(BOUNDS, { padding: 10, duration: 0 });
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
                width: "min(860px, 92vw)",
              }
            : {}
        }
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#343c4c] px-4 py-3 font-bold">
          <span>Change Detection</span>
          <div className="flex items-center gap-1">
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

        <div className="p-3">
          <p className="text-white/60 mb-3 text-[11px]">
            Compare two drone images side-by-side. Drag the swipe handle to reveal
            changes between time periods.
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
                {IMAGERY.map((item, i) => (
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
                {IMAGERY.map((item, i) => (
                  <option key={item.id} value={i} disabled={i === leftIdx}>
                    {item.short}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Swipe comparison map — taller when expanded */}
          <div
            ref={containerRef}
            className="relative rounded-md overflow-hidden border border-[#3b4558] mb-3 select-none transition-all duration-300"
            style={{ height: expanded ? "480px" : "220px", width: "100%" }}
          >
            {/* Map A (Left image) */}
            <div ref={containerLeftRef} style={{ position: "absolute", inset: 0 }} />

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
            <div className="text-[10px] text-white/40 mb-1 font-semibold">SWIPE POSITION</div>
            <input
              type="range" min="0" max="100" value={swipePos}
              onChange={(e) => setSwipePos(Number(e.target.value))}
              className="w-full h-[4px] rounded-full appearance-none cursor-pointer accent-[#8fd36f]"
              style={{
                background: `linear-gradient(to right, ${IMAGERY[leftIdx].color} ${swipePos}%, ${IMAGERY[rightIdx].color} ${swipePos}%)`,
              }}
            />
            <div className="flex justify-between text-[10px] text-white/40 mt-1">
              <span style={{ color: IMAGERY[leftIdx].color }}>← {IMAGERY[leftIdx].short}</span>
              <span style={{ color: IMAGERY[rightIdx].color }}>{IMAGERY[rightIdx].short} →</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

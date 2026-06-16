import React, { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  SkipBack,
  SkipForward,
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

export default function TimeLapse({ map }) {
  const miniMapRef = useRef(null);
  const containerRef = useRef(null);
  const mapLoadedRef = useRef(false);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2000);

  // Show the correct layer on the mini map
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
      } catch (e) {
        // layer not ready yet, safe to ignore
      }
    });
  }, []);

  // Initialize mini map
  useEffect(() => {
    if (!containerRef.current || miniMapRef.current) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

    const mm = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [74.43, 31.608],
      zoom: 14,
      interactive: false,
      attributionControl: false,
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

  // Update visibility when current changes
  useEffect(() => {
    showLayer(current);
  }, [current, showLayer]);

  // Auto-play timer
  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % TIMELINE.length);
    }, speed);
    return () => clearInterval(interval);
  }, [playing, speed]);

  const goPrev = () =>
    setCurrent((c) => (c - 1 + TIMELINE.length) % TIMELINE.length);
  const goNext = () => setCurrent((c) => (c + 1) % TIMELINE.length);

  return (
    <div className="text-[12px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#343c4c] px-4 py-3 font-bold">
        <span>Time Lapse</span>
        <ChevronRight size={15} />
      </div>

      <div className="p-3">
        <p className="text-white/60 mb-3 text-[11px]">
          View the construction progress of Chahar Bagh Phase 1 through drone
          imagery captured at three different time periods.
        </p>

        {/* Mini Map */}
        <div className="relative rounded-md overflow-hidden border border-[#3b4558] mb-3">
          <div ref={containerRef} style={{ width: "100%", height: "200px" }} />
          {/* Date Badge */}
          <div
            className="absolute top-2 left-2 px-2 py-1 rounded text-[11px] font-bold text-white shadow-lg"
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
                backgroundColor:
                  i === current ? item.color + "22" : "transparent",
                border:
                  i === current
                    ? `1px solid ${item.color}`
                    : "1px solid transparent",
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
                style={{
                  color: i === current ? "#fff" : "rgba(255,255,255,0.5)",
                }}
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
              backgroundColor: playing
                ? TIMELINE[current].color + "33"
                : "#232b3a",
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
                (t, i) =>
                  `${t.color} ${(i / (TIMELINE.length - 1)) * 100}%`
              ).join(", ")})`,
            }}
          />
          <div className="flex justify-between mt-1">
            {TIMELINE.map((item, i) => (
              <span
                key={item.layerId}
                className="text-[10px] font-semibold cursor-pointer transition"
                style={{
                  color: i === current ? item.color : "rgba(255,255,255,0.4)",
                }}
                onClick={() => setCurrent(i)}
              >
                {item.date}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

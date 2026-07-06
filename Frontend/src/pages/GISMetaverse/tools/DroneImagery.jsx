import { useState, useEffect, useRef } from "react";
import {
  Grid3X3,
  Clock,
  Video,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RotateCcw,
  Image,
} from "lucide-react";
import { LAYER_PANEL_SCROLL } from "./Layers/_layerScroll";

// ── Video catalogue ────────────────────────────────────────────────────────────
const DRONE_VIDEOS = [
  {
    id: "chahar-bagh-1",
    title: "Chahar Bagh Phase 1",
    subtitle: "Aerial Survey — 2024",
    src: "/Ruda Chahar Bagh Drone Video 1.mp4",
    color: "#65c96b",
  },
];

// ── Imagery catalogue ──────────────────────────────────────────────────────────
const IMAGERY_LAYERS = [
  {
    id: "jan2023",
    label: "Jan 2023",
    color: "#a855f7",
    sourceId: "gis-jan2023-source",
    layerId: "gis-jan2023-layer",
    tileUrl: "https://rudametaverse.nespakprogresscenter.com/tiles/data/Chahar_Bagh_AsBuilt_Jan2023/{z}/{x}/{y}.png",
  },
  {
    id: "june2023",
    label: "June 2023",
    color: "#3b82f6",
    sourceId: "gis-june2023-source",
    layerId: "gis-june2023-layer",
    tileUrl: "https://rudametaverse.nespakprogresscenter.com/tiles/data/Chahar_Bagh_Ortho_June2023/{z}/{x}/{y}.png",
  },
  {
    id: "nov2024",
    label: "Nov 2024",
    color: "#ef4444",
    sourceId: "gis-nov2024-source",
    layerId: "gis-nov2024-layer",
    tileUrl: "https://rudametaverse.nespakprogresscenter.com/tiles/data/Chahar_Bagh_Ortho_Nov2024/{z}/{x}/{y}.png",
  },
  {
    id: "apr2026",
    label: "Apr 2026",
    color: "#f59e0b",
    sourceId: "gis-apr2026-source",
    layerId: "gis-apr2026-layer",
    tileUrl: "https://rudametaverse.nespakprogresscenter.com/tiles/data/Chaharbagh_Ortho/{z}/{x}/{y}.png",
  },
];

export default function DroneImagery({ map, onExpandedChange }) {
  // ── Tab state: "imagery" | "videos" ──────────────────────────────────────
  const [activeTab, setActiveTab] = useState("imagery");

  // ── Imagery state ─────────────────────────────────────────────────────────
  const [imageryState, setImageryState] = useState(() =>
    Object.fromEntries(
      IMAGERY_LAYERS.map((l) => [l.id, { visible: false, opacity: 100 }]),
    ),
  );

  // ── Video state ───────────────────────────────────────────────────────────
  const [activeVideo, setActiveVideo] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (typeof onExpandedChange !== "function") return;

    onExpandedChange(expanded);

    return () => {
      onExpandedChange(false);
    };
  }, [expanded, onExpandedChange]);

  const flyToChaharbagh = () => {
    if (!map) return;
    map.fitBounds(
      [
        [74.42562653088396, 31.60509230706726],
        [74.43545280361002, 31.6112165411359],
      ],
      { padding: 50, duration: 1500 },
    );
  };

  // ── Sync each raster layer to map ─────────────────────────────────────────
  useEffect(() => {
    if (!map) return;

    IMAGERY_LAYERS.forEach(({ id, sourceId, layerId, tileUrl }) => {
      const { visible, opacity } = imageryState[id];

      if (visible) {
        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, {
            type: "raster",
            tiles: [tileUrl],
            tileSize: 256,
          });
        }
        if (!map.getLayer(layerId)) {
          map.addLayer({
            id: layerId,
            type: "raster",
            source: sourceId,
            paint: { "raster-opacity": opacity / 100 },
            layout: { visibility: "visible" },
          });
          flyToChaharbagh();
        } else {
          map.setLayoutProperty(layerId, "visibility", "visible");
          map.setPaintProperty(layerId, "raster-opacity", opacity / 100);
        }
      } else if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, "visibility", "none");
      }
    });
  }, [map, imageryState]); // eslint-disable-line react-hooks/exhaustive-deps

  const setLayerState = (id, patch) =>
    setImageryState((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));

  // ── Video helpers ─────────────────────────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) v.play().catch(() => setPlaying(false));
    else v.pause();
  }, [playing]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = muted ? 0 : volume;
  }, [volume, muted]);

  const formatTime = (s) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleSeek = (e) => {
    const v = videoRef.current;
    if (!v) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = pct * v.duration;
    setProgress(pct * 100);
    setCurrentTime(v.currentTime);
  };

  const openVideo = (id) => {
    setActiveVideo(id);
    setPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setExpanded(false);
  };

  const closeVideo = () => {
    setActiveVideo(null);
    setPlaying(false);
    setExpanded(false);
  };

  const activeVid = DRONE_VIDEOS.find((v) => v.id === activeVideo);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="text-[12px]">
      {/* ── Panel header ── */}
      <div className="flex items-center justify-between border-b border-[#343c4c] px-4 py-3 font-bold">
        <span>Drone Imagery</span>
      </div>

      {/* ── Tab toggle strip ── */}
      <div className="flex gap-1 border-b border-[#343c4c] px-3 pt-2 pb-0">
        <TabBtn
          active={activeTab === "imagery"}
          icon={<Image size={13} />}
          label="Imagery"
          onClick={() => setActiveTab("imagery")}
        />
        <TabBtn
          active={activeTab === "videos"}
          icon={<Video size={13} />}
          label="Videos"
          onClick={() => setActiveTab("videos")}
        />
      </div>

      {/* ══════════════════════════ IMAGERY TAB ══════════════════════════ */}
      {activeTab === "imagery" && (
        <div
          className={`p-3 max-h-[calc(70vh-6rem)] sm:max-h-[calc(100vh-130px)] ${LAYER_PANEL_SCROLL}`}
        >
          <p className="mb-3 text-white/60">
            Toggle historical drone imagery of Chaharbagh Phase 1 to monitor
            construction progress over time.
          </p>

          <div className="rounded-sm border border-[#3b4558] bg-[#232b3a] p-2 space-y-4">
            {IMAGERY_LAYERS.map((layer, i) => {
              const state = imageryState[layer.id];
              return (
                <div key={layer.id}>
                  {i > 0 && (
                    <div className="border-t border-[#394354] -mx-2 mb-4" />
                  )}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={state.visible}
                        onChange={(e) =>
                          setLayerState(layer.id, { visible: e.target.checked })
                        }
                        className="accent-[#65c96b]"
                      />
                      <Clock size={14} style={{ color: layer.color }} />
                      <span className="font-semibold text-white/90">
                        {layer.label}
                      </span>
                    </label>
                    <Grid3X3 size={14} className="text-white/60" />
                  </div>

                  <div className="mt-2 flex items-center gap-2 pl-6">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={state.opacity}
                      onChange={(e) =>
                        setLayerState(layer.id, {
                          opacity: Number(e.target.value),
                        })
                      }
                      className="h-[3px] flex-1 rounded-full accent-[#65c96b] bg-[#8fd36f]"
                    />
                    <span className="text-[11px] text-white/90 w-8 text-right">
                      {state.opacity}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════ VIDEOS TAB ══════════════════════════ */}
      {activeTab === "videos" && (
        <div
          className={`p-3 max-h-[calc(70vh-6rem)] sm:max-h-[calc(100vh-130px)] ${LAYER_PANEL_SCROLL}`}
        >
          <p className="mb-3 text-white/60">
            Watch aerial drone footage captured over Chaharbagh Phase 1.
          </p>

          {/* Video card list */}
          {DRONE_VIDEOS.map((vid) => (
            <button
              key={vid.id}
              type="button"
              onClick={() => openVideo(vid.id)}
              className={`w-full flex items-center gap-3 rounded-md border px-3 py-2.5 mb-2 transition text-left ${
                activeVideo === vid.id
                  ? "border-[#65c96b] bg-[#1e2e1e]"
                  : "border-[#3b4558] bg-[#1e2636] hover:border-[#65c96b]/50 hover:bg-[#1e2e1e]/60"
              }`}
            >
              <div
                className="shrink-0 w-14 h-10 rounded overflow-hidden flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg,#1a3a1a,#2d5a2d)",
                }}
              >
                <Video size={20} className="text-[#65c96b]/70" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="font-semibold text-white/90 text-[11px] truncate">
                  {vid.title}
                </div>
                <div className="text-[10px] text-white/40 truncate">
                  {vid.subtitle}
                </div>
              </div>

              <div
                className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: vid.color + "33",
                  border: `1px solid ${vid.color}`,
                }}
              >
                <Play size={10} style={{ color: vid.color }} />
              </div>
            </button>
          ))}

          {/* Inline player */}
          {activeVid && (
            <>
              {expanded && (
                <div
                  className="fixed inset-0 z-[10001] bg-black/70 backdrop-blur-sm"
                  onClick={() => setExpanded(false)}
                />
              )}

<div
  className={`bg-[#06291f] shadow-xl transition-all duration-300 ${
    expanded
      ? "fixed z-[10002] rounded-xl border border-[#3b4558] overflow-hidden"
      : "mt-2 rounded-lg border border-[#3b4558] overflow-hidden"
  }`}
style={
                  expanded
                    ? {
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "min(820px, 90vw)",
                      }
                    : {}
                }
>
                {/* Player header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a3548]">
                  <div className="flex items-center gap-2">
                    <Video size={12} className="text-[#65c96b]" />
                    <span className="text-[11px] font-semibold text-white/80 truncate max-w-[180px]">
                      {activeVid.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title={expanded ? "Shrink" : "Expand"}
                      onClick={() => setExpanded((e) => !e)}
                      className="flex h-6 w-6 items-center justify-center rounded text-white/50 hover:text-white hover:bg-[#2a3548] transition"
                    >
                      {expanded ? (
                        <Minimize2 size={13} />
                      ) : (
                        <Maximize2 size={13} />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={closeVideo}
                      className="flex h-6 w-6 items-center justify-center rounded text-white/40 hover:text-white hover:bg-[#2a3548] transition text-[18px] leading-none"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Video */}
                <div
                  className="relative bg-black"
                  style={{ aspectRatio: "16/9" }}
                >
                  <video
                    ref={videoRef}
                    src={activeVid.src}
                    className="w-full h-full object-contain"
                    onTimeUpdate={() => {
                      const v = videoRef.current;
                      if (!v || dragging) return;
                      setCurrentTime(v.currentTime);
                      setProgress((v.currentTime / v.duration) * 100 || 0);
                    }}
                    onLoadedMetadata={() => {
                      const v = videoRef.current;
                      if (v) setDuration(v.duration);
                    }}
                    onEnded={() => setPlaying(false)}
                    preload="metadata"
                    playsInline
                    onClick={() => setPlaying((p) => !p)}
                    style={{ cursor: "pointer" }}
                  />
                  {!playing && (
                    <div
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      style={{ background: "rgba(0,0,0,0.35)" }}
                    >
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: "rgba(101,201,107,0.25)",
                          border: "2px solid #65c96b",
                        }}
                      >
                        <Play size={24} className="text-[#65c96b] ml-1" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="px-3 pt-2 pb-3 space-y-2">
                  {/* Progress bar */}
                  <div
                    className="relative w-full h-1.5 rounded-full cursor-pointer group"
                    style={{ backgroundColor: "#2a3548" }}
                    onClick={handleSeek}
                    onMouseDown={() => setDragging(true)}
                    onMouseUp={() => setDragging(false)}
                    onMouseMove={(e) => {
                      if (!dragging) return;
                      const v = videoRef.current;
                      if (!v) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const pct = Math.max(
                        0,
                        Math.min(1, (e.clientX - rect.left) / rect.width),
                      );
                      v.currentTime = pct * v.duration;
                      setProgress(pct * 100);
                      setCurrentTime(v.currentTime);
                    }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: "#65c96b",
                      }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-[#65c96b] bg-white shadow opacity-0 group-hover:opacity-100"
                      style={{
                        left: `calc(${progress}% - 6px)`,
                        backgroundColor: "#65c96b",
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-white/40 -mt-0.5">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CtrlBtn
                        title="Restart"
                        onClick={() => {
                          const v = videoRef.current;
                          if (!v) return;
                          v.currentTime = 0;
                          setProgress(0);
                          setCurrentTime(0);
                          setPlaying(true);
                        }}
                      >
                        <RotateCcw size={14} />
                      </CtrlBtn>
                      <button
                        type="button"
                        onClick={() => setPlaying((p) => !p)}
                        className="flex h-8 w-8 items-center justify-center rounded-full transition"
                        style={{ backgroundColor: "#9be37b", color: "#06291f" }}
                      >
                        {playing ? (
                          <Pause size={15} />
                        ) : (
                          <Play size={15} className="ml-0.5" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <CtrlBtn
                          title={muted ? "Unmute" : "Mute"}
                          onClick={() => setMuted((m) => !m)}
                        >
                          {muted ? (
                            <VolumeX size={14} />
                          ) : (
                            <Volume2 size={14} />
                          )}
                        </CtrlBtn>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={muted ? 0 : volume}
                          onChange={(e) => {
                            setVolume(Number(e.target.value));
                            setMuted(false);
                          }}
                          className="h-[3px] w-16 rounded-full accent-[#65c96b] bg-[#2a3548] cursor-pointer"
                        />
                      </div>
                      <CtrlBtn
                        title="Fullscreen"
                        onClick={() => {
                          const v = videoRef.current;
                          if (!v) return;
                          if (v.requestFullscreen) v.requestFullscreen();
                          else if (v.webkitRequestFullscreen)
                            v.webkitRequestFullscreen();
                        }}
                      >
                        <Maximize2 size={14} />
                      </CtrlBtn>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tab button ────────────────────────────────────────────────────────────────
function TabBtn({ active, icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold rounded-t-md border-b-2 transition-colors ${
        active
          ? "border-[#65c96b] text-[#65c96b] bg-[#65c96b]/10"
          : "border-transparent text-white/40 hover:text-white/70"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ── Small icon button ─────────────────────────────────────────────────────────
function CtrlBtn({ title, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-md border border-[#0f3d2e] bg-[#1f2937] text-white/70 transition hover:bg-[#0f3d2e] hover:text-white"
    >
      {children}
    </button>
  );
}

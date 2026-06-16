import { useState, useEffect, useRef } from "react";
import {
  ChevronRight,
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
} from "lucide-react";

// ── Video catalogue (add more entries here as needed) ─────────────────────────
const DRONE_VIDEOS = [
  {
    id: "chahar-bagh-1",
    title: "Chahar Bagh Phase 1",
    subtitle: "Aerial Survey — 2024",
    src: "/Ruda Chahar Bagh Drone Video 1.mp4",
    thumb: null, // no thumbnail, use gradient placeholder
    color: "#65c96b",
  },
];

export default function DroneImagery({ map }) {
  // ── Imagery state ─────────────────────────────────────────────────────────
  const [jan2023Visible,  setJan2023Visible]  = useState(false);
  const [jan2023Opacity,  setJan2023Opacity]  = useState(100);
  const [june2023Visible, setJune2023Visible] = useState(false);
  const [june2023Opacity, setJune2023Opacity] = useState(100);
  const [nov2024Visible,  setNov2024Visible]  = useState(false);
  const [nov2024Opacity,  setNov2024Opacity]  = useState(100);

  // ── Video state ───────────────────────────────────────────────────────────
  const [activeVideo,  setActiveVideo]  = useState(null);   // video id or null
  const [playing,      setPlaying]      = useState(false);
  const [muted,        setMuted]        = useState(false);
  const [volume,       setVolume]       = useState(0.8);
  const [progress,     setProgress]     = useState(0);      // 0-100
  const [currentTime,  setCurrentTime]  = useState(0);
  const [duration,     setDuration]     = useState(0);
  const [dragging,     setDragging]     = useState(false);
  const [expanded,     setExpanded]     = useState(false); // overlay expand mode
  const videoRef = useRef(null);

  // ── Map source / layer IDs ────────────────────────────────────────────────
  const JAN2023_SOURCE  = "gis-jan2023-source";
  const JAN2023_LAYER   = "gis-jan2023-layer";
  const JUNE2023_SOURCE = "gis-june2023-source";
  const JUNE2023_LAYER  = "gis-june2023-layer";
  const NOV2024_SOURCE  = "gis-nov2024-source";
  const NOV2024_LAYER   = "gis-nov2024-layer";

  const flyToChaharbagh = () => {
    if (!map) return;
    map.fitBounds(
      [[74.42562653088396, 31.60509230706726], [74.43545280361002, 31.6112165411359]],
      { padding: 50, duration: 1500 },
    );
  };

  // ── Raster layer effects (unchanged logic) ────────────────────────────────
  useEffect(() => {
    if (!map) return;
    if (jan2023Visible) {
      if (!map.getSource(JAN2023_SOURCE))
        map.addSource(JAN2023_SOURCE, { type: "raster", tiles: ["http://localhost:8080/data/Chahar_Bagh_Jan2023/{z}/{x}/{y}.png"], tileSize: 256 });
      if (!map.getLayer(JAN2023_LAYER)) {
        map.addLayer({ id: JAN2023_LAYER, type: "raster", source: JAN2023_SOURCE, paint: { "raster-opacity": jan2023Opacity / 100 }, layout: { visibility: "visible" } });
        flyToChaharbagh();
      } else {
        map.setLayoutProperty(JAN2023_LAYER, "visibility", "visible");
        map.setPaintProperty(JAN2023_LAYER, "raster-opacity", jan2023Opacity / 100);
      }
    } else if (map.getLayer(JAN2023_LAYER)) {
      map.setLayoutProperty(JAN2023_LAYER, "visibility", "none");
    }
  }, [map, jan2023Visible, jan2023Opacity]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!map) return;
    if (june2023Visible) {
      if (!map.getSource(JUNE2023_SOURCE))
        map.addSource(JUNE2023_SOURCE, { type: "raster", tiles: ["http://localhost:8080/data/Chahar_Bagh_June2023/{z}/{x}/{y}.png"], tileSize: 256 });
      if (!map.getLayer(JUNE2023_LAYER)) {
        map.addLayer({ id: JUNE2023_LAYER, type: "raster", source: JUNE2023_SOURCE, paint: { "raster-opacity": june2023Opacity / 100 }, layout: { visibility: "visible" } });
        flyToChaharbagh();
      } else {
        map.setLayoutProperty(JUNE2023_LAYER, "visibility", "visible");
        map.setPaintProperty(JUNE2023_LAYER, "raster-opacity", june2023Opacity / 100);
      }
    } else if (map.getLayer(JUNE2023_LAYER)) {
      map.setLayoutProperty(JUNE2023_LAYER, "visibility", "none");
    }
  }, [map, june2023Visible, june2023Opacity]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!map) return;
    if (nov2024Visible) {
      if (!map.getSource(NOV2024_SOURCE))
        map.addSource(NOV2024_SOURCE, { type: "raster", tiles: ["http://localhost:8080/data/Chahar_Bagh_Nov2024/{z}/{x}/{y}.png"], tileSize: 256 });
      if (!map.getLayer(NOV2024_LAYER)) {
        map.addLayer({ id: NOV2024_LAYER, type: "raster", source: NOV2024_SOURCE, paint: { "raster-opacity": nov2024Opacity / 100 }, layout: { visibility: "visible" } });
        flyToChaharbagh();
      } else {
        map.setLayoutProperty(NOV2024_LAYER, "visibility", "visible");
        map.setPaintProperty(NOV2024_LAYER, "raster-opacity", nov2024Opacity / 100);
      }
    } else if (map.getLayer(NOV2024_LAYER)) {
      map.setLayoutProperty(NOV2024_LAYER, "visibility", "none");
    }
  }, [map, nov2024Visible, nov2024Opacity]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Video helpers ─────────────────────────────────────────────────────────
  const formatTime = (s) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Sync video element when playing state changes
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) v.play().catch(() => setPlaying(false));
    else v.pause();
  }, [playing]);

  // Sync volume
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = muted ? 0 : volume;
  }, [volume, muted]);

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || dragging) return;
    setCurrentTime(v.currentTime);
    setProgress((v.currentTime / v.duration) * 100 || 0);
  };

  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (v) setDuration(v.duration);
  };

  const handleEnded = () => setPlaying(false);

  const handleSeek = (e) => {
    const v = videoRef.current;
    if (!v) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = pct * v.duration;
    setProgress(pct * 100);
    setCurrentTime(v.currentTime);
  };

  const handleRestart = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    setProgress(0);
    setCurrentTime(0);
    setPlaying(true);
  };

  const handleFullscreen = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.requestFullscreen) v.requestFullscreen();
    else if (v.webkitRequestFullscreen) v.webkitRequestFullscreen();
  };

  const openVideo = (videoId) => {
    setActiveVideo(videoId);
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
    <div>
      {/* ── Section header ── */}
      <div className="flex items-center justify-between border-b border-[#343c4c] px-4 py-3 text-[12px] font-bold">
        <span>Drone Imagery</span>
        <ChevronRight size={15} />
      </div>

      <div className="p-3 text-[12px]">
        {/* Description */}
        <div className="mb-3 text-white/70">
          Toggle historical drone imagery of Chaharbagh Phase 1 to monitor
          construction progress over time.
        </div>

        {/* ── Raster imagery toggles ── */}
        <div className="rounded-sm border border-[#3b4558] bg-[#232b3a] p-2 space-y-4">
          {/* Jan 2023 */}
          <div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={jan2023Visible}
                  onChange={(e) => setJan2023Visible(e.target.checked)} className="accent-[#65c96b]" />
                <Clock size={14} className="text-[#a855f7]" />
                <span className="font-semibold text-white/90">Jan 2023</span>
              </label>
              <Grid3X3 size={14} className="text-white/60" />
            </div>
            <div className="mt-2 flex items-center gap-2 pl-6">
              <input type="range" min="0" max="100" value={jan2023Opacity}
                onChange={(e) => setJan2023Opacity(Number(e.target.value))}
                className="h-[3px] flex-1 rounded-full accent-[#65c96b] bg-[#8fd36f]" />
              <span className="text-[11px] text-white/90 w-8 text-right">{jan2023Opacity}%</span>
            </div>
          </div>

          <div className="border-t border-[#394354]" />

          {/* June 2023 */}
          <div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={june2023Visible}
                  onChange={(e) => setJune2023Visible(e.target.checked)} className="accent-[#65c96b]" />
                <Clock size={14} className="text-[#3b82f6]" />
                <span className="font-semibold text-white/90">June 2023</span>
              </label>
              <Grid3X3 size={14} className="text-white/60" />
            </div>
            <div className="mt-2 flex items-center gap-2 pl-6">
              <input type="range" min="0" max="100" value={june2023Opacity}
                onChange={(e) => setJune2023Opacity(Number(e.target.value))}
                className="h-[3px] flex-1 rounded-full accent-[#65c96b] bg-[#8fd36f]" />
              <span className="text-[11px] text-white/90 w-8 text-right">{june2023Opacity}%</span>
            </div>
          </div>

          <div className="border-t border-[#394354]" />

          {/* Nov 2024 */}
          <div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={nov2024Visible}
                  onChange={(e) => setNov2024Visible(e.target.checked)} className="accent-[#65c96b]" />
                <Clock size={14} className="text-[#ef4444]" />
                <span className="font-semibold text-white/90">Nov 2024</span>
              </label>
              <Grid3X3 size={14} className="text-white/60" />
            </div>
            <div className="mt-2 flex items-center gap-2 pl-6">
              <input type="range" min="0" max="100" value={nov2024Opacity}
                onChange={(e) => setNov2024Opacity(Number(e.target.value))}
                className="h-[3px] flex-1 rounded-full accent-[#65c96b] bg-[#8fd36f]" />
              <span className="text-[11px] text-white/90 w-8 text-right">{nov2024Opacity}%</span>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            DRONE VIDEO SECTION
        ════════════════════════════════════════════════════════════════ */}
        <div className="mt-4">
          {/* Section sub-header */}
          <div className="flex items-center gap-2 mb-2">
            <Video size={13} className="text-[#65c96b]" />
            <span className="font-bold text-white/90 text-[11px] uppercase tracking-wide">
              Drone Videos
            </span>
          </div>

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
              {/* Thumbnail placeholder */}
              <div
                className="shrink-0 w-14 h-10 rounded overflow-hidden flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#1a3a1a,#2d5a2d)" }}
              >
                <Video size={20} className="text-[#65c96b]/70" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="font-semibold text-white/90 text-[11px] truncate">{vid.title}</div>
                <div className="text-[10px] text-white/40 truncate">{vid.subtitle}</div>
              </div>

              {/* Play badge */}
              <div
                className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: vid.color + "33", border: `1px solid ${vid.color}` }}
              >
                <Play size={10} style={{ color: vid.color }} />
              </div>
            </button>
          ))}

          {/* ── Inline video player (shown when a video is selected) ── */}
          {activeVid && (
            <>
              {/* ── Expanded overlay backdrop ── */}
              {expanded && (
                <div
                  className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
                  onClick={() => setExpanded(false)}
                />
              )}

              {/* ── Player ── */}
              <div
                className={`bg-[#111827] shadow-xl transition-all duration-300 ${
                  expanded
                    ? "fixed z-[70] rounded-xl border border-[#3b4558] overflow-hidden"
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
                    {/* Expand / shrink toggle */}
                    <button
                      type="button"
                      title={expanded ? "Shrink player" : "Expand player"}
                      onClick={() => setExpanded((e) => !e)}
                      className="flex h-6 w-6 items-center justify-center rounded text-white/50 hover:text-white hover:bg-[#2a3548] transition"
                    >
                      {expanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                    </button>

                    {/* Close */}
                    <button
                      type="button"
                      onClick={closeVideo}
                      className="flex h-6 w-6 items-center justify-center rounded text-white/40 hover:text-white hover:bg-[#2a3548] transition text-[18px] leading-none"
                      title="Close player"
                    >
                      ×
                    </button>
                  </div>
                </div>

              {/* Video element */}
              <div className="relative bg-black" style={{ aspectRatio: "16/9" }}>
                <video
                  ref={videoRef}
                  src={activeVid.src}
                  className="w-full h-full object-contain"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={handleEnded}
                  preload="metadata"
                  playsInline
                  onClick={() => setPlaying((p) => !p)}
                  style={{ cursor: "pointer" }}
                />

                {/* Centered play/pause overlay (fades on hover) */}
                {!playing && (
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{ background: "rgba(0,0,0,0.35)" }}
                  >
                    <div className="w-14 h-14 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "rgba(101,201,107,0.25)", border: "2px solid #65c96b" }}>
                      <Play size={24} className="text-[#65c96b] ml-1" />
                    </div>
                  </div>
                )}
              </div>

              {/* Controls bar */}
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
                    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    v.currentTime = pct * v.duration;
                    setProgress(pct * 100);
                    setCurrentTime(v.currentTime);
                  }}
                >
                  {/* Filled portion */}
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${progress}%`, backgroundColor: "#65c96b" }}
                  />
                  {/* Thumb */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-[#65c96b] bg-white shadow transition-all opacity-0 group-hover:opacity-100"
                    style={{ left: `calc(${progress}% - 6px)`, backgroundColor: "#65c96b" }}
                  />
                </div>

                {/* Time display */}
                <div className="flex items-center justify-between text-[10px] text-white/40 -mt-0.5">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>

                {/* Buttons row */}
                <div className="flex items-center justify-between">
                  {/* Left: restart + play/pause */}
                  <div className="flex items-center gap-2">
                    <CtrlBtn title="Restart" onClick={handleRestart}>
                      <RotateCcw size={14} />
                    </CtrlBtn>

                    <button
                      type="button"
                      title={playing ? "Pause" : "Play"}
                      onClick={() => setPlaying((p) => !p)}
                      className="flex h-8 w-8 items-center justify-center rounded-full transition"
                      style={{ backgroundColor: "#65c96b", color: "#111827" }}
                    >
                      {playing ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
                    </button>
                  </div>

                  {/* Right: volume + fullscreen */}
                  <div className="flex items-center gap-2">
                    {/* Volume slider */}
                    <div className="flex items-center gap-1.5">
                      <CtrlBtn title={muted ? "Unmute" : "Mute"} onClick={() => setMuted((m) => !m)}>
                        {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      </CtrlBtn>
                      <input
                        type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume}
                        onChange={(e) => { setVolume(Number(e.target.value)); setMuted(false); }}
                        className="h-[3px] w-16 rounded-full accent-[#65c96b] bg-[#2a3548] cursor-pointer"
                      />
                    </div>

                    <CtrlBtn title="Fullscreen (OS)" onClick={handleFullscreen}>
                      <Maximize2 size={14} />
                    </CtrlBtn>
                  </div>
                </div>
              </div>
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Small icon button ─────────────────────────────────────────────────────────
function CtrlBtn({ title, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-md border border-[#344055] bg-[#1d2533] text-white/70 transition hover:bg-[#293445] hover:text-white"
    >
      {children}
    </button>
  );
}

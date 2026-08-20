import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Film,
  MapPin,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  Search,
  Video,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { LAYER_PANEL_SCROLL } from "./Layers/_layerScroll";

/*
 * Add future drone videos here.
 *
 * Files placed inside Frontend/public are referenced with a root-relative URL.
 * Example:
 * src: "/DroneVideos/chahar-bagh-2026.mp4"
 */
const DRONE_VIDEOS = [
  {
    id: "chahar-bagh-2024",
    title: "Chahar Bagh Phase 1",
    subtitle: "Aerial construction survey",
    date: "2024",
    location: "Chahar Bagh",
    src: encodeURI(
      "/Ruda_Official/Ruda Chahar Bagh Drone Video 1.mp4"
    ),
    poster: "",
    color: "#65c96b",
  },

  // Add future videos like this:
  // {
  //   id: "chahar-bagh-2026",
  //   title: "Chahar Bagh Phase 1",
  //   subtitle: "Latest construction progress",
  //   date: "2026",
  //   location: "Chahar Bagh",
  //   src: "/DroneVideos/chahar-bagh-2026.mp4",
  //   poster: "/DroneVideos/chahar-bagh-2026.jpg",
  //   color: "#65c96b",
  // },
];

export default function DroneVideo({ onClose, onExpandedChange }) {
  const videoRef = useRef(null);

  const [query, setQuery] = useState("");
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [dragging, setDragging] = useState(false);

  const filteredVideos = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return DRONE_VIDEOS;

    return DRONE_VIDEOS.filter((video) =>
      [
        video.title,
        video.subtitle,
        video.date,
        video.location,
      ]
        .filter(Boolean)
        .some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        ),
    );
  }, [query]);

  const activeVideo = DRONE_VIDEOS.find(
    (video) => video.id === activeVideoId,
  );

  const playerOpen = Boolean(activeVideo);

  useEffect(() => {
    if (typeof onExpandedChange !== "function") return undefined;

    onExpandedChange(playerOpen);

    return () => {
      onExpandedChange(false);
    };
  }, [playerOpen, onExpandedChange]);

useEffect(() => {
  const videoElement = videoRef.current;
  if (!videoElement) return;

  if (!playing) {
    videoElement.pause();
    return;
  }

  const playVideo = async () => {
    try {
      await videoElement.play();
    } catch (error) {
      // Ignore normal play/pause race
      if (error?.name !== "AbortError") {
        console.error("Unable to play drone video:", error);
        setPlaying(false);
      }
    }
  };

  if (videoElement.readyState >= 2) {
    playVideo();
  } else {
    const handleCanPlay = () => {
      playVideo();
    };

    videoElement.addEventListener("canplay", handleCanPlay, {
      once: true,
    });

    return () => {
      videoElement.removeEventListener("canplay", handleCanPlay);
    };
  }
}, [playing, activeVideoId]);


  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    videoElement.volume = muted ? 0 : volume;
  }, [volume, muted, activeVideoId]);

  useEffect(() => {
    if (!playerOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closePlayer();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [playerOpen]);

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return "0:00";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${minutes}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const openPlayer = (videoId) => {
    setActiveVideoId(videoId);
    setPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  };

  const closePlayer = () => {
    const videoElement = videoRef.current;

    if (videoElement) {
      videoElement.pause();
    }

    setPlaying(false);
    setActiveVideoId(null);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  };

  const seekToPointer = (event) => {
    const videoElement = videoRef.current;

    if (
      !videoElement ||
      !Number.isFinite(videoElement.duration) ||
      videoElement.duration <= 0
    ) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const pointerX =
      "touches" in event && event.touches.length > 0
        ? event.touches[0].clientX
        : event.clientX;

    const ratio = Math.max(
      0,
      Math.min(1, (pointerX - rect.left) / rect.width),
    );

    videoElement.currentTime =
      ratio * videoElement.duration;

    setProgress(ratio * 100);
    setCurrentTime(videoElement.currentTime);
  };

  const requestVideoFullscreen = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (videoElement.requestFullscreen) {
      videoElement.requestFullscreen();
    } else if (videoElement.webkitRequestFullscreen) {
      videoElement.webkitRequestFullscreen();
    }
  };

  return (
    <>
      <div className="flex max-h-[calc(100vh-120px)] flex-col text-[12px]">
        <div className="flex shrink-0 items-center justify-between border-b border-[#343c4c] px-4 py-3 font-bold">
          <div className="flex items-center gap-2">
            <Video size={15} className="text-[#65c96b]" />
            <span>Drone Videos</span>
          </div>

          <button
            type="button"
            title="Close"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded text-white/50 transition hover:bg-[#0a3327] hover:text-white"
          >
            <X size={14} />
          </button>
        </div>

        <div
          className={`min-h-0 flex-1 p-3 ${LAYER_PANEL_SCROLL}`}
        >
          <p className="mb-3 text-[11px] leading-relaxed text-white/60">
            Browse the latest RUDA aerial surveys and construction
            progress videos. Select any video to open the player.
          </p>

          <label className="relative mb-3 block">
            <span className="sr-only">Search drone videos</span>

            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
            />

            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search project, place or year"
              className="w-full rounded-md border border-[#3b4558] bg-[#1e2636] py-2 pl-9 pr-3 text-[11px] text-white outline-none placeholder:text-white/30 focus:border-[#65c96b]"
            />
          </label>

          <div className="space-y-2">
            {filteredVideos.map((video) => (
              <VideoListItem
                key={video.id}
                video={video}
                onOpen={() => openPlayer(video.id)}
              />
            ))}

            {filteredVideos.length === 0 && (
              <div className="rounded-md border border-dashed border-[#3b4558] px-3 py-7 text-center text-[11px] text-white/45">
                No drone videos match your search.
              </div>
            )}
          </div>
        </div>
      </div>

      {activeVideo && (
        <VideoPlayerModal
          video={activeVideo}
          videoRef={videoRef}
          playing={playing}
          setPlaying={setPlaying}
          muted={muted}
          setMuted={setMuted}
          volume={volume}
          setVolume={setVolume}
          progress={progress}
          setProgress={setProgress}
          currentTime={currentTime}
          setCurrentTime={setCurrentTime}
          duration={duration}
          setDuration={setDuration}
          dragging={dragging}
          setDragging={setDragging}
          formatTime={formatTime}
          seekToPointer={seekToPointer}
          onClose={closePlayer}
          onFullscreen={requestVideoFullscreen}
        />
      )}
    </>
  );
}

function VideoListItem({ video, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center gap-3 rounded-lg border border-[#3b4558] bg-[#1e2636] p-2.5 text-left transition hover:border-[#65c96b]/70 hover:bg-[#173126]"
    >
      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md bg-[linear-gradient(135deg,#123829,#061a14)]">
        {video.poster ? (
          <img
            src={video.poster}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Film
              size={24}
              className="text-[#65c96b]/60"
            />
          </div>
        )}

        <span
          className="absolute inset-0 flex items-center justify-center bg-black/10 transition group-hover:bg-black/25"
          aria-hidden="true"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full border"
            style={{
              borderColor: video.color,
              backgroundColor: `${video.color}32`,
              color: video.color,
            }}
          >
            <Play size={13} className="ml-0.5" />
          </span>
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-[11px] font-semibold text-white/90">
          {video.title}
        </div>

        <div className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-white/45">
          {video.subtitle}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-white/35">
          <span className="flex items-center gap-1">
            <CalendarDays size={10} />
            {video.date}
          </span>

          <span className="flex items-center gap-1">
            <MapPin size={10} />
            {video.location}
          </span>
        </div>
      </div>

      <Play
        size={16}
        className="shrink-0 text-[#65c96b] opacity-70 transition group-hover:opacity-100"
      />
    </button>
  );
}

function VideoPlayerModal({
  video,
  videoRef,
  playing,
  setPlaying,
  muted,
  setMuted,
  volume,
  setVolume,
  progress,
  setProgress,
  currentTime,
  setCurrentTime,
  duration,
  setDuration,
  dragging,
  setDragging,
  formatTime,
  seekToPointer,
  onClose,
  onFullscreen,
}) {
  return (
    <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close video player"
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
      />

      <div className="relative z-10 flex max-h-[92vh] w-[min(680px,90vw)] flex-col overflow-hidden rounded-xl border border-[#13593f] bg-[#06291f] shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-[#2a3548] px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Video size={15} className="text-[#65c96b]" />
              <span className="truncate text-sm font-semibold text-white/95">
                {video.title}
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 pl-[23px] text-[10px] text-white/45">
              <span>{video.subtitle}</span>
              <span>•</span>
              <span>{video.date}</span>
              <span>•</span>
              <span>{video.location}</span>
            </div>
          </div>

          <button
            type="button"
            title="Close player"
            onClick={onClose}
            className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/55 transition hover:bg-[#0a3327] hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="relative aspect-video min-h-0 bg-black">
          <video
  key={video.id}
  ref={videoRef}
  src={video.src}
  poster={video.poster || undefined}
  className="h-full w-full object-cover"
  preload="auto"
  playsInline
  onClick={() => setPlaying((current) => !current)}
  onLoadedMetadata={() => {
    const videoElement = videoRef.current;

    if (videoElement) {
      setDuration(videoElement.duration);
      videoElement.volume = muted ? 0 : volume;
    }
  }}
  onTimeUpdate={() => {
    const videoElement = videoRef.current;

    if (!videoElement || dragging) return;

    setCurrentTime(videoElement.currentTime);

    setProgress(
      videoElement.duration > 0
        ? (videoElement.currentTime / videoElement.duration) * 100
        : 0,
    );
  }}
  onEnded={() => setPlaying(false)}
  onError={(event) => {
    console.error(
      "Drone video failed to load:",
      video.src,
      event,
    );
  }}
/>

          {!playing && (
            <button
              type="button"
              aria-label="Play video"
              onClick={() => setPlaying(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/20"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#65c96b] bg-[#65c96b]/20 text-[#65c96b] shadow-lg transition hover:scale-105 hover:bg-[#65c96b]/30">
                <Play size={27} className="ml-1" />
              </span>
            </button>
          )}
        </div>

        <div className="shrink-0 space-y-3 px-4 pb-4 pt-3">
          <div
            role="slider"
            aria-label="Video progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            tabIndex={0}
            className="group relative h-2 w-full cursor-pointer rounded-full bg-[#2a3548]"
            onClick={seekToPointer}
            onMouseDown={(event) => {
              setDragging(true);
              seekToPointer(event);
            }}
            onMouseMove={(event) => {
              if (dragging) seekToPointer(event);
            }}
            onMouseUp={() => setDragging(false)}
            onMouseLeave={() => setDragging(false)}
            onKeyDown={(event) => {
              const videoElement = videoRef.current;
              if (!videoElement) return;

              if (event.key === "ArrowRight") {
                videoElement.currentTime = Math.min(
                  videoElement.duration,
                  videoElement.currentTime + 5,
                );
              }

              if (event.key === "ArrowLeft") {
                videoElement.currentTime = Math.max(
                  0,
                  videoElement.currentTime - 5,
                );
              }
            }}
          >
            <div
              className="h-full rounded-full bg-[#65c96b]"
              style={{ width: `${progress}%` }}
            />

            <span
              className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white bg-[#65c96b] opacity-0 shadow transition group-hover:opacity-100"
              style={{
                left: `calc(${progress}% - 7px)`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-white/45">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ControlButton
                title="Restart"
                onClick={() => {
                  const videoElement = videoRef.current;
                  if (!videoElement) return;

                  videoElement.currentTime = 0;
                  setCurrentTime(0);
                  setProgress(0);
                  setPlaying(true);
                }}
              >
                <RotateCcw size={15} />
              </ControlButton>

              <button
                type="button"
                title={playing ? "Pause" : "Play"}
                onClick={() => setPlaying((current) => !current)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#9be37b] text-[#06291f] transition hover:bg-[#b1ef94]"
              >
                {playing ? (
                  <Pause size={18} />
                ) : (
                  <Play size={18} className="ml-0.5" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <ControlButton
                title={muted ? "Unmute" : "Mute"}
                onClick={() => setMuted((current) => !current)}
              >
                {muted ? (
                  <VolumeX size={15} />
                ) : (
                  <Volume2 size={15} />
                )}
              </ControlButton>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={muted ? 0 : volume}
                onChange={(event) => {
                  setVolume(Number(event.target.value));
                  setMuted(false);
                }}
                aria-label="Volume"
                className="h-[3px] w-24 cursor-pointer rounded-full bg-[#2a3548] accent-[#65c96b]"
              />

              <ControlButton
                title="Fullscreen"
                onClick={onFullscreen}
              >
                <Maximize2 size={15} />
              </ControlButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ControlButton({ title, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-[#0f3d2e] bg-[#1f2937] text-white/70 transition hover:bg-[#0f3d2e] hover:text-white"
    >
      {children}
    </button>
  );
}
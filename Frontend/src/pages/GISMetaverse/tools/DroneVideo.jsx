import { useEffect, useMemo, useRef, useState } from "react";
import {
    CalendarDays,
    Film,
    Maximize2,
    Minimize2,
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
 * Files placed inside Frontend/public are referenced with a root-relative URL:
 * /Ruda_Official/example.mp4
 */
const DRONE_VIDEOS = [
    {
        id: "chahar-bagh-2024",
        title: "Chahar Bagh Phase 1",
        subtitle: "Aerial construction survey",
        date: "2024",
        location: "Chahar Bagh",
        src: "/Ruda Chahar Bagh Drone Video 1.mp4",
        poster: "",
        color: "#65c96b",
    },
];

export default function DroneVideos({ onClose, onExpandedChange }) {
    const videoRef = useRef(null);

    const [query, setQuery] = useState("");
    const [activeVideoId, setActiveVideoId] = useState(
        DRONE_VIDEOS[0]?.id ?? null,
    );
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(false);
    const [volume, setVolume] = useState(0.8);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [dragging, setDragging] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const filteredVideos = useMemo(() => {
        const normalized = query.trim().toLowerCase();

        if (!normalized) return DRONE_VIDEOS;

        return DRONE_VIDEOS.filter((video) =>
            [
                video.title,
                video.subtitle,
                video.date,
                video.location,
            ]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(normalized)),
        );
    }, [query]);

    const activeVideo = DRONE_VIDEOS.find(
        (video) => video.id === activeVideoId,
    );

    useEffect(() => {
        if (typeof onExpandedChange !== "function") return undefined;

        onExpandedChange(expanded);

        return () => {
            onExpandedChange(false);
        };
    }, [expanded, onExpandedChange]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (playing) {
            video.play().catch(() => setPlaying(false));
        } else {
            video.pause();
        }
    }, [playing, activeVideoId]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        video.volume = muted ? 0 : volume;
    }, [volume, muted, activeVideoId]);

    const formatTime = (seconds) => {
        if (!Number.isFinite(seconds)) return "0:00";

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);

        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    };

    const selectVideo = (videoId) => {
        setActiveVideoId(videoId);
        setPlaying(false);
        setProgress(0);
        setCurrentTime(0);
    };

    const closeTool = () => {
        if (expanded) {
            setExpanded(false);
            return;
        }

        if (typeof onClose === "function") {
            onClose();
        }
    };

    const seekToPointer = (event) => {
        const video = videoRef.current;
        if (!video || !Number.isFinite(video.duration) || video.duration <= 0) {
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

        video.currentTime = ratio * video.duration;
        setProgress(ratio * 100);
        setCurrentTime(video.currentTime);
    };

    return (
        <>
            {expanded && (
                <button
                    type="button"
                    aria-label="Close expanded video viewer"
                    className="fixed inset-0 z-[10001] bg-black/70 backdrop-blur-sm"
                    onClick={() => setExpanded(false)}
                />
            )}

            <div
                className={`text-[12px] ${expanded
                    ? "fixed inset-x-0 bottom-4 top-4 z-[10002] mx-auto flex w-[min(980px,96vw)] flex-col overflow-hidden rounded-xl border border-[#13593f] bg-[#06291f] shadow-2xl"
                    : "flex flex-col"
                    }`}
            >
                <div className="flex shrink-0 items-center justify-between border-b border-[#343c4c] px-4 py-3 font-bold">
                    <div className="flex items-center gap-2">
                        <Video size={15} className="text-[#65c96b]" />
                        <span>Drone Videos</span>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            title={expanded ? "Shrink viewer" : "Expand viewer"}
                            onClick={() => setExpanded((current) => !current)}
                            className="flex h-7 w-7 items-center justify-center rounded text-white/50 transition hover:bg-[#0a3327] hover:text-white"
                        >
                            {expanded ? (
                                <Minimize2 size={14} />
                            ) : (
                                <Maximize2 size={14} />
                            )}
                        </button>

                        <button
                            type="button"
                            title={expanded ? "Close expanded viewer" : "Close panel"}
                            onClick={closeTool}
                            className="flex h-7 w-7 items-center justify-center rounded text-white/50 transition hover:bg-[#0a3327] hover:text-white"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>

                <div
                    className={`min-h-0 p-3 ${expanded
                        ? "grid flex-1 grid-cols-[300px_minmax(0,1fr)] gap-4 overflow-hidden"
                        : LAYER_PANEL_SCROLL
                        }`}
                >
                    <section
                        className={
                            expanded
                                ? `min-h-0 overflow-y-auto pr-1 ${LAYER_PANEL_SCROLL}`
                                : ""
                        }
                    >
                        <p className="mb-3 text-[11px] leading-relaxed text-white/60">
                            Browse the latest available RUDA aerial surveys and construction
                            progress videos.
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
                                placeholder="Search project or year"
                                className="w-full rounded-md border border-[#3b4558] bg-[#1e2636] py-2 pl-9 pr-3 text-[11px] text-white outline-none placeholder:text-white/30 focus:border-[#65c96b]"
                            />
                        </label>

                        <div className="space-y-2">
                            {filteredVideos.map((video) => {
                                const active = activeVideoId === video.id;

                                return (
                                    <button
                                        key={video.id}
                                        type="button"
                                        onClick={() => selectVideo(video.id)}
                                        className={`w-full overflow-hidden rounded-lg border text-left transition ${active
                                            ? "border-[#65c96b] bg-[#123829]"
                                            : "border-[#3b4558] bg-[#1e2636] hover:border-[#65c96b]/60 hover:bg-[#173126]"
                                            }`}
                                    >
                                        <div className="relative aspect-video overflow-hidden bg-[linear-gradient(135deg,#123829,#061a14)]">
                                            {video.poster ? (
                                                <img
                                                    src={video.poster}
                                                    alt=""
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center">
                                                    <Film size={28} className="text-[#65c96b]/60" />
                                                </div>
                                            )}

                                            <span
                                                className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full border"
                                                style={{
                                                    borderColor: video.color,
                                                    backgroundColor: `${video.color}2f`,
                                                    color: video.color,
                                                }}
                                            >
                                                <Play size={13} className="ml-0.5" />
                                            </span>
                                        </div>

                                        <div className="p-2.5">
                                            <div className="truncate text-[11px] font-semibold text-white/90">
                                                {video.title}
                                            </div>

                                            <div className="mt-1 truncate text-[10px] text-white/45">
                                                {video.subtitle}
                                            </div>

                                            <div className="mt-2 flex items-center gap-3 text-[9px] text-white/35">
                                                <span className="flex items-center gap-1">
                                                    <CalendarDays size={10} />
                                                    {video.date}
                                                </span>
                                                <span>{video.location}</span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}

                            {filteredVideos.length === 0 && (
                                <div className="rounded-md border border-dashed border-[#3b4558] px-3 py-6 text-center text-[11px] text-white/45">
                                    No drone videos match your search.
                                </div>
                            )}
                        </div>
                    </section>

                    {activeVideo ? (
                        <section
                            className={`overflow-hidden rounded-lg border border-[#3b4558] bg-[#031a14] ${expanded ? "flex min-h-0 flex-col" : "mt-3"
                                }`}
                        >
                            <div className="flex items-center justify-between border-b border-[#2a3548] px-3 py-2">
                                <div className="min-w-0">
                                    <div className="truncate text-[11px] font-semibold text-white/90">
                                        {activeVideo.title}
                                    </div>
                                    <div className="mt-0.5 truncate text-[9px] text-white/40">
                                        {activeVideo.subtitle} · {activeVideo.date}
                                    </div>
                                </div>
                            </div>

                            <div
                                className={`relative bg-black ${expanded ? "min-h-0 flex-1" : "aspect-video"
                                    }`}
                            >
                                <video
                                    key={activeVideo.id}
                                    ref={videoRef}
                                    src={activeVideo.src}
                                    poster={activeVideo.poster || undefined}
                                    className="h-full w-full object-contain"
                                    preload="metadata"
                                    playsInline
                                    onClick={() => setPlaying((current) => !current)}
                                    onLoadedMetadata={() => {
                                        const video = videoRef.current;
                                        if (video) setDuration(video.duration);
                                    }}
                                    onTimeUpdate={() => {
                                        const video = videoRef.current;
                                        if (!video || dragging) return;

                                        setCurrentTime(video.currentTime);
                                        setProgress(
                                            video.duration > 0
                                                ? (video.currentTime / video.duration) * 100
                                                : 0,
                                        );
                                    }}
                                    onEnded={() => setPlaying(false)}
                                />

                                {!playing && (
                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
                                        <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#65c96b] bg-[#65c96b]/20 text-[#65c96b]">
                                            <Play size={24} className="ml-1" />
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="shrink-0 space-y-2 px-3 pb-3 pt-2">
                                <div
                                    role="slider"
                                    aria-label="Video progress"
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-valuenow={Math.round(progress)}
                                    tabIndex={0}
                                    className="group relative h-1.5 w-full cursor-pointer rounded-full bg-[#2a3548]"
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
                                        const video = videoRef.current;
                                        if (!video) return;

                                        if (event.key === "ArrowRight") {
                                            video.currentTime = Math.min(
                                                video.duration,
                                                video.currentTime + 5,
                                            );
                                        }

                                        if (event.key === "ArrowLeft") {
                                            video.currentTime = Math.max(
                                                0,
                                                video.currentTime - 5,
                                            );
                                        }
                                    }}
                                >
                                    <div
                                        className="h-full rounded-full bg-[#65c96b]"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-white/40">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <ControlButton
                                            title="Restart"
                                            onClick={() => {
                                                const video = videoRef.current;
                                                if (!video) return;

                                                video.currentTime = 0;
                                                setCurrentTime(0);
                                                setProgress(0);
                                                setPlaying(true);
                                            }}
                                        >
                                            <RotateCcw size={14} />
                                        </ControlButton>

                                        <button
                                            type="button"
                                            title={playing ? "Pause" : "Play"}
                                            onClick={() => setPlaying((current) => !current)}
                                            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#9be37b] text-[#06291f] transition hover:bg-[#b1ef94]"
                                        >
                                            {playing ? (
                                                <Pause size={15} />
                                            ) : (
                                                <Play size={15} className="ml-0.5" />
                                            )}
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <ControlButton
                                            title={muted ? "Unmute" : "Mute"}
                                            onClick={() => setMuted((current) => !current)}
                                        >
                                            {muted ? (
                                                <VolumeX size={14} />
                                            ) : (
                                                <Volume2 size={14} />
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
                                            className="h-[3px] w-16 cursor-pointer rounded-full bg-[#2a3548] accent-[#65c96b]"
                                        />

                                        <ControlButton
                                            title="Browser fullscreen"
                                            onClick={() => {
                                                const video = videoRef.current;
                                                if (!video) return;

                                                if (video.requestFullscreen) {
                                                    video.requestFullscreen();
                                                } else if (video.webkitRequestFullscreen) {
                                                    video.webkitRequestFullscreen();
                                                }
                                            }}
                                        >
                                            <Maximize2 size={14} />
                                        </ControlButton>
                                    </div>
                                </div>
                            </div>
                        </section>
                    ) : (
                        <div className="mt-3 rounded-md border border-dashed border-[#3b4558] px-3 py-8 text-center text-[11px] text-white/45">
                            Select a drone video to open the player.
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function ControlButton({ title, onClick, children }) {
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
import { useMemo, useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  Grid3X3,
  Video,
  X,
  VideoOff,
  Maximize2,
  Eye,
} from "lucide-react";
import axios from "axios";
import CameraLocationsAttribute from "./AttributeTable/CameraLocationsAttribute";
import {
  API_BASE,
  getMapSourceGeoJSON,
  unwrapGeoJSON,
} from "./AttributeTable/AdminAttributeTableShell";

// ── Constants ─────────────────────────────────────────────────────────────────

const CAMERA_STYLE = {
  color: "#f97316",
  opacity: 100,
  sourceId: "metaverse-camera-locations-source",
  endpoint: "/camera-location/",
  circleLayer: "metaverse-camera-locations-circle",
  labelLayer: "metaverse-camera-locations-label",
};

// Placeholder camera feeds — set `stream` to a real HLS URL when available
const CAMERA_FEEDS = [
  { id: 1, label: "Camera 1", location: "Main Entrance", stream: null },
  { id: 2, label: "Camera 2", location: "Block-A Gate", stream: null },
  { id: 3, label: "Camera 3", location: "Roundabout", stream: null },
  { id: 4, label: "Camera 4", location: "Boulevard", stream: null },
  { id: 5, label: "Camera 5", location: "Park North", stream: null },
  { id: 6, label: "Camera 6", location: "Commercial Area", stream: null },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const clampOpacity = (value = 100) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 100;
  return Math.min(Math.max(numeric, 0), 100);
};

const setPaint = (map, layerId, property, value) => {
  if (map?.getLayer?.(layerId)) {
    map.setPaintProperty(layerId, property, value);
  }
};

const setRuntimeStyle = (key, patch = {}) => {
  if (typeof window === "undefined") return;
  window.__metaverseLayerRuntimeStyles = {
    ...(window.__metaverseLayerRuntimeStyles || {}),
    [key]: {
      ...(window.__metaverseLayerRuntimeStyles?.[key] || {}),
      ...patch,
    },
  };
};

const applyCameraStyle = (map, style = {}) => {
  if (!map) return;
  const color = style.color || CAMERA_STYLE.color;
  const opacityRatio =
    clampOpacity(style.opacity ?? CAMERA_STYLE.opacity) / 100;
  setPaint(map, CAMERA_STYLE.circleLayer, "circle-color", color);
  setPaint(map, CAMERA_STYLE.circleLayer, "circle-opacity", opacityRatio);
  setPaint(
    map,
    CAMERA_STYLE.circleLayer,
    "circle-stroke-opacity",
    opacityRatio,
  );
  setPaint(map, CAMERA_STYLE.labelLayer, "text-color", color);
  setPaint(map, CAMERA_STYLE.labelLayer, "text-opacity", opacityRatio);
};

const applyAfterLayerLoads = (map, style) => {
  [0, 120, 350, 700, 1200, 2000].forEach((delay) => {
    window.setTimeout(() => applyCameraStyle(map, style), delay);
  });
};

// ── Main component ────────────────────────────────────────────────────────────

export default function Services({
  map,
  selectedProjectId,
  layerVisibility = {},
  setLayerVisibility,
}) {
  const [open, setOpen] = useState(false);
  const [cameraStyle, setCameraStyle] = useState({
    color: CAMERA_STYLE.color,
    opacity: layerVisibility.cameraLocationsOpacity ?? 100,
  });
  const [liveFeedOpen, setLiveFeedOpen] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState(CAMERA_FEEDS[0]);
  const [fullscreen, setFullscreen] = useState(false);
  const [activeAttributeTable, setActiveAttributeTable] = useState(null);
  const [cameraDropdownOpen, setCameraDropdownOpen] = useState(false);
  const [cameraDropdownData, setCameraDropdownData] = useState([]);

  const cameraEnabled = !!layerVisibility.cameraLocations;

  const readCameraSourceOrFetch = async () => {
    const fromMap = getMapSourceGeoJSON(map, CAMERA_STYLE.sourceId);
    if (fromMap.features?.length) return fromMap;

    const res = await axios.get(`${API_BASE}${CAMERA_STYLE.endpoint}`, {
      params: { project_id: selectedProjectId },
    });
    return unwrapGeoJSON(res.data);
  };

  const loadCameraDropdownData = async () => {
    if (!selectedProjectId) return;

    try {
      const geojson = await readCameraSourceOrFetch();
      setCameraDropdownData(geojson.features || []);
    } catch (error) {
      console.error("Camera locations dropdown load error:", error);
      setCameraDropdownData([]);
    }
  };

  const toggleCameraDropdown = () => {
    setCameraDropdownOpen((prev) => !prev);
    loadCameraDropdownData();
  };

  const cameraSummary = useMemo(
    () => ({
      count: cameraDropdownData.length,
    }),
    [cameraDropdownData],
  );

  const toggleLayer = (key) => {
    if (!selectedProjectId) {
      alert("Please select a project first.");
      return;
    }
    if (!setLayerVisibility) return;

    const nextVisible = !layerVisibility[key];
    setLayerVisibility((prev) => ({ ...prev, [key]: !prev[key] }));

    if (nextVisible) {
      setRuntimeStyle(key, cameraStyle);
      applyAfterLayerLoads(map, cameraStyle);
    } else {
      setLiveFeedOpen(false);
    }
  };

  const updateOpacity = (value) => {
    const opacity = clampOpacity(value);
    setCameraStyle((prev) => {
      const nextStyle = { ...prev, opacity };
      setRuntimeStyle("cameraLocations", nextStyle);
      applyCameraStyle(map, nextStyle);
      return nextStyle;
    });
  };

  const updateColor = (color) => {
    setCameraStyle((prev) => {
      const nextStyle = { ...prev, color };
      setRuntimeStyle("cameraLocations", nextStyle);
      applyCameraStyle(map, nextStyle);
      return nextStyle;
    });
  };

  return (
    <>
      {/* ── Section row ── */}
      <div className="border-b border-[#343c4c]">
        <button
          type="button"
          className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-white hover:bg-[#0a3327]"
          onClick={() => setOpen((prev) => !prev)}
        >
          <span>SERVICES</span>
          {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>

        {open && (
          <div className="mx-3 mb-3 rounded-sm border border-[#3b4558] bg-[#232b3a] p-2">
            <LayerItem
              disabled={!selectedProjectId}
              checked={cameraEnabled}
              color={cameraStyle.color}
              label="Camera Locations"
              opacity={cameraStyle.opacity}
              onChange={() => toggleLayer("cameraLocations")}
              onOpacityChange={updateOpacity}
              onColorChange={updateColor}
              hasDropdown
              dropdownOpen={cameraDropdownOpen}
              onDropdownToggle={toggleCameraDropdown}
              onTableOpen={() => setActiveAttributeTable("cameraLocations")}
              onEyeClick={() => {
                // Placeholder only. Camera view action can be implemented later.
              }}
            />

            {cameraDropdownOpen && (
              <div className="ml-6 mt-2 rounded-sm border border-[#3b4558] bg-[#1f2633] px-3 py-2 text-[11px] text-white/80">
                <div className="flex justify-between py-1">
                  <span>Total Camera Locations</span>
                  <span>{cameraSummary.count}</span>
                </div>
              </div>
            )}

            {/* Live Camera Feed button — visible only when Camera Locations is ON */}
            {cameraEnabled && (
              <button
                type="button"
                onClick={() => setLiveFeedOpen(true)}
                className="mt-3 flex w-full items-center gap-2 rounded-md border border-[#f97316]/40 bg-[#f97316]/10 px-3 py-2 text-[11px] font-semibold text-[#f97316] transition hover:bg-[#f97316]/20"
              >
                <Video size={13} />
                Live Camera Feed
                <span className="ml-auto flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                  <span className="text-[10px] font-normal text-white/50">
                    LIVE
                  </span>
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Live Camera Feed Modal ── */}
      {liveFeedOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div
            className={`flex flex-col overflow-hidden rounded-xl border border-[#13593f] bg-[#031a14] shadow-2xl transition-all duration-200 ${
              fullscreen
                ? "fixed inset-4"
                : "w-[min(900px,96vw)] max-h-[min(620px,90vh)]"
            }`}
          >
            {/* Modal header */}
            <div className="flex shrink-0 items-center justify-between border-b border-[#2a3548] bg-[#161f2e] px-4 py-3">
              <div className="flex items-center gap-2">
                <Video size={15} className="text-[#f97316]" />
                <span className="text-[13px] font-bold text-white">
                  Live Camera Feed
                </span>
                <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                  LIVE
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
                  onClick={() => setFullscreen((f) => !f)}
                  className="flex h-7 w-7 items-center justify-center rounded text-white/50 transition hover:bg-[#2a3548] hover:text-white"
                >
                  <Maximize2 size={14} />
                </button>
                <button
                  type="button"
                  title="Close"
                  onClick={() => {
                    setLiveFeedOpen(false);
                    setFullscreen(false);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded text-white/50 transition hover:bg-[#2a3548] hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="flex min-h-0 flex-1">
              {/* Camera list sidebar */}
              <div className="flex w-40 shrink-0 flex-col gap-1 overflow-y-auto border-r border-[#2a3548] bg-[#0d1420] p-2 [scrollbar-width:none]">
                {CAMERA_FEEDS.map((cam) => (
                  <button
                    key={cam.id}
                    type="button"
                    onClick={() => setSelectedCamera(cam)}
                    className={`flex flex-col rounded-md px-2.5 py-2 text-left transition ${
                      selectedCamera.id === cam.id
                        ? "border border-[#f97316]/40 bg-[#f97316]/15 text-[#f97316]"
                        : "border border-transparent text-white/60 hover:bg-[#1a2535] hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          backgroundColor:
                            selectedCamera.id === cam.id
                              ? "#f97316"
                              : "#4b5563",
                        }}
                      />
                      {cam.label}
                    </span>
                    <span className="mt-0.5 truncate text-[10px] opacity-60">
                      {cam.location}
                    </span>
                  </button>
                ))}
              </div>

              {/* Feed viewer */}
              <div className="flex min-h-0 flex-1 flex-col">
                {/* Camera info bar */}
                <div className="flex shrink-0 items-center justify-between border-b border-[#2a3548] bg-[#131c2b] px-4 py-2">
                  <div>
                    <p className="text-[12px] font-bold text-white">
                      {selectedCamera.label}
                    </p>
                    <p className="text-[10px] text-white/40">
                      {selectedCamera.location}
                    </p>
                  </div>
                  <span className="rounded bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold text-green-400">
                    Connected
                  </span>
                </div>

                {/* Stream / placeholder */}
                <div className="relative flex flex-1 items-center justify-center bg-black">
                  {selectedCamera.stream ? (
                    <video
                      key={selectedCamera.id}
                      src={selectedCamera.stream}
                      autoPlay
                      muted
                      playsInline
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1a2535]">
                        <VideoOff size={28} className="text-white/30" />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-white/60">
                          Stream not available
                        </p>
                        <p className="mt-1 text-[11px] text-white/30">
                          Configure a stream URL for {selectedCamera.label}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* HUD overlays */}
                  <div className="pointer-events-none absolute bottom-2 left-3 text-[10px] font-semibold text-white/50">
                    {selectedCamera.label} · {selectedCamera.location}
                  </div>
                  <div className="pointer-events-none absolute bottom-2 right-3 font-mono text-[10px] text-white/40">
                    <LiveClock />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeAttributeTable === "cameraLocations" && (
        <CameraLocationsAttribute
          map={map}
          selectedProjectId={selectedProjectId}
          onClose={() => setActiveAttributeTable(null)}
        />
      )}
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function LiveClock() {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString());
  useEffect(() => {
    const id = setInterval(
      () => setTime(new Date().toLocaleTimeString()),
      1000,
    );
    return () => clearInterval(id);
  }, []);
  return <>{time}</>;
}

function ColorPickerSquare({ color, label, disabled, onColorChange }) {
  return (
    <span
      className="relative h-4 w-4 shrink-0 overflow-hidden rounded-sm border border-white/35"
      style={{ backgroundColor: color }}
      title={`Change ${label} color`}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <input
        type="color"
        value={color}
        disabled={disabled}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onChange={(e) => onColorChange?.(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
    </span>
  );
}

function LayerItem({
  checked = false,
  color,
  label,
  opacity,
  onChange,
  onOpacityChange,
  onColorChange,
  disabled,
  hasDropdown = false,
  dropdownOpen = false,
  onDropdownToggle,
  onTableOpen,
  onEyeClick,
}) {
  return (
    <div className={`mt-3 first:mt-1 ${disabled ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            className="accent-[#65c96b]"
          />
          <ColorPickerSquare
            color={color}
            label={label}
            disabled={disabled}
            onColorChange={onColorChange}
          />
          <span className="text-[11px]">{label}</span>
        </label>
        <div className="flex items-center gap-1">
          {onEyeClick && (
            <button
              type="button"
              disabled={disabled}
              onClick={(event) => {
                event.stopPropagation();
                onEyeClick();
              }}
              className="rounded p-0.5 text-white/70 hover:bg-[#0f3d2e] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              title={`View ${label}`}
            >
              <Eye size={14} />
            </button>
          )}

          {onTableOpen && (
            <button
              type="button"
              disabled={disabled}
              onClick={(event) => {
                event.stopPropagation();
                onTableOpen();
              }}
              className="rounded p-0.5 text-white/70 hover:bg-[#0f3d2e] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              title={`Open ${label} attribute table`}
            >
              <Grid3X3 size={14} />
            </button>
          )}

          {hasDropdown && (
            <button
              type="button"
              disabled={disabled}
              onClick={(event) => {
                event.stopPropagation();
                onDropdownToggle?.();
              }}
              className="rounded p-0.5 text-white/70 hover:bg-[#0f3d2e] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              title={`Show ${label} details`}
            >
              {dropdownOpen ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 pl-6">
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          disabled={disabled}
          onChange={(e) => onOpacityChange(Number(e.target.value))}
          className="h-[3px] flex-1 cursor-pointer rounded-full bg-[#8fd36f] accent-[#65c96b] disabled:cursor-not-allowed"
        />
        <span className="w-7 text-right text-[11px] text-white/90">
          {opacity}%
        </span>
      </div>
    </div>
  );
}

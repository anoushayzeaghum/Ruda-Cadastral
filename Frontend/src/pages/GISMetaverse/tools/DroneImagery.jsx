import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Clock,
  Grid3X3,
  Image,
  ScanSearch,
  TimerReset,
} from "lucide-react";

import { LAYER_PANEL_SCROLL } from "./Layers/_layerScroll";
import ChangeDetection from "./ChangeDetection";
import TimeLapse from "./TimeLapse";
import {
  getDroneSourceId,
  getDroneLayerId,
  canUseChangeDetection,
  canUseTimeLapse,
} from "./droneProjectConfig";

// ── helpers ──────────────────────────────────────────────────────────────────

const buildInitialImageryState = (layers) =>
  Object.fromEntries(
    layers.map((layer) => [layer.id, { visible: false, opacity: 100 }]),
  );

const removeRasterLayerAndSource = (mapInstance, layerId, sourceId) => {
  if (!mapInstance) return;
  try {
    if (mapInstance.getLayer(layerId)) mapInstance.removeLayer(layerId);
    if (mapInstance.getSource(sourceId)) mapInstance.removeSource(sourceId);
  } catch (error) {
    console.error(
      `[DroneImagery] Failed to remove drone raster "${layerId}".`,
      error,
    );
  }
};

// ── Empty state component ────────────────────────────────────────────────────

function DroneImageryEmptyState({ message }) {
  return (
    <div className="flex min-h-[120px] items-center justify-center p-6 text-center">
      <p className="text-[12px] text-white/50">{message}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DroneImagery({
  map,
  filters,
  projectConfig,
  onExpandedChange,
}) {
  const projectId = String(filters?.projectId || "");

  // Sorted imagery from config
  const imageryLayers = useMemo(() => {
    const layers = projectConfig?.imagery || [];
    return [...layers].sort(
      (a, b) =>
        new Date(a.captureDate).getTime() - new Date(b.captureDate).getTime(),
    );
  }, [projectConfig]);

  // Build Mapbox-safe source/layer IDs per project
  const mapImageryLayers = useMemo(
    () =>
      imageryLayers.map((item) => ({
        ...item,
        sourceId: getDroneSourceId(projectId, item.id, "gis-drone"),
        layerId: getDroneLayerId(projectId, item.id, "gis-drone"),
      })),
    [projectId, imageryLayers],
  );

  const projectBounds = projectConfig?.bounds || null;

  const [activeTab, setActiveTab] = useState("imagery");
  const [timeLapseExpanded, setTimeLapseExpanded] = useState(false);
  const [changeDetectionExpanded, setChangeDetectionExpanded] = useState(false);
  const [imageryState, setImageryState] = useState({});

  // Track previous layers for cleanup
  const previousLayersRef = useRef([]);
  // Ref to track whether a fly-to has already fired for the current project
  const hasFlewRef = useRef(false);

  // ── Notify parent of expanded state ─────────────────────────────────────
  useEffect(() => {
    if (typeof onExpandedChange !== "function") return undefined;
    onExpandedChange(timeLapseExpanded || changeDetectionExpanded);
    return () => onExpandedChange(false);
  }, [timeLapseExpanded, changeDetectionExpanded, onExpandedChange]);

  // ── Reset state when project changes ─────────────────────────────────────
  useEffect(() => {
    setImageryState(buildInitialImageryState(mapImageryLayers));
    setActiveTab("imagery");
    setTimeLapseExpanded(false);
    setChangeDetectionExpanded(false);
    hasFlewRef.current = false;
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Clean up old project raster layers, track new ones ───────────────────
  useEffect(() => {
    const previousLayers = previousLayersRef.current;

    // Remove every layer from the previous project
    previousLayers.forEach((layer) => {
      removeRasterLayerAndSource(map, layer.layerId, layer.sourceId);
    });

    previousLayersRef.current = mapImageryLayers;

    // On unmount, remove current project layers too
    return () => {
      mapImageryLayers.forEach((layer) => {
        removeRasterLayerAndSource(map, layer.layerId, layer.sourceId);
      });
    };
  }, [map, projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fly to project bounds ────────────────────────────────────────────────
  const flyToSelectedProject = useCallback(() => {
    if (!map || !projectBounds) return;
    map.fitBounds(projectBounds, {
      padding: 50,
      duration: 1500,
      maxZoom: projectConfig?.maxZoom || 17.5,
    });
  }, [map, projectBounds, projectConfig]);

  // ── Rebuild visible drone layers after basemap/style change ─────────────
  const rebuildVisibleDroneLayers = useCallback(() => {
    if (!map) return;
    mapImageryLayers.forEach((layer) => {
      const state = imageryState[layer.id];
      if (!state?.visible) return;
      try {
        if (!map.getSource(layer.sourceId)) {
          map.addSource(layer.sourceId, {
            type: "raster",
            tiles: [layer.tileUrl],
            tileSize: 256,
          });
        }
        if (!map.getLayer(layer.layerId)) {
          map.addLayer({
            id: layer.layerId,
            type: "raster",
            source: layer.sourceId,
            paint: { "raster-opacity": (state.opacity ?? 100) / 100 },
            layout: { visibility: "visible" },
          });
        }
      } catch (error) {
        console.error("[DroneImagery] Failed to rebuild raster layer", {
          projectId,
          imageryId: layer.id,
          layerId: layer.layerId,
          error,
        });
      }
    });
  }, [map, mapImageryLayers, imageryState, projectId]);

  useEffect(() => {
    if (!map) return undefined;
    map.on("style.load", rebuildVisibleDroneLayers);
    return () => map.off("style.load", rebuildVisibleDroneLayers);
  }, [map, rebuildVisibleDroneLayers]);

  // ── Sync raster layers to imagery toggles ────────────────────────────────
  useEffect(() => {
    if (!map) return;

    mapImageryLayers.forEach((layer) => {
      const layerState = imageryState[layer.id];
      if (!layerState) return;

      const { visible, opacity } = layerState;

      try {
        if (visible) {
          if (!map.getSource(layer.sourceId)) {
            map.addSource(layer.sourceId, {
              type: "raster",
              tiles: [layer.tileUrl],
              tileSize: 256,
            });
          }

          if (!map.getLayer(layer.layerId)) {
            map.addLayer({
              id: layer.layerId,
              type: "raster",
              source: layer.sourceId,
              paint: { "raster-opacity": opacity / 100 },
              layout: { visibility: "visible" },
            });

            // Fly on first activation for this project
            if (!hasFlewRef.current) {
              hasFlewRef.current = true;
              flyToSelectedProject();
            }
          } else {
            map.setLayoutProperty(layer.layerId, "visibility", "visible");
            map.setPaintProperty(
              layer.layerId,
              "raster-opacity",
              opacity / 100,
            );
          }
        } else if (map.getLayer(layer.layerId)) {
          map.setLayoutProperty(layer.layerId, "visibility", "none");
        }
      } catch (error) {
        console.error("[DroneImagery] Failed to update drone imagery layer", {
          projectId,
          imageryId: layer.id,
          layerId: layer.layerId,
          error,
        });
      }
    });
  }, [map, imageryState]); // eslint-disable-line react-hooks/exhaustive-deps

  const setLayerState = (id, patch) => {
    setImageryState((previous) => ({
      ...previous,
      [id]: { ...previous[id], ...patch },
    }));
  };

  // ── Tab availability ─────────────────────────────────────────────────────
  const canUseChange = canUseChangeDetection(projectId);
  const canUseTL = canUseTimeLapse(projectId);

  // ── Defensive empty states ────────────────────────────────────────────────
  if (!projectId) {
    return <DroneImageryEmptyState message="Select a project first." />;
  }

  if (!projectConfig || imageryLayers.length === 0) {
    return (
      <DroneImageryEmptyState message="Drone imagery is not available for the selected project." />
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="text-[12px]">
      <div className="grid grid-cols-3 gap-1 border-b border-[#343c4c] px-3 pt-2">
        <TabButton
          active={activeTab === "imagery"}
          icon={<Image size={13} />}
          label="Imagery"
          onClick={() => setActiveTab("imagery")}
        />

        <TabButton
          active={activeTab === "change"}
          icon={<ScanSearch size={13} />}
          label="Change"
          title="Change Detection"
          disabled={!canUseChange}
          disabledReason="At least two imagery dates are required."
          onClick={() => {
            if (canUseChange) setActiveTab("change");
          }}
        />

        <TabButton
          active={activeTab === "timelapse"}
          icon={<TimerReset size={13} />}
          label="Time Lapse"
          disabled={!canUseTL}
          disabledReason="At least two imagery dates are required."
          onClick={() => {
            if (canUseTL) setActiveTab("timelapse");
          }}
        />
      </div>

      {activeTab === "imagery" && (
        <div
          className={`max-h-[calc(70vh-6rem)] p-3 sm:max-h-[calc(100vh-130px)] ${LAYER_PANEL_SCROLL}`}
        >
          <p className="mb-3 text-white/60">
            Toggle historical drone imagery of{" "}
            {projectConfig.projectName} to monitor construction
            progress over time.
          </p>

          <div className="space-y-4 rounded-sm border border-[#3b4558] bg-[#232b3a] p-2">
            {mapImageryLayers.map((layer, index) => {
              const state = imageryState[layer.id] || {
                visible: false,
                opacity: 100,
              };

              return (
                <div key={layer.id}>
                  {index > 0 && (
                    <div className="-mx-2 mb-4 border-t border-[#394354]" />
                  )}

                  <div className="flex items-center justify-between">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={state.visible}
                        onChange={(event) =>
                          setLayerState(layer.id, {
                            visible: event.target.checked,
                          })
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
                      onChange={(event) =>
                        setLayerState(layer.id, {
                          opacity: Number(event.target.value),
                        })
                      }
                      className="h-[3px] flex-1 rounded-full bg-[#8fd36f] accent-[#65c96b]"
                    />

                    <span className="w-8 text-right text-[11px] text-white/90">
                      {state.opacity}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "change" && (
        <div
          className={`max-h-[calc(70vh-6rem)] sm:max-h-[calc(100vh-130px)] ${LAYER_PANEL_SCROLL}`}
        >
          <ChangeDetection
            map={map}
            filters={filters}
            projectConfig={projectConfig}
            embedded
            onExpandedChange={setChangeDetectionExpanded}
          />
        </div>
      )}

      {activeTab === "timelapse" && (
        <div
          className={`max-h-[calc(70vh-6rem)] sm:max-h-[calc(100vh-130px)] ${LAYER_PANEL_SCROLL}`}
        >
          <TimeLapse
            map={map}
            filters={filters}
            projectConfig={projectConfig}
            embedded
            onExpandedChange={setTimeLapseExpanded}
          />
        </div>
      )}
    </div>
  );
}

// ── TabButton ─────────────────────────────────────────────────────────────────

function TabButton({
  active,
  icon,
  label,
  title,
  disabled,
  disabledReason,
  onClick,
}) {
  const resolvedTitle = disabled ? disabledReason : title || label;

  return (
    <button
      type="button"
      title={resolvedTitle}
      disabled={disabled}
      onClick={onClick}
      className={`flex min-w-0 items-center justify-center gap-1.5 rounded-t-md border-b-2 px-2 py-2 text-[10px] font-semibold transition-colors sm:text-[11px] ${
        disabled
          ? "cursor-not-allowed border-transparent text-white/20"
          : active
            ? "border-[#65c96b] bg-[#65c96b]/10 text-[#65c96b]"
            : "border-transparent text-white/40 hover:text-white/70"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

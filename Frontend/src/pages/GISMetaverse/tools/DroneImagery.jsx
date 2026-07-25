import { useEffect, useState } from "react";
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

const IMAGERY_LAYERS = [
  {
    id: "jan2023",
    label: "Jan 2023",
    color: "#a855f7",
    sourceId: "gis-jan2023-source",
    layerId: "gis-jan2023-layer",
    tileUrl:
      "https://rudametaverse.nespakprogresscenter.com/tiles/data/Chahar_Bagh_AsBuilt_Jan2023/{z}/{x}/{y}.png",
  },
  {
    id: "june2023",
    label: "June 2023",
    color: "#3b82f6",
    sourceId: "gis-june2023-source",
    layerId: "gis-june2023-layer",
    tileUrl:
      "https://rudametaverse.nespakprogresscenter.com/tiles/data/Chahar_Bagh_Ortho_June2023/{z}/{x}/{y}.png",
  },
  {
    id: "nov2024",
    label: "Nov 2024",
    color: "#ef4444",
    sourceId: "gis-nov2024-source",
    layerId: "gis-nov2024-layer",
    tileUrl:
      "https://rudametaverse.nespakprogresscenter.com/tiles/data/Chahar_Bagh_Ortho_Nov2024/{z}/{x}/{y}.png",
  },
  {
    id: "apr2026",
    label: "Apr 2026",
    color: "#f59e0b",
    sourceId: "gis-apr2026-source",
    layerId: "gis-apr2026-layer",
    tileUrl:
      "https://rudametaverse.nespakprogresscenter.com/tiles/data/Chaharbagh_Ortho/{z}/{x}/{y}.png",
  },
];

export default function DroneImagery({ map, onExpandedChange }) {
  const [activeTab, setActiveTab] = useState("imagery");

  const [timeLapseExpanded, setTimeLapseExpanded] = useState(false);
  const [changeDetectionExpanded, setChangeDetectionExpanded] =
    useState(false);

  const [imageryState, setImageryState] = useState(() =>
    Object.fromEntries(
      IMAGERY_LAYERS.map((layer) => [
        layer.id,
        {
          visible: false,
          opacity: 100,
        },
      ]),
    ),
  );

  useEffect(() => {
    if (typeof onExpandedChange !== "function") return undefined;

    onExpandedChange(
      timeLapseExpanded || changeDetectionExpanded,
    );

    return () => {
      onExpandedChange(false);
    };
  }, [
    timeLapseExpanded,
    changeDetectionExpanded,
    onExpandedChange,
  ]);

  const flyToChaharbagh = () => {
    if (!map) return;

    map.fitBounds(
      [
        [74.42562653088396, 31.60509230706726],
        [74.43545280361002, 31.6112165411359],
      ],
      {
        padding: 50,
        duration: 1500,
      },
    );
  };

  useEffect(() => {
    if (!map) return;

    IMAGERY_LAYERS.forEach(
      ({ id, sourceId, layerId, tileUrl }) => {
        const layerState = imageryState[id];

        if (!layerState) return;

        const { visible, opacity } = layerState;

        try {
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
                paint: {
                  "raster-opacity": opacity / 100,
                },
                layout: {
                  visibility: "visible",
                },
              });

              flyToChaharbagh();
            } else {
              map.setLayoutProperty(
                layerId,
                "visibility",
                "visible",
              );

              map.setPaintProperty(
                layerId,
                "raster-opacity",
                opacity / 100,
              );
            }
          } else if (map.getLayer(layerId)) {
            map.setLayoutProperty(
              layerId,
              "visibility",
              "none",
            );
          }
        } catch (error) {
          console.error(
            `Failed to update drone imagery layer "${layerId}".`,
            error,
          );
        }
      },
    );
  }, [map, imageryState]); // eslint-disable-line react-hooks/exhaustive-deps

  const setLayerState = (id, patch) => {
    setImageryState((previous) => ({
      ...previous,
      [id]: {
        ...previous[id],
        ...patch,
      },
    }));
  };

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
          onClick={() => setActiveTab("change")}
        />

        <TabButton
          active={activeTab === "timelapse"}
          icon={<TimerReset size={13} />}
          label="Time Lapse"
          onClick={() => setActiveTab("timelapse")}
        />
      </div>

      {activeTab === "imagery" && (
        <div
          className={`max-h-[calc(70vh-6rem)] p-3 sm:max-h-[calc(100vh-130px)] ${LAYER_PANEL_SCROLL}`}
        >
          <p className="mb-3 text-white/60">
            Toggle historical drone imagery of Chaharbagh Phase 1
            to monitor construction progress over time.
          </p>

          <div className="space-y-4 rounded-sm border border-[#3b4558] bg-[#232b3a] p-2">
            {IMAGERY_LAYERS.map((layer, index) => {
              const state = imageryState[layer.id];

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

                      <Clock
                        size={14}
                        style={{ color: layer.color }}
                      />

                      <span className="font-semibold text-white/90">
                        {layer.label}
                      </span>
                    </label>

                    <Grid3X3
                      size={14}
                      className="text-white/60"
                    />
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
            embedded
            onExpandedChange={setTimeLapseExpanded}
          />
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  icon,
  label,
  title,
  onClick,
}) {
  return (
    <button
      type="button"
      title={title || label}
      onClick={onClick}
      className={`flex min-w-0 items-center justify-center gap-1.5 rounded-t-md border-b-2 px-2 py-2 text-[10px] font-semibold transition-colors sm:text-[11px] ${active
        ? "border-[#65c96b] bg-[#65c96b]/10 text-[#65c96b]"
        : "border-transparent text-white/40 hover:text-white/70"
        }`}
    >
      {icon}
      {label}
    </button>
  );
}
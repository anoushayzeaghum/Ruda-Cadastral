import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { ChevronDown, ChevronRight, Grid3X3 } from "lucide-react";
import GeodeticNetworkAttribute from "./AttributeTable/Topographic/GeodeticNetworkAttribute";
import {
  addGeodeticPointsLayer,
  GEODETIC_POINTS_IDS,
} from "./LayerManager/Cadastral/GeodeticPointsLayer";
import {
  API_BASE,
  unwrapGeoJSON,
} from "./AttributeTable/AdminAttributeTableShell";
import InlineLayerLegend from "./_InlineLayerLegend";
import { pointLegend } from "./_legendUtils";

const GEODETIC_LAYER = {
  key: "geodeticNetwork",
  label: "Geodetic Network",
  color: "#D92D20",
  endpoint: "/geodeticnetwork/",
  layerIds: [GEODETIC_POINTS_IDS.circle, GEODETIC_POINTS_IDS.label],
};

function emptyFeatureCollection() {
  return { type: "FeatureCollection", features: [] };
}

function setGeodeticVisibility(map, visible) {
  if (!map) return;

  GEODETIC_LAYER.layerIds.forEach((layerId) => {
    if (layerId && map.getLayer(layerId)) {
      map.setLayoutProperty(
        layerId,
        "visibility",
        visible ? "visible" : "none",
      );
    }
  });
}

export default function Topographic({ map }) {
  const [open, setOpen] = useState(false);
  const [activeTable, setActiveTable] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [layer, setLayer] = useState({
    visible: false,
    opacity: 100,
    color: GEODETIC_LAYER.color,
    loading: false,
  });

  const layerRef = useRef(layer);
  const cachedGeoJSON = useRef(null);
  const requestRef = useRef(null);

  useEffect(() => {
    layerRef.current = layer;
  }, [layer]);

  const updateLayerState = (changes) => {
    layerRef.current = { ...layerRef.current, ...changes };
    setLayer((previous) => ({ ...previous, ...changes }));
  };

  const drawGeodeticNetwork = (geojson, state = layerRef.current) => {
    if (!map || !geojson) return;

    addGeodeticPointsLayer(
      map,
      geojson,
      state.color,
      state.opacity / 100,
    );
    setGeodeticVisibility(map, state.visible);
  };

  const loadGeodeticNetwork = async () => {
    if (!map) return emptyFeatureCollection();

    updateLayerState({ loading: true });

    try {
      let geojson = cachedGeoJSON.current;

      if (!geojson) {
        if (!requestRef.current) {
          requestRef.current = axios
            .get(`${API_BASE}${GEODETIC_LAYER.endpoint}`)
            .then((response) => {
              const loadedGeoJSON = unwrapGeoJSON(response.data);
              cachedGeoJSON.current = loadedGeoJSON;
              return loadedGeoJSON;
            })
            .finally(() => {
              requestRef.current = null;
            });
        }

        geojson = await requestRef.current;
      }

      if (layerRef.current.visible) {
        drawGeodeticNetwork(geojson);
      }

      return geojson;
    } catch (error) {
      console.error("Geodetic Network layer load error:", error);
      updateLayerState({ visible: false });
      setGeodeticVisibility(map, false);
      return emptyFeatureCollection();
    } finally {
      updateLayerState({ loading: false });
    }
  };

  const handleVisibilityChange = async (visible) => {
    updateLayerState({ visible });

    if (!map) return;

    if (!visible) {
      setGeodeticVisibility(map, false);
      return;
    }

    await loadGeodeticNetwork();
  };

  const handleOpacityChange = (opacity) => {
    updateLayerState({ opacity });

    if (layerRef.current.visible && cachedGeoJSON.current) {
      drawGeodeticNetwork(cachedGeoJSON.current, {
        ...layerRef.current,
        opacity,
      });
    }
  };

  const handleColorChange = (color) => {
    updateLayerState({ color });

    if (layerRef.current.visible && cachedGeoJSON.current) {
      drawGeodeticNetwork(cachedGeoJSON.current, {
        ...layerRef.current,
        color,
      });
    }
  };

  useEffect(() => {
    if (!map) return;

    cachedGeoJSON.current = null;
    requestRef.current = null;
    setOpen(false);
    setDetailsOpen(false);
    setActiveTable(false);
    setGeodeticVisibility(map, false);
    updateLayerState({ visible: false, loading: false });
  }, [map]);

  return (
    <div className="border-b border-[#343c4c]">
      <div className="flex w-full items-center justify-between px-4 py-3 text-white hover:bg-[#0f3d2e]">
        <button
          type="button"
          className="flex flex-1 cursor-pointer items-center gap-2 text-left"
          onClick={() => setOpen((previous) => !previous)}
        >
          <span>TOPOGRAPHIC</span>
          {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>

        <button
          type="button"
          title={
            layer.visible
              ? "Hide all topographic layers"
              : "Show all topographic layers"
          }
          onClick={(event) => {
            event.stopPropagation();
            handleVisibilityChange(!layer.visible);
          }}
          className={`relative ml-2 h-5 w-9 shrink-0 overflow-hidden rounded-full transition-colors duration-200 focus:outline-none ${
            layer.visible ? "bg-[#65c96b]" : "bg-white/20"
          }`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
              layer.visible ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {open && (
        <div className="mx-3 mb-3 rounded-sm border border-[#13593f]/40 bg-[#093024] p-2">
          <div className="mt-1 text-white">
            <div className="flex items-center justify-between">
              <label className="flex min-w-0 cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={layer.visible}
                  onChange={(event) =>
                    handleVisibilityChange(event.target.checked)
                  }
                  className="accent-[#65c96b]"
                />

                <span
                  className="relative h-4 w-4 shrink-0 overflow-hidden rounded-sm border border-white/35"
                  style={{ backgroundColor: layer.color }}
                  title="Change Geodetic Network color"
                  onClick={(event) => event.stopPropagation()}
                  onMouseDown={(event) => event.stopPropagation()}
                >
                  <input
                    type="color"
                    value={layer.color}
                    onClick={(event) => event.stopPropagation()}
                    onMouseDown={(event) => event.stopPropagation()}
                    onChange={(event) => handleColorChange(event.target.value)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </span>

                <span className="truncate text-[11px]">
                  {layer.loading ? (
                    <span className="flex items-center gap-1">
                      {GEODETIC_LAYER.label}
                      <span className="animate-pulse text-[9px] text-white/40">
                        loading…
                      </span>
                    </span>
                  ) : (
                    GEODETIC_LAYER.label
                  )}
                </span>
              </label>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  className="rounded px-1 py-0.5 text-white/60 hover:bg-white/10 hover:text-white"
                  onClick={(event) => {
                    event.stopPropagation();
                    setActiveTable(true);
                  }}
                  title="Open Geodetic Network attribute table"
                >
                  <Grid3X3 size={14} />
                </button>

                <button
                  type="button"
                  className="flex items-center gap-1 rounded px-1 py-0.5 text-white/60 hover:bg-white/10 hover:text-white"
                  onClick={(event) => {
                    event.stopPropagation();
                    setDetailsOpen((previous) => !previous);
                  }}
                  title="Show Geodetic Network details"
                >
                  {detailsOpen ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </button>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-2 pl-6">
              <input
                type="range"
                min="0"
                max="100"
                value={layer.opacity}
                onChange={(event) =>
                  handleOpacityChange(Number(event.target.value))
                }
                className="h-[3px] flex-1 cursor-pointer rounded-full bg-[#8fd36f] accent-[#65c96b]"
              />
              <span className="w-7 text-right text-[11px] text-white/90">
                {layer.opacity}%
              </span>
            </div>

            {layer.visible && (
              <InlineLayerLegend
                items={[
                  pointLegend("Geodetic Point", layer.color),
                ]}
                opacity={layer.opacity}
              />
            )}

            {detailsOpen && (
              <div
                className="ml-6 mt-2 rounded-sm border border-[#13593f]/30 bg-[#051f17] px-3 py-2 text-[11px] text-white/80"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex justify-between">
                  <span>Total Features</span>
                  <span>{cachedGeoJSON.current?.features?.length || 0}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTable && (
        <GeodeticNetworkAttribute
          map={map}
          geojson={cachedGeoJSON.current}
          onClose={() => setActiveTable(false)}
        />
      )}
    </div>
  );
}

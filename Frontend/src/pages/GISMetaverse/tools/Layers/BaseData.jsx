import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Grid3X3 } from "lucide-react";
import TransportationRoadNetworkAttribute from "./AttributeTable/BaseData/TransportationRoadNetworkAttribute";
import HousingSchemesAttribute from "./AttributeTable/BaseData/HousingSchemesAttribute";
import ForestBoundaryAttribute from "./AttributeTable/BaseData/ForestBoundaryAttribute";
import ExistingDrainsAttribute from "./AttributeTable/BaseData/ExistingDrainsAttribute";
import {
  getExistingDrainsGeoJSON,
  getForestBoundaryGeoJSON,
  getHousingSchemesGeoJSON,
  getLahoreTransportationRoadsGeoJSON,
} from "../../../../services/metaverseApi";
import ExistingDrainsStyle from "./LayerManager/BaseData/ExistingDrainsStyle";
import ForestBoundaryStyle from "./LayerManager/BaseData/ForestBoundaryStyle";
import HousingSchemesStyle from "./LayerManager/BaseData/HousingSchemesStyle";
import RoadNetworkLegend, {
  addOrUpdateRoadNetworkLayer,
  removeRoadNetworkLayer,
  setRoadNetworkOpacity,
  setRoadNetworkVisibility,
} from "./LayerManager/BaseData/RoadNetworkLayer";
import InlineLayerLegend from "./_InlineLayerLegend";
import { polygonLegend, lineLegend } from "./_legendUtils";

const SOURCE_PREFIX = "gism-base-data";

const POLYGON_FILTER = [
  "match",
  ["geometry-type"],
  ["Polygon", "MultiPolygon"],
  true,
  false,
];

const LINE_FILTER = [
  "match",
  ["geometry-type"],
  ["LineString", "MultiLineString"],
  true,
  false,
];

const POINT_FILTER = [
  "match",
  ["geometry-type"],
  ["Point", "MultiPoint"],
  true,
  false,
];

const LAYER_DEFS = [
  {
    key: "transportationRoadNetwork",
    label: "Transportation Road Network",
    color: "#ef4444",
    previewColors: [
      "#ef4444",
      "#f97316",
      "#facc15",
      "#22c55e",
      "#3b82f6",
      "#8b5cf6",
    ],
    fetchGeoJSON: getLahoreTransportationRoadsGeoJSON,
    customRoadStyle: true,
  },
  {
    key: "housingSchemes",
    label: "Housing Schemes",
    color: HousingSchemesStyle.color,
    style: HousingSchemesStyle,
    fetchGeoJSON: getHousingSchemesGeoJSON,
  },
  {
    key: "forest",
    label: "Forest Boundary",
    color: ForestBoundaryStyle.color,
    style: ForestBoundaryStyle,
    fetchGeoJSON: getForestBoundaryGeoJSON,
  },
  {
    key: "existingDrains",
    label: "Existing Drains",
    color: ExistingDrainsStyle.color,
    style: ExistingDrainsStyle,
    fetchGeoJSON: getExistingDrainsGeoJSON,
  },
  {
    key: "floodInundation",
    label: "Flood Indentation",
    color: "#2563eb",
    fetchGeoJSON: null,
  },
];

const createInitialLayers = () =>
  Object.fromEntries(
    LAYER_DEFS.map((layer) => [
      layer.key,
      {
        visible: false,
        loading: false,
        color: layer.color,
        opacity: 100,
      },
    ]),
  );

const emptyFeatureCollection = () => ({
  type: "FeatureCollection",
  features: [],
});

const normalizeGeoJSON = (data) => {
  const raw = data?.data || data?.results || data;

  if (raw?.type === "FeatureCollection") return raw;
  if (Array.isArray(raw?.features)) {
    return { type: "FeatureCollection", features: raw.features };
  }
  if (Array.isArray(raw)) {
    return { type: "FeatureCollection", features: raw };
  }

  return emptyFeatureCollection();
};

const getIds = (key) => ({
  source: `${SOURCE_PREFIX}-${key}-source`,
  fill: `${SOURCE_PREFIX}-${key}-fill`,
  line: `${SOURCE_PREFIX}-${key}-line`,
  point: `${SOURCE_PREFIX}-${key}-point`,
});

function setLayerVisibility(map, key, visible) {
  if (!map) return;

  const ids = getIds(key);
  const visibility = visible ? "visible" : "none";

  [ids.fill, ids.line, ids.point].forEach((layerId) => {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, "visibility", visibility);
    }
  });
}

function applyLayerStyle(map, key, color, opacity, style = {}) {
  if (!map) return;

  const ids = getIds(key);
  const ratio = opacity / 100;

  if (map.getLayer(ids.fill)) {
    map.setPaintProperty(ids.fill, "fill-color", color);
    map.setPaintProperty(
      ids.fill,
      "fill-opacity",
      (style.fillOpacity ?? 0.35) * ratio,
    );
  }

  if (map.getLayer(ids.line)) {
    map.setPaintProperty(ids.line, "line-color", color);
    map.setPaintProperty(
      ids.line,
      "line-opacity",
      (style.lineOpacity ?? 1) * ratio,
    );
    if (style.lineWidth) {
      map.setPaintProperty(ids.line, "line-width", style.lineWidth);
    }
    if (style.lineDasharray) {
      map.setPaintProperty(ids.line, "line-dasharray", style.lineDasharray);
    }
  }

  if (map.getLayer(ids.point)) {
    map.setPaintProperty(ids.point, "circle-color", color);
    map.setPaintProperty(ids.point, "circle-opacity", ratio);
    map.setPaintProperty(ids.point, "circle-stroke-opacity", ratio);
    if (style.pointRadius) {
      map.setPaintProperty(ids.point, "circle-radius", style.pointRadius);
    }
    if (style.pointStrokeColor) {
      map.setPaintProperty(
        ids.point,
        "circle-stroke-color",
        style.pointStrokeColor,
      );
    }
    if (style.pointStrokeWidth !== undefined) {
      map.setPaintProperty(
        ids.point,
        "circle-stroke-width",
        style.pointStrokeWidth,
      );
    }
  }
}

function addOrUpdateMapLayer(map, key, geojson, color, opacity, style = {}) {
  if (!map) return;

  const ids = getIds(key);
  const data = normalizeGeoJSON(geojson);
  const ratio = opacity / 100;

  if (!map.getSource(ids.source)) {
    map.addSource(ids.source, {
      type: "geojson",
      data,
    });
  } else {
    map.getSource(ids.source)?.setData?.(data);
  }

  if (!map.getLayer(ids.fill)) {
    map.addLayer({
      id: ids.fill,
      type: "fill",
      source: ids.source,
      filter: POLYGON_FILTER,
      layout: { visibility: "visible" },
      paint: {
        "fill-color": color,
        "fill-opacity": (style.fillOpacity ?? 0.35) * ratio,
      },
    });
  }

  if (!map.getLayer(ids.line)) {
    map.addLayer({
      id: ids.line,
      type: "line",
      source: ids.source,
      filter: LINE_FILTER,
      layout: { visibility: "visible" },
      paint: {
        "line-color": color,
        "line-width": style.lineWidth || [
          "interpolate",
          ["linear"],
          ["zoom"],
          7,
          1.2,
          14,
          3,
        ],
        ...(style.lineDasharray
          ? { "line-dasharray": style.lineDasharray }
          : {}),
        "line-opacity": (style.lineOpacity ?? 1) * ratio,
      },
    });
  }

  if (!map.getLayer(ids.point)) {
    map.addLayer({
      id: ids.point,
      type: "circle",
      source: ids.source,
      filter: POINT_FILTER,
      layout: { visibility: "visible" },
      paint: {
        "circle-radius": style.pointRadius || [
          "interpolate",
          ["linear"],
          ["zoom"],
          7,
          3,
          15,
          6,
        ],
        "circle-color": color,
        "circle-opacity": ratio,
        "circle-stroke-color": style.pointStrokeColor || "#ffffff",
        "circle-stroke-width": style.pointStrokeWidth ?? 1,
        "circle-stroke-opacity": ratio,
      },
    });
  }

  applyLayerStyle(map, key, color, opacity, style);
  setLayerVisibility(map, key, true);
}

function removeMapLayer(map, key) {
  if (!map) return;

  const ids = getIds(key);

  [ids.point, ids.line, ids.fill].forEach((layerId) => {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
  });

  if (map.getSource(ids.source)) map.removeSource(ids.source);
}

export default function BaseData({ map }) {
  const [open, setOpen] = useState(false);
  const [layers, setLayers] = useState(createInitialLayers);
  const [statuses, setStatuses] = useState({});
  const [activeTables, setActiveTables] = useState({});

  const layersRef = useRef(layers);
  const loadedGeoJSONRef = useRef({});
  const layerRequestsRef = useRef({});

  useEffect(() => {
    layersRef.current = layers;
  }, [layers]);

  const runWhenMapReady = (callback) => {
    if (!map) return;

    if (map.isStyleLoaded?.()) {
      callback();
      return;
    }

    map.once("style.load", callback);
  };

  const showLoadedLayer = (definition) => {
    const geojson = loadedGeoJSONRef.current[definition.key];

    if (!geojson) return;

    runWhenMapReady(() => {
      // Style may have changed before this callback runs
      if (!map || !map.isStyleLoaded?.()) return;

      const currentState = layersRef.current[definition.key];
      if (!currentState?.visible) return;

      if (definition.customRoadStyle) {
        addOrUpdateRoadNetworkLayer(map, geojson, currentState.opacity);
      } else {
        addOrUpdateMapLayer(
          map,
          definition.key,
          geojson,
          currentState.color,
          currentState.opacity,
          definition.style,
        );
      }
    });
  };
  const loadLayer = async (definition) => {
    if (!map || !definition.fetchGeoJSON) return null;

    if (loadedGeoJSONRef.current[definition.key]) {
      showLoadedLayer(definition);
      return loadedGeoJSONRef.current[definition.key];
    }

    if (layerRequestsRef.current[definition.key]) {
      const geojson = await layerRequestsRef.current[definition.key];
      if (layersRef.current[definition.key]?.visible) {
        showLoadedLayer(definition);
      }
      return geojson;
    }

    setLayers((previous) => ({
      ...previous,
      [definition.key]: {
        ...previous[definition.key],
        loading: true,
      },
    }));

    setStatuses((previous) => ({
      ...previous,
      [definition.key]: null,
    }));

    const request = (async () => {
      try {
        const geojson = normalizeGeoJSON(await definition.fetchGeoJSON());
        loadedGeoJSONRef.current[definition.key] = geojson;

        setStatuses((previous) => ({
          ...previous,
          [definition.key]: geojson.features.length ? null : "No features",
        }));

        return geojson;
      } catch (error) {
        console.error(`Failed to load ${definition.label}`, error);
        setStatuses((previous) => ({
          ...previous,
          [definition.key]: "Backend error",
        }));
        return null;
      } finally {
        delete layerRequestsRef.current[definition.key];
        setLayers((previous) => ({
          ...previous,
          [definition.key]: {
            ...previous[definition.key],
            loading: false,
          },
        }));
      }
    })();

    layerRequestsRef.current[definition.key] = request;
    const geojson = await request;

    if (geojson && layersRef.current[definition.key]?.visible) {
      showLoadedLayer(definition);
    }

    return geojson;
  };

  useEffect(() => {
    if (!map) return;

    LAYER_DEFS.forEach((definition) => {
      const state = layers[definition.key];

      if (!state.visible) {
        if (definition.customRoadStyle) {
          setRoadNetworkVisibility(map, false);
        } else {
          setLayerVisibility(map, definition.key, false);
        }
        return;
      }

      if (!definition.fetchGeoJSON) {
        setStatuses((previous) => ({
          ...previous,
          [definition.key]: "Backend not connected",
        }));
        return;
      }

      loadLayer(definition);
    });
  }, [map, ...LAYER_DEFS.map((definition) => layers[definition.key].visible)]);

  useEffect(() => {
    if (!map) return undefined;

    const restoreVisibleLayers = () => {
      LAYER_DEFS.forEach((definition) => {
        if (
          layersRef.current[definition.key]?.visible &&
          loadedGeoJSONRef.current[definition.key]
        ) {
          showLoadedLayer(definition);
        }
      });
    };

    map.on("style.load", restoreVisibleLayers);
    return () => map.off("style.load", restoreVisibleLayers);
  }, [map]);

  useEffect(() => {
    return () => {
      if (!map) return;
      LAYER_DEFS.forEach((definition) => {
        if (definition.customRoadStyle) removeRoadNetworkLayer(map);
        else removeMapLayer(map, definition.key);
      });
    };
  }, [map]);

  const setVisible = (key, visible) => {
    setLayers((previous) => ({
      ...previous,
      [key]: { ...previous[key], visible },
    }));

    if (!visible) {
      setStatuses((previous) => ({ ...previous, [key]: null }));
    }
  };

  const setOpacity = (key, opacity) => {
    setLayers((previous) => ({
      ...previous,
      [key]: { ...previous[key], opacity },
    }));

    const definition = LAYER_DEFS.find((item) => item.key === key);
    const state = layersRef.current[key];

    if (definition?.customRoadStyle) {
      setRoadNetworkOpacity(map, opacity);
    } else {
      applyLayerStyle(
        map,
        key,
        state?.color || definition?.style?.color || "#ffffff",
        opacity,
        definition?.style,
      );
    }
  };

  const setColor = (key, color) => {
    setLayers((previous) => ({
      ...previous,
      [key]: { ...previous[key], color },
    }));

    const state = layersRef.current[key];
    const definition = LAYER_DEFS.find((item) => item.key === key);
    applyLayerStyle(map, key, color, state?.opacity ?? 100, definition?.style);
  };

  const openAttributeTable = (key) => {
    setActiveTables((previous) => ({
      ...previous,
      [key]: true,
    }));
  };

  const closeAttributeTable = (key) => {
    setActiveTables((previous) => ({
      ...previous,
      [key]: false,
    }));
  };

  const renderAttributeTables = () => (
    <>
      {activeTables.transportationRoadNetwork && (
        <TransportationRoadNetworkAttribute
          map={map}
          geojson={loadedGeoJSONRef.current.transportationRoadNetwork || null}
          onClose={() => closeAttributeTable("transportationRoadNetwork")}
        />
      )}

      {activeTables.housingSchemes && (
        <HousingSchemesAttribute
          map={map}
          geojson={loadedGeoJSONRef.current.housingSchemes || null}
          onClose={() => closeAttributeTable("housingSchemes")}
        />
      )}

      {activeTables.forest && (
        <ForestBoundaryAttribute
          map={map}
          geojson={loadedGeoJSONRef.current.forest || null}
          onClose={() => closeAttributeTable("forest")}
        />
      )}

      {activeTables.existingDrains && (
        <ExistingDrainsAttribute
          map={map}
          geojson={loadedGeoJSONRef.current.existingDrains || null}
          onClose={() => closeAttributeTable("existingDrains")}
        />
      )}
    </>
  );

  return (
    <div className="border-b border-[#343c4c]">
      <div className="flex w-full items-center justify-between px-4 py-3 text-white hover:bg-[#0f3d2e]">
        <button
          type="button"
          className="flex flex-1 cursor-pointer items-center gap-2 text-left"
          onClick={() => setOpen((previous) => !previous)}
        >
          <span>BASE DATA</span>
          {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>
        {/* Toggle-all switch */}
        <button
          type="button"
          title={
            LAYER_DEFS.every((d) => layers[d.key]?.visible)
              ? "Hide all base data layers"
              : "Show all base data layers"
          }
          onClick={(e) => {
            e.stopPropagation();
            const next = !LAYER_DEFS.every((d) => layers[d.key]?.visible);
            LAYER_DEFS.forEach((d) => setVisible(d.key, next));
          }}
          className={`relative ml-2 h-5 w-9 shrink-0 overflow-hidden rounded-full transition-colors duration-200 focus:outline-none ${
            LAYER_DEFS.every((d) => layers[d.key]?.visible)
              ? "bg-[#65c96b]"
              : "bg-white/20"
          }`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
              LAYER_DEFS.every((d) => layers[d.key]?.visible)
                ? "translate-x-4"
                : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {open && (
        <div className="mx-3 mb-3 rounded-sm border border-[#13593f]/40 bg-[#093024] p-2">
          {LAYER_DEFS.map((definition) => {
            const state = layers[definition.key];

            // Build inline legend items for non-road, non-flood layers
            let legendItems = [];
            if (!definition.customRoadStyle && definition.fetchGeoJSON) {
              if (definition.key === "housingSchemes") {
                legendItems = [
                  polygonLegend("Housing Schemes", state.color || HousingSchemesStyle.color),
                ];
              } else if (definition.key === "forest") {
                legendItems = [
                  polygonLegend("Forest Boundary", state.color || ForestBoundaryStyle.color),
                ];
              } else if (definition.key === "existingDrains") {
                legendItems = [
                  lineLegend("Existing Drain", state.color || ExistingDrainsStyle.color, {
                    dashed: Array.isArray(ExistingDrainsStyle.lineDasharray),
                    width: 2,
                  }),
                ];
              }
            }

            return (
              <div key={definition.key}>
                <LayerItem
                  checked={state.visible}
                  color={state.color}
                  label={definition.label}
                  loading={state.loading}
                  opacity={state.opacity}
                  onChange={(checked) => setVisible(definition.key, checked)}
                  onOpacityChange={(opacity) =>
                    setOpacity(definition.key, opacity)
                  }
                  onColorChange={(color) => setColor(definition.key, color)}
                  showColorPicker={!definition.customRoadStyle}
                  previewColors={definition.previewColors}
                  onTableOpen={() => openAttributeTable(definition.key)}
                />

                {definition.customRoadStyle && state.visible && (
                  <RoadNetworkLegend />
                )}

                {!definition.customRoadStyle && state.visible && legendItems.length > 0 && (
                  <InlineLayerLegend items={legendItems} opacity={state.opacity} />
                )}

                {statuses[definition.key] && state.visible && (
                  <div className="pl-6 pt-1 text-[10px] text-amber-300">
                    {statuses[definition.key]}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {renderAttributeTables()}
    </div>
  );
}

function ColorPickerSquare({ color, label, onColorChange }) {
  return (
    <span
      className="relative h-4 w-4 shrink-0 overflow-hidden rounded-sm border border-white/35"
      style={{ backgroundColor: color }}
      title={`Change ${label} color`}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <input
        type="color"
        value={color}
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onChange={(event) => onColorChange(event.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </span>
  );
}

function PalettePreview({ colors = [], label }) {
  if (!colors.length) return null;

  return (
    <span
      className="flex h-4 w-4 shrink-0 overflow-hidden rounded-sm border border-white/35"
      title={`${label} color palette`}
      aria-label={`${label} color palette`}
    >
      {colors.map((color, index) => (
        <span
          key={`${color}-${index}`}
          className="h-full flex-1"
          style={{ backgroundColor: color }}
        />
      ))}
    </span>
  );
}

function LayerItem({
  checked,
  color,
  label,
  loading,
  opacity,
  onChange,
  onOpacityChange,
  onColorChange,
  onTableOpen,
  showColorPicker = true,
  previewColors = [],
}) {
  return (
    <div className="mt-3 first:mt-1 text-white">
      <div className="flex items-center justify-between">
        <label className="flex min-w-0 cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => onChange(event.target.checked)}
            className="accent-[#65c96b]"
          />

          {showColorPicker ? (
            <ColorPickerSquare
              color={color}
              label={label}
              onColorChange={onColorChange}
            />
          ) : (
            <PalettePreview colors={previewColors} label={label} />
          )}

          <span className="truncate text-[11px]">
            {loading ? (
              <span className="flex items-center gap-1">
                {label}
                <span className="animate-pulse text-[9px] text-white/40">
                  loading…
                </span>
              </span>
            ) : (
              label
            )}
          </span>
        </label>

        {onTableOpen && (
          <button
            type="button"
            className="shrink-0 rounded px-1 py-0.5 text-white/60 hover:bg-white/10 hover:text-white"
            onClick={(event) => {
              event.stopPropagation();
              onTableOpen();
            }}
            title={`Open ${label} attribute table`}
          >
            <Grid3X3 size={14} />
          </button>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2 pl-6">
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          onChange={(event) => onOpacityChange(Number(event.target.value))}
          className="h-[3px] flex-1 cursor-pointer rounded-full bg-[#8fd36f] accent-[#65c96b]"
        />

        <span className="w-7 text-right text-[11px] text-white/90">
          {opacity}%
        </span>
      </div>
    </div>
  );
}

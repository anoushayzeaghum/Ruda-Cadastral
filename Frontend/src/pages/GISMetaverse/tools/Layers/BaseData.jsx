import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Grid3X3 } from "lucide-react";
import {
  getExistingForestGeoJSON,
  getLahoreTransportationRoadsGeoJSON,
  getMpPrincipleZoningGeoJSON,
} from "../../../../services/metaverseApi";
import RoadNetworkLegend, {
  addOrUpdateRoadNetworkLayer,
  removeRoadNetworkLayer,
  setRoadNetworkOpacity,
  setRoadNetworkVisibility,
} from "./LayerManager/BaseData/RoadNetworkLayer";
import LandUseLegend, {
  addOrUpdateLandUseLayer,
  removeLandUseLayer,
  setLandUseOpacity,
  setLandUseVisibility,
} from "./LayerManager/BaseData/LandUseLayer";

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
    key: "existingLandUse",
    label: "Existing Land Use",
    color: "#d4a72c",
    fetchGeoJSON: getMpPrincipleZoningGeoJSON,
    customLandUseStyle: true,
  },
  {
    key: "transportationRoadNetwork",
    label: "Transportation Road Network",
    color: "#ef4444",
    fetchGeoJSON: getLahoreTransportationRoadsGeoJSON,
    customRoadStyle: true,
  },
  {
    key: "forest",
    label: "Forest",
    color: "#22c55e",
    fetchGeoJSON: getExistingForestGeoJSON,
  },
  {
    key: "irrigationNetwork",
    label: "Irrigation Network",
    color: "#38bdf8",
    fetchGeoJSON: null,
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

function applyLayerStyle(map, key, color, opacity) {
  if (!map) return;

  const ids = getIds(key);
  const ratio = opacity / 100;

  if (map.getLayer(ids.fill)) {
    map.setPaintProperty(ids.fill, "fill-color", color);
    map.setPaintProperty(ids.fill, "fill-opacity", 0.35 * ratio);
  }

  if (map.getLayer(ids.line)) {
    map.setPaintProperty(ids.line, "line-color", color);
    map.setPaintProperty(ids.line, "line-opacity", ratio);
  }

  if (map.getLayer(ids.point)) {
    map.setPaintProperty(ids.point, "circle-color", color);
    map.setPaintProperty(ids.point, "circle-opacity", ratio);
    map.setPaintProperty(ids.point, "circle-stroke-opacity", ratio);
  }
}

function addOrUpdateMapLayer(map, key, geojson, color, opacity) {
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
        "fill-opacity": 0.35 * ratio,
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
        "line-width": ["interpolate", ["linear"], ["zoom"], 7, 1.2, 14, 3],
        "line-opacity": ratio,
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
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 7, 3, 15, 6],
        "circle-color": color,
        "circle-opacity": ratio,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1,
        "circle-stroke-opacity": ratio,
      },
    });
  }

  applyLayerStyle(map, key, color, opacity);
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

  const layersRef = useRef(layers);
  const loadedGeoJSONRef = useRef({});
  const requestTokenRef = useRef({});

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
    const state = layersRef.current[definition.key];

    if (!geojson || !state) return;

    runWhenMapReady(() => {
      if (definition.customRoadStyle) {
        addOrUpdateRoadNetworkLayer(map, geojson, state.opacity);
      } else if (definition.customLandUseStyle) {
        addOrUpdateLandUseLayer(map, geojson, state.opacity);
      } else {
        addOrUpdateMapLayer(
          map,
          definition.key,
          geojson,
          state.color,
          state.opacity,
        );
      }
    });
  };

  const loadLayer = async (definition) => {
    if (!map || !definition.fetchGeoJSON) return;

    if (loadedGeoJSONRef.current[definition.key]) {
      showLoadedLayer(definition);
      return;
    }

    const token = Date.now();
    requestTokenRef.current[definition.key] = token;

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

    try {
      const geojson = normalizeGeoJSON(await definition.fetchGeoJSON());

      if (requestTokenRef.current[definition.key] !== token) return;

      loadedGeoJSONRef.current[definition.key] = geojson;

      setStatuses((previous) => ({
        ...previous,
        [definition.key]: geojson.features.length ? null : "No features",
      }));

      if (layersRef.current[definition.key]?.visible) {
        showLoadedLayer(definition);
      }
    } catch (error) {
      console.error(`Failed to load ${definition.label}`, error);
      setStatuses((previous) => ({
        ...previous,
        [definition.key]: "Backend error",
      }));
    } finally {
      setLayers((previous) => ({
        ...previous,
        [definition.key]: {
          ...previous[definition.key],
          loading: false,
        },
      }));
    }
  };

  useEffect(() => {
    if (!map) return;

    LAYER_DEFS.forEach((definition) => {
      const state = layers[definition.key];

      if (!state.visible) {
        requestTokenRef.current[definition.key] = null;
        if (definition.customRoadStyle) {
          setRoadNetworkVisibility(map, false);
        } else if (definition.customLandUseStyle) {
          setLandUseVisibility(map, false);
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
        else if (definition.customLandUseStyle) removeLandUseLayer(map);
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
    } else if (definition?.customLandUseStyle) {
      setLandUseOpacity(map, opacity);
    } else {
      applyLayerStyle(map, key, state?.color || "#ffffff", opacity);
    }
  };

  const setColor = (key, color) => {
    setLayers((previous) => ({
      ...previous,
      [key]: { ...previous[key], color },
    }));

    const state = layersRef.current[key];
    applyLayerStyle(map, key, color, state?.opacity ?? 100);
  };

  return (
    <div className="border-b border-[#343c4c]">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-white hover:bg-[#0f3d2e]"
        onClick={() => setOpen((previous) => !previous)}
      >
        <span>BASE DATA</span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>

      {open && (
        <div className="mx-3 mb-3 rounded-sm border border-[#13593f]/40 bg-[#093024] p-2">
          {LAYER_DEFS.map((definition) => {
            const state = layers[definition.key];

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
                  showColorPicker={
                    !definition.customRoadStyle &&
                    !definition.customLandUseStyle
                  }
                />

                {definition.customLandUseStyle && state.visible && (
                  <LandUseLegend />
                )}

                {definition.customRoadStyle && state.visible && (
                  <RoadNetworkLegend />
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

function LayerItem({
  checked,
  color,
  label,
  loading,
  opacity,
  onChange,
  onOpacityChange,
  onColorChange,
  showColorPicker = true,
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

          {showColorPicker && (
            <ColorPickerSquare
              color={color}
              label={label}
              onColorChange={onColorChange}
            />
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

        <Grid3X3 size={14} className="shrink-0 text-white/60" />
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
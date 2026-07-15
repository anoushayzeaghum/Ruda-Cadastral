import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  getBranchCanalGeoJSON,
  getBridgesGeoJSON,
  getDistributaryGeoJSON,
  getExistingForestGeoJSON,
  getForestBoundaryGeoJSON,
  getIrrigationNetworkGeoJSON,
  getLinkCanalGeoJSON,
  getOrangeTrackGeoJSON,
  getRailwayLineGeoJSON,
  getRailwayStationsGeoJSON,
  getRiverGeoJSON,
  getTransportationRoadsGeoJSON,
} from "../../../../services/metaverseApi";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://rudametaverse.nespakprogresscenter.com/api";

const SOURCE_PREFIX = "base-data";

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

const fetchFromEndpoints = async (endpoints) => {
  const routes = Array.isArray(endpoints) ? endpoints : [endpoints];
  let lastError = null;

  for (const endpoint of routes) {
    try {
      const response = await axios.get(`${API_BASE}${endpoint}`);
      return normalizeGeoJSON(response.data);
    } catch (error) {
      lastError = error;

      if (error?.response?.status !== 404) {
        throw error;
      }
    }
  }

  throw lastError;
};

const getFlood2025GeoJSON = () =>
  fetchFromEndpoints(["/flood-2025/", "/flood2025/"]);

const getFloodQCMapsGeoJSON = () =>
  fetchFromEndpoints(["/flood-qc-maps/", "/flood-qc-map/", "/floodqcmaps/"]);

const BASE_DATA_GROUPS = [
  {
    key: "irrigationData",
    label: "Irrigation Data",
    children: [
      {
        key: "irrigationNetwork",
        label: "Irrigation Network",
        color: "#2196f3",
      },
      { key: "linkCanal", label: "Link Canal", color: "#00bcd4" },
      { key: "branchCanal", label: "Branch Canal", color: "#4fc3f7" },
      { key: "distributary", label: "Distributary", color: "#81d4fa" },
      { key: "existingRivers", label: "Existing Rivers", color: "#0288d1" },
    ],
  },
  {
    key: "roadNetwork",
    label: "Road Network",
    children: [
      { key: "railwayLine", label: "Railway Line", color: "#111827" },
      { key: "orangeTrack", label: "Orange Track", color: "#f97316" },
      {
        key: "railwayStations",
        label: "Railway Stations",
        color: "#facc15",
      },
      { key: "bridges", label: "Bridges", color: "#a855f7" },
      {
        key: "transportationRoads",
        label: "Transportation Roads",
        color: "#ef4444",
      },
    ],
  },
  {
    key: "forestBoundaries",
    label: "Forest Boundaries",
    children: [
      { key: "existingForest", label: "Existing Forest", color: "#4d7c0f" },
      { key: "forestBoundary", label: "Forest Boundary", color: "#22c55e" },
    ],
  },
  {
    key: "floodInundation",
    label: "Flood Inundation",
    children: [
      { key: "flood2025", label: "Flood 2025", color: "#2563eb" },
      { key: "floodQCMaps", label: "Flood QC Maps", color: "#7c3aed" },
    ],
  },
];

const STANDALONE_LAYER = {
  key: "existingRiversStandalone",
  label: "Existing Rivers",
  color: "#0288d1",
};

const LAYER_CONFIG = {
  existingRiversStandalone: {
    fetchGeoJSON: getRiverGeoJSON,
    lineWidth: 3,
  },
  irrigationNetwork: {
    fetchGeoJSON: getIrrigationNetworkGeoJSON,
    lineWidth: 2.8,
  },
  linkCanal: {
    fetchGeoJSON: getLinkCanalGeoJSON,
    lineWidth: 2.8,
  },
  branchCanal: {
    fetchGeoJSON: getBranchCanalGeoJSON,
    lineWidth: 2.8,
  },
  distributary: {
    fetchGeoJSON: getDistributaryGeoJSON,
    lineWidth: 2.8,
  },
  existingRivers: {
    fetchGeoJSON: getRiverGeoJSON,
    lineWidth: 3,
  },
  railwayLine: {
    fetchGeoJSON: getRailwayLineGeoJSON,
    lineWidth: 2.5,
    lineDasharray: [2, 2],
  },
  orangeTrack: {
    fetchGeoJSON: getOrangeTrackGeoJSON,
    lineWidth: 4,
    casingColor: "#111827",
    casingWidth: 7,
  },
  railwayStations: {
    fetchGeoJSON: getRailwayStationsGeoJSON,
    circleRadius: 6,
  },
  bridges: {
    fetchGeoJSON: getBridgesGeoJSON,
    lineWidth: 3,
    circleRadius: 6,
  },
  transportationRoads: {
    fetchGeoJSON: getTransportationRoadsGeoJSON,
    lineWidth: 3,
  },
  existingForest: {
    fetchGeoJSON: getExistingForestGeoJSON,
    fillOpacity: 0.45,
  },
  forestBoundary: {
    fetchGeoJSON: getForestBoundaryGeoJSON,
    fillOpacity: 0.15,
    lineWidth: 2.5,
  },
  flood2025: {
    fetchGeoJSON: getFlood2025GeoJSON,
    fillOpacity: 0.45,
    lineWidth: 2,
  },
  floodQCMaps: {
    fetchGeoJSON: getFloodQCMapsGeoJSON,
    fillOpacity: 0.4,
    lineWidth: 2,
  },
};

const getIds = (layerKey) => {
  const base = `${SOURCE_PREFIX}-${layerKey}`;

  return {
    sourceId: `${base}-source`,
    fillId: `${base}-fill`,
    outlineId: `${base}-outline`,
    casingId: `${base}-casing`,
    lineId: `${base}-line`,
    circleId: `${base}-circle`,
  };
};

const setVisibility = (map, layerKey, visible) => {
  if (!map) return;

  const ids = getIds(layerKey);
  const visibility = visible ? "visible" : "none";

  [ids.fillId, ids.outlineId, ids.casingId, ids.lineId, ids.circleId].forEach(
    (id) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, "visibility", visibility);
      }
    },
  );
};

const addOrUpdateLayer = ({ map, layerKey, geojson, color, config }) => {
  if (!map) return;

  const ids = getIds(layerKey);
  const data = normalizeGeoJSON(geojson);

  if (!map.getSource(ids.sourceId)) {
    map.addSource(ids.sourceId, {
      type: "geojson",
      data,
    });
  } else {
    map.getSource(ids.sourceId)?.setData?.(data);
  }

  if (!map.getLayer(ids.fillId)) {
    map.addLayer({
      id: ids.fillId,
      type: "fill",
      source: ids.sourceId,
      filter: POLYGON_FILTER,
      layout: { visibility: "visible" },
      paint: {
        "fill-color": color,
        "fill-opacity": config.fillOpacity ?? 0.3,
      },
    });
  }

  if (!map.getLayer(ids.outlineId)) {
    map.addLayer({
      id: ids.outlineId,
      type: "line",
      source: ids.sourceId,
      filter: POLYGON_FILTER,
      layout: { visibility: "visible" },
      paint: {
        "line-color": color,
        "line-width": config.lineWidth ?? 1.5,
        "line-opacity": 1,
      },
    });
  }

  if (config.casingColor && !map.getLayer(ids.casingId)) {
    map.addLayer({
      id: ids.casingId,
      type: "line",
      source: ids.sourceId,
      filter: LINE_FILTER,
      layout: {
        visibility: "visible",
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": config.casingColor,
        "line-width": config.casingWidth ?? 6,
      },
    });
  }

  if (!map.getLayer(ids.lineId)) {
    map.addLayer({
      id: ids.lineId,
      type: "line",
      source: ids.sourceId,
      filter: LINE_FILTER,
      layout: {
        visibility: "visible",
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": color,
        "line-width": config.lineWidth ?? 2.5,
        ...(config.lineDasharray
          ? { "line-dasharray": config.lineDasharray }
          : {}),
      },
    });
  }

  if (!map.getLayer(ids.circleId)) {
    map.addLayer({
      id: ids.circleId,
      type: "circle",
      source: ids.sourceId,
      filter: POINT_FILTER,
      layout: { visibility: "visible" },
      paint: {
        "circle-radius": config.circleRadius ?? 5,
        "circle-color": color,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1.5,
      },
    });
  }

  setVisibility(map, layerKey, true);
};

const removeLayer = (map, layerKey) => {
  if (!map) return;

  const ids = getIds(layerKey);

  [ids.circleId, ids.lineId, ids.casingId, ids.outlineId, ids.fillId].forEach(
    (id) => {
      if (map.getLayer(id)) map.removeLayer(id);
    },
  );

  if (map.getSource(ids.sourceId)) {
    map.removeSource(ids.sourceId);
  }
};

const createInitialLayerState = () => {
  const state = {
    [STANDALONE_LAYER.key]: false,
  };

  BASE_DATA_GROUPS.forEach((group) => {
    group.children.forEach((layer) => {
      state[layer.key] = false;
    });
  });

  return state;
};

const createInitialGroupState = () =>
  BASE_DATA_GROUPS.reduce((state, group) => {
    state[group.key] = false;
    return state;
  }, {});

function LayerCheckbox({ checked, color, label, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-[12px] text-white/90 hover:bg-[#0f3d2e]">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-3.5 w-3.5 cursor-pointer accent-emerald-500"
      />
      <span
        className="h-3 w-3 shrink-0 rounded-sm border border-white/40"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </label>
  );
}

function GroupRow({ group, open, selectedCount, onToggleOpen }) {
  return (
    <button
      type="button"
      onClick={onToggleOpen}
      className="flex w-full items-center justify-between rounded px-2 py-2 text-left text-[12px] font-medium text-white hover:bg-[#0f3d2e]"
    >
      <span className="flex items-center gap-2">
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {group.label}
      </span>
      {selectedCount > 0 && (
        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300">
          {selectedCount}
        </span>
      )}
    </button>
  );
}

export default function BaseData({ map }) {
  const [open, setOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(createInitialGroupState);
  const [layerState, setLayerState] = useState(createInitialLayerState);
  const [layerStatus, setLayerStatus] = useState({});

  const loadedGeoJSONRef = useRef({});
  const requestTokensRef = useRef({});
  const layerStateRef = useRef(layerState);

  useEffect(() => {
    layerStateRef.current = layerState;
  }, [layerState]);

  const layerLookup = useMemo(() => {
    const lookup = {
      [STANDALONE_LAYER.key]: STANDALONE_LAYER,
    };

    BASE_DATA_GROUPS.forEach((group) => {
      group.children.forEach((layer) => {
        lookup[layer.key] = layer;
      });
    });

    return lookup;
  }, []);

  const runWhenMapReady = (callback) => {
    if (!map) return;

    if (map.isStyleLoaded?.()) {
      callback();
      return;
    }

    map.once("style.load", callback);
  };

  const showLayer = (layerKey) => {
    const config = LAYER_CONFIG[layerKey];
    const geojson = loadedGeoJSONRef.current[layerKey];
    const layer = layerLookup[layerKey];

    if (!config || !geojson || !layer) return;

    runWhenMapReady(() => {
      addOrUpdateLayer({
        map,
        layerKey,
        geojson,
        color: layer.color,
        config,
      });
    });
  };

  const loadLayer = async (layerKey) => {
    const config = LAYER_CONFIG[layerKey];
    if (!config?.fetchGeoJSON || !map) return;

    if (loadedGeoJSONRef.current[layerKey]) {
      showLayer(layerKey);
      return;
    }

    const token = Date.now();
    requestTokensRef.current[layerKey] = token;

    setLayerStatus((previous) => ({
      ...previous,
      [layerKey]: "loading",
    }));

    try {
      const geojson = normalizeGeoJSON(await config.fetchGeoJSON());

      if (requestTokensRef.current[layerKey] !== token) return;

      loadedGeoJSONRef.current[layerKey] = geojson;

      setLayerStatus((previous) => ({
        ...previous,
        [layerKey]: geojson.features.length ? "loaded" : "empty",
      }));

      if (layerStateRef.current[layerKey]) {
        showLayer(layerKey);
      }
    } catch (error) {
      console.error(`Failed to load Base Data layer: ${layerKey}`, error);

      setLayerStatus((previous) => ({
        ...previous,
        [layerKey]: "error",
      }));
    }
  };

  useEffect(() => {
    if (!map) return;

    Object.entries(layerState).forEach(([layerKey, checked]) => {
      if (checked) {
        loadLayer(layerKey);
      } else {
        requestTokensRef.current[layerKey] = null;
        setVisibility(map, layerKey, false);
      }
    });
  }, [map, layerState]);

  useEffect(() => {
    if (!map) return undefined;

    const restoreVisibleLayers = () => {
      Object.entries(layerStateRef.current).forEach(([layerKey, checked]) => {
        if (checked && loadedGeoJSONRef.current[layerKey]) {
          showLayer(layerKey);
        }
      });
    };

    map.on("style.load", restoreVisibleLayers);

    return () => {
      map.off("style.load", restoreVisibleLayers);
    };
  }, [map]);

  useEffect(() => {
    return () => {
      if (!map) return;

      Object.keys(LAYER_CONFIG).forEach((layerKey) => {
        removeLayer(map, layerKey);
      });
    };
  }, [map]);

  const toggleLayer = (layerKey) => {
    setLayerState((previous) => ({
      ...previous,
      [layerKey]: !previous[layerKey],
    }));
  };

  const getStatusText = (layerKey) => {
    const status = layerStatus[layerKey];
    if (status === "loading") return "Loading...";
    if (status === "error") return "Backend error";
    if (status === "empty") return "No features";
    return null;
  };

  return (
    <div className="border-b border-[#343c4c]">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-white hover:bg-[#0f3d2e]"
        onClick={() => setOpen((previous) => !previous)}
      >
        <span>BASE DATA</span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>

      {open && (
        <div className="mx-2 mb-2 rounded-sm border border-[#13593f]/40 bg-[#071f18] p-2">
          <div className="mb-1">
            <LayerCheckbox
              checked={layerState[STANDALONE_LAYER.key]}
              color={STANDALONE_LAYER.color}
              label={STANDALONE_LAYER.label}
              onChange={() => toggleLayer(STANDALONE_LAYER.key)}
            />
            {getStatusText(STANDALONE_LAYER.key) && (
              <div className="pl-9 text-[10px] text-amber-300">
                {getStatusText(STANDALONE_LAYER.key)}
              </div>
            )}
          </div>

          {BASE_DATA_GROUPS.map((group) => {
            const isOpen = groupOpen[group.key];
            const selectedCount = group.children.filter(
              (layer) => layerState[layer.key],
            ).length;

            return (
              <div key={group.key} className="mt-1">
                <GroupRow
                  group={group}
                  open={isOpen}
                  selectedCount={selectedCount}
                  onToggleOpen={() =>
                    setGroupOpen((previous) => ({
                      ...previous,
                      [group.key]: !previous[group.key],
                    }))
                  }
                />

                {isOpen && (
                  <div className="ml-3 rounded-sm border border-[#13593f]/30 bg-[#051f17] px-1 py-1">
                    {group.children.map((layer) => (
                      <div key={layer.key}>
                        <LayerCheckbox
                          checked={layerState[layer.key]}
                          color={layer.color}
                          label={layer.label}
                          onChange={() => toggleLayer(layer.key)}
                        />
                        {getStatusText(layer.key) && (
                          <div className="pb-1 pl-9 text-[10px] text-amber-300">
                            {getStatusText(layer.key)}
                          </div>
                        )}
                      </div>
                    ))}
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

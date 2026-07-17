const SOURCE_ID = "gism-road-network-source";
const NORMALIZED_TYPE_FIELD = "__road_type";

export const ROAD_NETWORK_LAYER_IDS = {
  casing: "gism-road-network-casing",
  main: "gism-road-network-main",
  transitCasing: "gism-road-network-transit-casing",
  transit: "gism-road-network-transit",
  railway: "gism-road-network-railway",
  bridge: "gism-road-network-bridge",
};

export const ROAD_NETWORK_LEGEND = [
  {
    label: "National Highway/Interchange",
    color: "#ff1f1f",
    casing: "#111111",
  },
  { label: "Motorway or Bypass", color: "#f5a400", casing: "#111111" },
  { label: "Lahore Ring Road", color: "#fff200", casing: "#111111" },
  { label: "Orange Line", color: "#f5a400", casing: "#111111", dashed: true },
  { label: "Metro Bus", color: "#ff1f1f", casing: "#111111", dashed: true },
  { label: "Primary Road", color: "#8f8f8f" },
  { label: "Secondary Road", color: "#c9c9c9" },
  { label: "Railway Line", color: "#111111", railway: true },
  { label: "Bridge", color: "#ff2ac2", bridge: true },
];

const CASED_TYPES = [
  "national highway",
  "interchange",
  "motorway",
  "bypass",
  "ring road",
  "lahore ring road",
];

const TRANSIT_TYPES = [
  "orange metro train",
  "orange metro",
  "orange line",
  "orange train",
  "metro train",
  "metro bus",
];

const RAILWAY_TYPES = ["railway", "railway line"];
const BRIDGE_TYPES = ["bridge"];

const MAIN_EXCLUDED_TYPES = [
  ...TRANSIT_TYPES,
  ...RAILWAY_TYPES,
  ...BRIDGE_TYPES,
];

const MAIN_COLOR = [
  "match",
  ["get", NORMALIZED_TYPE_FIELD],
  "national highway",
  "#ff1f1f",
  "interchange",
  "#ff1f1f",
  "motorway",
  "#f5a400",
  "bypass",
  "#f5a400",
  "ring road",
  "#fff200",
  "lahore ring road",
  "#fff200",
  "primary road",
  "#8f8f8f",
  "secondary road",
  "#c9c9c9",
  "#8f8f8f",
];

const TRANSIT_COLOR = [
  "match",
  ["get", NORMALIZED_TYPE_FIELD],
  "metro bus",
  "#ff1f1f",
  "orange metro train",
  "#f5a400",
  "orange metro",
  "#f5a400",
  "orange line",
  "#f5a400",
  "orange train",
  "#f5a400",
  "metro train",
  "#f5a400",
  "#f5a400",
];

const MAIN_WIDTH = [
  "interpolate",
  ["linear"],
  ["zoom"],
  7,
  [
    "match",
    ["get", NORMALIZED_TYPE_FIELD],
    "national highway",
    2.8,
    "interchange",
    2.8,
    "motorway",
    2.8,
    "bypass",
    2.8,
    "ring road",
    2.6,
    "lahore ring road",
    2.6,
    1.2,
  ],
  15,
  [
    "match",
    ["get", NORMALIZED_TYPE_FIELD],
    "national highway",
    6,
    "interchange",
    6,
    "motorway",
    6,
    "bypass",
    6,
    "ring road",
    5.5,
    "lahore ring road",
    5.5,
    3,
  ],
];

const CASING_WIDTH = [
  "interpolate",
  ["linear"],
  ["zoom"],
  7,
  [
    "match",
    ["get", NORMALIZED_TYPE_FIELD],
    "national highway",
    5.2,
    "interchange",
    5.2,
    "motorway",
    5.2,
    "bypass",
    5.2,
    "ring road",
    5,
    "lahore ring road",
    5,
    3.6,
  ],
  15,
  [
    "match",
    ["get", NORMALIZED_TYPE_FIELD],
    "national highway",
    8.4,
    "interchange",
    8.4,
    "motorway",
    8.4,
    "bypass",
    8.4,
    "ring road",
    7.9,
    "lahore ring road",
    7.9,
    5.4,
  ],
];

const TRANSIT_WIDTH = ["interpolate", ["linear"], ["zoom"], 7, 2.4, 15, 5.5];

const TRANSIT_CASING_WIDTH = [
  "interpolate",
  ["linear"],
  ["zoom"],
  7,
  4.8,
  15,
  8,
];

const LINE_FILTER = ["==", "$type", "LineString"];

function normalizeType(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function normalizeRoadGeoJSON(data) {
  const raw = data?.data || data?.results || data;

  let featureCollection;

  if (raw?.type === "FeatureCollection") {
    featureCollection = raw;
  } else if (Array.isArray(raw?.features)) {
    featureCollection = {
      type: "FeatureCollection",
      features: raw.features,
    };
  } else if (Array.isArray(raw)) {
    featureCollection = {
      type: "FeatureCollection",
      features: raw,
    };
  } else {
    featureCollection = {
      type: "FeatureCollection",
      features: [],
    };
  }

  return {
    ...featureCollection,
    features: (featureCollection.features || []).map((feature) => {
      const properties = feature?.properties || {};
      const rawType =
        properties.type ??
        properties.Type ??
        properties.TYPE ??
        properties.road_type ??
        properties.ROAD_TYPE ??
        "";

      return {
        ...feature,
        properties: {
          ...properties,
          [NORMALIZED_TYPE_FIELD]: normalizeType(rawType),
        },
      };
    }),
  };
}

function typeFilter(operator, values) {
  return [operator, NORMALIZED_TYPE_FIELD, ...values];
}

export function addOrUpdateRoadNetworkLayer(map, geojson, opacity = 100) {
  if (!map) return;

  const data = normalizeRoadGeoJSON(geojson);
  const ratio = opacity / 100;

  if (!map.getSource(SOURCE_ID)) {
    map.addSource(SOURCE_ID, { type: "geojson", data });
  } else {
    map.getSource(SOURCE_ID)?.setData?.(data);
  }

  if (!map.getLayer(ROAD_NETWORK_LAYER_IDS.casing)) {
    map.addLayer({
      id: ROAD_NETWORK_LAYER_IDS.casing,
      type: "line",
      source: SOURCE_ID,
      filter: ["all", LINE_FILTER, typeFilter("in", CASED_TYPES)],
      layout: {
        visibility: "visible",
        "line-cap": "butt",
        "line-join": "round",
      },
      paint: {
        "line-color": "#111111",
        "line-width": CASING_WIDTH,
        "line-opacity": ratio,
      },
    });
  }

  if (!map.getLayer(ROAD_NETWORK_LAYER_IDS.main)) {
    map.addLayer({
      id: ROAD_NETWORK_LAYER_IDS.main,
      type: "line",
      source: SOURCE_ID,
      filter: ["all", LINE_FILTER, typeFilter("!in", MAIN_EXCLUDED_TYPES)],
      layout: {
        visibility: "visible",
        "line-cap": "butt",
        "line-join": "round",
      },
      paint: {
        "line-color": MAIN_COLOR,
        "line-width": MAIN_WIDTH,
        "line-opacity": ratio,
      },
    });
  }

  if (!map.getLayer(ROAD_NETWORK_LAYER_IDS.transitCasing)) {
    map.addLayer({
      id: ROAD_NETWORK_LAYER_IDS.transitCasing,
      type: "line",
      source: SOURCE_ID,
      filter: ["all", LINE_FILTER, typeFilter("in", TRANSIT_TYPES)],
      layout: {
        visibility: "visible",
        "line-cap": "butt",
        "line-join": "round",
      },
      paint: {
        "line-color": "#111111",
        "line-width": TRANSIT_CASING_WIDTH,
        "line-opacity": ratio,
      },
    });
  }

  if (!map.getLayer(ROAD_NETWORK_LAYER_IDS.transit)) {
    map.addLayer({
      id: ROAD_NETWORK_LAYER_IDS.transit,
      type: "line",
      source: SOURCE_ID,
      filter: ["all", LINE_FILTER, typeFilter("in", TRANSIT_TYPES)],
      layout: {
        visibility: "visible",
        "line-cap": "butt",
        "line-join": "round",
      },
      paint: {
        "line-color": TRANSIT_COLOR,
        "line-width": TRANSIT_WIDTH,
        "line-dasharray": [2, 1.4],
        "line-opacity": ratio,
      },
    });
  }

  if (!map.getLayer(ROAD_NETWORK_LAYER_IDS.railway)) {
    map.addLayer({
      id: ROAD_NETWORK_LAYER_IDS.railway,
      type: "line",
      source: SOURCE_ID,
      filter: ["all", LINE_FILTER, typeFilter("in", RAILWAY_TYPES)],
      layout: {
        visibility: "visible",
        "line-cap": "butt",
        "line-join": "round",
      },
      paint: {
        "line-color": "#111111",
        "line-width": ["interpolate", ["linear"], ["zoom"], 7, 1.5, 15, 3.5],
        "line-dasharray": [5, 2],
        "line-opacity": ratio,
      },
    });
  }

  if (!map.getLayer(ROAD_NETWORK_LAYER_IDS.bridge)) {
    map.addLayer({
      id: ROAD_NETWORK_LAYER_IDS.bridge,
      type: "line",
      source: SOURCE_ID,
      filter: ["all", LINE_FILTER, typeFilter("in", BRIDGE_TYPES)],
      layout: {
        visibility: "visible",
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#ff2ac2",
        "line-width": ["interpolate", ["linear"], ["zoom"], 7, 2, 15, 5],
        "line-gap-width": ["interpolate", ["linear"], ["zoom"], 7, 2.5, 15, 7],
        "line-opacity": ratio,
      },
    });
  }

  setRoadNetworkOpacity(map, opacity);
  setRoadNetworkVisibility(map, true);
}

export function setRoadNetworkVisibility(map, visible) {
  const visibility = visible ? "visible" : "none";

  Object.values(ROAD_NETWORK_LAYER_IDS).forEach((id) => {
    if (map?.getLayer(id)) {
      map.setLayoutProperty(id, "visibility", visibility);
    }
  });
}

export function setRoadNetworkOpacity(map, opacity) {
  const ratio = opacity / 100;

  Object.values(ROAD_NETWORK_LAYER_IDS).forEach((id) => {
    if (map?.getLayer(id)) {
      map.setPaintProperty(id, "line-opacity", ratio);
    }
  });
}

export function removeRoadNetworkLayer(map) {
  if (!map) return;

  // Map has been destroyed or style is unavailable
  try {
    if (!map.getStyle()) return;
  } catch (e) {
    return;
  }

  Object.values(ROAD_NETWORK_LAYER_IDS)
    .reverse()
    .forEach((id) => {
      try {
        if (map.getLayer(id)) {
          map.removeLayer(id);
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    });

  try {
    if (map.getSource(SOURCE_ID)) {
      map.removeSource(SOURCE_ID);
    }
  } catch (e) {
    // Ignore cleanup errors
  }
}

export default function RoadNetworkLegend() {
  return (
    <div className="mt-2 space-y-1.5 pl-6 pr-2">
      {ROAD_NETWORK_LEGEND.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-2 text-[10px] text-white/80"
        >
          <span className="relative block h-3 w-10 shrink-0">
            <span
              className="absolute left-0 right-0 top-1/2 -translate-y-1/2"
              style={{
                height: item.bridge ? 7 : item.casing ? 6 : 3,
                background: item.casing || "transparent",
                borderRadius: item.bridge ? 999 : 0,
              }}
            />
            <span
              className="absolute left-0 right-0 top-1/2 -translate-y-1/2"
              style={{
                height: item.bridge ? 2 : 3,
                background: item.railway ? "transparent" : item.color,
                borderTop: item.railway ? "2px dashed #111111" : undefined,
                backgroundImage: item.dashed
                  ? `repeating-linear-gradient(90deg, ${item.color} 0 7px, transparent 7px 11px)`
                  : undefined,
              }}
            />
          </span>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

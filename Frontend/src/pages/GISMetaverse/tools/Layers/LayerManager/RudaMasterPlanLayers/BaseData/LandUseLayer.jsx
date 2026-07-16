const SOURCE_ID = "gism-land-use-source";
const NORMALIZED_FIELD = "__zoning_cat";

const PATTERN_IDS = {
  publicUtility: "gism-public-utility-pattern",
  pond: "gism-pond-pattern",
};

export const LAND_USE_LAYER_IDS = {
  base: "gism-land-use-base",
  publicUtilityPattern: "gism-land-use-public-utility-pattern",
  pondPattern: "gism-land-use-pond-pattern",
  outline: "gism-land-use-outline",
};

export const LAND_USE_LEGEND = [
  {
    label: "Brown Zone",
    description: "Development on PPP/JV Mode",
    color: "#F9C55B",
  },
  {
    label: "Green Zone",
    description: "Agriculture/Modal Village",
    color: "#86F15B",
  },
  {
    label: "Industrial Zone",
    description: "Industry Regularization",
    color: "#CF67E8",
  },
  {
    label: "Infill Development",
    description: "Regularize Development & Pvt. Schemes",
    color: "#4F96B5",
  },
  {
    label: "Public Utility Zone",
    color: "#FFF35B",
    pattern: "stripes",
  },
  {
    label: "Pond Area",
    color: "#73C7F2",
    pattern: "dots",
  },
];

const BASE_COLOR = [
  "match",
  ["get", NORMALIZED_FIELD],
  "brown zone",
  "#F9C55B",
  "green zone",
  "#86F15B",
  "industrial zone",
  "#CF67E8",
  "infill development",
  "#4F96B5",
  "public utility zone",
  "#FFF35B",
  "pond area",
  "#73C7F2",
  "#B8B8B8",
];

const POLYGON_FILTER = ["==", "$type", "Polygon"];

function normalizeCategory(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function normalizeLandUseGeoJSON(data) {
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

      const rawCategory =
        properties.zoning_cat ??
        properties.Zoning_Cat ??
        properties.ZONING_CAT ??
        properties.zoningCat ??
        properties["zoning cat"] ??
        properties["Zoning Cat"] ??
        "";

      return {
        ...feature,
        properties: {
          ...properties,
          [NORMALIZED_FIELD]: normalizeCategory(rawCategory),
        },
      };
    }),
  };
}

function createStripePattern(size = 12) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  context.clearRect(0, 0, size, size);
  context.strokeStyle = "#FF5A4F";
  context.lineWidth = 3;

  context.beginPath();
  context.moveTo(-2, size);
  context.lineTo(size, -2);
  context.stroke();

  context.beginPath();
  context.moveTo(size - 2, size + 2);
  context.lineTo(size + 2, size - 2);
  context.stroke();

  return context.getImageData(0, 0, size, size);
}

function createDotPattern(size = 10) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  context.clearRect(0, 0, size, size);
  context.fillStyle = "#3A91D8";

  context.beginPath();
  context.arc(size / 2, size / 2, 1.3, 0, Math.PI * 2);
  context.fill();

  return context.getImageData(0, 0, size, size);
}

function ensurePatterns(map) {
  if (!map.hasImage(PATTERN_IDS.publicUtility)) {
    map.addImage(PATTERN_IDS.publicUtility, createStripePattern(), {
      pixelRatio: 1,
    });
  }

  if (!map.hasImage(PATTERN_IDS.pond)) {
    map.addImage(PATTERN_IDS.pond, createDotPattern(), {
      pixelRatio: 1,
    });
  }
}

export function addOrUpdateLandUseLayer(map, geojson, opacity = 100) {
  if (!map) return;

  const data = normalizeLandUseGeoJSON(geojson);
  const ratio = opacity / 100;

  ensurePatterns(map);

  if (!map.getSource(SOURCE_ID)) {
    map.addSource(SOURCE_ID, {
      type: "geojson",
      data,
    });
  } else {
    map.getSource(SOURCE_ID)?.setData?.(data);
  }

  if (!map.getLayer(LAND_USE_LAYER_IDS.base)) {
    map.addLayer({
      id: LAND_USE_LAYER_IDS.base,
      type: "fill",
      source: SOURCE_ID,
      filter: POLYGON_FILTER,
      layout: {
        visibility: "visible",
      },
      paint: {
        "fill-color": BASE_COLOR,
        "fill-opacity": 0.82 * ratio,
      },
    });
  }

  if (!map.getLayer(LAND_USE_LAYER_IDS.publicUtilityPattern)) {
    map.addLayer({
      id: LAND_USE_LAYER_IDS.publicUtilityPattern,
      type: "fill",
      source: SOURCE_ID,
      filter: [
        "all",
        POLYGON_FILTER,
        ["==", NORMALIZED_FIELD, "public utility zone"],
      ],
      layout: {
        visibility: "visible",
      },
      paint: {
        "fill-pattern": PATTERN_IDS.publicUtility,
        "fill-opacity": ratio,
      },
    });
  }

  if (!map.getLayer(LAND_USE_LAYER_IDS.pondPattern)) {
    map.addLayer({
      id: LAND_USE_LAYER_IDS.pondPattern,
      type: "fill",
      source: SOURCE_ID,
      filter: [
        "all",
        POLYGON_FILTER,
        ["==", NORMALIZED_FIELD, "pond area"],
      ],
      layout: {
        visibility: "visible",
      },
      paint: {
        "fill-pattern": PATTERN_IDS.pond,
        "fill-opacity": ratio,
      },
    });
  }

  if (!map.getLayer(LAND_USE_LAYER_IDS.outline)) {
    map.addLayer({
      id: LAND_USE_LAYER_IDS.outline,
      type: "line",
      source: SOURCE_ID,
      filter: POLYGON_FILTER,
      layout: {
        visibility: "visible",
        "line-join": "round",
      },
      paint: {
        "line-color": "#7A7A7A",
        "line-width": 0.8,
        "line-opacity": 0.75 * ratio,
      },
    });
  }

  setLandUseOpacity(map, opacity);
  setLandUseVisibility(map, true);
}

export function setLandUseVisibility(map, visible) {
  const visibility = visible ? "visible" : "none";

  Object.values(LAND_USE_LAYER_IDS).forEach((id) => {
    if (map?.getLayer(id)) {
      map.setLayoutProperty(id, "visibility", visibility);
    }
  });
}

export function setLandUseOpacity(map, opacity) {
  const ratio = opacity / 100;

  if (map?.getLayer(LAND_USE_LAYER_IDS.base)) {
    map.setPaintProperty(
      LAND_USE_LAYER_IDS.base,
      "fill-opacity",
      0.82 * ratio,
    );
  }

  if (map?.getLayer(LAND_USE_LAYER_IDS.publicUtilityPattern)) {
    map.setPaintProperty(
      LAND_USE_LAYER_IDS.publicUtilityPattern,
      "fill-opacity",
      ratio,
    );
  }

  if (map?.getLayer(LAND_USE_LAYER_IDS.pondPattern)) {
    map.setPaintProperty(
      LAND_USE_LAYER_IDS.pondPattern,
      "fill-opacity",
      ratio,
    );
  }

  if (map?.getLayer(LAND_USE_LAYER_IDS.outline)) {
    map.setPaintProperty(
      LAND_USE_LAYER_IDS.outline,
      "line-opacity",
      0.75 * ratio,
    );
  }
}

export function removeLandUseLayer(map) {
  Object.values(LAND_USE_LAYER_IDS)
    .reverse()
    .forEach((id) => {
      if (map?.getLayer(id)) {
        map.removeLayer(id);
      }
    });

  if (map?.getSource(SOURCE_ID)) {
    map.removeSource(SOURCE_ID);
  }

  Object.values(PATTERN_IDS).forEach((id) => {
    if (map?.hasImage(id)) {
      map.removeImage(id);
    }
  });
}

function LegendSwatch({ item }) {
  if (item.pattern === "stripes") {
    return (
      <span
        className="h-4 w-8 shrink-0 border border-white/30"
        style={{
          backgroundColor: item.color,
          backgroundImage:
            "repeating-linear-gradient(135deg, #FF5A4F 0 3px, transparent 3px 7px)",
        }}
      />
    );
  }

  if (item.pattern === "dots") {
    return (
      <span
        className="h-4 w-8 shrink-0 border border-white/30"
        style={{
          backgroundColor: item.color,
          backgroundImage:
            "radial-gradient(circle, #3A91D8 1px, transparent 1.5px)",
          backgroundSize: "6px 6px",
        }}
      />
    );
  }

  return (
    <span
      className="h-4 w-8 shrink-0 border border-white/30"
      style={{ backgroundColor: item.color }}
    />
  );
}

export default function LandUseLegend() {
  return (
    <div className="mt-2 space-y-2 pl-6 pr-2">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-white/60">
        Principal Landuse Zoning
      </div>

      {LAND_USE_LEGEND.map((item) => (
        <div
          key={item.label}
          className="flex items-start gap-2 text-[10px] text-white/80"
        >
          <LegendSwatch item={item} />

          <div className="leading-tight">
            <div>{item.label}</div>
            {item.description && (
              <div className="text-[9px] text-white/45">
                {item.description}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

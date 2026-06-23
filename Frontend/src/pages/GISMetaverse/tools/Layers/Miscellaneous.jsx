import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import LayerRow from "./_LayerRow";
import { getFieldPoints, getTrijunctionPoints } from "../../../../services/api";

const IDS = {
  trijunction: {
    src: "gism-misc-tri-src",
    circle: "gism-misc-tri-cir",
    label: "gism-misc-tri-label",
  },
  fieldPoints: {
    src: "gism-misc-fp-src",
    circle: "gism-misc-fp-cir",
    label: "gism-misc-fp-label",
  },
};

const LAYER_DEFS = [
  { key: "trijunction", label: "Trijunction Points", color: "#f97316" },
  { key: "fieldPoints", label: "Field Points", color: "#a855f7" },
];

const emptyFC = { type: "FeatureCollection", features: [] };

function getLabelExpression(key) {
  if (key === "trijunction") {
    const rawType = [
      "coalesce",
      ["to-string", ["get", "type"]],
      ["to-string", ["get", "TYPE"]],
      ["to-string", ["get", "Type"]],
      ["to-string", ["get", "gm_type"]],
      ["to-string", ["get", "code"]],
      "",
    ];

    return [
      "match",
      rawType,
      "B",
      "Burjhi",
      "b",
      "Burjhi",
      "TJ",
      "TriJunction",
      "tj",
      "TriJunction",
      rawType,
    ];
  }

  return [
    "coalesce",
    ["to-string", ["get", "name"]],
    ["to-string", ["get", "Name"]],
    "",
  ];
}

function addOrUpdatePointLayer(map, key, geojson, opacity = 100) {
  if (!map) return;

  const ids = IDS[key];
  const color =
    LAYER_DEFS.find((layer) => layer.key === key)?.color || "#ffffff";
  const o = opacity / 100;

  if (!map.getSource(ids.src)) {
    map.addSource(ids.src, { type: "geojson", data: geojson || emptyFC });
  } else {
    map.getSource(ids.src).setData(geojson || emptyFC);
  }

  if (!map.getLayer(ids.circle)) {
    map.addLayer({
      id: ids.circle,
      type: "circle",
      source: ids.src,
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 12, 4, 18, 7],
        "circle-color": color,
        "circle-opacity": o,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1.5,
        "circle-stroke-opacity": o,
      },
      layout: { visibility: "visible" },
    });
  } else {
    map.setLayoutProperty(ids.circle, "visibility", "visible");
    map.setPaintProperty(ids.circle, "circle-opacity", o);
    map.setPaintProperty(ids.circle, "circle-stroke-opacity", o);
  }

  if (!map.getLayer(ids.label)) {
    map.addLayer({
      id: ids.label,
      type: "symbol",
      source: ids.src,
      minzoom: 16,
      layout: {
        visibility: "visible",
        "text-field": getLabelExpression(key),
        "text-size": 10,
        "text-offset": [0, 1.2],
        "text-anchor": "top",
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": key === "trijunction" ? "#7c2d12" : "#581c87",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.2,
        "text-opacity": o,
      },
    });
  } else {
    map.setLayoutProperty(ids.label, "visibility", "visible");
    map.setPaintProperty(ids.label, "text-opacity", o);
  }
}

function applyVisibility(map, key, visible) {
  if (!map) return;
  const ids = IDS[key];
  const vis = visible ? "visible" : "none";
  try {
    if (ids.circle && map.getLayer(ids.circle))
      map.setLayoutProperty(ids.circle, "visibility", vis);
    if (ids.label && map.getLayer(ids.label))
      map.setLayoutProperty(ids.label, "visibility", vis);
  } catch (_) {}
}

function applyOpacity(map, key, opacity) {
  if (!map) return;
  const ids = IDS[key];
  const o = opacity / 100;
  try {
    if (ids.circle && map.getLayer(ids.circle)) {
      map.setPaintProperty(ids.circle, "circle-opacity", o);
      map.setPaintProperty(ids.circle, "circle-stroke-opacity", o);
    }
    if (ids.label && map.getLayer(ids.label))
      map.setPaintProperty(ids.label, "text-opacity", o);
  } catch (_) {}
}

export default function Miscellaneous({ map }) {
  const [open, setOpen] = useState(false);
  const cachedData = useRef({});
  const [layers, setLayers] = useState(() =>
    Object.fromEntries(
      LAYER_DEFS.map((d) => [
        d.key,
        { visible: false, opacity: 100, loading: false },
      ]),
    ),
  );

  const setVisible = (key, v) =>
    setLayers((p) => ({ ...p, [key]: { ...p[key], visible: v } }));
  const setOpacity = (key, o) =>
    setLayers((p) => ({ ...p, [key]: { ...p[key], opacity: o } }));
  const setLoading = (key, loading) =>
    setLayers((p) => ({ ...p, [key]: { ...p[key], loading } }));

  const loadLayer = async (key) => {
    if (!map) return;

    setLoading(key, true);
    try {
      const data =
        cachedData.current[key] ||
        (key === "trijunction"
          ? await getTrijunctionPoints()
          : await getFieldPoints());

      cachedData.current[key] = data;
      addOrUpdatePointLayer(map, key, data, layers[key].opacity);
      setVisible(key, true);
    } catch (error) {
      console.error(`${key} load error:`, error);
    } finally {
      setLoading(key, false);
    }
  };

  const handleVisible = async (key, visible) => {
    if (!visible) {
      setVisible(key, false);
      applyVisibility(map, key, false);
      return;
    }

    await loadLayer(key);
  };

  useEffect(() => {
    LAYER_DEFS.forEach(({ key }) =>
      applyVisibility(map, key, layers[key].visible),
    );
  }, [map, layers]);

  useEffect(() => {
    LAYER_DEFS.forEach(({ key }) => {
      if (layers[key].visible) applyOpacity(map, key, layers[key].opacity);
    });
  }, [map, layers]);

  return (
    <div className="border-b border-[#343c4c]">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-white hover:bg-[#0f3d2e]"
        onClick={() => setOpen((p) => !p)}
      >
        <span>MISCELLANEOUS</span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>

      {open && (
        <div className="mx-3 mb-3 rounded-sm border border-[#3b4558] bg-[#232b3a] p-2">
          {LAYER_DEFS.map(({ key, label, color }) => (
            <LayerRow
              key={key}
              label={layers[key].loading ? `${label}...` : label}
              color={color}
              checked={layers[key].visible}
              opacity={layers[key].opacity}
              onCheckedChange={(v) => handleVisible(key, v)}
              onOpacityChange={(o) => setOpacity(key, o)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

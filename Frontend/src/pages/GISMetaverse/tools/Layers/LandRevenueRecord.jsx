import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import LayerRow from "./_LayerRow";
const MASAWI_SOURCE = "gis-handu-gujran-ortho-source";
const MASAWI_LAYER = "gis-handu-gujran-ortho-layer";
const MASAWI_TILE_URL = "http://localhost:8081/data/Handu_Gujran_Ortho/{z}/{x}/{y}.png";

const MASAWI_BOUNDS = [
  [74.42562653088396, 31.60509230706726],
  [74.43545280361002, 31.6112165411359],
];

// ── Layer IDs ─────────────────────────────────────────────────────────────────
const IDS = {
  moza:    { src: "gism-lrr-moza-src",    fill: "gism-lrr-moza-fill",    line: "gism-lrr-moza-line"    },
  murabba: { src: "gism-lrr-murabba-src", fill: "gism-lrr-murabba-fill", line: "gism-lrr-murabba-line" },
  khasra:  { src: "gism-lrr-khasra-src",  fill: "gism-lrr-khasra-fill",  line: "gism-lrr-khasra-line"  },
};

const LAYER_DEFS = [
  { key: "moza",    label: "Mauzed Boundary",   color: "#ff8b24", type: "polygon" },
  { key: "khasra",  label: "Hasra Boundary",    color: "#65c96b", type: "polygon" },
  { key: "murabba", label: "Murabba Boundary",  color: "#d7bf32", type: "polygon" },
  { key: "masawi",  label: "Masawi",            color: "#84cc16", type: "raster" },
];

// ── Map helpers ───────────────────────────────────────────────────────────────
function addOrUpdatePolygonLayer(map, key, geojson, opacity) {
  const ids = IDS[key];
  if (!ids) return;
  const o = opacity / 100;

  if (!map.getSource(ids.src)) {
    map.addSource(ids.src, { type: "geojson", data: geojson });
  } else {
    map.getSource(ids.src).setData(geojson);
  }

  if (!map.getLayer(ids.fill)) {
    map.addLayer({
      id: ids.fill, type: "fill", source: ids.src,
      paint: { "fill-color": LAYER_DEFS.find((d) => d.key === key).color, "fill-opacity": o * 0.2 },
      layout: { visibility: "visible" },
    });
  } else {
    map.setLayoutProperty(ids.fill, "visibility", "visible");
    map.setPaintProperty(ids.fill, "fill-opacity", o * 0.2);
  }

  if (!map.getLayer(ids.line)) {
    map.addLayer({
      id: ids.line, type: "line", source: ids.src,
      paint: { "line-color": LAYER_DEFS.find((d) => d.key === key).color, "line-width": 1.5, "line-opacity": o },
      layout: { visibility: "visible" },
    });
  } else {
    map.setLayoutProperty(ids.line, "visibility", "visible");
    map.setPaintProperty(ids.line, "line-opacity", o);
  }
}

function hideLayer(map, key) {
  if (key === "masawi") {
    try {
      if (map?.getLayer(MASAWI_LAYER)) map.setLayoutProperty(MASAWI_LAYER, "visibility", "none");
    } catch (_) {}
    return;
  }

  const ids = IDS[key];
  if (!ids) return;
  try {
    if (map.getLayer(ids.fill)) map.setLayoutProperty(ids.fill, "visibility", "none");
    if (map.getLayer(ids.line)) map.setLayoutProperty(ids.line, "visibility", "none");
  } catch (_) {}
}

function updateOpacity(map, key, opacity) {
  const o = opacity / 100;

  if (key === "masawi") {
    try {
      if (map?.getLayer(MASAWI_LAYER)) map.setPaintProperty(MASAWI_LAYER, "raster-opacity", o);
    } catch (_) {}
    return;
  }

  const ids = IDS[key];
  if (!ids) return;
  try {
    if (map.getLayer(ids.fill)) map.setPaintProperty(ids.fill, "fill-opacity", o * 0.2);
    if (map.getLayer(ids.line)) map.setPaintProperty(ids.line, "line-opacity", o);
  } catch (_) {}
}

function addOrUpdateMasawiLayer(map, opacity) {
  if (!map) return;

  if (!map.getSource(MASAWI_SOURCE)) {
    map.addSource(MASAWI_SOURCE, {
      type: "raster",
      tiles: [MASAWI_TILE_URL],
      tileSize: 256,
    });
  }

  if (!map.getLayer(MASAWI_LAYER)) {
    map.addLayer({
      id: MASAWI_LAYER,
      type: "raster",
      source: MASAWI_SOURCE,
      paint: {
        "raster-opacity": opacity / 100,
      },
      layout: {
        visibility: "visible",
      },
    });
  } else {
    map.setLayoutProperty(MASAWI_LAYER, "visibility", "visible");
    map.setPaintProperty(MASAWI_LAYER, "raster-opacity", opacity / 100);
  }

  map.fitBounds(MASAWI_BOUNDS, { padding: 50, duration: 1500 });
}

export default function LandRevenueRecord({ map }) {
  const [open, setOpen] = useState(false);
  const [layers, setLayers] = useState(() =>
    Object.fromEntries(LAYER_DEFS.map((d) => [d.key, { visible: false, opacity: 100, loading: false }]))
  );

  const setVisible = (key, v) => setLayers((p) => ({ ...p, [key]: { ...p[key], visible: v } }));
  const setOpacity = (key, o) => setLayers((p) => ({ ...p, [key]: { ...p[key], opacity: o } }));
  const setLoading = (key, l) => setLayers((p) => ({ ...p, [key]: { ...p[key], loading: l } }));

  // Handle visibility changes — fetch GeoJSON on first enable
  const cachedData = useState({})[0]; // mutable ref-like cache

  const handleVisible = async (key, visible) => {
    if (!map) { setVisible(key, visible); return; }

    if (!visible) {
      setVisible(key, false);
      hideLayer(map, key);
      return;
    }

    if (key === "masawi") {
      addOrUpdateMasawiLayer(map, layers[key].opacity);
      setVisible(key, true);
      return;
    }

    // If source already on map just show it
    if (IDS[key] && map.getSource(IDS[key].src)) {
      setVisible(key, true);
      addOrUpdatePolygonLayer(map, key, cachedData[key], layers[key].opacity);
      return;
    }

    setLoading(key, true);
    try {
      let geojson = null;
      // Fetch all records (no filter — show full dataset)
      if (key === "moza")    geojson = await import("../../../../services/api").then(m => m.getMauzas());
      if (key === "murabba") geojson = await import("../../../../services/api").then(m => m.getMurabbas());
      if (key === "khasra")  geojson = await import("../../../../services/api").then(m => m.getKhasras());

      if (geojson?.features?.length) {
        cachedData[key] = geojson;
        addOrUpdatePolygonLayer(map, key, geojson, layers[key].opacity);
        setVisible(key, true);

        // Zoom to data
        const bounds = new (await import("mapbox-gl")).default.LngLatBounds();
        geojson.features.forEach((f) => {
          const coords = f.geometry?.coordinates;
          const traverse = (c) => {
            if (typeof c?.[0] === "number") bounds.extend(c);
            else if (Array.isArray(c)) c.forEach(traverse);
          };
          traverse(coords);
        });
        if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 40, duration: 800 });
      }
    } catch (e) {
      console.error("LandRevenue layer load error:", e);
    } finally {
      setLoading(key, false);
    }
  };

  // Live opacity updates
  useEffect(() => {
    LAYER_DEFS.forEach(({ key }) => {
      if (layers[key].visible) updateOpacity(map, key, layers[key].opacity);
    });
  }, [map, layers]);

  return (
    <div className="border-b border-[#343c4c]">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-white hover:bg-[#293445]"
        onClick={() => setOpen((p) => !p)}
      >
        <span>LAND REVENUE RECORD</span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>

      {open && (
        <div className="mx-3 mb-3 rounded-sm border border-[#3b4558] bg-[#232b3a] p-2">
          {LAYER_DEFS.map(({ key, label, color }) => (
            <LayerRow
              key={key}
              label={
                layers[key].loading
                  ? <span className="flex items-center gap-1">{label} <span className="text-[9px] text-white/40 animate-pulse">loading…</span></span>
                  : label
              }
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

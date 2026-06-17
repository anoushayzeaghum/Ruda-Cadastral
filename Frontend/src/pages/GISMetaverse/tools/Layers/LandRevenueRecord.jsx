import { useState, useEffect, useRef } from "react";
import LayerRow from "./_LayerRow";
import { getMauzas } from "../../../../services/api";
import { ChevronDown, ChevronRight, Grid } from "lucide-react";
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
  { key: "moza",    label: "Mauza Boundary",   color: "#ff8b24", type: "polygon" },
  { key: "khasra",  label: "Khasra Boundary",    color: "#65c96b", type: "polygon" },
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
  const [mauzas, setMauzas] = useState([]);
  const [selectedMauzas, setSelectedMauzas] = useState([]);
  const [mauzaOpen, setMauzaOpen] = useState(false);
  const [mauzaLayerData, setMauzaLayerData] = useState(null);
  const [mauzaPanelOpen, setMauzaPanelOpen] = useState(false);

  const [showMauzaSelector, setShowMauzaSelector] = useState(false);
  const [open, setOpen] = useState(false);
  const [layers, setLayers] = useState(() =>
    Object.fromEntries(LAYER_DEFS.map((d) => [d.key, { visible: false, opacity: 100, loading: false }]))
  );

  const setVisible = (key, v) => setLayers((p) => ({ ...p, [key]: { ...p[key], visible: v } }));
  const setOpacity = (key, o) => setLayers((p) => ({ ...p, [key]: { ...p[key], opacity: o } }));
  const setLoading = (key, l) => setLayers((p) => ({ ...p, [key]: { ...p[key], loading: l } }));

  // Handle visibility changes — fetch GeoJSON on first enable
  // const cachedData = useState({})[0]; // mutable ref-like cache
 const cachedData = useRef({});
  const handleVisible = async (key, visible) => {
    if (!map) { setVisible(key, visible); return; }

    if (!visible) {
      setVisible(key, false);
      hideLayer(map, key);

      // reset mauza UI
      setSelectedMauzas([]);
      setMauzaLayerData(null);
      setMauzaOpen(false);

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
      
      if (key === "moza") {
        const res = await getMauzas();
        const features = res.features || [];

        setMauzas(features);
        setMauzaLayerData(features);

        const geojson = {
          type: "FeatureCollection",
          features,
        };

        cachedData.current.moza = geojson;

        // show all on map initially
        addOrUpdatePolygonLayer(map, "moza", geojson, layers[key].opacity);
        setVisible("moza", true);

        return;
      }
      if (key === "murabba") geojson = await import("../../../../services/api").then(m => m.getMurabbas());
      if (key === "khasra")  geojson = await import("../../../../services/api").then(m => m.getKhasras());

      if (geojson?.features?.length) {
        // cachedData[key] = geojson;
        cachedData.current[key] = geojson;
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

useEffect(() => {
  if (!map || !mauzaLayerData) return;

  const geojson = {
    type: "FeatureCollection",
    features:
      selectedMauzas.length === 0
        ? mauzaLayerData
        : mauzaLayerData.filter((m) =>
            selectedMauzas.includes(Number(m.properties?.gid))
          ),
  };

  addOrUpdatePolygonLayer(map, "moza", geojson, 100);
}, [selectedMauzas, map, mauzaLayerData]);

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
          {/* ✅ 1. MAUZA SELECTOR (PUT HERE) */}
          {/* MAUZA CONTROL BLOCK */}
<div className="bg-[#1b2230] p-2 mb-2 rounded text-xs text-white">

  {/* HEADER ROW */}
  <div className="flex items-center justify-between">

    {/* LEFT SIDE: CHECKBOX + TITLE */}
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={layers.moza.visible}
        onChange={(e) => handleVisible("moza", e.target.checked)}
      />

      <span className="font-bold">Mauza Boundary</span>
    </div>

    {/* RIGHT SIDE: GRID + V ICON */}
    <div className="flex items-center gap-2">

      {/* GRID ICON */}
      <Grid
        size={16}
        className="cursor-pointer"
        onClick={() => setMauzaPanelOpen((p) => !p)}
      />

      {/* V ICON */}
      <span
        className="cursor-pointer select-none px-1"
        onClick={() => setMauzaPanelOpen((p) => !p)}
      >
        {mauzaPanelOpen ? "▼" : "V"}
      </span>
    </div>
  </div>

  {/* DROPDOWN PANEL (ONLY NAMES) */}
  {mauzaPanelOpen && (
    <div className="mt-2 max-h-48 overflow-auto border-t border-white/10 pt-2">

      {mauzas.map((m) => {
        const id = Number(m.properties?.gid);

        return (
          <label
            key={id}
            className="flex items-center gap-2 py-1 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedMauzas.includes(id)}
              onChange={(e) => {
                setSelectedMauzas((prev) =>
                  e.target.checked
                    ? [...prev, id]
                    : prev.filter((x) => x !== id)
                );
              }}
            />

            {m.properties?.mauza}
          </label>
        );
      })}

    </div>
  )}
</div>
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

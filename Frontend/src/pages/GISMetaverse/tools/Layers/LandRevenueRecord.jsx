import { useEffect, useMemo, useRef, useState } from "react";
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

const IDS = {
  moza: { src: "gism-lrr-moza-src", fill: "gism-lrr-moza-fill", line: "gism-lrr-moza-line" },
  murabba: { src: "gism-lrr-murabba-src", fill: "gism-lrr-murabba-fill", line: "gism-lrr-murabba-line" },
  khasra: { src: "gism-lrr-khasra-src", fill: "gism-lrr-khasra-fill", line: "gism-lrr-khasra-line" },
};

const MAUZA_DEF = { key: "moza", label: "Mauza Boundary", color: "#ff8b24", type: "polygon" };

const LAYER_DEFS = [
  { key: "khasra", label: "Khasra Boundary", color: "#65c96b", type: "polygon" },
  { key: "murabba", label: "Murabba Boundary", color: "#d7bf32", type: "polygon" },
  { key: "masawi", label: "Masawi", color: "#84cc16", type: "raster" },
];

const ALL_LAYER_DEFS = [MAUZA_DEF, ...LAYER_DEFS];

function getLayerColor(key) {
  return ALL_LAYER_DEFS.find((d) => d.key === key)?.color || "#ffffff";
}

function getMauzaId(feature) {
  return Number(
    feature?.properties?.gid ??
      feature?.properties?.id ??
      feature?.properties?.mauza_id ??
      feature?.properties?.moza_id
  );
}

function getMauzaName(feature) {
  return (
    feature?.properties?.mauza ??
    feature?.properties?.Mauza ??
    feature?.properties?.moza ??
    feature?.properties?.Moza ??
    feature?.properties?.name ??
    feature?.properties?.Name ??
    `Mauza ${getMauzaId(feature) || ""}`
  );
}

function getProjectId(feature) {
  return String(
    feature?.properties?.project_id ??
      feature?.properties?.projectId ??
      feature?.properties?.Project_ID ??
      feature?.properties?.PROJECT_ID ??
      ""
  );
}

function filterFeaturesByProject(features, selectedProjectId) {
  if (!selectedProjectId) return features;

  const selectedId = String(selectedProjectId);
  const withProjectId = features.filter((feature) => getProjectId(feature));

  if (!withProjectId.length) return features;

  return features.filter((feature) => getProjectId(feature) === selectedId);
}

function fitToGeojson(map, geojson) {
  if (!map || !geojson?.features?.length) return;

  import("mapbox-gl").then((m) => {
    const bounds = new m.default.LngLatBounds();

    geojson.features.forEach((feature) => {
      const traverse = (coords) => {
        if (!coords) return;
        if (typeof coords?.[0] === "number" && typeof coords?.[1] === "number") {
          bounds.extend(coords);
          return;
        }
        if (Array.isArray(coords)) coords.forEach(traverse);
      };

      traverse(feature.geometry?.coordinates);
    });

    if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 40, duration: 900 });
  });
}

function addOrUpdatePolygonLayer(map, key, geojson, opacity) {
  const ids = IDS[key];
  if (!map || !ids || !geojson) return;

  const o = opacity / 100;

  if (!map.getSource(ids.src)) {
    map.addSource(ids.src, { type: "geojson", data: geojson });
  } else {
    map.getSource(ids.src).setData(geojson);
  }

  if (!map.getLayer(ids.fill)) {
    map.addLayer({
      id: ids.fill,
      type: "fill",
      source: ids.src,
      paint: {
        "fill-color": getLayerColor(key),
        "fill-opacity": o * 0.2,
      },
      layout: { visibility: "visible" },
    });
  } else {
    map.setLayoutProperty(ids.fill, "visibility", "visible");
    map.setPaintProperty(ids.fill, "fill-opacity", o * 0.2);
  }

  if (!map.getLayer(ids.line)) {
    map.addLayer({
      id: ids.line,
      type: "line",
      source: ids.src,
      paint: {
        "line-color": getLayerColor(key),
        "line-width": 1.5,
        "line-opacity": o,
      },
      layout: { visibility: "visible" },
    });
  } else {
    map.setLayoutProperty(ids.line, "visibility", "visible");
    map.setPaintProperty(ids.line, "line-opacity", o);
  }
}

function hideLayer(map, key) {
  if (!map) return;

  if (key === "masawi") {
    try {
      if (map.getLayer(MASAWI_LAYER)) map.setLayoutProperty(MASAWI_LAYER, "visibility", "none");
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
  if (!map) return;

  const o = opacity / 100;

  if (key === "masawi") {
    try {
      if (map.getLayer(MASAWI_LAYER)) map.setPaintProperty(MASAWI_LAYER, "raster-opacity", o);
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
      paint: { "raster-opacity": opacity / 100 },
      layout: { visibility: "visible" },
    });
  } else {
    map.setLayoutProperty(MASAWI_LAYER, "visibility", "visible");
    map.setPaintProperty(MASAWI_LAYER, "raster-opacity", opacity / 100);
  }

  map.fitBounds(MASAWI_BOUNDS, { padding: 50, duration: 1500 });
}

export default function LandRevenueRecord({ map, selectedProjectId }) {
  const [mauzas, setMauzas] = useState([]);
  const [selectedMauzas, setSelectedMauzas] = useState([]);
  const [mauzaPanelOpen, setMauzaPanelOpen] = useState(false);
  const [open, setOpen] = useState(false);

  const cachedData = useRef({});

  const [layers, setLayers] = useState(() =>
    Object.fromEntries(ALL_LAYER_DEFS.map((d) => [d.key, { visible: false, opacity: 100, loading: false }]))
  );

  const selectedProjectKey = selectedProjectId ? String(selectedProjectId) : "all";

  const setVisible = (key, visible) => {
    setLayers((prev) => ({ ...prev, [key]: { ...prev[key], visible } }));
  };

  const setOpacity = (key, opacity) => {
    setLayers((prev) => ({ ...prev, [key]: { ...prev[key], opacity } }));
  };

  const setLoading = (key, loading) => {
    setLayers((prev) => ({ ...prev, [key]: { ...prev[key], loading } }));
  };

  const mauzaGeojson = useMemo(() => {
    const features = selectedMauzas.length
      ? mauzas.filter((feature) => selectedMauzas.includes(getMauzaId(feature)))
      : mauzas;

    return { type: "FeatureCollection", features };
  }, [mauzas, selectedMauzas]);

  const loadMauzas = async () => {
    if (!map) return;

    setLoading("moza", true);

    try {
      const res = await getMauzas(selectedProjectId);
      const allFeatures = res?.features || [];
      const projectFeatures = filterFeaturesByProject(allFeatures, selectedProjectId);
      const geojson = { type: "FeatureCollection", features: projectFeatures };

      cachedData.current.moza = geojson;
      setMauzas(projectFeatures);
      setSelectedMauzas([]);
      addOrUpdatePolygonLayer(map, "moza", geojson, layers.moza.opacity);
      fitToGeojson(map, geojson);
      setVisible("moza", true);
    } catch (error) {
      console.error("Mauza boundary load error:", error);
    } finally {
      setLoading("moza", false);
    }
  };

  const handleVisible = async (key, visible) => {
    if (!map) {
      setVisible(key, visible);
      return;
    }

    if (!visible) {
      setVisible(key, false);
      hideLayer(map, key);

      if (key === "moza") {
        setSelectedMauzas([]);
        setMauzaPanelOpen(false);
      }

      return;
    }

    if (key === "masawi") {
      addOrUpdateMasawiLayer(map, layers[key].opacity);
      setVisible(key, true);
      return;
    }

    if (key === "moza") {
      await loadMauzas();
      return;
    }

    if (IDS[key] && map.getSource(IDS[key].src) && cachedData.current[key]) {
      setVisible(key, true);
      addOrUpdatePolygonLayer(map, key, cachedData.current[key], layers[key].opacity);
      return;
    }

    setLoading(key, true);

    try {
      let geojson = null;

      if (key === "murabba") {
        geojson = await import("../../../../services/api").then((m) => m.getMurabbas());
      }

      if (key === "khasra") {
        geojson = await import("../../../../services/api").then((m) => m.getKhasras());
      }

      if (geojson?.features?.length) {
        cachedData.current[key] = geojson;
        addOrUpdatePolygonLayer(map, key, geojson, layers[key].opacity);
        fitToGeojson(map, geojson);
        setVisible(key, true);
      }
    } catch (error) {
      console.error("LandRevenue layer load error:", error);
    } finally {
      setLoading(key, false);
    }
  };

  useEffect(() => {
    ALL_LAYER_DEFS.forEach(({ key }) => {
      if (layers[key]?.visible) updateOpacity(map, key, layers[key].opacity);
    });
  }, [map, layers]);

  useEffect(() => {
    if (!map || !layers.moza.visible) return;
    addOrUpdatePolygonLayer(map, "moza", mauzaGeojson, layers.moza.opacity);
  }, [map, mauzaGeojson, layers.moza.visible, layers.moza.opacity]);

  useEffect(() => {
    if (!map || !layers.moza.visible) return;
    loadMauzas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectKey]);

  return (
    <div className="border-b border-[#343c4c]">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-white hover:bg-[#293445]"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>LAND REVENUE RECORD</span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>

      {open && (
        <div className="mx-3 mb-3 rounded-sm border border-[#3b4558] bg-[#232b3a] p-2">
          <div className="mb-2 rounded-sm border border-[#344055] bg-[#1b2230] text-xs text-white">
            <div className="flex items-center justify-between px-3 py-2">
              <label className="flex min-w-0 cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={layers.moza.visible}
                  onChange={(event) => handleVisible("moza", event.target.checked)}
                />

                <span
                  className="h-3 w-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: MAUZA_DEF.color }}
                />

                <span className="truncate font-semibold">
                  {layers.moza.loading ? (
                    <span className="flex items-center gap-1">
                      Mauza Boundary
                      <span className="text-[9px] text-white/40 animate-pulse">loading…</span>
                    </span>
                  ) : (
                    "Mauza Boundary"
                  )}
                </span>
              </label>

              <button
                type="button"
                className="flex items-center gap-1 rounded px-1.5 py-1 text-white/80 hover:bg-white/10 hover:text-white"
                onClick={() => setMauzaPanelOpen((prev) => !prev)}
                title="Show mauza names"
              >
                <Grid size={15} />
                {mauzaPanelOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            </div>

            {layers.moza.visible && (
              <div className="border-t border-white/10 px-3 pb-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={layers.moza.opacity}
                  onChange={(event) => setOpacity("moza", Number(event.target.value))}
                  className="h-1.5 w-full accent-[#8bd66f]"
                />
              </div>
            )}

            {mauzaPanelOpen && (
              <div className="max-h-48 overflow-y-auto border-t border-white/10 px-3 py-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {!layers.moza.visible && (
                  <div className="py-1 text-[11px] text-white/45">
                    Turn on Mauza Boundary to load project mauzas.
                  </div>
                )}

                {layers.moza.visible && !mauzas.length && !layers.moza.loading && (
                  <div className="py-1 text-[11px] text-white/45">
                    No mauza found for selected project.
                  </div>
                )}

                {mauzas.map((mauza) => {
                  const id = getMauzaId(mauza);
                  const name = getMauzaName(mauza);

                  return (
                    <label key={`${id}-${name}`} className="flex cursor-pointer items-center gap-2 py-1 text-[11px] text-white/85 hover:text-white">
                      <input
                        type="checkbox"
                        checked={selectedMauzas.includes(id)}
                        onChange={(event) => {
                          setSelectedMauzas((prev) =>
                            event.target.checked
                              ? [...prev, id]
                              : prev.filter((selectedId) => selectedId !== id)
                          );
                        }}
                      />
                      <span className="truncate">{name}</span>
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
                layers[key].loading ? (
                  <span className="flex items-center gap-1">
                    {label}
                    <span className="text-[9px] text-white/40 animate-pulse">loading…</span>
                  </span>
                ) : (
                  label
                )
              }
              color={color}
              checked={layers[key].visible}
              opacity={layers[key].opacity}
              onCheckedChange={(value) => handleVisible(key, value)}
              onOpacityChange={(opacity) => setOpacity(key, opacity)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

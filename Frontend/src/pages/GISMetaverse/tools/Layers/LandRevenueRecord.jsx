import { useEffect, useMemo, useRef, useState } from "react";
import LayerRow from "./_LayerRow";
import {
  getProjectMauzasGeoJSON,
  getMurabbasGeoJSON,
  getKhasrasGeoJSON,
} from "../../../../services/api";
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
  { key: "khasra", label: "Khasra Boundary", color: "#65c96b", type: "polygon", dropdown: true },
  { key: "murabba", label: "Murabba Boundary", color: "#d7bf32", type: "polygon" },
  { key: "masawi", label: "Masawi", color: "#84cc16", type: "raster" },
];

const ALL_LAYER_DEFS = [MAUZA_DEF, ...LAYER_DEFS];

function emptyFC() {
  return { type: "FeatureCollection", features: [] };
}

function getLayerColor(key) {
  return ALL_LAYER_DEFS.find((d) => d.key === key)?.color || "#ffffff";
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function getMauzaId(feature) {
  return toNumber(
    feature?.properties?.mauza_id ??
      feature?.properties?.gid ??
      feature?.properties?.id ??
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

function uniqueByMauza(features = []) {
  const seen = new Set();

  return features.filter((feature) => {
    const id = getMauzaId(feature);
    const name = getMauzaName(feature);
    const key = id ?? name;

    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getMauzaIdsFromFeatures(features = []) {
  return [...new Set(features.map(getMauzaId).filter((id) => id !== null))];
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
  const [khasraPanelOpen, setKhasraPanelOpen] = useState(false);
  const [khasraMauzas, setKhasraMauzas] = useState([]);
  const [open, setOpen] = useState(false);

  const cachedData = useRef({});

  const [layers, setLayers] = useState(() =>
    Object.fromEntries(ALL_LAYER_DEFS.map((d) => [d.key, { visible: false, opacity: 100, loading: false }]))
  );

  const selectedProjectKey = selectedProjectId ? String(selectedProjectId) : "";

  const setVisible = (key, visible) => {
    setLayers((prev) => ({ ...prev, [key]: { ...prev[key], visible } }));
  };

  const setOpacity = (key, opacity) => {
    setLayers((prev) => ({ ...prev, [key]: { ...prev[key], opacity } }));
  };

  const setLoading = (key, loading) => {
    setLayers((prev) => ({ ...prev, [key]: { ...prev[key], loading } }));
  };

  const activeMauzaFeatures = useMemo(() => {
    if (selectedMauzas.length) {
      return mauzas.filter((feature) => selectedMauzas.includes(getMauzaId(feature)));
    }

    return mauzas;
  }, [mauzas, selectedMauzas]);

  const activeMauzaIds = useMemo(() => getMauzaIdsFromFeatures(activeMauzaFeatures), [activeMauzaFeatures]);

  const mauzaGeojson = useMemo(
    () => ({ type: "FeatureCollection", features: activeMauzaFeatures }),
    [activeMauzaFeatures]
  );

  const loadMauzas = async ({ zoom = true } = {}) => {
    if (!map) return emptyFC();

    if (!selectedProjectId) {
      cachedData.current.moza = emptyFC();
      setMauzas([]);
      setSelectedMauzas([]);
      addOrUpdatePolygonLayer(map, "moza", emptyFC(), layers.moza.opacity);
      setVisible("moza", true);
      return emptyFC();
    }

    setLoading("moza", true);

    try {
      const geojson = await getProjectMauzasGeoJSON(selectedProjectId);
      const projectMauzas = uniqueByMauza(geojson?.features || []);
      const projectGeojson = { type: "FeatureCollection", features: projectMauzas };

      cachedData.current.moza = projectGeojson;
      setMauzas(projectMauzas);
      setSelectedMauzas([]);
      addOrUpdatePolygonLayer(map, "moza", projectGeojson, layers.moza.opacity);
      if (zoom) fitToGeojson(map, projectGeojson);
      setVisible("moza", true);
      return projectGeojson;
    } catch (error) {
      console.error("Mauza boundary load error:", error);
      return emptyFC();
    } finally {
      setLoading("moza", false);
    }
  };

  const loadBoundaryByMauzas = async (key, mauzaIds, { zoom = true } = {}) => {
    if (!map || !mauzaIds?.length) {
      cachedData.current[key] = emptyFC();
      addOrUpdatePolygonLayer(map, key, emptyFC(), layers[key].opacity);
      setVisible(key, true);
      return emptyFC();
    }

    setLoading(key, true);

    try {
      const geojson =
        key === "khasra"
          ? await getKhasrasGeoJSON({ mauza_ids: mauzaIds })
          : await getMurabbasGeoJSON({ mauza_ids: mauzaIds });

      cachedData.current[key] = geojson;
      addOrUpdatePolygonLayer(map, key, geojson, layers[key].opacity);
      if (zoom) fitToGeojson(map, geojson);
      setVisible(key, true);

      if (key === "khasra") {
        setKhasraMauzas(activeMauzaFeatures);
      }

      return geojson;
    } catch (error) {
      console.error(`${key} boundary load error:`, error);
      return emptyFC();
    } finally {
      setLoading(key, false);
    }
  };

  const ensureMauzas = async () => {
    if (activeMauzaIds.length) return activeMauzaIds;

    const loaded = await loadMauzas({ zoom: false });
    return getMauzaIdsFromFeatures(loaded.features || []);
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

      if (key === "khasra") {
        setKhasraPanelOpen(false);
        setKhasraMauzas([]);
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

    if (key === "murabba" || key === "khasra") {
      const mauzaIds = await ensureMauzas();
      await loadBoundaryByMauzas(key, mauzaIds);
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
    if (!map) return;

    if (!layers.khasra.visible && !layers.murabba.visible) return;

    const reloadDependentLayers = async () => {
      if (layers.khasra.visible) await loadBoundaryByMauzas("khasra", activeMauzaIds, { zoom: false });
      if (layers.murabba.visible) await loadBoundaryByMauzas("murabba", activeMauzaIds, { zoom: false });
    };

    reloadDependentLayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMauzaIds.join(",")]);

  useEffect(() => {
    if (!map) return;

    cachedData.current = {};
    setMauzas([]);
    setSelectedMauzas([]);
    setKhasraMauzas([]);
    setMauzaPanelOpen(false);
    setKhasraPanelOpen(false);

    ["moza", "murabba", "khasra"].forEach((key) => hideLayer(map, key));

    setLayers((prev) => ({
      ...prev,
      moza: { ...prev.moza, visible: false, loading: false },
      murabba: { ...prev.murabba, visible: false, loading: false },
      khasra: { ...prev.khasra, visible: false, loading: false },
    }));
  }, [map, selectedProjectKey]);

  const renderBoundaryRow = ({ key, label, color, dropdown }) => {
    const isKhasra = key === "khasra";

    return (
      <div key={key} className="mb-2 rounded-sm border border-[#344055] bg-[#1b2230] text-xs text-white">
        <div className="flex items-center justify-between px-3 py-2">
          <label className="flex min-w-0 cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={layers[key].visible}
              onChange={(event) => handleVisible(key, event.target.checked)}
            />

            <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: color }} />

            <span className="truncate font-semibold">
              {layers[key].loading ? (
                <span className="flex items-center gap-1">
                  {label}
                  <span className="text-[9px] text-white/40 animate-pulse">loading…</span>
                </span>
              ) : (
                label
              )}
            </span>
          </label>

          {dropdown && (
            <button
              type="button"
              className="flex items-center gap-1 rounded px-1.5 py-1 text-white/80 hover:bg-white/10 hover:text-white"
              onClick={() => setKhasraPanelOpen((prev) => !prev)}
              title="Show khasra mauza names"
            >
              <Grid size={15} />
              {khasraPanelOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          )}
        </div>

        {layers[key].visible && (
          <div className="border-t border-white/10 px-3 pb-2">
            <input
              type="range"
              min="0"
              max="100"
              value={layers[key].opacity}
              onChange={(event) => setOpacity(key, Number(event.target.value))}
              className="h-1.5 w-full accent-[#8bd66f]"
            />
          </div>
        )}

        {isKhasra && khasraPanelOpen && (
          <div className="max-h-48 overflow-y-auto border-t border-white/10 px-3 py-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {!layers.khasra.visible && (
              <div className="py-1 text-[11px] text-white/45">
                Turn on Khasra Boundary to view linked mauza names.
              </div>
            )}

            {layers.khasra.visible && !khasraMauzas.length && !layers.khasra.loading && (
              <div className="py-1 text-[11px] text-white/45">
                No khasra boundary loaded for selected project mauzas.
              </div>
            )}

            {khasraMauzas.map((mauza) => {
              const id = getMauzaId(mauza);
              const name = getMauzaName(mauza);

              return (
                <div key={`khasra-${id}-${name}`} className="flex items-center gap-2 py-1 text-[11px] text-white/85">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#65c96b]" />
                  <span className="truncate">{name}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

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

                <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: MAUZA_DEF.color }} />

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
                {!selectedProjectId && (
                  <div className="py-1 text-[11px] text-white/45">
                    Select a project first to load linked mauzas.
                  </div>
                )}

                {selectedProjectId && !layers.moza.visible && (
                  <div className="py-1 text-[11px] text-white/45">
                    Turn on Mauza Boundary to load project mauzas.
                  </div>
                )}

                {selectedProjectId && layers.moza.visible && !mauzas.length && !layers.moza.loading && (
                  <div className="py-1 text-[11px] text-white/45">
                    No mauza found for selected project.
                  </div>
                )}

                {mauzas.map((mauza) => {
                  const id = getMauzaId(mauza);
                  const name = getMauzaName(mauza);

                  return (
                    <label
                      key={`${id}-${name}`}
                      className="flex cursor-pointer items-center gap-2 py-1 text-[11px] text-white/85 hover:text-white"
                    >
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

          {LAYER_DEFS.map((definition) =>
            definition.dropdown
              ? renderBoundaryRow(definition)
              : definition.key === "masawi"
                ? (
                  <LayerRow
                    key={definition.key}
                    label={
                      layers[definition.key].loading ? (
                        <span className="flex items-center gap-1">
                          {definition.label}
                          <span className="text-[9px] text-white/40 animate-pulse">loading…</span>
                        </span>
                      ) : (
                        definition.label
                      )
                    }
                    color={definition.color}
                    checked={layers[definition.key].visible}
                    opacity={layers[definition.key].opacity}
                    onCheckedChange={(value) => handleVisible(definition.key, value)}
                    onOpacityChange={(opacity) => setOpacity(definition.key, opacity)}
                  />
                )
                : renderBoundaryRow(definition)
          )}
        </div>
      )}
    </div>
  );
}

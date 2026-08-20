import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Grid3X3 } from "lucide-react";
import { getHousingSchemesGeoJSON } from "../../../../services/metaverseApi";
import HousingSchemesStyle, { RUDA_SCHEME_COLORS } from "./LayerManager/PrivateHousingSchemes/HousingSchemesStyle";
import HousingSchemesAttribute from "./AttributeTable/PrivateHousingSchemes/HousingSchemesAttribute";
import InlineLayerLegend from "./_InlineLayerLegend";

const SOURCE_PREFIX = "gism-private-housing-schemes";

const POLYGON_FILTER = ["match", ["geometry-type"], ["Polygon", "MultiPolygon"], true, false];
const LINE_FILTER = ["match", ["geometry-type"], ["LineString", "MultiLineString"], true, false];
const POINT_FILTER = ["match", ["geometry-type"], ["Point", "MultiPoint"], true, false];

const getIds = () => ({
  source: `${SOURCE_PREFIX}-source`,
  fill: `${SOURCE_PREFIX}-fill`,
  line: `${SOURCE_PREFIX}-line`,
  point: `${SOURCE_PREFIX}-point`,
});

const normalizeGeoJSON = (data) => {
  const raw = data?.data || data?.results || data;
  if (raw?.type === "FeatureCollection") return raw;
  if (Array.isArray(raw?.features)) return { type: "FeatureCollection", features: raw.features };
  if (Array.isArray(raw)) return { type: "FeatureCollection", features: raw };
  return { type: "FeatureCollection", features: [] };
};

// Generate legend items from RUDA_SCHEME_COLORS
const legendItems = Object.entries(RUDA_SCHEME_COLORS)
  .filter(([status]) => status !== "underprocess") // Deduplicate the typo status for the UI
  .map(([status, color]) => ({
    label: status.replace(/\b\w/g, (char) => char.toUpperCase()), // Title Case
    color: color,
  }));

function setLayerVisibility(map, visible) {
  if (!map) return;
  const ids = getIds();
  const visibility = visible ? "visible" : "none";
  [ids.fill, ids.line, ids.point].forEach((layerId) => {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, "visibility", visibility);
    }
  });
}

function applyLayerStyle(map, opacity, style = {}) {
  if (!map) return;
  const ids = getIds();
  const ratio = opacity / 100;

  if (map.getLayer(ids.fill)) {
    map.setPaintProperty(ids.fill, "fill-opacity", (style.fillOpacity ?? 0.35) * ratio);
  }
  if (map.getLayer(ids.line)) {
    map.setPaintProperty(ids.line, "line-opacity", (style.lineOpacity ?? 1) * ratio);
  }
  if (map.getLayer(ids.point)) {
    map.setPaintProperty(ids.point, "circle-opacity", ratio);
    map.setPaintProperty(ids.point, "circle-stroke-opacity", ratio);
  }
}

function addOrUpdateMapLayer(map, geojson, opacity, style = {}) {
  if (!map) return;
  const ids = getIds();
  const data = normalizeGeoJSON(geojson);
  const ratio = opacity / 100;

  if (!map.getSource(ids.source)) {
    map.addSource(ids.source, { type: "geojson", data });
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
        "fill-color": style.dataDrivenColor || style.color,
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
        "line-color": style.dataDrivenColor || style.color,
        "line-width": style.lineWidth || ["interpolate", ["linear"], ["zoom"], 7, 1.2, 14, 3],
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
        "circle-radius": style.pointRadius || ["interpolate", ["linear"], ["zoom"], 7, 3, 15, 6],
        "circle-color": style.dataDrivenColor || style.color,
        "circle-opacity": ratio,
        "circle-stroke-color": style.pointStrokeColor || "#ffffff",
        "circle-stroke-width": style.pointStrokeWidth ?? 1,
        "circle-stroke-opacity": ratio,
      },
    });
  }

  applyLayerStyle(map, opacity, style);
  setLayerVisibility(map, true);
}

function removeMapLayer(map) {
  if (!map) return;
  const ids = getIds();
  [ids.point, ids.line, ids.fill].forEach((layerId) => {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
  });
  if (map.getSource(ids.source)) map.removeSource(ids.source);
}

export default function PrivateHousingSchemes({ map }) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [opacity, setOpacity] = useState(100);
  const [status, setStatus] = useState(null);
  const [tableOpen, setTableOpen] = useState(false);

  const visibleRef = useRef(visible);
  const opacityRef = useRef(opacity);
  const loadedGeoJSONRef = useRef(null);
  const requestRef = useRef(null);

  useEffect(() => {
    visibleRef.current = visible;
    opacityRef.current = opacity;
  }, [visible, opacity]);

  const runWhenMapReady = (callback) => {
    if (!map) return;
    if (map.isStyleLoaded?.()) {
      callback();
      return;
    }
    map.once("style.load", callback);
  };

  const showLoadedLayer = () => {
    const geojson = loadedGeoJSONRef.current;
    if (!geojson) return;
    runWhenMapReady(() => {
      if (!map || !map.isStyleLoaded?.()) return;
      if (!visibleRef.current) return;
      addOrUpdateMapLayer(map, geojson, opacityRef.current, HousingSchemesStyle);
    });
  };

  const loadLayer = async () => {
    if (!map) return null;

    if (loadedGeoJSONRef.current) {
      showLoadedLayer();
      return loadedGeoJSONRef.current;
    }

    if (requestRef.current) {
      const geojson = await requestRef.current;
      if (visibleRef.current) showLoadedLayer();
      return geojson;
    }

    setLoading(true);
    setStatus(null);

    const request = (async () => {
      try {
        const geojson = normalizeGeoJSON(await getHousingSchemesGeoJSON());
        loadedGeoJSONRef.current = geojson;
        setStatus(geojson.features.length ? null : "No features");
        return geojson;
      } catch (error) {
        console.error("Failed to load Housing Schemes", error);
        setStatus("Backend error");
        return null;
      } finally {
        requestRef.current = null;
        setLoading(false);
      }
    })();

    requestRef.current = request;
    const geojson = await request;

    if (geojson && visibleRef.current) {
      showLoadedLayer();
    }

    return geojson;
  };

  useEffect(() => {
    if (!map) return;
    if (!visible) {
      setLayerVisibility(map, false);
      return;
    }
    loadLayer();
  }, [map, visible]);

  useEffect(() => {
    if (!map) return undefined;
    const restoreVisibleLayers = () => {
      if (visibleRef.current && loadedGeoJSONRef.current) {
        showLoadedLayer();
      }
    };
    map.on("style.load", restoreVisibleLayers);
    return () => map.off("style.load", restoreVisibleLayers);
  }, [map]);

  useEffect(() => {
    return () => {
      if (map) removeMapLayer(map);
    };
  }, [map]);

  const handleOpacityChange = (val) => {
    setOpacity(val);
    applyLayerStyle(map, val, HousingSchemesStyle);
  };

  return (
    <div className="border-b border-[#343c4c]">
      <div className="flex w-full items-center justify-between px-4 py-3 text-white hover:bg-[#0f3d2e]">
        <button
          type="button"
          className="flex flex-1 cursor-pointer items-center gap-2 text-left"
          onClick={() => setOpen((prev) => !prev)}
        >
          <span>PRIVATE HOUSING SCHEMES</span>
          {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>
        <button
          type="button"
          title={visible ? "Hide layer group" : "Show layer group"}
          onClick={(e) => {
            e.stopPropagation();
            setVisible((prev) => !prev);
          }}
          className={`relative ml-2 h-5 w-9 shrink-0 overflow-hidden rounded-full transition-colors duration-200 focus:outline-none ${
            visible ? "bg-[#65c96b]" : "bg-white/20"
          }`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
              visible ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {open && (
        <div className="mx-3 mb-3 rounded-sm border border-[#13593f]/40 bg-[#093024] p-2">
          <div className="mt-3 first:mt-1 text-white">
            <div className="flex items-center justify-between">
              <label className="flex min-w-0 cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={(e) => setVisible(e.target.checked)}
                  className="accent-[#65c96b]"
                />
                <span className="truncate text-[11px]">
                  {loading ? (
                    <span className="flex items-center gap-1">
                      Housing Schemes
                      <span className="animate-pulse text-[9px] text-white/40">loading…</span>
                    </span>
                  ) : (
                    "Housing Schemes"
                  )}
                </span>
              </label>

              <button
                type="button"
                className="shrink-0 rounded px-1 py-0.5 text-white/60 hover:bg-white/10 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setTableOpen(true);
                }}
                title="Open Housing Schemes attribute table"
              >
                <Grid3X3 size={14} />
              </button>
            </div>

            <div className="mt-2 flex items-center gap-2 pl-6">
              <input
                type="range"
                min="0"
                max="100"
                value={opacity}
                onChange={(e) => handleOpacityChange(Number(e.target.value))}
                className="h-[3px] flex-1 cursor-pointer rounded-full bg-[#8fd36f] accent-[#65c96b]"
              />
              <span className="w-7 text-right text-[11px] text-white/90">{opacity}%</span>
            </div>
          </div>

          {visible && (
            <div className="mt-2 pl-6">
              {legendItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2 mt-1 text-[10px] text-white/80">
                  <span
                    className="inline-block h-3 w-3 shrink-0"
                    style={{ backgroundColor: item.color, opacity: opacity / 100 }}
                  />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          )}

          {status && visible && (
            <div className="pl-6 pt-1 text-[10px] text-amber-300">{status}</div>
          )}
        </div>
      )}

      {tableOpen && (
        <HousingSchemesAttribute
          map={map}
          geojson={loadedGeoJSONRef.current || null}
          onClose={() => setTableOpen(false)}
        />
      )}
    </div>
  );
}

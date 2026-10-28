import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Grid3X3 } from "lucide-react";
import {
  getHousingSchemesGeoJSON,
  getIllegalHousingSchemesGeoJSON,
} from "../../../../services/metaverseApi";
import HousingSchemesStyle, {
  createHousingSchemeCategoryConfig,
  createHousingSchemeColorExpression,
  normalizeHousingSchemeStatus,
} from "./LayerManager/PrivateHousingSchemes/HousingSchemesStyle";
import IllegalHousingSchemeStyle, {
  ILLEGAL_HOUSING_SCHEME_COLOR,
  ILLEGAL_HOUSING_SCHEME_OUTLINE_COLOR,
} from "./LayerManager/PrivateHousingSchemes/IllegalHousingSchemeStyle";
import HousingSchemesAttribute from "./AttributeTable/PrivateHousingSchemes/HousingSchemesAttribute";

const HOUSING_SOURCE_PREFIX = "gism-private-housing-schemes";
const ILLEGAL_SOURCE_PREFIX = "gism-illegal-housing-schemes";

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

const getIds = (sourcePrefix) => ({
  source: `${sourcePrefix}-source`,
  fill: `${sourcePrefix}-fill`,
  outline: `${sourcePrefix}-outline`,
  line: `${sourcePrefix}-line`,
  point: `${sourcePrefix}-point`,
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
  return { type: "FeatureCollection", features: [] };
};

function setMapLayerVisibility(map, sourcePrefix, visible) {
  if (!map) return;

  const ids = getIds(sourcePrefix);
  const visibility = visible ? "visible" : "none";

  [ids.fill, ids.outline, ids.line, ids.point].forEach((layerId) => {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, "visibility", visibility);
    }
  });
}

function applyLayerStyle(map, sourcePrefix, opacity, style = {}) {
  if (!map) return;

  const ids = getIds(sourcePrefix);
  const ratio = opacity / 100;
  const fillColor = style.fillColor || style.dataDrivenColor || style.color;
  const outlineColor = style.outlineColor || style.color || "#ffffff";
  const fillEnabled = style.fillEnabled ?? true;
  const outlineEnabled = style.outlineEnabled ?? false;

  if (map.getLayer(ids.fill)) {
    if (fillColor) {
      map.setPaintProperty(ids.fill, "fill-color", fillColor);
    }
    map.setPaintProperty(
      ids.fill,
      "fill-opacity",
      fillEnabled ? (style.fillOpacity ?? 0.35) * ratio : 0,
    );
  }

  if (map.getLayer(ids.outline)) {
    map.setPaintProperty(ids.outline, "line-color", outlineColor);
    map.setPaintProperty(
      ids.outline,
      "line-opacity",
      outlineEnabled ? (style.outlineOpacity ?? style.lineOpacity ?? 1) * ratio : 0,
    );
    map.setPaintProperty(
      ids.outline,
      "line-width",
      style.outlineWidth ?? style.lineWidth ?? 2,
    );
  }

  if (map.getLayer(ids.line)) {
    map.setPaintProperty(
      ids.line,
      "line-opacity",
      (style.lineOpacity ?? 1) * ratio,
    );
  }

  if (map.getLayer(ids.point)) {
    map.setPaintProperty(ids.point, "circle-opacity", ratio);
    map.setPaintProperty(ids.point, "circle-stroke-opacity", ratio);
  }
}

function addOrUpdateMapLayer(map, sourcePrefix, geojson, opacity, style = {}) {
  if (!map) return;

  const ids = getIds(sourcePrefix);
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
        "fill-color": style.fillColor || style.dataDrivenColor || style.color,
        "fill-opacity": (style.fillEnabled ?? true)
          ? (style.fillOpacity ?? 0.35) * ratio
          : 0,
      },
    });
  }

  if (!map.getLayer(ids.outline)) {
    map.addLayer({
      id: ids.outline,
      type: "line",
      source: ids.source,
      filter: POLYGON_FILTER,
      layout: { visibility: "visible" },
      paint: {
        "line-color": style.outlineColor || style.color || "#ffffff",
        "line-width": style.outlineWidth ?? style.lineWidth ?? 2,
        "line-opacity": (style.outlineEnabled ?? false)
          ? (style.outlineOpacity ?? style.lineOpacity ?? 1) * ratio
          : 0,
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
        "line-width": style.lineWidth || [
          "interpolate",
          ["linear"],
          ["zoom"],
          7,
          1.2,
          14,
          3,
        ],
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
        "circle-radius": style.pointRadius || [
          "interpolate",
          ["linear"],
          ["zoom"],
          7,
          3,
          15,
          6,
        ],
        "circle-color": style.dataDrivenColor || style.color,
        "circle-opacity": ratio,
        "circle-stroke-color": style.pointStrokeColor || "#ffffff",
        "circle-stroke-width": style.pointStrokeWidth ?? 1,
        "circle-stroke-opacity": ratio,
      },
    });
  }

  applyLayerStyle(map, sourcePrefix, opacity, style);
  setMapLayerVisibility(map, sourcePrefix, true);
}

function removeMapLayer(map, sourcePrefix) {
  if (!map || !map.style) return;

  const ids = getIds(sourcePrefix);

  try {
    [ids.point, ids.line, ids.outline, ids.fill].forEach((layerId) => {
      if (map.style && map.getLayer?.(layerId)) {
        map.removeLayer(layerId);
      }
    });

    if (map.style && map.getSource?.(ids.source)) {
      map.removeSource(ids.source);
    }
  } catch (error) {
    if (map.style) {
      console.warn(`Could not clean up ${sourcePrefix} layers.`, error);
    }
  }
}

export default function PrivateHousingSchemes({ map }) {
  const [open, setOpen] = useState(false);

  const [housingVisible, setHousingVisible] = useState(false);
  const [housingLoading, setHousingLoading] = useState(false);
  const [housingOpacity, setHousingOpacity] = useState(100);
  const [housingStatus, setHousingStatus] = useState(null);
  const [housingLegendItems, setHousingLegendItems] = useState([]);
  const [tableOpen, setTableOpen] = useState(false);

  const [illegalVisible, setIllegalVisible] = useState(false);
  const [illegalLoading, setIllegalLoading] = useState(false);
  const [illegalOpacity, setIllegalOpacity] = useState(100);
  const [illegalStatus, setIllegalStatus] = useState(null);
  const [illegalFillEnabled, setIllegalFillEnabled] = useState(false);
  const [illegalFillColor, setIllegalFillColor] = useState(
    ILLEGAL_HOUSING_SCHEME_COLOR,
  );
  const [illegalOutlineEnabled, setIllegalOutlineEnabled] = useState(true);
  const [illegalOutlineColor, setIllegalOutlineColor] = useState(
    ILLEGAL_HOUSING_SCHEME_OUTLINE_COLOR,
  );

  const housingVisibleRef = useRef(housingVisible);
  const housingOpacityRef = useRef(housingOpacity);
  const housingGeoJSONRef = useRef(null);
  const housingRequestRef = useRef(null);
  const housingLegendItemsRef = useRef([]);

  const illegalVisibleRef = useRef(illegalVisible);
  const illegalOpacityRef = useRef(illegalOpacity);
  const illegalFillEnabledRef = useRef(illegalFillEnabled);
  const illegalFillColorRef = useRef(illegalFillColor);
  const illegalOutlineEnabledRef = useRef(illegalOutlineEnabled);
  const illegalOutlineColorRef = useRef(illegalOutlineColor);
  const illegalGeoJSONRef = useRef(null);
  const illegalRequestRef = useRef(null);

  const anyVisible = housingVisible || illegalVisible;

  useEffect(() => {
    housingVisibleRef.current = housingVisible;
    housingOpacityRef.current = housingOpacity;
  }, [housingVisible, housingOpacity]);

  useEffect(() => {
    illegalVisibleRef.current = illegalVisible;
    illegalOpacityRef.current = illegalOpacity;
    illegalFillEnabledRef.current = illegalFillEnabled;
    illegalFillColorRef.current = illegalFillColor;
    illegalOutlineEnabledRef.current = illegalOutlineEnabled;
    illegalOutlineColorRef.current = illegalOutlineColor;
  }, [
    illegalVisible,
    illegalOpacity,
    illegalFillEnabled,
    illegalFillColor,
    illegalOutlineEnabled,
    illegalOutlineColor,
  ]);

  const runWhenMapReady = (callback) => {
    if (!map) return;

    if (map.isStyleLoaded?.()) {
      callback();
      return;
    }

    map.once("style.load", callback);
  };

  const getHousingStyle = () => ({
    ...HousingSchemesStyle,
    dataDrivenColor: createHousingSchemeColorExpression(
      housingLegendItemsRef.current,
    ),
  });

  const showHousingLayer = () => {
    const geojson = housingGeoJSONRef.current;
    if (!geojson) return;

    runWhenMapReady(() => {
      if (!map || !map.isStyleLoaded?.() || !housingVisibleRef.current) return;

      addOrUpdateMapLayer(
        map,
        HOUSING_SOURCE_PREFIX,
        geojson,
        housingOpacityRef.current,
        getHousingStyle(),
      );
    });
  };

  const getIllegalStyle = () => ({
    ...IllegalHousingSchemeStyle,
    fillEnabled: illegalFillEnabledRef.current,
    fillColor: illegalFillColorRef.current,
    outlineEnabled: illegalOutlineEnabledRef.current,
    outlineColor: illegalOutlineColorRef.current,
  });

  const showIllegalLayer = () => {
    const geojson = illegalGeoJSONRef.current;
    if (!geojson) return;

    runWhenMapReady(() => {
      if (!map || !map.isStyleLoaded?.() || !illegalVisibleRef.current) return;

      addOrUpdateMapLayer(
        map,
        ILLEGAL_SOURCE_PREFIX,
        geojson,
        illegalOpacityRef.current,
        getIllegalStyle(),
      );
    });
  };

  const loadHousingLayer = async () => {
    if (!map) return null;

    if (housingGeoJSONRef.current) {
      showHousingLayer();
      return housingGeoJSONRef.current;
    }

    if (housingRequestRef.current) {
      const geojson = await housingRequestRef.current;
      if (housingVisibleRef.current) showHousingLayer();
      return geojson;
    }

    setHousingLoading(true);
    setHousingStatus(null);

    const request = (async () => {
      try {
        const rawGeojson = normalizeGeoJSON(await getHousingSchemesGeoJSON());
        const geojson = {
          ...rawGeojson,
          features: (rawGeojson.features || []).map((feature) => ({
            ...feature,
            properties: {
              ...(feature?.properties || {}),
              _ruda_status_key: normalizeHousingSchemeStatus(
                feature?.properties?.ruda_st ??
                  feature?.properties?.ruda_scheme,
              ),
            },
          })),
        };

        housingGeoJSONRef.current = geojson;

        const categoryConfig = createHousingSchemeCategoryConfig(geojson);
        housingLegendItemsRef.current = categoryConfig;
        setHousingLegendItems(categoryConfig);

        setHousingStatus(
          geojson.features.length
            ? categoryConfig.length
              ? null
              : "No RUDA status categories found"
            : "No features",
        );

        return geojson;
      } catch (error) {
        console.error("Failed to load Housing Schemes", error);
        setHousingStatus("Backend error");
        return null;
      } finally {
        housingRequestRef.current = null;
        setHousingLoading(false);
      }
    })();

    housingRequestRef.current = request;
    const geojson = await request;

    if (geojson && housingVisibleRef.current) {
      showHousingLayer();
    }

    return geojson;
  };

  const loadIllegalLayer = async () => {
    if (!map) return null;

    if (illegalGeoJSONRef.current) {
      showIllegalLayer();
      return illegalGeoJSONRef.current;
    }

    if (illegalRequestRef.current) {
      const geojson = await illegalRequestRef.current;
      if (illegalVisibleRef.current) showIllegalLayer();
      return geojson;
    }

    setIllegalLoading(true);
    setIllegalStatus(null);

    const request = (async () => {
      try {
        const geojson = normalizeGeoJSON(
          await getIllegalHousingSchemesGeoJSON(),
        );
        illegalGeoJSONRef.current = geojson;
        setIllegalStatus(geojson.features.length ? null : "No features");
        return geojson;
      } catch (error) {
        console.error("Failed to load Illegal Housing Schemes", error);
        setIllegalStatus("Backend error");
        return null;
      } finally {
        illegalRequestRef.current = null;
        setIllegalLoading(false);
      }
    })();

    illegalRequestRef.current = request;
    const geojson = await request;

    if (geojson && illegalVisibleRef.current) {
      showIllegalLayer();
    }

    return geojson;
  };

  useEffect(() => {
    if (!map) return;

    if (!housingVisible) {
      setMapLayerVisibility(map, HOUSING_SOURCE_PREFIX, false);
      return;
    }

    loadHousingLayer();
  }, [map, housingVisible]);

  useEffect(() => {
    if (!map) return;

    if (!illegalVisible) {
      setMapLayerVisibility(map, ILLEGAL_SOURCE_PREFIX, false);
      return;
    }

    loadIllegalLayer();
  }, [map, illegalVisible]);

  useEffect(() => {
    if (!map) return undefined;

    const restoreVisibleLayers = () => {
      if (housingVisibleRef.current && housingGeoJSONRef.current) {
        showHousingLayer();
      }

      if (illegalVisibleRef.current && illegalGeoJSONRef.current) {
        showIllegalLayer();
      }
    };

    map.on("style.load", restoreVisibleLayers);
    return () => map.off("style.load", restoreVisibleLayers);
  }, [map]);

  useEffect(() => {
    return () => {
      if (!map || !map.style) return;
      removeMapLayer(map, HOUSING_SOURCE_PREFIX);
      removeMapLayer(map, ILLEGAL_SOURCE_PREFIX);
    };
  }, [map]);

  const handleHousingOpacityChange = (value) => {
    setHousingOpacity(value);
    applyLayerStyle(map, HOUSING_SOURCE_PREFIX, value, HousingSchemesStyle);
  };

  const handleIllegalOpacityChange = (value) => {
    setIllegalOpacity(value);
    applyLayerStyle(
      map,
      ILLEGAL_SOURCE_PREFIX,
      value,
      getIllegalStyle(),
    );
  };

  const handleIllegalFillToggle = (checked) => {
    setIllegalFillEnabled(checked);
    illegalFillEnabledRef.current = checked;
    applyLayerStyle(map, ILLEGAL_SOURCE_PREFIX, illegalOpacityRef.current, {
      ...getIllegalStyle(),
      fillEnabled: checked,
    });
  };

  const handleIllegalFillColorChange = (color) => {
    setIllegalFillColor(color);
    illegalFillColorRef.current = color;
    applyLayerStyle(map, ILLEGAL_SOURCE_PREFIX, illegalOpacityRef.current, {
      ...getIllegalStyle(),
      fillColor: color,
    });
  };

  const handleIllegalOutlineToggle = (checked) => {
    setIllegalOutlineEnabled(checked);
    illegalOutlineEnabledRef.current = checked;
    applyLayerStyle(map, ILLEGAL_SOURCE_PREFIX, illegalOpacityRef.current, {
      ...getIllegalStyle(),
      outlineEnabled: checked,
    });
  };

  const handleIllegalOutlineColorChange = (color) => {
    setIllegalOutlineColor(color);
    illegalOutlineColorRef.current = color;
    applyLayerStyle(map, ILLEGAL_SOURCE_PREFIX, illegalOpacityRef.current, {
      ...getIllegalStyle(),
      outlineColor: color,
    });
  };

  const handleGroupToggle = () => {
    const nextVisible = !anyVisible;
    setHousingVisible(nextVisible);
    setIllegalVisible(nextVisible);
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
          title={anyVisible ? "Hide layer group" : "Show layer group"}
          onClick={(event) => {
            event.stopPropagation();
            handleGroupToggle();
          }}
          className={`relative ml-2 h-5 w-9 shrink-0 overflow-hidden rounded-full transition-colors duration-200 focus:outline-none ${
            anyVisible ? "bg-[#65c96b]" : "bg-white/20"
          }`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
              anyVisible ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {open && (
        <div className="mx-3 mb-3 rounded-sm border border-[#13593f]/40 bg-[#093024] p-2">
          <div className="mt-1 text-white">
            <div className="flex items-center justify-between">
              <label className="flex min-w-0 cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={housingVisible}
                  onChange={(event) => setHousingVisible(event.target.checked)}
                  className="accent-[#65c96b]"
                />

                <span className="truncate text-[11px]">
                  {housingLoading ? (
                    <span className="flex items-center gap-1">
                      Housing Schemes
                      <span className="animate-pulse text-[9px] text-white/40">
                        loading…
                      </span>
                    </span>
                  ) : (
                    "Housing Schemes"
                  )}
                </span>
              </label>

              <button
                type="button"
                className="shrink-0 rounded px-1 py-0.5 text-white/60 hover:bg-white/10 hover:text-white"
                onClick={(event) => {
                  event.stopPropagation();
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
                value={housingOpacity}
                onChange={(event) =>
                  handleHousingOpacityChange(Number(event.target.value))
                }
                className="h-[3px] flex-1 cursor-pointer rounded-full bg-[#8fd36f] accent-[#65c96b]"
              />
              <span className="w-7 text-right text-[11px] text-white/90">
                {housingOpacity}%
              </span>
            </div>

            {housingVisible && (
              <div className="mt-2 pl-6">
                {housingLegendItems.map((item) => (
                  <div
                    key={item.label}
                    className="mt-1 flex items-center gap-2 text-[10px] text-white/80"
                  >
                    <span
                      className="inline-block h-3 w-3 shrink-0"
                      style={{
                        backgroundColor: item.color,
                        opacity: housingOpacity / 100,
                      }}
                    />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            )}

            {housingStatus && housingVisible && (
              <div className="pl-6 pt-1 text-[10px] text-amber-300">
                {housingStatus}
              </div>
            )}
          </div>

          <div className="mt-4 border-t border-white/10 pt-3 text-white">
            <div className="flex items-center justify-between">
              <label className="flex min-w-0 cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={illegalVisible}
                  onChange={(event) => setIllegalVisible(event.target.checked)}
                  className="accent-[#ef4444]"
                />

                <span className="truncate text-[11px]">
                  {illegalLoading ? (
                    <span className="flex items-center gap-1">
                      Illegal Housing Schemes
                      <span className="animate-pulse text-[9px] text-white/40">
                        loading…
                      </span>
                    </span>
                  ) : (
                    "Illegal Housing Schemes"
                  )}
                </span>
              </label>
            </div>

            <div className="mt-2 flex items-center gap-2 pl-6">
              <input
                type="range"
                min="0"
                max="100"
                value={illegalOpacity}
                onChange={(event) =>
                  handleIllegalOpacityChange(Number(event.target.value))
                }
                className="h-[3px] flex-1 cursor-pointer rounded-full bg-[#ef4444]/40 accent-[#ef4444]"
              />
              <span className="w-7 text-right text-[11px] text-white/90">
                {illegalOpacity}%
              </span>
            </div>

            {illegalVisible && (
              <div className="mt-3 space-y-3 pl-6">
                <div className="rounded border border-white/10 bg-black/10 p-2">
                  <label className="flex cursor-pointer items-center gap-2 text-[10px] text-white/90">
                    <input
                      type="checkbox"
                      checked={illegalFillEnabled}
                      onChange={(event) =>
                        handleIllegalFillToggle(event.target.checked)
                      }
                      className="accent-[#65c96b]"
                    />
                    <span>Fill</span>
                    <span
                      className="ml-auto inline-block h-3 w-5 rounded-sm border border-white/30"
                      style={{
                        backgroundColor: illegalFillEnabled
                          ? illegalFillColor
                          : "transparent",
                        opacity: illegalFillEnabled ? illegalOpacity / 100 : 0.35,
                      }}
                    />
                  </label>

                  <div
                    className={`mt-2 flex items-center justify-between ${
                      illegalFillEnabled ? "opacity-100" : "pointer-events-none opacity-35"
                    }`}
                  >
                    <span className="text-[9px] text-white/55">Fill color</span>
                    <span
                      className="relative h-4 w-6 shrink-0 overflow-hidden rounded-sm border border-white/35"
                      style={{ backgroundColor: illegalFillColor }}
                      title="Change Illegal Housing Schemes fill color"
                      onClick={(event) => event.stopPropagation()}
                      onMouseDown={(event) => event.stopPropagation()}
                    >
                      <input
                        type="color"
                        value={illegalFillColor}
                        disabled={!illegalFillEnabled}
                        aria-label="Change Illegal Housing Schemes fill color"
                        onClick={(event) => event.stopPropagation()}
                        onMouseDown={(event) => event.stopPropagation()}
                        onChange={(event) =>
                          handleIllegalFillColorChange(event.target.value)
                        }
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                      />
                    </span>
                  </div>
                </div>

                <div className="rounded border border-white/10 bg-black/10 p-2">
                  <label className="flex cursor-pointer items-center gap-2 text-[10px] text-white/90">
                    <input
                      type="checkbox"
                      checked={illegalOutlineEnabled}
                      onChange={(event) =>
                        handleIllegalOutlineToggle(event.target.checked)
                      }
                      className="accent-[#65c96b]"
                    />
                    <span>Outline</span>
                    <span
                      className="ml-auto inline-block h-3 w-5 rounded-sm border"
                      style={{
                        borderColor: illegalOutlineEnabled
                          ? illegalOutlineColor
                          : "rgba(255,255,255,0.3)",
                        opacity: illegalOutlineEnabled
                          ? illegalOpacity / 100
                          : 0.35,
                      }}
                    />
                  </label>

                  <div
                    className={`mt-2 flex items-center justify-between ${
                      illegalOutlineEnabled
                        ? "opacity-100"
                        : "pointer-events-none opacity-35"
                    }`}
                  >
                    <span className="text-[9px] text-white/55">Outline color</span>
                    <span
                      className="relative h-4 w-6 shrink-0 overflow-hidden rounded-sm border border-white/35"
                      style={{ backgroundColor: illegalOutlineColor }}
                      title="Change Illegal Housing Schemes outline color"
                      onClick={(event) => event.stopPropagation()}
                      onMouseDown={(event) => event.stopPropagation()}
                    >
                      <input
                        type="color"
                        value={illegalOutlineColor}
                        disabled={!illegalOutlineEnabled}
                        aria-label="Change Illegal Housing Schemes outline color"
                        onClick={(event) => event.stopPropagation()}
                        onMouseDown={(event) => event.stopPropagation()}
                        onChange={(event) =>
                          handleIllegalOutlineColorChange(event.target.value)
                        }
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                      />
                    </span>
                  </div>
                </div>
              </div>
            )}

            {illegalStatus && illegalVisible && (
              <div className="pl-6 pt-1 text-[10px] text-amber-300">
                {illegalStatus}
              </div>
            )}
          </div>
        </div>
      )}

      {tableOpen && (
        <HousingSchemesAttribute
          map={map}
          geojson={housingGeoJSONRef.current || null}
          onClose={() => setTableOpen(false)}
        />
      )}
    </div>
  );
}

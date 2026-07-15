import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { ChevronDown, ChevronRight, Grid3X3 } from "lucide-react";
import mapboxgl from "mapbox-gl";
import { API_BASE, unwrapGeoJSON } from "./AttributeTable/AdminAttributeTableShell";

const EMPTY_FC = { type: "FeatureCollection", features: [] };

const LAYERS = {
  rudaNotifiedBoundary: {
    label: "RUDA Notified Boundary",
    endpoint: "/ruda-jurisdiction/",
    color: "#ff00b8",
    source: "metaverse-admin-ruda-notified-source",
    fill: "metaverse-admin-ruda-notified-fill",
    line: "metaverse-admin-ruda-notified-line",
    labelLayer: "metaverse-admin-ruda-notified-label",
  },
  rudaPhasesBoundary: {
    label: "RUDA Phases Boundary",
    endpoint: "/ruda/",
    color: "#6bb7e8",
    source: "metaverse-admin-ruda-phases-source",
    fill: "metaverse-admin-ruda-phases-fill",
    line: "metaverse-admin-ruda-phases-line",
    labelLayer: "metaverse-admin-ruda-phases-label",
  },
  districtBoundary: {
    label: "District Boundary",
    endpoint: "/district/",
    color: "#f59e0b",
    source: "metaverse-admin-district-source",
    fill: "metaverse-admin-district-fill",
    line: "metaverse-admin-district-line",
    labelLayer: "metaverse-admin-district-label",
  },
  tehsilBoundary: {
    label: "Tehsil Boundary",
    endpoint: "/tehsil/",
    color: "#22c55e",
    source: "metaverse-admin-tehsil-source",
    fill: "metaverse-admin-tehsil-fill",
    line: "metaverse-admin-tehsil-line",
    labelLayer: "metaverse-admin-tehsil-label",
  },
};

const PHASE_UI = [
  { key: "notifiedPhases", label: "Notified Phases", color: "#f97316" },
  { key: "masterPlanPhases", label: "Master Plan Phases", color: "#8b5cf6" },
  { key: "executionPhases", label: "Execution Phases", color: "#14b8a6" },
];

const clamp = (value) => Math.min(100, Math.max(0, Number(value) || 0));

function setVisibility(map, def, visible) {
  [def.fill, def.line, def.labelLayer].forEach((id) => {
    if (map?.getLayer?.(id)) {
      map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
    }
  });
}

function addOrUpdateBoundary(map, def, geojson, style) {
  if (!map || !def) return;
  const data = geojson?.type === "FeatureCollection" ? geojson : EMPTY_FC;
  const opacity = clamp(style.opacity) / 100;

  if (!map.getSource(def.source)) {
    map.addSource(def.source, { type: "geojson", data });
  } else {
    map.getSource(def.source).setData(data);
  }

  if (!map.getLayer(def.fill)) {
    map.addLayer({
      id: def.fill,
      type: "fill",
      source: def.source,
      filter: ["match", ["geometry-type"], ["Polygon", "MultiPolygon"], true, false],
      paint: {
        "fill-color": style.color,
        "fill-opacity": 0.12 * opacity,
      },
      layout: { visibility: "visible" },
    });
  } else {
    map.setPaintProperty(def.fill, "fill-color", style.color);
    map.setPaintProperty(def.fill, "fill-opacity", 0.12 * opacity);
    map.setLayoutProperty(def.fill, "visibility", "visible");
  }

  if (!map.getLayer(def.line)) {
    map.addLayer({
      id: def.line,
      type: "line",
      source: def.source,
      paint: {
        "line-color": style.color,
        "line-width": 2.2,
        "line-opacity": opacity,
        "line-dasharray": def === LAYERS.rudaNotifiedBoundary ? [2, 2] : [1],
      },
      layout: { visibility: "visible", "line-cap": "round", "line-join": "round" },
    });
  } else {
    map.setPaintProperty(def.line, "line-color", style.color);
    map.setPaintProperty(def.line, "line-opacity", opacity);
    map.setLayoutProperty(def.line, "visibility", "visible");
  }

  if (!map.getLayer(def.labelLayer)) {
    map.addLayer({
      id: def.labelLayer,
      type: "symbol",
      source: def.source,
      minzoom: 8,
      layout: {
        visibility: "visible",
        "text-field": [
          "coalesce",
          ["to-string", ["get", "name"]],
          ["to-string", ["get", "Name"]],
          ["to-string", ["get", "district_name"]],
          ["to-string", ["get", "tehsil_name"]],
          "",
        ],
        "text-size": 11,
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": style.color,
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.2,
        "text-opacity": opacity,
      },
    });
  } else {
    map.setPaintProperty(def.labelLayer, "text-color", style.color);
    map.setPaintProperty(def.labelLayer, "text-opacity", opacity);
    map.setLayoutProperty(def.labelLayer, "visibility", "visible");
  }
}

function fitToData(map, geojson) {
  if (!map || !geojson?.features?.length) return;
  const bounds = new mapboxgl.LngLatBounds();
  const walk = (coords) => {
    if (!Array.isArray(coords)) return;
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      bounds.extend(coords);
      return;
    }
    coords.forEach(walk);
  };
  geojson.features.forEach((feature) => walk(feature?.geometry?.coordinates));
  if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 60, duration: 900, maxZoom: 13 });
}

export default function AdministrativeBoundaries({
  map,
  adminBoundaryVisibility = {},
  setAdminBoundaryVisibility,
}) {
  const [open, setOpen] = useState(false);
  const [phaseOpen, setPhaseOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState({});
  const [loading, setLoading] = useState({});
  const [featureCounts, setFeatureCounts] = useState({});
  const cache = useRef({});

  const [localVisibility, setLocalVisibility] = useState({
    rudaNotifiedBoundary: false,
    rudaPhasesBoundary: false,
    districtBoundary: false,
    tehsilBoundary: false,
  });

  const [phaseUi, setPhaseUi] = useState({
    notifiedPhases: false,
    masterPlanPhases: false,
    executionPhases: false,
  });

  const [styles, setStyles] = useState(() =>
    Object.fromEntries(
      Object.entries(LAYERS).map(([key, def]) => [
        key,
        { color: def.color, opacity: 100 },
      ]),
    ),
  );

  const isVisible = (key) =>
    adminBoundaryVisibility?.[key] ?? localVisibility[key] ?? false;

  const setVisibleState = (key, visible) => {
    setLocalVisibility((prev) => ({ ...prev, [key]: visible }));
    setAdminBoundaryVisibility?.((prev) => ({ ...prev, [key]: visible }));
  };

  const fetchLayer = async (key) => {
    if (cache.current[key]) return cache.current[key];
    const def = LAYERS[key];
    const response = await axios.get(`${API_BASE}${def.endpoint}`);
    const geojson = unwrapGeoJSON(response.data);
    cache.current[key] = geojson;
    setFeatureCounts((prev) => ({ ...prev, [key]: geojson.features?.length || 0 }));
    return geojson;
  };

  const toggleLayer = async (key) => {
    const def = LAYERS[key];
    const next = !isVisible(key);
    setVisibleState(key, next);

    if (!next) {
      setVisibility(map, def, false);
      return;
    }

    setLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const geojson = await fetchLayer(key);
      addOrUpdateBoundary(map, def, geojson, styles[key]);
      fitToData(map, geojson);
      if (key === "rudaPhasesBoundary") setPhaseOpen(true);
    } catch (error) {
      console.error(`${def.label} load error:`, error);
      setVisibleState(key, false);
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const updateStyle = (key, patch) => {
    setStyles((prev) => {
      const nextStyle = { ...prev[key], ...patch };
      if (map && isVisible(key)) {
        const data = cache.current[key] || EMPTY_FC;
        addOrUpdateBoundary(map, LAYERS[key], data, nextStyle);
      }
      return { ...prev, [key]: nextStyle };
    });
  };

  useEffect(() => {
    if (!map) return;
    Object.keys(LAYERS).forEach((key) => {
      setVisibility(map, LAYERS[key], isVisible(key));
    });
  }, [map]);

  return (
    <div className="border-b border-[#343c4c]">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-white hover:bg-[#0f3d2e]"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>ADMINISTRATIVE</span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>

      {open && (
        <div className="mx-3 mb-3 rounded-sm border border-[#13593f]/40 bg-[#093024] p-2">
          <LayerItem
            checked={isVisible("rudaNotifiedBoundary")}
            loading={loading.rudaNotifiedBoundary}
            label={LAYERS.rudaNotifiedBoundary.label}
            style={styles.rudaNotifiedBoundary}
            onChange={() => toggleLayer("rudaNotifiedBoundary")}
            onStyleChange={(patch) => updateStyle("rudaNotifiedBoundary", patch)}
            detailsOpen={!!detailsOpen.rudaNotifiedBoundary}
            onDetails={() => setDetailsOpen((prev) => ({ ...prev, rudaNotifiedBoundary: !prev.rudaNotifiedBoundary }))}
            count={featureCounts.rudaNotifiedBoundary}
          />

          <LayerItem
            checked={isVisible("rudaPhasesBoundary")}
            loading={loading.rudaPhasesBoundary}
            label={LAYERS.rudaPhasesBoundary.label}
            style={styles.rudaPhasesBoundary}
            onChange={() => toggleLayer("rudaPhasesBoundary")}
            onStyleChange={(patch) => updateStyle("rudaPhasesBoundary", patch)}
            detailsOpen={phaseOpen}
            onDetails={() => setPhaseOpen((prev) => !prev)}
            count={featureCounts.rudaPhasesBoundary}
          >
            {phaseOpen && (
              <div className="ml-6 mt-2 rounded-sm border border-[#13593f]/30 bg-[#051f17] p-2">
                {PHASE_UI.map((phase) => (
                  <label key={phase.key} className="flex cursor-pointer items-center gap-2 border-b border-[#343c4c]/60 py-2 last:border-0">
                    <input
                      type="checkbox"
                      checked={phaseUi[phase.key]}
                      onChange={() => setPhaseUi((prev) => ({ ...prev, [phase.key]: !prev[phase.key] }))}
                      className="accent-[#65c96b]"
                    />
                    <span className="h-4 w-4 rounded-sm border border-white/40" style={{ backgroundColor: phase.color }} />
                    <span className="text-[11px] text-white/85">{phase.label}</span>
                    <span className="ml-auto text-[9px] text-white/40">UI only</span>
                  </label>
                ))}
              </div>
            )}
          </LayerItem>

          <LayerItem
            checked={isVisible("districtBoundary")}
            loading={loading.districtBoundary}
            label={LAYERS.districtBoundary.label}
            style={styles.districtBoundary}
            onChange={() => toggleLayer("districtBoundary")}
            onStyleChange={(patch) => updateStyle("districtBoundary", patch)}
            detailsOpen={!!detailsOpen.districtBoundary}
            onDetails={() => setDetailsOpen((prev) => ({ ...prev, districtBoundary: !prev.districtBoundary }))}
            count={featureCounts.districtBoundary}
          />

          <LayerItem
            checked={isVisible("tehsilBoundary")}
            loading={loading.tehsilBoundary}
            label={LAYERS.tehsilBoundary.label}
            style={styles.tehsilBoundary}
            onChange={() => toggleLayer("tehsilBoundary")}
            onStyleChange={(patch) => updateStyle("tehsilBoundary", patch)}
            detailsOpen={!!detailsOpen.tehsilBoundary}
            onDetails={() => setDetailsOpen((prev) => ({ ...prev, tehsilBoundary: !prev.tehsilBoundary }))}
            count={featureCounts.tehsilBoundary}
          />
        </div>
      )}
    </div>
  );
}

function LayerItem({
  checked,
  loading,
  label,
  style,
  onChange,
  onStyleChange,
  detailsOpen,
  onDetails,
  count,
  children,
}) {
  return (
    <div className="mt-3 first:mt-1">
      <div className="flex items-center justify-between">
        <label className="flex min-w-0 cursor-pointer items-center gap-2">
          <input type="checkbox" checked={checked} onChange={onChange} className="accent-[#65c96b]" />
          <span className="relative h-4 w-4 shrink-0 overflow-hidden rounded-sm border border-white/50" style={{ backgroundColor: style.color }}>
            <input
              type="color"
              value={style.color}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => onStyleChange({ color: event.target.value })}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </span>
          <span className="truncate text-[11px]">{loading ? `${label} (Loading...)` : label}</span>
        </label>

        <div className="flex items-center gap-1">
          <button type="button" className="rounded p-0.5 text-white/60 hover:bg-[#0f3d2e]" title={`${label} attribute table`}>
            <Grid3X3 size={14} />
          </button>
          <button type="button" onClick={onDetails} className="rounded p-0.5 text-white/70 hover:bg-[#0f3d2e]">
            {detailsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 pl-6">
        <input
          type="range"
          min="0"
          max="100"
          value={style.opacity}
          onChange={(event) => onStyleChange({ opacity: Number(event.target.value) })}
          className="h-[3px] flex-1 cursor-pointer rounded-full bg-[#8fd36f] accent-[#65c96b]"
        />
        <span className="w-7 text-right text-[11px] text-white/90">{style.opacity}%</span>
      </div>

      {detailsOpen && !children && (
        <div className="ml-6 mt-2 rounded-sm border border-[#13593f]/30 bg-[#051f17] px-3 py-2 text-[11px] text-white/80">
          <div className="flex justify-between"><span>Total Features</span><span>{count ?? 0}</span></div>
        </div>
      )}
      {children}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { ChevronDown, ChevronRight, Grid3X3 } from "lucide-react";
import mapboxgl from "mapbox-gl";
import {
  API_BASE,
  unwrapGeoJSON,
} from "./AttributeTable/AdminAttributeTableShell";
import {
  RUDA_PLANNING_BOUNDARY,
  DEFAULT_RUDA_PLANNING_STYLE,
  addOrUpdateRudaPlanningBoundary,
  setRudaPlanningBoundaryVisibility,
} from "./LayerManager/AdministrativeLayers/RudaPlanningBoundaryLayer";
import {
  RUDA_NOTIFIED_BOUNDARY,
  DEFAULT_RUDA_NOTIFIED_STYLE,
  addOrUpdateRudaNotifiedBoundary,
  setRudaNotifiedBoundaryVisibility,
} from "./LayerManager/AdministrativeLayers/RudaNotifiedBoundaryLayer";
import {
  DISTRICT_BOUNDARY,
  DEFAULT_DISTRICT_STYLE,
  addOrUpdateDistrictBoundary,
  setDistrictBoundaryVisibility,
} from "./LayerManager/AdministrativeLayers/DistrictboundaryLayer";
import {
  TEHSIL_BOUNDARY,
  DEFAULT_TEHSIL_STYLE,
  addOrUpdateTehsilBoundary,
  setTehsilBoundaryVisibility,
} from "./LayerManager/AdministrativeLayers/TehsilBoundaryLayer";

const EMPTY_FC = { type: "FeatureCollection", features: [] };

const LAYERS = {
  rudaNotifiedBoundary: {
    ...RUDA_NOTIFIED_BOUNDARY,
    defaultStyle: DEFAULT_RUDA_NOTIFIED_STYLE,
    addOrUpdate: addOrUpdateRudaNotifiedBoundary,
    setVisibility: setRudaNotifiedBoundaryVisibility,
  },
  rudaPhasesBoundary: {
    ...RUDA_PLANNING_BOUNDARY,
    defaultStyle: DEFAULT_RUDA_PLANNING_STYLE,
    addOrUpdate: addOrUpdateRudaPlanningBoundary,
    setVisibility: setRudaPlanningBoundaryVisibility,
  },
  districtBoundary: {
    ...DISTRICT_BOUNDARY,
    defaultStyle: DEFAULT_DISTRICT_STYLE,
    addOrUpdate: addOrUpdateDistrictBoundary,
    setVisibility: setDistrictBoundaryVisibility,
  },
  tehsilBoundary: {
    ...TEHSIL_BOUNDARY,
    defaultStyle: DEFAULT_TEHSIL_STYLE,
    addOrUpdate: addOrUpdateTehsilBoundary,
    setVisibility: setTehsilBoundaryVisibility,
  },
};

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

  if (!bounds.isEmpty()) {
    map.fitBounds(bounds, {
      padding: 60,
      duration: 900,
      maxZoom: 13,
    });
  }
}

export default function AdministrativeBoundaries({
  map,
  adminBoundaryVisibility = {},
  setAdminBoundaryVisibility,
}) {
  const [open, setOpen] = useState(false);
  const [phaseOpen, setPhaseOpen] = useState(false);
  const [phaseOptions, setPhaseOptions] = useState({
    notifiedPhases: false,
    masterplanPhases: false,
    executionPhases: false,
  });
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

  const [styles, setStyles] = useState(() =>
    Object.fromEntries(
      Object.entries(LAYERS).map(([key, def]) => [
        key,
        { ...def.defaultStyle },
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
    setFeatureCounts((prev) => ({
      ...prev,
      [key]: geojson.features?.length || 0,
    }));

    return geojson;
  };

  const toggleLayer = async (key) => {
    const def = LAYERS[key];
    const next = !isVisible(key);

    setVisibleState(key, next);

    if (!next) {
      def.setVisibility(map, false);
      return;
    }

    setLoading((prev) => ({ ...prev, [key]: true }));

    try {
      const geojson = await fetchLayer(key);
      def.addOrUpdate(map, geojson, styles[key]);
      fitToData(map, geojson);
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
        const data = cache.current[key] || null;
        LAYERS[key].addOrUpdate(map, data, nextStyle);
      }

      return { ...prev, [key]: nextStyle };
    });
  };

  useEffect(() => {
    if (!map) return;

    let cancelled = false;

    const syncExternalVisibility = async () => {
      for (const key of Object.keys(LAYERS)) {
        const def = LAYERS[key];
        const visible = isVisible(key);

        if (!visible) {
          def.setVisibility(map, false);
          continue;
        }

        try {
          const geojson = cache.current[key] || (await fetchLayer(key));
          if (cancelled) return;
          def.addOrUpdate(map, geojson, styles[key]);
        } catch (error) {
          console.error(`${def.label} synchronization error:`, error);
        }
      }
    };

    syncExternalVisibility();

    return () => {
      cancelled = true;
    };
  }, [
    map,
    adminBoundaryVisibility?.rudaNotifiedBoundary,
    adminBoundaryVisibility?.rudaPhasesBoundary,
    adminBoundaryVisibility?.districtBoundary,
    adminBoundaryVisibility?.tehsilBoundary,
  ]);

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
            symbolType="notified"
            onChange={() => toggleLayer("rudaNotifiedBoundary")}
            onStyleChange={(patch) =>
              updateStyle("rudaNotifiedBoundary", patch)
            }
            detailsOpen={!!detailsOpen.rudaNotifiedBoundary}
            onDetails={() =>
              setDetailsOpen((prev) => ({
                ...prev,
                rudaNotifiedBoundary: !prev.rudaNotifiedBoundary,
              }))
            }
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
              <PhaseOptions
                values={phaseOptions}
                onChange={(key) =>
                  setPhaseOptions((prev) => ({
                    ...prev,
                    [key]: !prev[key],
                  }))
                }
              />
            )}
          </LayerItem>

          <LayerItem
            checked={isVisible("districtBoundary")}
            loading={loading.districtBoundary}
            label={LAYERS.districtBoundary.label}
            style={styles.districtBoundary}
            symbolType="district"
            onChange={() => toggleLayer("districtBoundary")}
            onStyleChange={(patch) => updateStyle("districtBoundary", patch)}
            detailsOpen={!!detailsOpen.districtBoundary}
            onDetails={() =>
              setDetailsOpen((prev) => ({
                ...prev,
                districtBoundary: !prev.districtBoundary,
              }))
            }
            count={featureCounts.districtBoundary}
          />

          <LayerItem
            checked={isVisible("tehsilBoundary")}
            loading={loading.tehsilBoundary}
            label={LAYERS.tehsilBoundary.label}
            style={styles.tehsilBoundary}
            symbolType="tehsil"
            onChange={() => toggleLayer("tehsilBoundary")}
            onStyleChange={(patch) => updateStyle("tehsilBoundary", patch)}
            detailsOpen={!!detailsOpen.tehsilBoundary}
            onDetails={() =>
              setDetailsOpen((prev) => ({
                ...prev,
                tehsilBoundary: !prev.tehsilBoundary,
              }))
            }
            count={featureCounts.tehsilBoundary}
          />
        </div>
      )}
    </div>
  );
}

function PhaseOptions({ values, onChange }) {
  const options = [
    { key: "notifiedPhases", label: "Notified Phases" },
    { key: "masterplanPhases", label: "Masterplan Phases" },
    { key: "executionPhases", label: "Execution Phases" },
  ];

  return (
    <div className="ml-6 mt-2 rounded-md border border-[#13593f]/30 bg-[#051f17] p-3 text-white/90 shadow-sm">
      <div className="mb-2 text-[11px] font-bold text-white">
        RUDA Phase Categories
      </div>

      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.key}
            className="flex cursor-pointer items-center gap-2 text-[10px] font-medium"
          >
            <input
              type="checkbox"
              checked={values[option.key]}
              onChange={() => onChange(option.key)}
              className="accent-[#65c96b]"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
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
  previewColors,
  symbolType,
}) {
  const previewBackground = previewColors?.length
    ? `linear-gradient(90deg, ${previewColors.join(", ")})`
    : style.fillColor || style.color;

  return (
    <div className="mt-3 first:mt-1">
      <div className="flex items-center justify-between">
        <label className="flex min-w-0 cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="accent-[#65c96b]"
          />

          <span
            className={`relative h-4 w-4 shrink-0 overflow-hidden rounded-sm ${
              symbolType === "tehsil" ? "border border-dashed" : "border"
            }`}
            style={{
              background:
                symbolType === "tehsil" ? "transparent" : previewBackground,
              borderColor: style.color,
              boxShadow:
                symbolType === "notified" ? `inset 0 0 0 1px #1A1A1A` : "none",
            }}
          >
            {symbolType === "notified" && (
              <span
                className="absolute left-0 right-0 top-1/2 border-t-2 border-dashed"
                style={{ borderColor: style.color }}
              />
            )}

            {symbolType === "district" && (
              <span
                className="absolute inset-x-0 top-1/2 border-t-2"
                style={{ borderColor: style.color }}
              />
            )}

            {symbolType === "tehsil" && (
              <span
                className="absolute inset-x-0 top-1/2 border-t border-dashed"
                style={{ borderColor: style.color }}
              />
            )}

            <input
              type="color"
              value={style.color}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => onStyleChange({ color: event.target.value })}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </span>

          <span className="truncate text-[11px]">
            {loading ? `${label} (Loading...)` : label}
          </span>
        </label>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded p-0.5 text-white/60 hover:bg-[#0f3d2e]"
            title={`${label} attribute table`}
          >
            <Grid3X3 size={14} />
          </button>

          <button
            type="button"
            onClick={onDetails}
            className="rounded p-0.5 text-white/70 hover:bg-[#0f3d2e]"
          >
            {detailsOpen ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 pl-6">
        <input
          type="range"
          min="0"
          max="100"
          value={style.opacity}
          onChange={(event) =>
            onStyleChange({ opacity: Number(event.target.value) })
          }
          className="h-[3px] flex-1 cursor-pointer rounded-full bg-[#8fd36f] accent-[#65c96b]"
        />
        <span className="w-7 text-right text-[11px] text-white/90">
          {style.opacity}%
        </span>
      </div>

      {detailsOpen && !children && (
        <div className="ml-6 mt-2 rounded-sm border border-[#13593f]/30 bg-[#051f17] px-3 py-2 text-[11px] text-white/80">
          <div className="flex justify-between">
            <span>Total Features</span>
            <span>{count ?? 0}</span>
          </div>
        </div>
      )}

      {children}
    </div>
  );
}

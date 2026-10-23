import { useRef, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { getFloodExtentScenariosGeoJSON } from "../../../../services/metaverseApi";
import {
  FLOOD_SCENARIO_LAYERS,
  addOrUpdateFloodScenarioLayer,
  setFloodScenarioLayerVisibility,
  updateFloodScenarioLayerColor,
} from "./LayerManager/Hydrology/FloodExtentScenariosLayer";

const SCENARIOS = [50000, 250000, 326000, 450000, 500000];

const formatCusic = (value) => Number(value).toLocaleString("en-US");

const buildVisibilityState = (value = false) =>
  Object.fromEntries(SCENARIOS.map((cusic) => [cusic, value]));

const buildColorState = () =>
  Object.fromEntries(
    SCENARIOS.map((cusic) => [cusic, FLOOD_SCENARIO_LAYERS[cusic].color]),
  );

/**
 * Flood Extent Scenarios layer group.
 *
 * The backend returns all flood scenario polygons from floodextentscenarios.
 * Each checkbox filters the same GeoJSON response by the `cusic` field so
 * individual scenarios can be shown, hidden, and styled independently.
 */
export default function FloodExtentScenarios({ map }) {
  const [open, setOpen] = useState(false);
  const [visibility, setVisibility] = useState(() => buildVisibilityState());
  const [colors, setColors] = useState(() => buildColorState());

  const visibilityRef = useRef(buildVisibilityState());
  const colorsRef = useRef(buildColorState());
  const floodScenarioCache = useRef(null);
  const floodScenarioRequest = useRef(null);

  const fetchFloodExtentScenarios = async () => {
    if (floodScenarioCache.current) return floodScenarioCache.current;
    if (floodScenarioRequest.current) return floodScenarioRequest.current;

    const request = getFloodExtentScenariosGeoJSON()
      .then((geojson) => {
        floodScenarioCache.current = geojson;
        return geojson;
      })
      .finally(() => {
        floodScenarioRequest.current = null;
      });

    floodScenarioRequest.current = request;
    return request;
  };

  const filterScenario = (geojson, cusic) => ({
    type: "FeatureCollection",
    features: (geojson?.features || []).filter(
      (feature) => Number(feature?.properties?.cusic) === Number(cusic),
    ),
  });

  const setScenarioVisibility = async (cusic, visible) => {
    const nextVisibility = {
      ...visibilityRef.current,
      [cusic]: visible,
    };

    visibilityRef.current = nextVisibility;
    setVisibility(nextVisibility);

    if (!map) return;

    if (!visible) {
      setFloodScenarioLayerVisibility(map, cusic, false);
      return;
    }

    try {
      const geojson = await fetchFloodExtentScenarios();

      // The checkbox may have been switched off while the request was loading.
      if (!visibilityRef.current[cusic]) return;

      addOrUpdateFloodScenarioLayer(
        map,
        filterScenario(geojson, cusic),
        cusic,
        colorsRef.current[cusic],
      );
    } catch (error) {
      console.error(`Flood Inundation ${formatCusic(cusic)} cusic load error:`, error);

      const failedVisibility = {
        ...visibilityRef.current,
        [cusic]: false,
      };

      visibilityRef.current = failedVisibility;
      setVisibility(failedVisibility);
      setFloodScenarioLayerVisibility(map, cusic, false);
    }
  };

  const setScenarioColor = (cusic, color) => {
    const nextColors = {
      ...colorsRef.current,
      [cusic]: color,
    };

    colorsRef.current = nextColors;
    setColors(nextColors);

    if (map && visibilityRef.current[cusic]) {
      updateFloodScenarioLayerColor(map, cusic, color);
    }
  };

  const toggleAll = async (event) => {
    event.stopPropagation();

    const anyVisible = SCENARIOS.some((cusic) => visibilityRef.current[cusic]);
    const nextVisible = !anyVisible;
    const nextVisibility = buildVisibilityState(nextVisible);

    visibilityRef.current = nextVisibility;
    setVisibility(nextVisibility);

    if (!map) return;

    if (!nextVisible) {
      SCENARIOS.forEach((cusic) =>
        setFloodScenarioLayerVisibility(map, cusic, false),
      );
      return;
    }

    try {
      const geojson = await fetchFloodExtentScenarios();

      SCENARIOS.forEach((cusic) => {
        if (!visibilityRef.current[cusic]) return;

        addOrUpdateFloodScenarioLayer(
          map,
          filterScenario(geojson, cusic),
          cusic,
          colorsRef.current[cusic],
        );
      });
    } catch (error) {
      console.error("Flood extent scenarios load error:", error);

      const hiddenState = buildVisibilityState(false);
      visibilityRef.current = hiddenState;
      setVisibility(hiddenState);

      SCENARIOS.forEach((cusic) =>
        setFloodScenarioLayerVisibility(map, cusic, false),
      );
    }
  };

  const anyVisible = SCENARIOS.some((cusic) => visibility[cusic]);

  return (
    <div className="border-b border-[#343c4c]">
      <div className="flex w-full items-center justify-between px-4 py-3 text-white hover:bg-[#0f3d2e]">
        <button
          type="button"
          className="flex flex-1 cursor-pointer items-center gap-2 text-left"
          onClick={() => setOpen((previous) => !previous)}
        >
          <span>FLOOD EXTENT SCENARIOS</span>
          {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>

        <button
          type="button"
          title={
            anyVisible
              ? "Hide all flood extent scenarios"
              : "Show all flood extent scenarios"
          }
          onClick={toggleAll}
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
          {SCENARIOS.map((cusic) => (
            <div
              key={cusic}
              className="flex items-center gap-2 px-1 py-1.5 text-white"
            >
              <input
                type="checkbox"
                checked={visibility[cusic]}
                onChange={(event) =>
                  void setScenarioVisibility(cusic, event.target.checked)
                }
                className="cursor-pointer accent-[#65c96b]"
              />

              <span
                className="relative h-4 w-4 shrink-0 overflow-hidden rounded-sm border border-white/35"
                style={{ backgroundColor: colors[cusic] }}
                title="Click to change layer color"
              >
                <input
                  type="color"
                  value={colors[cusic]}
                  onChange={(event) =>
                    setScenarioColor(cusic, event.target.value)
                  }
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  aria-label={`Change Flood Inundation ${formatCusic(cusic)} cusic color`}
                />
              </span>

              <span className="truncate text-[11px]">
                Flood Inundation {formatCusic(cusic)} cusic
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

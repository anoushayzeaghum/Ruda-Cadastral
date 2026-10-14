import { useRef, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { getFloodExtentGeoJSON } from "../../../../services/metaverseApi";
import {
  FLOOD_LAYER,
  addOrUpdateFloodLayer,
  setFloodLayerVisibility,
} from "./LayerManager/Hydrology/FloodLayer";

const FLOOD_YEARS = [2025, 2026];

/**
 * Hydrology layer group.
 *
 * Flood extent data is loaded once from the FloodExtent backend API.
 * The visible GeoJSON is then filtered by the selected year(s).
 */
export default function Hydrology({ map }) {
  const [open, setOpen] = useState(false);
  const [floodYearsVisible, setFloodYearsVisible] = useState({
    2025: false,
    2026: false,
  });

  const floodYearsVisibleRef = useRef({
    2025: false,
    2026: false,
  });

  const floodCache = useRef(null);
  const floodRequest = useRef(null);

  const fetchFloodExtent = async () => {
    if (floodCache.current) return floodCache.current;
    if (floodRequest.current) return floodRequest.current;

    const request = getFloodExtentGeoJSON()
      .then((geojson) => {
        floodCache.current = geojson;
        return geojson;
      })
      .finally(() => {
        floodRequest.current = null;
      });

    floodRequest.current = request;
    return request;
  };

  const filterFloodExtentByYears = (geojson, visibility) => {
    const selectedYears = FLOOD_YEARS.filter((year) => visibility[year]);

    return {
      ...geojson,
      type: "FeatureCollection",
      features: (geojson?.features || []).filter((feature) =>
        selectedYears.includes(Number(feature?.properties?.year)),
      ),
    };
  };

  const applyFloodVisibility = async (nextVisibility) => {
    floodYearsVisibleRef.current = nextVisibility;
    setFloodYearsVisible(nextVisibility);

    if (!map) return;

    const hasVisibleFloodLayer = FLOOD_YEARS.some(
      (year) => nextVisibility[year],
    );

    if (!hasVisibleFloodLayer) {
      setFloodLayerVisibility(map, false);
      return;
    }

    try {
      const geojson = await fetchFloodExtent();

      // Use the latest checkbox state in case it changed while the request
      // was still in progress.
      const latestVisibility = floodYearsVisibleRef.current;
      const stillHasVisibleFloodLayer = FLOOD_YEARS.some(
        (year) => latestVisibility[year],
      );

      if (!stillHasVisibleFloodLayer) {
        setFloodLayerVisibility(map, false);
        return;
      }

      const filteredGeojson = filterFloodExtentByYears(
        geojson,
        latestVisibility,
      );

      addOrUpdateFloodLayer(map, filteredGeojson);
    } catch (error) {
      console.error(`${FLOOD_LAYER.label} load error:`, error);

      const hiddenState = {
        2025: false,
        2026: false,
      };

      floodYearsVisibleRef.current = hiddenState;
      setFloodYearsVisible(hiddenState);
      setFloodLayerVisibility(map, false);
    }
  };

  const setFloodYearVisibility = (year, visible) => {
    const nextVisibility = {
      ...floodYearsVisibleRef.current,
      [year]: visible,
    };

    void applyFloodVisibility(nextVisibility);
  };

  const toggleAll = (event) => {
    event.stopPropagation();

    const anyVisible = FLOOD_YEARS.some(
      (year) => floodYearsVisibleRef.current[year],
    );

    const nextVisibility = {
      2025: !anyVisible,
      2026: !anyVisible,
    };

    void applyFloodVisibility(nextVisibility);
  };

  const anyFloodVisible = FLOOD_YEARS.some((year) => floodYearsVisible[year]);

  return (
    <div className="border-b border-[#343c4c]">
      <div className="flex w-full items-center justify-between px-4 py-3 text-white hover:bg-[#0f3d2e]">
        <button
          type="button"
          className="flex flex-1 cursor-pointer items-center gap-2 text-left"
          onClick={() => setOpen((previous) => !previous)}
        >
          <span>HYDROLOGY</span>
          {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>

        <button
          type="button"
          title={
            anyFloodVisible
              ? "Hide all hydrology layers"
              : "Show all hydrology layers"
          }
          onClick={toggleAll}
          className={`relative ml-2 h-5 w-9 shrink-0 overflow-hidden rounded-full transition-colors duration-200 focus:outline-none ${
            anyFloodVisible ? "bg-[#65c96b]" : "bg-white/20"
          }`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
              anyFloodVisible ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {open && (
        <div className="mx-3 mb-3 rounded-sm border border-[#13593f]/40 bg-[#093024] p-2">
          {FLOOD_YEARS.map((year) => (
            <label
              key={year}
              className="flex cursor-pointer items-center gap-2 px-1 py-1.5 text-white"
            >
              <input
                type="checkbox"
                checked={floodYearsVisible[year]}
                onChange={(event) =>
                  setFloodYearVisibility(year, event.target.checked)
                }
                className="accent-[#65c96b]"
              />

              <span
                className="h-4 w-4 shrink-0 rounded-sm border border-white/35"
                style={{ backgroundColor: FLOOD_LAYER.color }}
              />

              <span className="truncate text-[11px]">Flood Extent {year}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

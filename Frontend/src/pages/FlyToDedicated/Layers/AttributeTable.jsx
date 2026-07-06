import { useState } from "react";
import { X, Search } from "lucide-react";
import axios from "axios";
import mapboxgl from "mapbox-gl";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

function extendBounds(bounds, coords) {
  if (!Array.isArray(coords)) return;

  if (typeof coords[0] === "number" && typeof coords[1] === "number") {
    bounds.extend(coords);
    return;
  }

  coords.forEach((item) => extendBounds(bounds, item));
}

function zoomToGeometry(map, geometry) {
  if (!map || !geometry?.coordinates) return;

  const bounds = new mapboxgl.LngLatBounds();
  extendBounds(bounds, geometry.coordinates);

  if (!bounds.isEmpty()) {
    map.fitBounds(bounds, {
      padding: 80,
      maxZoom: 18,
      duration: 900,
    });
  }
}

function getPlotId(props = {}, fallbackId) {
  return (
    props.gid ||
    props.id ||
    props.plot_id ||
    props.plotId ||
    props.plot_gid ||
    props.objectid ||
    props.OBJECTID ||
    fallbackId ||
    ""
  );
}

export default function AttributeTable({ map, onClose, onSelectPlot, filters }) {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query) return;

    setLoading(true);

    try {
      const params = { search: query };
      if (filters?.projectId) params.project_id = filters.projectId;
      if (filters?.block) params.block = filters.block;
      if (filters?.area) params.plot_area = filters.area;
      if (filters?.plotType) params.type = filters.plotType;
      // Note: plot_no is not included in search query as it is handled via selection
      const res = await axios.get(`${API_BASE}/plot/`, { params });

      const raw = res.data?.data || res.data || [];

      let data = [];

      if (Array.isArray(raw)) {
        data = raw;
      } else if (raw?.features) {
        data = raw.features;
      } else if (raw?.results) {
        data = raw.results;
      } else {
        data = [];
      }

      const formatted = data.map((f, i) => {
        const props = f?.properties || f || {};

        return {
          sr: i + 1,
          project: props.project_name || props.project_id || "-",
          block: props.block_name || props.block || "-",
          plot_type: props.type || props.plot_type || "-",
          plot_no: props.plot_no || "-",
          name: props.name || "-",
          area: props.plot_area || props.area || "-",
          geometry: f?.geometry || props.geometry || null,
          plotId: getPlotId(props, f?.id),
          raw: props,
        };
      });

      setRows(formatted);
    } catch (err) {
      console.error("Search error:", err);
    }

    setLoading(false);
  };

  const handleClear = () => {
    setQuery("");
    setRows([]);
  };

  return (
    <div className="w-[700px] max-w-[calc(100vw-4rem)] overflow-hidden rounded-md border border-[#13593f] bg-[#06291f] text-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-[#0c3d2d] px-3 py-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
          <Search size={15} />
          Attribute Search
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-white/80 transition hover:bg-[#0a3327] hover:text-white"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex gap-2 p-3 text-xs">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
          placeholder="Enter keyword (commercial, residential...)"
          className="h-8 flex-1 rounded border border-[#0c3d2d] bg-[#031a14] px-2 text-xs text-white outline-none placeholder:text-white/40 focus:border-[#9be37b]"
        />

        <button
          type="button"
          onClick={handleSearch}
          className="h-8 rounded bg-[#9be37b] px-3 text-xs font-bold text-black transition hover:brightness-110"
        >
          {loading ? "Searching..." : "Search"}
        </button>

        <button
          type="button"
          onClick={handleClear}
          className="h-8 rounded border border-[#0c3d2d] px-3 text-xs text-white transition hover:bg-[#0a3327]"
        >
          Clear
        </button>
      </div>

      <div className="max-h-[400px] overflow-auto px-3 pb-3 text-xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <table className="w-full min-w-[620px] border-separate border-spacing-0 text-left">
          <thead className="sticky top-0 z-10 bg-[#0f3d2e] text-white/90">
            <tr>
              <th className="border-b border-[#0c3d2d] px-2 py-2 font-semibold">SR</th>
              <th className="border-b border-[#0c3d2d] px-2 py-2 font-semibold">Project</th>
              <th className="border-b border-[#0c3d2d] px-2 py-2 font-semibold">Block</th>
              <th className="border-b border-[#0c3d2d] px-2 py-2 font-semibold">Type</th>
              <th className="border-b border-[#0c3d2d] px-2 py-2 font-semibold">Plot No</th>
              <th className="border-b border-[#0c3d2d] px-2 py-2 font-semibold">Name</th>
              <th className="border-b border-[#0c3d2d] px-2 py-2 font-semibold">Area</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-2 py-8 text-center text-white/50">
                  No records to show
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr
                  key={i}
                  onClick={() => {
                    zoomToGeometry(map, r.geometry);
                    if (onSelectPlot) {
                      onSelectPlot({
                        projectId:
                          r.raw?.project_id ||
                          r.raw?.project ||
                          filters?.projectId ||
                          "",
                        block:
                          r.raw?.block ||
                          r.raw?.block_name ||
                          (r.block !== "-" ? r.block : ""),
                        plotType:
                          r.raw?.type ||
                          r.raw?.plot_type ||
                          (r.plot_type !== "-" ? r.plot_type : ""),
                        area:
                          r.raw?.plot_area ||
                          r.raw?.area ||
                          (r.area !== "-" ? r.area : ""),
                        plotNo:
                          r.raw?.plot_no ||
                          (r.plot_no !== "-" ? r.plot_no : ""),
                        selectedPlotId: r.plotId || "",
                        selectedPlotGid: r.raw?.gid || "",
                        selectedPlotGeometry: r.geometry || null,
                        flyToPlotTrigger: Date.now(),
                      });
                    }
                  }}
                  className="cursor-pointer border-b border-[#0c3d2d] transition hover:bg-[#0a3327]"
                  title="Click to select and highlight this plot"
                >
                  <td className="border-b border-[#0c3d2d]/70 px-2 py-2">{r.sr}</td>
                  <td className="border-b border-[#0c3d2d]/70 px-2 py-2">{r.project}</td>
                  <td className="border-b border-[#0c3d2d]/70 px-2 py-2">{r.block}</td>
                  <td className="border-b border-[#0c3d2d]/70 px-2 py-2">{r.plot_type}</td>
                  <td className="border-b border-[#0c3d2d]/70 px-2 py-2">{r.plot_no}</td>
                  <td className="border-b border-[#0c3d2d]/70 px-2 py-2">{r.name}</td>
                  <td className="border-b border-[#0c3d2d]/70 px-2 py-2">{r.area}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { X, Search } from "lucide-react";
import mapboxgl from "mapbox-gl";

export const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export const emptyFC = () => ({ type: "FeatureCollection", features: [] });

export const unwrapGeoJSON = (data) => {
  const raw = data?.data || data?.results || data;
  if (raw?.type === "FeatureCollection") return raw;
  if (raw?.features) return { type: "FeatureCollection", features: raw.features };
  if (Array.isArray(raw)) return { type: "FeatureCollection", features: raw };
  return emptyFC();
};

export const getMapSourceGeoJSON = (map, sourceId) => {
  try {
    const source = map?.getSource?.(sourceId);
    const data = source?._data || source?.serialize?.()?.data;
    return data?.features ? data : emptyFC();
  } catch (error) {
    console.error("Attribute table source read error:", error);
    return emptyFC();
  }
};

export const extendBounds = (bounds, coords) => {
  if (!Array.isArray(coords)) return;

  if (typeof coords[0] === "number" && typeof coords[1] === "number") {
    bounds.extend(coords);
    return;
  }

  coords.forEach((item) => extendBounds(bounds, item));
};

export const zoomToGeometry = (map, geometry) => {
  if (!map || !geometry?.coordinates) return;

  const bounds = new mapboxgl.LngLatBounds();
  extendBounds(bounds, geometry.coordinates);

  if (!bounds.isEmpty()) {
    map.fitBounds(bounds, {
      padding: 80,
      maxZoom: geometry.type?.includes("Point") ? 17 : 14,
      duration: 900,
    });
  }
};

export const formatNumber = (value, digits = 2) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return num.toLocaleString(undefined, {
    maximumFractionDigits: digits,
  });
};

const cellText = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
};

export default function AdminAttributeTableShell({
  map,
  title,
  placeholder = "Search records...",
  columns = [],
  rows = [],
  loading = false,
  onClose,
}) {
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");

  const filteredRows = useMemo(() => {
    const search = activeQuery.trim().toLowerCase();
    if (!search) return rows;

    return rows.filter((row) =>
      columns.some((column) =>
        String(row?.[column.key] ?? "")
          .toLowerCase()
          .includes(search),
      ),
    );
  }, [activeQuery, columns, rows]);

  const handleSearch = () => setActiveQuery(query);

  const handleClear = () => {
    setQuery("");
    setActiveQuery("");
  };

  return (
    <div className="fixed bottom-5 left-[92px] z-[9999] w-[760px] max-w-[calc(100vw-120px)] overflow-hidden rounded-md border border-[#13593f] bg-[#06291f] text-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-[#0c3d2d] px-3 py-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
          <Search size={15} />
          {title}
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
          placeholder={placeholder}
          className="h-8 flex-1 rounded border border-[#0c3d2d] bg-[#031a14] px-2 text-xs text-white outline-none placeholder:text-white/40 focus:border-[#9be37b]"
        />

        <button
          type="button"
          onClick={handleSearch}
          className="h-8 rounded bg-[#9be37b] px-3 text-xs font-bold text-black transition hover:brightness-110"
        >
          Search
        </button>

        <button
          type="button"
          onClick={handleClear}
          className="h-8 rounded border border-[#0c3d2d] px-3 text-xs text-white transition hover:bg-[#0a3327]"
        >
          Clear
        </button>
      </div>

      <div className="max-h-[420px] overflow-auto px-3 pb-3 text-xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <table className="w-full min-w-[680px] border-separate border-spacing-0 text-left">
          <thead className="sticky top-0 z-10 bg-[#0f3d2e] text-white/90">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="border-b border-[#0c3d2d] px-2 py-2 font-semibold"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-2 py-8 text-center text-white/50"
                >
                  Loading records...
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-2 py-8 text-center text-white/50"
                >
                  No records to show
                </td>
              </tr>
            ) : (
              filteredRows.map((row, index) => (
                <tr
                  key={row.id || index}
                  onClick={() => zoomToGeometry(map, row.geometry)}
                  className="cursor-pointer border-b border-[#0c3d2d] transition hover:bg-[#0a3327]"
                  title="Click to zoom to this feature"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="border-b border-[#0c3d2d]/70 px-2 py-2"
                    >
                      {cellText(row?.[column.key])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useMemo, useState, useEffect } from "react";
import { X, Search, ChevronDown, ChevronUp, Layers } from "lucide-react";
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
  const [isMinimized, setIsMinimized] = useState(false);
  const [tick, setTick] = useState(0);

  // Sync state with global tabs registry
  useEffect(() => {
    if (!window.__openAttributeTables) {
      window.__openAttributeTables = [];
    }
    if (!window.__openAttributeTables.includes(title)) {
      window.__openAttributeTables.push(title);
    }
    window.__activeAttributeTable = title;

    if (!window.__attributeTableCloseCallbacks) {
      window.__attributeTableCloseCallbacks = {};
    }
    window.__attributeTableCloseCallbacks[title] = onClose;

    // Trigger state sync across all shells
    window.dispatchEvent(new CustomEvent("attribute-tables-changed"));

    const handleUpdate = () => {
      setTick((t) => t + 1);
    };

    window.addEventListener("attribute-tables-changed", handleUpdate);

    return () => {
      window.removeEventListener("attribute-tables-changed", handleUpdate);
      if (window.__openAttributeTables) {
        window.__openAttributeTables = window.__openAttributeTables.filter(
          (t) => t !== title
        );
        if (window.__activeAttributeTable === title) {
          window.__activeAttributeTable = window.__openAttributeTables[0] || null;
        }
      }
      if (window.__attributeTableCloseCallbacks) {
        delete window.__attributeTableCloseCallbacks[title];
      }
      window.dispatchEvent(new CustomEvent("attribute-tables-changed"));
    };
  }, [title, onClose]);

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

  const handleTabClick = (tabTitle) => {
    window.__activeAttributeTable = tabTitle;
    window.dispatchEvent(new CustomEvent("attribute-tables-changed"));
  };

  const handleTabClose = (tabTitle, e) => {
    e.stopPropagation();
    if (window.__attributeTableCloseCallbacks?.[tabTitle]) {
      window.__attributeTableCloseCallbacks[tabTitle]();
    }
  };

  // If this specific instance is not the active one, hide it completely (render null)
  if (window.__activeAttributeTable && window.__activeAttributeTable !== title) {
    return null;
  }

  const openTabsList = window.__openAttributeTables || [title];

  return (
    <div className={`fixed bottom-3 right-[55px] z-[999] overflow-hidden rounded-xl border border-[#13593f]/40 bg-[#041d15]/85 backdrop-blur-md text-white shadow-2xl transition-all duration-300 ease-in-out max-w-[calc(100vw-90px)] ${isMinimized ? 'w-[280px]' : 'w-[460px]'}`}>
      {/* HEADER TABS BAR */}
      <div className="flex items-center justify-between border-b border-[#13593f]/20 bg-[#02110a]/90 shrink-0">
        
        {/* TABS CONTAINER */}
        <div className="flex items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-1 max-w-[calc(100%-60px)]">
          {openTabsList.map((tabTitle) => {
            const isActive = tabTitle === title;
            return (
              <div
                key={tabTitle}
                onClick={() => handleTabClick(tabTitle)}
                className={`group/tab flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider border-r border-[#13593f]/15 cursor-pointer transition select-none whitespace-nowrap ${isActive ? 'bg-[#041d15]/40 text-[#9be37b] border-b-2 border-b-[#9be37b]' : 'text-white/50 hover:text-white/80 hover:bg-[#03150f]/20'}`}
              >
                <Layers size={10} className={isActive ? "animate-pulse text-[#9be37b]" : "text-white/30"} />
                <span className="truncate max-w-[120px]">{tabTitle}</span>
                <button
                  type="button"
                  onClick={(e) => handleTabClose(tabTitle, e)}
                  className="rounded-full p-0.5 text-white/30 hover:bg-white/10 hover:text-white transition"
                >
                  <X size={10} />
                </button>
              </div>
            );
          })}
        </div>

        {/* RIGHT CONTROLS */}
        <div className="flex items-center gap-1 pr-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? "Expand table" : "Minimize table"}
            className="rounded p-1 text-white/60 transition hover:bg-[#0c3d2d] hover:text-white"
          >
            {isMinimized ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          
          <button
            type="button"
            onClick={(e) => handleTabClose(title, e)}
            className="rounded p-1 text-white/60 transition hover:bg-red-500/20 hover:text-red-400"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* CONTENT (Hidden when minimized) */}
      <div className={`transition-all duration-300 ease-in-out ${isMinimized ? 'max-h-0 opacity-0 pointer-events-none' : 'max-h-[480px] opacity-100'}`}>
        {/* ROW COUNT & SEARCH CONTROLS */}
        <div className="flex items-center gap-2 p-2.5 text-xs bg-[#031a14]/40 border-b border-[#13593f]/10">
          <span className="shrink-0 rounded bg-[#13593f]/30 px-1.5 py-0.5 text-[9px] font-bold text-[#9be37b]">
            {filteredRows.length} rows
          </span>
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-white/30">
              <Search size={11} />
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              placeholder={placeholder}
              className="h-7 w-full rounded-lg border border-[#13593f]/30 bg-[#02130e]/80 pl-6 pr-2 text-xs text-white outline-none placeholder:text-white/30 focus:border-[#9be37b] focus:ring-1 focus:ring-[#9be37b]/25 transition"
            />
          </div>

          <button
            type="button"
            onClick={handleSearch}
            className="h-7 rounded-lg bg-[#9be37b] px-2.5 text-[11px] font-bold text-black transition hover:bg-[#a9eb8a] hover:shadow-[#9be37b]/20 shrink-0"
          >
            Search
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="h-7 rounded-lg border border-[#13593f]/40 bg-[#041d15]/50 px-2 text-[11px] text-white/80 transition hover:bg-[#0c3d2d] hover:text-white shrink-0"
          >
            Clear
          </button>
        </div>

        {/* TABLE CONTAINER */}
        <div className="max-h-[250px] overflow-y-auto px-3 pb-3 text-xs scrollbar-thin scrollbar-thumb-[#13593f]/40 scrollbar-track-transparent">
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-left">
              <thead className="sticky top-0 z-10 bg-[#052319] text-[#9be37b]/90">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className="border-b border-[#13593f]/30 px-3 py-2 text-[10px] font-bold uppercase tracking-wider bg-[#052319] whitespace-nowrap"
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-[#13593f]/10">
                {loading ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-3 py-8 text-center text-white/40"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#9be37b] border-t-transparent"></span>
                        Loading...
                      </div>
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-3 py-8 text-center text-white/40 whitespace-nowrap"
                    >
                      No records match query
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, index) => (
                    <tr
                      key={row.id || index}
                      onClick={() => zoomToGeometry(map, row.geometry)}
                      className="group cursor-pointer transition-colors duration-150 hover:bg-[#9be37b]/5"
                      title="Click to zoom to this feature"
                    >
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className="px-3 py-2 text-white/80 group-hover:text-white border-b border-[#13593f]/5 whitespace-nowrap"
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
      </div>
    </div>
  );
}

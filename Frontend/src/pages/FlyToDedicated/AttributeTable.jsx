import { useState } from "react";
import { X, Search } from "lucide-react";
import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export default function AttributeTable({ onClose }) {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

const handleSearch = async () => {
  if (!query) return;

  setLoading(true);

  try {
    const res = await axios.get(`${API_BASE}/plot/`, {
      params: { search: query },
    });

    // 🔥 STEP 1: unwrap safely
    const raw = res.data?.data || res.data || [];

    // 🔥 STEP 2: convert to array safely
    let data = [];

    if (Array.isArray(raw)) {
      data = raw;
    } else if (raw?.features) {
      data = raw.features; // GeoJSON case
    } else if (raw?.results) {
      data = raw.results;
    } else {
      data = [];
    }

    // 🔥 STEP 3: map safely
    const formatted = data.map((f, i) => ({
      sr: i + 1,
      project: f.project_name || f.project_id,
      block: f.block_name || f.block,
      plot_type: f.type,
      plot_no: f.plot_no,
      name: f.name,
      area: f.plot_area,
    }));

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
    <div className="w-[700px] text-white">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-[#343c4c] px-3 py-2">
        <div className="flex items-center gap-2 text-sm font-bold">
          <Search size={16} />
          Attribute Search
        </div>

        <button onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      {/* SEARCH BOX */}
      <div className="flex gap-2 p-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter keyword (commercial, residential...)"
          className="h-8 flex-1 rounded border border-gray-600 bg-[#1d2533] px-2 text-sm"
        />

        <button
          onClick={handleSearch}
          className="rounded bg-green-500 px-3 text-sm text-black"
        >
          Search
        </button>

        <button
          onClick={handleClear}
          className="rounded border px-3 text-sm"
        >
          Clear
        </button>
      </div>

      {/* TABLE */}
      <div className="max-h-[400px] overflow-auto px-3 pb-3">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-[#111827] text-left">
            <tr>
              <th>SR</th>
              <th>Project</th>
              <th>Block</th>
              <th>Type</th>
              <th>Plot No</th>
              <th>Name</th>
              <th>Area</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-gray-700">
                <td>{r.sr}</td>
                <td>{r.project}</td>
                <td>{r.block}</td>
                <td>{r.plot_type}</td>
                <td>{r.plot_no}</td>
                <td>{r.name}</td>
                <td>{r.area}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
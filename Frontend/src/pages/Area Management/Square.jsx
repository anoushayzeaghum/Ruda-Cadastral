import React, { useEffect, useMemo, useState } from "react";
import { getSquares } from "../../services/api";
import ImportModal from "../../components/ImportModal";

const featureRows = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.features)) return data.features;
  if (Array.isArray(data?.data?.features)) return data.data.features;
  return [];
};

const asProperties = (feature) => ({
  ...(feature?.properties || feature || {}),
  gid: feature?.properties?.gid ?? feature?.gid ?? feature?.id ?? null,
});

const display = (value) =>
  value === null || value === undefined || String(value).trim() === ""
    ? "-"
    : String(value);

export default function Square() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await getSquares();
      setItems(featureRows(res).map(asProperties));
    } catch (error) {
      console.error("Failed to load squares:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((row) =>
      [row.gid, row.sq, row.mauza_name, row.mauza, row.tehsil_name, row.district_name, row.kc, row.pc, row.layer]
        .some((value) => String(value ?? "").toLowerCase().includes(q))
    );
  }, [items, search]);

  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  useEffect(() => setPage(1), [search]);
  useEffect(() => { if (page > pages) setPage(pages); }, [page, pages]);
  const shown = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-6 bg-white dark:bg-[#07111a]">
        <h2 className="text-xl font-semibold">Square — Import</h2>
        <p className="text-sm text-gray-500 mt-1">Import Square shapefile data directly into the Square table.</p>
        <div className="mt-6 flex justify-end">
          <ImportModal title="Import Square" open={showImport} onClose={() => setShowImport(false)} type="square" onSuccess={fetchItems} />
          <button onClick={() => setShowImport(true)} className="bg-red-600 text-white px-4 py-2 rounded-md">Import Square</button>
        </div>
      </div>

      <div className="rounded-lg border p-6 bg-white dark:bg-[#07111a]">
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-semibold">Square List</h3>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search square, mauza, tehsil..." className="border rounded-md px-3 py-2 text-sm w-72 bg-white dark:bg-[#0b1419]" />
        </div>
        <div className="mt-4 overflow-x-auto">
          {loading ? <div className="py-6 text-center">Loading...</div> : filtered.length === 0 ? <div className="py-6 text-center">No squares found</div> : (
            <div className="min-w-[950px]">
              <table className="w-full text-left border-collapse">
                <thead><tr className="text-sm text-gray-500">
                  <th className="py-2 px-2">Sr. No</th><th className="py-2 px-2">Square</th><th className="py-2 px-2">Mauza</th><th className="py-2 px-2">Tehsil</th><th className="py-2 px-2">District</th><th className="py-2 px-2">KC</th><th className="py-2 px-2">PC</th><th className="py-2 px-2">Layer</th>
                </tr></thead>
                <tbody>{shown.map((row, index) => <tr key={row.gid ?? index} className="border-t">
                  <td className="py-2 px-2">{(page - 1) * perPage + index + 1}</td><td className="py-2 px-2">{display(row.sq)}</td><td className="py-2 px-2">{display(row.mauza_name ?? row.mauza)}</td><td className="py-2 px-2">{display(row.tehsil_name ?? row.tehsil)}</td><td className="py-2 px-2">{display(row.district_name ?? row.district)}</td><td className="py-2 px-2">{display(row.kc)}</td><td className="py-2 px-2">{display(row.pc)}</td><td className="py-2 px-2">{display(row.layer)}</td>
                </tr>)}</tbody>
              </table>
              <Pagination page={page} pages={pages} setPage={setPage} total={filtered.length} perPage={perPage} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Pagination({ page, pages, setPage, total, perPage }) {
  return <div className="mt-4 flex items-center justify-between"><p className="text-sm text-gray-500">Showing {total ? (page - 1) * perPage + 1 : 0} to {Math.min(page * perPage, total)} of {total}</p><div className="flex items-center gap-2"><button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50">←</button><span className="text-sm">Page {page} of {pages}</span><button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="px-3 py-1 border rounded disabled:opacity-50">→</button></div></div>;
}

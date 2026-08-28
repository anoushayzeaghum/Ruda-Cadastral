import React, { useEffect, useMemo, useState } from "react";
import { getAcres } from "../../services/api";
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

export default function Acre() {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(false); const [showImport, setShowImport] = useState(false); const [search, setSearch] = useState(""); const [page, setPage] = useState(1); const perPage = 10;
  const fetchItems = async () => { try { setLoading(true); const res = await getAcres(); setItems(featureRows(res).map(asProperties)); } catch (error) { console.error("Failed to load acres:", error); setItems([]); } finally { setLoading(false); } };
  useEffect(() => { fetchItems(); }, []);
  const filtered = useMemo(() => { const q = search.trim().toLowerCase(); if (!q) return items; return items.filter((row) => [row.gid,row.acre,row.sq,row.mauza_name,row.mauza,row.tehsil_name,row.district_name,row.layer].some((value) => String(value ?? "").toLowerCase().includes(q))); }, [items, search]);
  const pages = Math.max(1, Math.ceil(filtered.length / perPage)); useEffect(() => setPage(1), [search]); useEffect(() => { if (page > pages) setPage(pages); }, [page,pages]); const shown = filtered.slice((page-1)*perPage,page*perPage);
  return <div className="space-y-6">
    <div className="rounded-lg border p-6 bg-white dark:bg-[#07111a]"><h2 className="text-xl font-semibold">Acre — Import</h2><p className="text-sm text-gray-500 mt-1">Import Acre shapefile data directly into the Acre table.</p><div className="mt-6 flex justify-end"><ImportModal title="Import Acre" open={showImport} onClose={() => setShowImport(false)} type="acre" onSuccess={fetchItems}/><button onClick={() => setShowImport(true)} className="bg-red-600 text-white px-4 py-2 rounded-md">Import Acre</button></div></div>
    <div className="rounded-lg border p-6 bg-white dark:bg-[#07111a]"><div className="flex items-center justify-between gap-4"><h3 className="font-semibold">Acre List</h3><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search acre, square, mauza..." className="border rounded-md px-3 py-2 text-sm w-72 bg-white dark:bg-[#0b1419]"/></div><div className="mt-4 overflow-x-auto">
      {loading ? <div className="py-6 text-center">Loading...</div> : filtered.length===0 ? <div className="py-6 text-center">No acres found</div> : <div className="min-w-[850px]"><table className="w-full text-left border-collapse"><thead><tr className="text-sm text-gray-500"><th className="py-2 px-2">Sr. No</th><th className="py-2 px-2">Acre</th><th className="py-2 px-2">Square</th><th className="py-2 px-2">Mauza</th><th className="py-2 px-2">Tehsil</th><th className="py-2 px-2">District</th><th className="py-2 px-2">Layer</th></tr></thead><tbody>{shown.map((row,index)=><tr key={row.gid??index} className="border-t"><td className="py-2 px-2">{(page-1)*perPage+index+1}</td><td className="py-2 px-2">{display(row.acre)}</td><td className="py-2 px-2">{display(row.sq)}</td><td className="py-2 px-2">{display(row.mauza_name??row.mauza)}</td><td className="py-2 px-2">{display(row.tehsil_name??row.tehsil)}</td><td className="py-2 px-2">{display(row.district_name??row.district)}</td><td className="py-2 px-2">{display(row.layer)}</td></tr>)}</tbody></table><Pagination page={page} pages={pages} setPage={setPage} total={filtered.length} perPage={perPage}/></div>}
    </div></div>
  </div>;
}
function Pagination({page,pages,setPage,total,perPage}) { return <div className="mt-4 flex items-center justify-between"><p className="text-sm text-gray-500">Showing {total?(page-1)*perPage+1:0} to {Math.min(page*perPage,total)} of {total}</p><div className="flex items-center gap-2"><button onClick={()=>setPage((p)=>Math.max(1,p-1))} disabled={page===1} className="px-3 py-1 border rounded disabled:opacity-50">←</button><span className="text-sm">Page {page} of {pages}</span><button onClick={()=>setPage((p)=>Math.min(pages,p+1))} disabled={page===pages} className="px-3 py-1 border rounded disabled:opacity-50">→</button></div></div>; }

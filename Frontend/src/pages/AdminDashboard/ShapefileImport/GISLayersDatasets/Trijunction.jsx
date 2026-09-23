import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  FileUp,
  RefreshCcw,
  Search,
  Waypoints,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getTrijunctions } from "../../../../services/api";
import ImportModal from "../../../../components/ImportModal";

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

export default function Trijunction() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await getTrijunctions();
      setItems(featureRows(res).map(asProperties));
    } catch (error) {
      console.error("Failed to load trijunctions:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((row) =>
      [
        row.gid,
        row.type,
        row.m1,
        row.m1_id,
        row.m2,
        row.m2_id,
        row.m3,
        row.m3_id,
        row.mauza_name,
        row.mauza_id,
        row.layer,
      ].some((value) => String(value ?? "").toLowerCase().includes(q)),
    );
  }, [items, search]);

  const pages = Math.max(1, Math.ceil(filtered.length / perPage));

  useEffect(() => setPage(1), [search]);

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  const shown = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="mx-auto max-w-[1500px] p-3 md:p-5">
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <button
            onClick={() => navigate("/data-management/import")}
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#0B7A3B] shadow-sm transition hover:border-[#0B7A3B]/40 hover:bg-emerald-50 dark:border-white/10 dark:bg-[#0d1b15] dark:text-[#70D84F] dark:hover:bg-white/5"
            aria-label="Back to Import Center"
            title="Back to Import Center"
          >
            <ArrowLeft size={17} />
          </button>

          <div className="min-w-0">
            <h1 className="text-xl font-black font-semibold text-[#10203a] dark:text-white md:text-2xl">
              Trijunction Management
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Import trijunction shapefiles and review existing trijunction records.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchItems}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:bg-[#0d1b15] dark:text-white dark:hover:bg-white/5"
          >
            <RefreshCcw size={14} />
            Refresh
          </button>

          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 rounded-lg bg-[#0B7A3B] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#086532]"
          >
            <FileUp size={15} />
            Import Trijunction
          </button>

          <div className="flex min-w-[165px] items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0B7A3B] text-white">
              <Waypoints size={17} />
            </span>
            <div className="leading-tight">
              <div className="text-lg font-black text-[#0B7A3B] dark:text-[#70D84F]">
                {items.length}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                Trijunction Records
              </div>
            </div>
          </div>
        </div>
      </div>

      <ImportModal
        title="Import Trijunction"
        open={showImport}
        onClose={() => setShowImport(false)}
        type="trijunction"
        onSuccess={fetchItems}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0d1b15]">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-normal text-[#10203a] dark:text-white">
              Trijunction List
            </h2>
            <p className="text-[10px] text-slate-400">
              Existing records of Ruda Cadastral System
            </p>
          </div>

          <div className="relative w-full sm:w-[360px]">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search type, mauza, M1/M2/M3..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none transition focus:border-[#0B7A3B] dark:border-white/10 dark:bg-white/5"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-white/5">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No trijunctions found
            </div>
          ) : (
            <div className="min-w-[1050px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400 dark:bg-white/5">
                  <tr>
                    <th className="px-4 py-3">Sr. No</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">M1</th>
                    <th className="px-4 py-3">M1 ID</th>
                    <th className="px-4 py-3">M2</th>
                    <th className="px-4 py-3">M2 ID</th>
                    <th className="px-4 py-3">M3</th>
                    <th className="px-4 py-3">M3 ID</th>
                    <th className="px-4 py-3">Mauza</th>
                    <th className="px-4 py-3">Layer</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((row, index) => (
                    <tr
                      key={row.gid ?? index}
                      className="border-t border-slate-100 dark:border-white/5"
                    >
                      <td className="px-4 py-3 text-slate-400">
                        {(page - 1) * perPage + index + 1}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-700 dark:text-white">
                        {display(row.type)}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{display(row.m1)}</td>
                      <td className="px-4 py-3 text-slate-500">{display(row.m1_id)}</td>
                      <td className="px-4 py-3 text-slate-500">{display(row.m2)}</td>
                      <td className="px-4 py-3 text-slate-500">{display(row.m2_id)}</td>
                      <td className="px-4 py-3 text-slate-500">{display(row.m3)}</td>
                      <td className="px-4 py-3 text-slate-500">{display(row.m3_id)}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {display(row.mauza_name ?? row.mauza_id)}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{display(row.layer)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <Pagination
                page={page}
                pages={pages}
                setPage={setPage}
                total={filtered.length}
                perPage={perPage}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Pagination({ page, pages, setPage, total, perPage }) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-white/5">
      <p className="text-[10px] text-slate-400">
        Showing {total ? (page - 1) * perPage + 1 : 0} to{" "}
        {Math.min(page * perPage, total)} of {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 disabled:opacity-50 dark:border-white/10 dark:text-white"
        >
          ←
        </button>
        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-300">
          Page {page} of {pages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(pages, p + 1))}
          disabled={page === pages}
          className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 disabled:opacity-50 dark:border-white/10 dark:text-white"
        >
          →
        </button>
      </div>
    </div>
  );
}

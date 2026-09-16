import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  FileUp,
  Grid2X2,
  RefreshCcw,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getSquares } from "../../../services/api";
import ImportModal from "../../../components/ImportModal";

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
      const res = await getSquares();
      setItems(featureRows(res).map(asProperties));
    } catch (error) {
      console.error("Failed to load squares:", error);
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
        row.sq,
        row.mauza_name,
        row.mauza,
        row.tehsil_name,
        row.district_name,
        row.kc,
        row.pc,
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
              Square Management
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Import square shapefiles and review existing square records.
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
            Import Square
          </button>

          <div className="flex min-w-[150px] items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0B7A3B] text-white">
              <Grid2X2 size={17} />
            </span>
            <div className="leading-tight">
              <div className="text-lg font-black text-[#0B7A3B] dark:text-[#70D84F]">
                {items.length}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                Square Records
              </div>
            </div>
          </div>
        </div>
      </div>

      <ImportModal
        title="Import Square"
        open={showImport}
        onClose={() => setShowImport(false)}
        type="square"
        onSuccess={fetchItems}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0d1b15]">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-normal text-[#10203a] dark:text-white">
              Square List
            </h2>
            <p className="text-[10px] text-slate-400">
              Existing records of Ruda Cadastral System
            </p>
          </div>

          <div className="relative w-full sm:w-[340px]">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search square, mauza, tehsil..."
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
              No squares found
            </div>
          ) : (
            <div className="min-w-[950px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400 dark:bg-white/5">
                  <tr>
                    <th className="px-4 py-3">Sr. No</th>
                    <th className="px-4 py-3">Square</th>
                    <th className="px-4 py-3">Mauza</th>
                    <th className="px-4 py-3">Tehsil</th>
                    <th className="px-4 py-3">District</th>
                    <th className="px-4 py-3">KC</th>
                    <th className="px-4 py-3">PC</th>
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
                        {display(row.sq)}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {display(row.mauza_name ?? row.mauza)}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {display(row.tehsil_name ?? row.tehsil)}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {display(row.district_name ?? row.district)}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {display(row.kc)}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {display(row.pc)}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {display(row.layer)}
                      </td>
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

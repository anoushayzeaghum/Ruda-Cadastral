import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, FileUp, Layers, RefreshCcw, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ImportModal from "../../../../components/ImportModal";
import { getProjectDataset } from "../../../../services/api";

export default function ProjectDataset({ dataset }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState("");

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProjectDataset(dataset.endpoint);
      setItems(data?.features || []);
    } catch (error) {
      console.error(`Failed to load ${dataset.title}:`, error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [dataset.endpoint, dataset.title]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const rows = useMemo(
    () =>
      items.map((feature) => ({
        id: feature.id ?? feature.properties?.gid,
        ...(feature.properties || {}),
      })),
    [items],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) =>
      Object.values(row).some((value) =>
        String(value ?? "").toLowerCase().includes(query),
      ),
    );
  }, [rows, search]);

  return (
    <div className="mx-auto max-w-[1500px] p-3 md:p-5">
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <button
            onClick={() => navigate("/data-management/import")}
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#0B7A3B] shadow-sm dark:border-white/10 dark:bg-[#0d1b15] dark:text-[#70D84F]"
            aria-label="Back to Import Center"
          >
            <ArrowLeft size={17} />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-[#10203a] dark:text-white md:text-2xl">
              {dataset.title} Management
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">{dataset.description}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchItems}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 dark:border-white/10 dark:bg-[#0d1b15] dark:text-white"
          >
            <RefreshCcw size={14} /> Refresh
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 rounded-lg bg-[#0B7A3B] px-4 py-2.5 text-xs font-bold text-white"
          >
            <FileUp size={15} /> Import {dataset.title}
          </button>
          <div className="flex min-w-[150px] items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0B7A3B] text-white">
              <Layers size={17} />
            </span>
            <div className="leading-tight">
              <div className="text-lg font-black text-[#0B7A3B]">{rows.length}</div>
              <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Records
              </div>
            </div>
          </div>
        </div>
      </div>

      <ImportModal
        title={`Import ${dataset.title}`}
        open={showImport}
        onClose={() => setShowImport(false)}
        type={dataset.type}
        onSuccess={fetchItems}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0d1b15]">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg text-[#10203a] dark:text-white">{dataset.title} List</h2>
            <p className="text-[10px] text-slate-400">Existing records of Ruda Cadastral System</p>
          </div>
          <div className="relative w-full sm:w-[340px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search all fields..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none dark:border-white/10 dark:bg-white/5"
            />
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-white/5">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">No records found</div>
          ) : (
            <table className="w-full min-w-[850px] text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400 dark:bg-white/5">
                <tr>
                  <th className="px-4 py-3">Sr. No</th>
                  {dataset.columns.map((column) => (
                    <th key={column.key} className="px-4 py-3">{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, index) => (
                  <tr key={row.id ?? index} className="border-t border-slate-100 dark:border-white/5">
                    <td className="px-4 py-3 text-slate-400">{index + 1}</td>
                    {dataset.columns.map((column) => (
                      <td key={column.key} className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {row[column.key] ?? "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

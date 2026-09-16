import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  FileUp,
  MapPin,
  RefreshCcw,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getMauzas } from "../../../../services/api";
import ImportModal from "../../../../components/ImportModal";

export default function Mauza() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showFields, setShowFields] = useState(false);

  const fetchMauzas = async () => {
    try {
      setLoading(true);

      const res = await getMauzas();

      const features = res?.features ?? [];

      const props = features.map((f) => ({
        ...(f.properties || {}),
        mauza_id: f.properties?.mauza_id ?? f.id,
      }));

      setItems(props);
    } catch (err) {
      console.error("Failed to load mauzas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMauzas();
  }, []);

  return (
    <div className="mx-auto max-w-[1500px] p-3 md:p-5">
      {/* PAGE HEADER */}
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
              Mauza Management
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Import mauza shapefiles and review existing mauza records.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchMauzas}
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
            Import Mauza
          </button>

          <div className="flex min-w-[150px] items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0B7A3B] text-white">
              <MapPin size={17} />
            </span>
            <div className="leading-tight">
              <div className="text-lg font-black text-[#0B7A3B] dark:text-[#70D84F]">
                {items.length}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                Mauza Records
              </div>
            </div>
          </div>
        </div>
      </div>

      <ImportModal
        title="Import Mauza"
        open={showImport}
        onClose={() => setShowImport(false)}
        type="mauza"
        onSuccess={fetchMauzas}
      />

      {/* MAUZA TABLE */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0d1b15]">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-normal text-[#10203a] dark:text-white">
              Mauza List
            </h2>
            <p className="text-[10px] text-slate-400">
              Existing records of Ruda Cadastral System
            </p>
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <div className="relative w-full sm:w-[320px]">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                placeholder="Search by name..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none transition focus:border-[#0B7A3B] dark:border-white/10 dark:bg-white/5"
              />
            </div>

            <button
              title="Show fields"
              onClick={() => setShowFields(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-[#0B7A3B]/30 hover:bg-emerald-50 hover:text-[#0B7A3B] dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              <svg
                width="18"
                height="14"
                viewBox="0 0 18 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="1" y="1" width="16" height="2" rx="1" fill="currentColor" />
                <rect x="1" y="6" width="16" height="2" rx="1" fill="currentColor" />
                <rect x="1" y="11" width="16" height="2" rx="1" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-white/5">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Loading...
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No mauzas found
            </div>
          ) : (
            <table className="w-full min-w-[800px] text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400 dark:bg-white/5">
                <tr>
                  <th className="px-4 py-3">Sr. No</th>
                  <th className="px-4 py-3">Mauza</th>
                  <th className="px-4 py-3">Mauza ID</th>
                  <th className="px-4 py-3">Tehsil</th>
                  <th className="px-4 py-3">District</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((d, idx) => (
                  <tr
                    key={d.mauza_id ?? d.gid ?? idx}
                    className="border-t border-slate-100 dark:border-white/5"
                  >
                    <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-bold text-slate-700 dark:text-white">
                      {d.mauza}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{d.mauza_id}</td>
                    <td className="px-4 py-3 text-slate-500">{d.tehsil}</td>
                    <td className="px-4 py-3 text-slate-500">{d.district}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="mr-2 rounded-md border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-600 dark:border-white/10 dark:text-white">
                        Edit
                      </button>
                      <button className="rounded-md border border-red-100 bg-red-50 px-3 py-1.5 text-[10px] font-bold text-red-600">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {showFields && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#0d1b15]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#10203a] dark:text-white">
                  Available Fields
                </h3>
                <p className="text-[10px] text-slate-400">
                  Fields available in the current Mauza dataset
                </p>
              </div>
              <button
                onClick={() => setShowFields(false)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
              >
                Close
              </button>
            </div>

            <div className="mt-4 max-h-96 overflow-auto rounded-xl border border-slate-100 dark:border-white/5">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400 dark:bg-[#13221b]">
                  <tr>
                    <th className="px-4 py-3">Field</th>
                    <th className="px-4 py-3">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {(items[0] ? Object.keys(items[0]) : []).map((k) => (
                    <tr
                      key={k}
                      className="border-t border-slate-100 dark:border-white/5"
                    >
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-white">
                        {k}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {typeof items[0][k]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

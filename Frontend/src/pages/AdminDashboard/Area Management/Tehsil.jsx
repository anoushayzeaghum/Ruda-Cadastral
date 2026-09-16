import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  FileUp,
  MapPin,
  RefreshCcw,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getTehsils, getDistricts } from "../../../services/api";
import ImportModal from "../../../components/ImportModal";

export default function Tehsil() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  const fetchTehsils = async () => {
    try {
      setLoading(true);
      const res = await getTehsils();
      setItems(res || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await getTehsils();
        setItems(res || []);
      } catch (err) {
        console.error("Failed to load tehsils:", err);
      } finally {
        setLoading(false);
      }
    };

    fetch();

    (async () => {
      try {
        const d = await getDistricts();
        setDistricts(d || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) => {
      const tehsil = String(item.tehsil ?? item.name ?? "").toLowerCase();
      const tehsilId = String(
        item.tehsil_id ?? item.id ?? item.gid ?? "",
      ).toLowerCase();
      const district = String(item.district ?? "").toLowerCase();
      const districtId = String(
        item.dist_id ?? item.district_id ?? "",
      ).toLowerCase();

      return (
        tehsil.includes(q) ||
        tehsilId.includes(q) ||
        district.includes(q) ||
        districtId.includes(q)
      );
    });
  }, [items, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / itemsPerPage),
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage]);

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
              Tehsil Management
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Import tehsil shapefiles and review existing tehsil records.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchTehsils}
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
            Import Tehsil
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
                Tehsil Records
              </div>
            </div>
          </div>
        </div>
      </div>

      <ImportModal
        title="Import Tehsil"
        open={showImport}
        onClose={() => setShowImport(false)}
        type="tehsil"
        onSuccess={fetchTehsils}
      />
    

      {/* TEHSIL TABLE */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0d1b15]">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-normal text-[#10203a] dark:text-white">
              Tehsil List
            </h2>
            <p className="text-[10px] text-slate-400">
              Existing records of Ruda Cadastral System
            </p>
          </div>

          <div className="relative w-full sm:w-[320px]">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by tehsil/district..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none transition focus:border-[#0B7A3B] dark:border-white/10 dark:bg-white/5"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-white/5">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Loading...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No tehsils found
            </div>
          ) : (
            <div className="min-w-[760px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400 dark:bg-white/5">
                  <tr>
                    <th className="px-4 py-3">Sr. No</th>
                    <th className="px-4 py-3">Tehsil</th>
                    <th className="px-4 py-3">Tehsil ID</th>
                    <th className="px-4 py-3">District</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((d, idx) => (
                    <tr
                      key={d.id ?? d.gid ?? d.tehsil_id ?? idx}
                      className="border-t border-slate-100 dark:border-white/5"
                    >
                      <td className="px-4 py-3 text-slate-400">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-700 dark:text-white">
                        {d.tehsil ?? d.name ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {String(
                          d.tehsil_id ?? d.id ?? d.gid ?? "",
                        ).toUpperCase()}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {d.district ?? "-"}
                      </td>
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

              <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-white/5">
                <p className="text-[10px] text-slate-400">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredItems.length)} of{" "}
                  {filteredItems.length}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-white"
                  >
                    ←
                  </button>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-300">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-white"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

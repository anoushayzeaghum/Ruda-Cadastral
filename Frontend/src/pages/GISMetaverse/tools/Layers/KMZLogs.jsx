import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  Eye,
  FileArchive,
  FileDown,
  MapPinned,
  RotateCcw,
  Search,
  Upload,
} from "lucide-react";
import Header from "../../Header";
import { getKmzPrintLogs } from "../../../../services/metaverseApi";

const formatFileSize = (bytes) => {
  if (!bytes) return "0 B";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const formatDateTime = (value) => {
  if (!value) return { date: "-", time: "-" };
  const date = new Date(value);
  return {
    date: date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
};

const normalizeLog = (item) => {
  const imported = formatDateTime(item.imported_at);
  const printed = formatDateTime(item.printed_at);
  return {
    ...item,
    fileName: item.file_name,
    fileSize: formatFileSize(item.file_size),
    project: item.project || "-",
    projectType: item.project_type || "-",
    phase: item.phase || "-",
    uploadedOn: imported.date,
    uploadedTime: imported.time,
    printedOn: printed.date,
    printedTime: printed.time,
    printedBy: item.printed_by || "-",
    preview: "parcel",
  };
};

const openStoredFile = (url) => {
  if (url) window.open(url, "_blank", "noopener,noreferrer");
};

const openLogInMap = (item) => {
  if (!item.file_url) return;

  sessionStorage.setItem(
    "ruda:open-kmz-in-map",
    JSON.stringify({ url: item.file_url, fileName: item.fileName }),
  );
  window.location.assign("/gis-metaverse");
};

export default function KMZLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState("All Phases");
  const [projectType, setProjectType] = useState("All Project Types");
  const [project, setProject] = useState("All Projects");
  const [printedBy, setPrintedBy] = useState("All Users");
  const [dateRange, setDateRange] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    let mounted = true;
    getKmzPrintLogs()
      .then((data) => {
        if (mounted) setLogs((Array.isArray(data) ? data : []).map(normalizeLog));
      })
      .catch(() => {
        if (mounted) setError("KMZ print logs could not be loaded.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const phases = useMemo(
    () => ["All Phases", ...new Set(logs.map((item) => item.phase))],
    [logs],
  );
  const projectTypes = useMemo(
    () => ["All Project Types", ...new Set(logs.map((item) => item.projectType))],
    [logs],
  );
  const projects = useMemo(
    () => ["All Projects", ...new Set(logs.map((item) => item.project))],
    [logs],
  );
  const users = useMemo(
    () => ["All Users", ...new Set(logs.map((item) => item.printedBy))],
    [logs],
  );

  const filteredLogs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return logs.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        item.fileName.toLowerCase().includes(normalizedQuery) ||
        item.reference.toLowerCase().includes(normalizedQuery) ||
        item.project.toLowerCase().includes(normalizedQuery);

      return (
        matchesQuery &&
        (phase === "All Phases" || item.phase === phase) &&
        (projectType === "All Project Types" ||
          item.projectType === projectType) &&
        (project === "All Projects" || item.project === project) &&
        (printedBy === "All Users" || item.printedBy === printedBy)
      );
    });
  }, [logs, query, phase, projectType, project, printedBy, dateRange]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleLogs = filteredLogs.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const resetFilters = () => {
    setQuery("");
    setPhase("All Phases");
    setProjectType("All Project Types");
    setProject("All Projects");
    setPrintedBy("All Users");
    setDateRange("");
    setPage(1);
  };

  const handleFilterChange = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[#f4f7f6] text-slate-800">
      <Header />

      <main className="px-4 py-5 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-[1800px]">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <ClipboardList size={30} className="text-[#0f3d2e]" />
                <h2 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
                  KMZ Print Logs
                </h2>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                View and manage uploaded KMZ files and their printed maps.
                Search, download or open them on the map.
              </p>
            </div>

            <button
              type="button"
              onClick={() => window.location.assign("/gis-metaverse")}
              className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg bg-[#0f4d39] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#123f32]"
            >
              <Upload size={17} />
              Upload KMZ
            </button>
          </div>

          <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[1.35fr_0.85fr_0.95fr_0.95fr_0.85fr_1.1fr_auto_auto]">
              <div className="relative">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={query}
                  onChange={handleFilterChange(setQuery)}
                  placeholder="Search by KMZ name or reference..."
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <FilterSelect
                label="Phase"
                value={phase}
                onChange={handleFilterChange(setPhase)}
                options={phases}
              />
              <FilterSelect
                label="Project Type"
                value={projectType}
                onChange={handleFilterChange(setProjectType)}
                options={projectTypes}
              />
              <FilterSelect
                label="Project"
                value={project}
                onChange={handleFilterChange(setProject)}
                options={projects}
              />
              <FilterSelect
                label="Printed By"
                value={printedBy}
                onChange={handleFilterChange(setPrintedBy)}
                options={users}
              />

              <label className="relative flex h-11 items-center rounded-lg border border-slate-200 bg-white px-3">
                <CalendarDays
                  size={17}
                  className="mr-2 shrink-0 text-slate-500"
                />
                <input
                  value={dateRange}
                  onChange={handleFilterChange(setDateRange)}
                  placeholder="From - To"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
              </label>

              <button
                type="button"
                onClick={() => setPage(1)}
                className="h-11 rounded-lg bg-[#0f4d39] px-5 text-sm font-semibold text-white transition hover:bg-[#123f32]"
              >
                Search
              </button>

              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <RotateCcw size={15} />
                Reset
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm font-semibold text-slate-700">
                Total Records:{" "}
                <span className="font-bold">{filteredLogs.length}</span>
              </div>

              <button
                type="button"
                className="inline-flex h-9 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:self-auto"
              >
                <Download size={16} />
                Export
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[1450px] w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <Th>#</Th>
                    <Th>Reference No.</Th>
                    <Th>KMZ File</Th>
                    <Th>Project</Th>
                    <Th>Phase</Th>
                    <Th>Uploaded On</Th>
                    <Th>Printed On</Th>
                    <Th>Printed By</Th>
                    <Th>Preview</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>

                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={10} className="px-6 py-16 text-center text-sm text-slate-500">
                        Loading KMZ print logs...
                      </td>
                    </tr>
                  )}
                  {!loading && error && (
                    <tr>
                      <td colSpan={10} className="px-6 py-16 text-center text-sm text-red-600">
                        {error}
                      </td>
                    </tr>
                  )}
                  {!loading && !error && visibleLogs.map((item, index) => (
                    <tr
                      key={item.id}
                      className="border-t border-slate-100 hover:bg-slate-50/60"
                    >
                      <Td>{(safePage - 1) * pageSize + index + 1}</Td>
                      <Td>
                        <span className="font-medium text-slate-700">
                          {item.reference}
                        </span>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <FileArchive
                            size={20}
                            className="shrink-0 text-[#174f7a]"
                          />
                          <div>
                            <div className="font-semibold text-slate-800">
                              {item.fileName}
                            </div>
                            <div className="text-xs text-slate-400">
                              ({item.fileSize})
                            </div>
                          </div>
                        </div>
                      </Td>
                      <Td>{item.project}</Td>
                      <Td>{item.phase}</Td>
                      <Td>
                        <DateCell
                          date={item.uploadedOn}
                          time={item.uploadedTime}
                        />
                      </Td>
                      <Td>
                        <DateCell
                          date={item.printedOn}
                          time={item.printedTime}
                        />
                      </Td>
                      <Td>{item.printedBy}</Td>
                      <Td>
                        <MapPreview type={item.preview} />
                      </Td>
                      <Td>
                        <div className="flex min-w-max items-center gap-2">
                          <ActionButton
                            icon={<Eye size={15} />}
                            label="View"
                            onClick={() => openStoredFile(item.report_url)}
                          />
                          <ActionButton
                            icon={<Download size={15} />}
                            label="KMZ"
                            onClick={() => openStoredFile(item.file_url)}
                          />
                          <ActionButton
                            icon={<FileDown size={15} />}
                            label="PDF"
                            onClick={() => openStoredFile(item.report_url)}
                          />
                          <ActionButton
                            icon={<MapPinned size={15} />}
                            label="Open in Map"
                            accent
                            onClick={() => openLogInMap(item)}
                          />
                        </div>
                      </Td>
                    </tr>
                  ))}

                  {visibleLogs.length === 0 && (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-6 py-16 text-center text-sm text-slate-500"
                      >
                        No KMZ print logs match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPage(1);
                  }}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 outline-none focus:border-emerald-700"
                >
                  {[5, 10, 20].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                <span>entries</span>
              </div>

              <div className="flex items-center gap-2">
                <PageButton
                  disabled={safePage <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft size={16} />
                </PageButton>

                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1,
                ).map((pageNumber) => (
                  <PageButton
                    key={pageNumber}
                    active={pageNumber === safePage}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </PageButton>
                ))}

                <PageButton
                  disabled={safePage >= totalPages}
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                >
                  <ChevronRight size={16} />
                </PageButton>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="relative flex h-11 flex-col justify-center rounded-lg border border-slate-200 bg-white px-3">
      <span className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-medium text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={onChange}
        className="h-full w-full appearance-none bg-transparent pr-5 text-sm font-medium text-slate-700 outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">
        ▼
      </span>
    </label>
  );
}

function Th({ children }) {
  return <th className="whitespace-nowrap px-4 py-3">{children}</th>;
}

function Td({ children }) {
  return (
    <td className="whitespace-nowrap px-4 py-4 align-middle text-slate-600">
      {children}
    </td>
  );
}

function DateCell({ date, time }) {
  return (
    <div>
      <div className="font-medium text-slate-700">{date}</div>
      <div className="mt-0.5 text-xs text-slate-400">{time}</div>
    </div>
  );
}

function ActionButton({ icon, label, accent = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition ${
        accent
          ? "border-emerald-200 text-[#0f5b43] hover:bg-emerald-50"
          : "border-slate-200 text-slate-700 hover:bg-slate-50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function PageButton({ children, active = false, disabled = false, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "border-[#0f4d39] bg-[#0f4d39] text-white"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function MapPreview({ type }) {
  const variants = {
    parcel: ["bg-orange-100", "border-yellow-400"],
    zoning: ["bg-fuchsia-100", "border-fuchsia-400"],
    boundary: ["bg-emerald-100", "border-emerald-400"],
    roads: ["bg-sky-50", "border-sky-300"],
  };
  const [background, border] = variants[type] || variants.parcel;

  return (
    <div
      className={`relative h-14 w-24 overflow-hidden rounded border border-slate-200 ${background}`}
    >
      <div className="absolute inset-0 opacity-70">
        <span className="absolute left-1 top-2 h-px w-24 rotate-[18deg] bg-slate-300" />
        <span className="absolute -left-1 top-8 h-px w-28 -rotate-[12deg] bg-slate-300" />
        <span className="absolute left-10 top-0 h-16 w-px rotate-[8deg] bg-slate-300" />
      </div>
      <div
        className={`absolute left-1/2 top-1/2 h-6 w-7 -translate-x-1/2 -translate-y-1/2 border-2 ${border} bg-white/25`}
      />
      <div className="absolute left-1/2 top-1.5 h-1.5 w-9 -translate-x-1/2 rounded bg-white/80" />
    </div>
  );
}

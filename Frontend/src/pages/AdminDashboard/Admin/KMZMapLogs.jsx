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
  RotateCcw,
  Search,
  Upload,
} from "lucide-react";
import AdminPage from "../Dashboard/AdminPage";
import { getKmzPrintLogs } from "../../../services/metaverseApi";

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
    time: date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

const toDateInputValue = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const normalizeLog = (item) => {
  // Print and upload happen together in this workflow, so show only one date.
  // Prefer printed_at because this page is specifically a print log.
  const logDateRaw = item.printed_at || item.imported_at;
  const logDate = formatDateTime(logDateRaw);

  const fallbackTitle = String(item.file_name || "Untitled Map")
    .replace(/\.kmz$/i, "")
    .replace(/[_-]+/g, " ")
    .trim();

  return {
    ...item,
    fileName: item.file_name,
    fileSize: formatFileSize(item.file_size),

    // Support the common backend field names without breaking older log records.
    // The title printed into the PDF is the authoritative title for this log.
    // Prefer it to an imported KMZ file title, which can be different.
    title:
      item.print_title ||
      item.report_title ||
      item.map_title ||
      item.title ||
      fallbackTitle ||
      "Untitled Map",

    printedBy:
      item.printed_by ||
      item.user_name ||
      item.username ||
      item.created_by ||
      "-",

    logDate: logDate.date,
    logTime: logDate.time,
    logDateValue: toDateInputValue(logDateRaw),
  };
};

// File actions use Django's streaming endpoints. In particular, downloading a
// KMZ must never fetch/expand it in Chrome memory or open it as a browser tab.
const storedFileActionUrl = (item, action) => {
  if (item?.id == null || !/^\d+$/.test(String(item.id))) return null;
  const sourceUrl = item.report_url || item.file_url;
  if (!sourceUrl) return null;
  try {
    const origin = new URL(sourceUrl, window.location.href).origin;
    return `${origin}/api/kmz-print-logs/${encodeURIComponent(item.id)}/${action}/`;
  } catch {
    return null;
  }
};

// Open-in-map functionality is intentionally kept commented for now.
// const openLogInMap = (item) => {
//   if (!item.file_url) return;
//
//   sessionStorage.setItem(
//     "ruda:open-kmz-in-map",
//     JSON.stringify({
//       url: item.file_url,
//       fileName: item.fileName,
//     }),
//   );
//
//   window.location.assign("/gis-metaverse");
// };

export default function KMZLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");

  const [appliedQuery, setAppliedQuery] = useState("");
  const [appliedDate, setAppliedDate] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    let mounted = true;

    getKmzPrintLogs()
      .then((data) => {
        if (mounted) {
          setLogs((Array.isArray(data) ? data : []).map(normalizeLog));
        }
      })
      .catch(() => {
        if (mounted) {
          setError("KMZ print logs could not be loaded.");
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredLogs = useMemo(() => {
    const normalizedQuery = appliedQuery.trim().toLowerCase();

    return logs.filter((item) => {
      const fileName = String(item.fileName || "").toLowerCase();
      const title = String(item.title || "").toLowerCase();

      const matchesQuery =
        !normalizedQuery ||
        fileName.includes(normalizedQuery) ||
        title.includes(normalizedQuery);

      const matchesDate = !appliedDate || item.logDateValue === appliedDate;

      return matchesQuery && matchesDate;
    });
  }, [logs, appliedQuery, appliedDate]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const visibleLogs = filteredLogs.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const runSearch = () => {
    setAppliedQuery(query);
    setAppliedDate(date);
    setPage(1);
  };

  const resetFilters = () => {
    setQuery("");
    setDate("");
    setAppliedQuery("");
    setAppliedDate("");
    setPage(1);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter") {
      runSearch();
    }
  };

  return (
    <AdminPage>
      <div className="px-4 py-5 text-slate-800 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-[1800px]">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <ClipboardList size={24} className="text-[#0f3d2e]" />

                <h2 className="text-xl font-semibold tracking-normal text-slate-800">
                  KMZ Print Logs
                </h2>
              </div>

              <p className="mt-1.5 text-sm font-normal text-slate-500">
                View uploaded KMZ files and their saved printed maps.
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
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_230px_auto_auto]">
              <div className="relative">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search by map title or KMZ file name..."
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <label className="relative flex h-11 items-center rounded-lg border border-slate-200 bg-white px-3">
                <CalendarDays
                  size={17}
                  className="mr-2.5 shrink-0 text-slate-500"
                />

                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none"
                />
              </label>

              <button
                type="button"
                onClick={runSearch}
                className="h-11 rounded-lg bg-[#0f4d39] px-6 text-sm font-semibold text-white transition hover:bg-[#123f32]"
              >
                Search
              </button>

              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
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
              <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <Th>#</Th>
                    <Th>Title</Th>
                    <Th>KMZ File</Th>
                    <Th>Date</Th>
                    <Th>Printed By</Th>
                    <Th>KMZ Preview</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>

                <tbody>
                  {loading && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-16 text-center text-sm text-slate-500"
                      >
                        Loading KMZ print logs...
                      </td>
                    </tr>
                  )}

                  {!loading && error && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-16 text-center text-sm text-red-600"
                      >
                        {error}
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    !error &&
                    visibleLogs.map((item, index) => (
                      <tr
                        key={item.id}
                        className="border-t border-slate-100 hover:bg-slate-50/60"
                      >
                        <Td>{(safePage - 1) * pageSize + index + 1}</Td>

                        <Td>
                          <div className="max-w-[260px] whitespace-normal font-medium leading-5 text-slate-800">
                            {item.title}
                            <div className="mt-1 text-[11px] font-normal text-slate-500">
                              Saved print log #{item.id}
                            </div>
                          </div>
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

                        <Td>
                          <DateCell date={item.logDate} time={item.logTime} />
                        </Td>

                        <Td>
                          <span className="font-medium text-slate-700">
                            {item.printedBy}
                          </span>
                        </Td>

                        <Td>
                          <KMZPreview
                            fileName={item.fileName}
                            reportUrl={item.report_url}
                            viewUrl={storedFileActionUrl(item, "view-pdf")}
                          />
                        </Td>

                        <Td>
                          <div className="flex min-w-max items-center gap-2">
                            <ActionButton
                              icon={<Eye size={15} />}
                              label="View Map"
                              href={item.report_url ? storedFileActionUrl(item, "view-pdf") : null}
                              newTab
                            />
                            <ActionButton
                              icon={<Download size={15} />}
                              label="KMZ"
                              href={item.file_url ? storedFileActionUrl(item, "download-kmz") : null}
                            />
                            <ActionButton
                              icon={<FileDown size={15} />}
                              label="PDF"
                              href={item.report_url ? storedFileActionUrl(item, "download-pdf") : null}
                            />
                          </div>
                        </Td>
                      </tr>
                    ))}

                  {!loading && !error && visibleLogs.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-16 text-center text-sm text-slate-500"
                      >
                        No KMZ print logs match the current search.
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
      </div>
    </AdminPage>
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
    <div className="min-w-[120px]">
      <div className="font-medium text-slate-700">{date}</div>
      <div className="mt-0.5 text-xs text-slate-400">{time}</div>
    </div>
  );
}

function ActionButton({ icon, label, accent = false, href, newTab = false }) {
  const className = `inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition ${
    accent
      ? "border-emerald-200 text-[#0f5b43] hover:bg-emerald-50"
      : "border-slate-200 text-slate-700 hover:bg-slate-50"
  }`;
  if (!href) {
    return <button type="button" disabled title="Saved file unavailable" className={`${className} cursor-not-allowed opacity-40`}>{icon}{label}</button>;
  }
  return (
    <a href={href} className={className}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      title={newTab ? "View the original saved printed map (PDF)" : `Download ${label} directly`}>
      {icon}{label}
    </a>
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

// This table intentionally does NOT decode every KMZ into an SVG thumbnail.
// Raw geometry previews are not the same as the paper map (basemap, legend,
// callout, scale bar, inset) and can look scattered when KML includes multiple
// placemarks. Loading many ZIPs at once can also exhaust Chrome memory.
// The stored PDF is the authoritative visual record of the printed map.
function KMZPreview({ fileName, reportUrl, viewUrl }) {
  const available = Boolean(reportUrl && viewUrl);
  const contents = (
    <div className={`flex h-[82px] w-[132px] flex-col items-center justify-center gap-1 rounded-md border px-2 text-center ${
      available
        ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
        : "border-dashed border-slate-300 bg-slate-50 text-slate-400"
    }`} title={fileName || "KMZ map"}>
      <FileDown size={21} />
      <span className="text-[11px] font-semibold leading-4">
        {available ? "View saved map" : "PDF unavailable"}
      </span>
      <span className="text-[9px] leading-3">{available ? "Original print PDF" : "KMZ still downloadable"}</span>
    </div>
  );
  return available ? (
    <a href={viewUrl} target="_blank" rel="noopener noreferrer" aria-label={`View saved map for ${fileName || "KMZ"}`}>
      {contents}
    </a>
  ) : contents;
}

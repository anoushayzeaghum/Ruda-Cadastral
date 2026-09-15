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
import Header from "../../Header";
import JSZip from "jszip";
import { kml as kmlToGeoJSON } from "@tmcw/togeojson";
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
    title:
      item.title ||
      item.map_title ||
      item.report_title ||
      item.print_title ||
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

const openStoredFile = (url) => {
  if (url) {
    window.open(url, "_blank", "noopener,noreferrer");
  }
};

const downloadStoredFile = async (url, fallbackName) => {
  if (!url) return;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = objectUrl;
    anchor.download = fallbackName || "download";

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch (downloadError) {
    console.warn(
      "Direct download failed; opening stored file instead.",
      downloadError,
    );

    window.open(url, "_blank", "noopener,noreferrer");
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
    <div className="min-h-screen bg-[#f4f7f6] text-slate-800">
      <Header />

      <main className="px-4 py-5 sm:px-6 lg:px-8">
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
                            fileUrl={item.file_url}
                            fileName={item.fileName}
                          />
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
                              onClick={() =>
                                downloadStoredFile(item.file_url, item.fileName)
                              }
                            />

                            <ActionButton
                              icon={<FileDown size={15} />}
                              label="PDF"
                              onClick={() =>
                                downloadStoredFile(
                                  item.report_url,
                                  `${
                                    item.fileName.replace(/\.kmz$/i, "") ||
                                    "KMZ_Map"
                                  }.pdf`,
                                )
                              }
                            />

                            {/*
                            <ActionButton
                              icon={<MapPinned size={15} />}
                              label="Open in Map"
                              accent
                              onClick={() => openLogInMap(item)}
                            />
                            */}
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
      </main>
    </div>
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

function collectCoordinatePairs(geometry, pairs) {
  if (!geometry) return;

  const walk = (value) => {
    if (!Array.isArray(value)) return;

    if (
      value.length >= 2 &&
      typeof value[0] === "number" &&
      typeof value[1] === "number"
    ) {
      pairs.push([value[0], value[1]]);
      return;
    }

    value.forEach(walk);
  };

  walk(geometry.coordinates);
}

function geometryToSvgPaths(geometry, project) {
  if (!geometry) return [];

  const paths = [];

  const lineToPath = (coordinates, close = false) => {
    if (!coordinates?.length) return "";

    const commands = coordinates.map((coord, index) => {
      const [x, y] = project(coord);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    });

    return `${commands.join(" ")}${close ? " Z" : ""}`;
  };

  if (geometry.type === "Polygon") {
    geometry.coordinates.forEach((ring) => {
      const path = lineToPath(ring, true);
      if (path) paths.push(path);
    });
  } else if (geometry.type === "MultiPolygon") {
    geometry.coordinates.forEach((polygon) => {
      polygon.forEach((ring) => {
        const path = lineToPath(ring, true);
        if (path) paths.push(path);
      });
    });
  } else if (geometry.type === "LineString") {
    const path = lineToPath(geometry.coordinates, false);
    if (path) paths.push(path);
  } else if (geometry.type === "MultiLineString") {
    geometry.coordinates.forEach((line) => {
      const path = lineToPath(line, false);
      if (path) paths.push(path);
    });
  } else if (geometry.type === "Point") {
    const [x, y] = project(geometry.coordinates);
    paths.push({ point: true, x, y });
  } else if (geometry.type === "MultiPoint") {
    geometry.coordinates.forEach((coord) => {
      const [x, y] = project(coord);
      paths.push({ point: true, x, y });
    });
  }

  return paths;
}

function KMZPreview({ fileUrl, fileName }) {
  const [preview, setPreview] = useState({
    loading: true,
    paths: [],
    error: "",
  });

  useEffect(() => {
    let cancelled = false;

    const loadPreview = async () => {
      if (!fileUrl) {
        setPreview({
          loading: false,
          paths: [],
          error: "KMZ unavailable",
        });
        return;
      }

      try {
        setPreview({
          loading: true,
          paths: [],
          error: "",
        });

        const response = await fetch(fileUrl);

        if (!response.ok) {
          throw new Error(`KMZ request failed (${response.status})`);
        }

        const kmzBuffer = await response.arrayBuffer();
        const zip = await JSZip.loadAsync(kmzBuffer);

        const kmlEntry = Object.values(zip.files).find(
          (entry) => !entry.dir && entry.name.toLowerCase().endsWith(".kml"),
        );

        if (!kmlEntry) {
          throw new Error("No KML document found inside KMZ");
        }

        const kmlText = await kmlEntry.async("text");
        const xml = new DOMParser().parseFromString(kmlText, "text/xml");

        if (xml.querySelector("parsererror")) {
          throw new Error("Invalid KML");
        }

        const geojson = kmlToGeoJSON(xml);
        const features = geojson?.features || [];

        const coordinatePairs = [];
        features.forEach((feature) => {
          collectCoordinatePairs(feature.geometry, coordinatePairs);
        });

        if (!coordinatePairs.length) {
          throw new Error("No drawable geometry");
        }

        const lngs = coordinatePairs.map(([lng]) => lng);
        const lats = coordinatePairs.map(([, lat]) => lat);

        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);

        const width = 132;
        const height = 82;
        const padding = 8;

        const geoWidth = Math.max(maxLng - minLng, 0.0000001);
        const geoHeight = Math.max(maxLat - minLat, 0.0000001);

        const scale = Math.min(
          (width - padding * 2) / geoWidth,
          (height - padding * 2) / geoHeight,
        );

        const renderedWidth = geoWidth * scale;
        const renderedHeight = geoHeight * scale;

        const offsetX = (width - renderedWidth) / 2;
        const offsetY = (height - renderedHeight) / 2;

        const project = ([lng, lat]) => [
          offsetX + (lng - minLng) * scale,
          offsetY + renderedHeight - (lat - minLat) * scale,
        ];

        const svgPaths = [];

        features.forEach((feature, featureIndex) => {
          const featurePaths = geometryToSvgPaths(feature.geometry, project);

          featurePaths.forEach((path, pathIndex) => {
            svgPaths.push({
              key: `${featureIndex}-${pathIndex}`,
              value: path,
            });
          });
        });

        if (!cancelled) {
          setPreview({
            loading: false,
            paths: svgPaths,
            error: "",
          });
        }
      } catch (previewError) {
        console.warn("KMZ preview could not be generated.", previewError);

        if (!cancelled) {
          setPreview({
            loading: false,
            paths: [],
            error: "Preview unavailable",
          });
        }
      }
    };

    loadPreview();

    return () => {
      cancelled = true;
    };
  }, [fileUrl]);

  if (preview.loading) {
    return (
      <div className="flex h-[82px] w-[132px] items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-[11px] text-slate-400">
        Loading...
      </div>
    );
  }

  if (preview.error || preview.paths.length === 0) {
    return (
      <div className="flex h-[82px] w-[132px] items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 text-center text-[11px] leading-4 text-slate-400">
        {preview.error || "Preview unavailable"}
      </div>
    );
  }

  return (
    <div
      className="h-[82px] w-[132px] overflow-hidden rounded-md border border-slate-200 bg-[#eef3f1] shadow-sm"
      title={fileName || "KMZ preview"}
    >
      <svg
        viewBox="0 0 132 82"
        className="h-full w-full"
        role="img"
        aria-label={`${fileName || "KMZ"} geometry preview`}
      >
        <rect x="0" y="0" width="132" height="82" fill="#eef3f1" />

        {preview.paths.map(({ key, value }) =>
          typeof value === "string" ? (
            <path
              key={key}
              d={value}
              fill="rgba(250, 204, 21, 0.22)"
              stroke="#d39e00"
              strokeWidth="1.6"
              vectorEffect="non-scaling-stroke"
            />
          ) : (
            <circle
              key={key}
              cx={value.x}
              cy={value.y}
              r="2.5"
              fill="#d39e00"
              stroke="#ffffff"
              strokeWidth="0.8"
            />
          ),
        )}
      </svg>
    </div>
  );
}

import { useState } from "react";
import { Download, FileJson, Trash2, X } from "lucide-react";
import { exportAOIGeoJSON, exportAOIKMZ } from "../ExportAOI.jsx";

const format = (value, digits = 3) =>
  Number.isFinite(Number(value))
    ? Number(value).toLocaleString(undefined, { maximumFractionDigits: digits })
    : "0";

export default function AOIAnalysisPanel({ result, onClose, onClear }) {
  const [tab, setTab] = useState("summary");
  if (!result?.feature || !result?.analysis) return null;
  const { feature, analysis } = result;

  return (
    <div className="absolute bottom-3 right-3 z-30 flex max-h-[calc(100vh-140px)] w-[min(430px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between gap-2 bg-[#0f3d2e] px-3 py-2.5 text-white">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold uppercase tracking-wide">
            AOI Analysis
          </h3>
          <p className="text-[10px] text-white/70">
            Drawn polygon spatial summary
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => exportAOIKMZ(feature)}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-2 text-[10px] font-semibold hover:bg-white/20"
            title="Download KMZ"
          >
            <Download size={14} /> KMZ
          </button>
          <button
            onClick={() => exportAOIGeoJSON(feature)}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-2 text-[10px] font-semibold hover:bg-white/20"
            title="Download GeoJSON"
          >
            <FileJson size={14} /> GeoJSON
          </button>
          <button
            onClick={onClear}
            className="rounded-lg p-1.5 hover:bg-white/10"
            title="Clear AOI"
          >
            <Trash2 size={17} />
          </button>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-white/10"
            title="Close panel"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-200 px-3 py-2">
        {[
          ["summary", "Summary"],
          ["details", "Khasra Details"],
          ["possession", "Possession Details"],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`rounded-md px-3 py-1.5 text-[11px] font-semibold ${tab === value ? "bg-green-700 text-white" : "bg-slate-100 text-slate-700"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {tab === "summary" ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat
                label="Area"
                value={`${format(analysis.totalAreaAcres)} ac`}
              />
              <Stat
                label="Hectares"
                value={format(analysis.totalAreaHectares)}
              />
              <Stat label="Khasras" value={analysis.khasraCount} />
              <Stat label="Mauzas" value={analysis.mauzaCount} />
            </div>
            <Info
              label="Khasra Numbers"
              value={analysis.khasraNumbers.join(", ") || "None"}
            />
            <Info
              label="Mauzas"
              value={analysis.mauzaNames.join(", ") || "None"}
            />
            <Info
              label="Tehsil"
              value={analysis.tehsilNames.join(", ") || "N/A"}
            />
            <Info
              label="District"
              value={analysis.districtNames.join(", ") || "N/A"}
            />

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
                Land Category Summary
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="border-y border-slate-200 bg-white text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2 text-right">Khasras</th>
                      <th className="px-3 py-2 text-right">Area (ac)</th>
                      <th className="px-3 py-2 text-right">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.categories.length ? (
                      analysis.categories.map((row) => (
                        <tr
                          key={row.category}
                          className="border-b border-slate-100"
                        >
                          <td className="px-3 py-2 font-medium">
                            {row.category}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {row.khasraCount}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {format(row.areaAcres)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {format(row.percentage, 2)}%
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-3 py-5 text-center text-slate-500"
                        >
                          No loaded land-category layer intersects the AOI.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : tab === "details" ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2">Khasra</th>
                  <th className="px-3 py-2">Mauza</th>
                  <th className="px-3 py-2">Tehsil</th>
                  <th className="px-3 py-2 text-right">
                    Intersected Area (ac)
                  </th>
                  <th className="px-3 py-2 text-right">Parcel Covered</th>
                </tr>
              </thead>
              <tbody>
                {analysis.details.length ? (
                  analysis.details.map((row) => (
                    <tr key={row.key} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-semibold">
                        {row.khasraNumber}
                      </td>
                      <td className="px-3 py-2">{row.mauza}</td>
                      <td className="px-3 py-2">{row.tehsil}</td>
                      <td className="px-3 py-2 text-right">
                        {format(row.areaAcres)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {format(row.overlapPercentage, 2)}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-3 py-5 text-center text-slate-500"
                    >
                      No Khasra parcel meaningfully intersects the AOI.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Khasra</th>
                  <th className="px-3 py-2">Mauza</th>
                  <th className="px-3 py-2 text-right">Area (ac)</th>
                  <th className="px-3 py-2 text-right">AOI %</th>
                </tr>
              </thead>
              <tbody>
                {analysis.possessionDetails?.length ? (
                  analysis.possessionDetails.map((row) => (
                    <tr key={row.key} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-semibold">
                        {row.category}
                      </td>
                      <td className="px-3 py-2">{row.khasraNumber}</td>
                      <td className="px-3 py-2">{row.mauza}</td>
                      <td className="px-3 py-2 text-right">
                        {format(row.areaAcres)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {format(row.percentage, 2)}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-3 py-5 text-center text-slate-500"
                    >
                      No possession, mutated, demarcated, awarded, or state-land
                      feature intersects the AOI.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-center">
      <p className="text-[9px] uppercase text-slate-500">{label}</p>
      <p className="text-sm font-bold text-green-700">{value}</p>
    </div>
  );
}
function Info({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 p-2">
      <p className="text-[10px] font-semibold uppercase text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xs text-slate-800">{value}</p>
    </div>
  );
}

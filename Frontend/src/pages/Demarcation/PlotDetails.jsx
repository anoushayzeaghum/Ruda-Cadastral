import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { printOfficialDemarcation } from "./PrintReports/PrintOfficialDemarcation";
import { printPartPlan } from "./PrintReports/PrintPartPlan";
import { printPossessionCertificate } from "./PrintReports/PrintPossessionCertificate";
import { printReport } from "./PrintReports/PrintReport";
import { printSitePlan } from "./PrintReports/PrintSitePlan";
import { buildPlotDetails, valueOrDash } from "./PrintReports/printUtils";

export default function PlotDetails({
  parcel = null,
  filters = {},
  contextGeojson = null,
  roadsGeojson = null,
}) {
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(!parcel);

  useEffect(() => {
    setIsCollapsed(!parcel);
    setShowPrintOptions(false);
  }, [parcel]);

  const details = buildPlotDetails(parcel, filters);

  const fields = [
    ["Project", valueOrDash(details.project)],
    ["Block", valueOrDash(details.block)],
    ["Plot No", valueOrDash(details.plotNo)],
    ["Plot Type / Landuse", valueOrDash(details.landUse)],
    ["Plot Area", valueOrDash(details.plotArea)],
    ["Dimension", valueOrDash(details.dimension)],
    ["Road Width", valueOrDash(details.roadFt)],
    ["Road Facing", valueOrDash(details.roadFacing)],
    ["Park Front", valueOrDash(details.parkFront)],
    ["Storey", valueOrDash(details.storey)],
    ["Possession", valueOrDash(details.possession)],
    ["Possession Status", valueOrDash(details.possessionStatus)],
    ["Canceled", valueOrDash(details.canceled)],
    ["Site Plan", valueOrDash(details.sitePlan)],
    ["Unique ID", valueOrDash(details.uniqueId)],
    ["Owner", valueOrDash(details.owner)],
    ["Transfer Plot No", valueOrDash(details.transferPlotNo)],
    ["Transfer Category", valueOrDash(details.transferCategory)],
    ["Remarks", valueOrDash(details.remarks)],
  ];

  const runPrintAction = async (action) => {
    setShowPrintOptions(false);
    await action({
      parcel,
      filters,
      details,
      contextGeojson,
      roadsGeojson,
    });
  };

  const printOptions = [
    {
      label: "Print Site Plan",
      action: printSitePlan,
    },
    {
      label: "Print Part Plan",
      action: printPartPlan,
    },
    {
      label: "Print Report",
      action: printReport,
    },
    {
      label: "Print Official Demarcation",
      action: printOfficialDemarcation,
    },
    {
      label: "Print Possession Certificate",
      action: printPossessionCertificate,
    },
  ];

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-md border border-[#b8c2cc] bg-white/95 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2 border-b border-gray-200 bg-gray-50/50 px-3 py-2 sm:gap-3 sm:px-3 sm:py-2.5">
        <button
          type="button"
          onClick={() => setIsCollapsed((previous) => !previous)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <h2 className="text-[14px] font-bold uppercase tracking-wide text-[#5b5b5b] sm:text-[17px]">
            Plot Details
          </h2>
          {parcel && (
            <span className="shrink-0 rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold text-green-700 sm:text-[11px]">
              Plot {details.plotNo}
            </span>
          )}
        </button>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {parcel && (
            <div className="relative">
              <button
                onClick={() => setShowPrintOptions((previous) => !previous)}
                className="rounded bg-green-700 px-2 py-1.5 text-[11px] font-semibold tracking-wider text-white transition hover:bg-[#165c2d] sm:px-3 sm:py-2 sm:text-[12px]"
                type="button"
                aria-expanded={showPrintOptions}
              >
                Print
              </button>

              {showPrintOptions && (
                <div className="absolute right-0 top-[34px] z-[100] w-[225px] overflow-hidden rounded border border-gray-300 bg-white shadow-lg sm:top-[38px] sm:w-[240px]">
                  {printOptions.map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => runPrintAction(option.action)}
                      className="w-full border-b border-gray-100 px-3 py-2.5 text-left text-[12px] text-gray-700 transition last:border-b-0 hover:bg-gray-100 sm:text-[13px]"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed((previous) => !previous)}
            title={isCollapsed ? "Expand" : "Collapse"}
            className="flex h-7 w-7 items-center justify-center rounded text-[#5b5b5b] transition hover:bg-gray-100 sm:h-8 sm:w-8"
          >
            {isCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="max-h-[280px] overflow-auto p-3 sm:max-h-[350px] sm:p-4">
          {!parcel ? (
            <div className="flex items-center justify-center py-6 text-sm text-gray-400">
              No plot selected.
            </div>
          ) : (
            <div className="space-y-0">
              {fields.map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-start justify-between gap-2 border-b border-gray-100 py-1.5 last:border-0 sm:gap-3 sm:py-2"
                >
                  <div className="shrink-0 text-[11px] text-gray-500 sm:text-[12px]">
                    {label}
                  </div>
                  <div className="break-words text-right text-[11px] font-semibold text-gray-800 sm:text-[12px]">
                    {String(value)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

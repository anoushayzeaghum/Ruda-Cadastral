import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const MASTER_PLAN_COLORS = {
  greenOpenAreaParks: "#159E49",
  condominiums: "#D5ACD2",
  mixUse: "#9D9E31",
  commercial: "#9FD3EB",
  publicBuilding: "#EFA4AA",
  residential10Marla: "#F89A1C",
  residential1Kanal: "#C97800",
  petrolPump: "#E34E52",
  grandMosque: "#F8F07E",
  rudaOffice: "#62D9AA",
  convenienceShops: "#A84FA2",
  cb1Boundary: "#00F51A",
  canal: "#9FD3EB",
  passage: "#F4F4F4",
  utility: "#EFA4AA",
  fallback: "#BFC3C9",
};

const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\\s+/g, " ");

const getColor = (label) => {
  const value = normalizeText(label);

  if (
    value.includes("cb - 1 boundary") ||
    value.includes("cb-1 boundary") ||
    value.includes("cb 1 boundary") ||
    value.includes("cb1 boundary")
  )
    return MASTER_PLAN_COLORS.cb1Boundary;

  if (
    value === "green area" ||
    value === "green areas" ||
    value === "green" ||
    value === "green belt" ||
    value === "open area" ||
    value === "open areas" ||
    value === "open space" ||
    value === "open spaces" ||
    value === "park" ||
    value === "parks"
  )
    return MASTER_PLAN_COLORS.greenOpenAreaParks;

  if (value.includes("condominium") || value.includes("condo"))
    return MASTER_PLAN_COLORS.condominiums;

  if (
    value.includes("mix use") ||
    value.includes("mixed use") ||
    value.includes("mix-use") ||
    value.includes("mixed-use")
  )
    return MASTER_PLAN_COLORS.mixUse;

  if (value.includes("commercial")) return MASTER_PLAN_COLORS.commercial;

  if (
    value.includes("public building") ||
    value.includes("public use") ||
    value.includes("public facility")
  )
    return MASTER_PLAN_COLORS.publicBuilding;

  if (value.includes("residential")) {
    if (
      value.includes("1 kanal") ||
      value.includes("1-kanal") ||
      value.includes("1kanal")
    )
      return MASTER_PLAN_COLORS.residential1Kanal;

    return MASTER_PLAN_COLORS.residential10Marla;
  }

  if (
    value.includes("petrol pump") ||
    value.includes("fuel station") ||
    value.includes("filling station")
  )
    return MASTER_PLAN_COLORS.petrolPump;

  if (
    value.includes("grand mosque") ||
    value.includes("mosque") ||
    value.includes("masjid") ||
    value.includes("religious building")
  )
    return MASTER_PLAN_COLORS.grandMosque;

  if (value.includes("ruda office")) return MASTER_PLAN_COLORS.rudaOffice;

  if (value.includes("convenience shop") || value.includes("convenience store"))
    return MASTER_PLAN_COLORS.convenienceShops;

  if (value.includes("canal") || value.includes("water channel"))
    return MASTER_PLAN_COLORS.canal;

  if (
    value.includes("passage") ||
    value.includes("walkway") ||
    value.includes("corridor")
  )
    return MASTER_PLAN_COLORS.passage;

  if (value.includes("utility")) return MASTER_PLAN_COLORS.utility;

  return MASTER_PLAN_COLORS.fallback;
};

export default function LandUseBreakdown({
  items = [],
  selectedProjectName = "",
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const total = items.reduce((sum, item) => sum + Number(item.count || 0), 0);

  const chartItems = useMemo(
    () => items.map((item) => ({ ...item, color: getColor(item.label) })),
    [items],
  );

  const gradientStops = useMemo(() => {
    if (!chartItems.length || !total) return "#e5e7eb 0deg 360deg";

    let current = 0;
    return chartItems
      .map((item) => {
        const start = (current / total) * 360;
        current += Number(item.count || 0);
        const end = (current / total) * 360;
        return `${item.color} ${start}deg ${end}deg`;
      })
      .join(", ");
  }, [chartItems, total]);

  const topItem = chartItems[0];

  return (
    <div className="overflow-hidden rounded-md border border-[#b8c2cc] bg-white/95 shadow-xl backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setIsCollapsed((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 border-b border-gray-200 bg-gray-50/50 px-3 py-2 text-left transition hover:bg-gray-50 sm:px-3 sm:py-2.5"
      >
        <div className="min-w-0">
          <h2 className="text-[13px] font-bold uppercase tracking-wide text-[#5b5b5b] sm:text-[15px]">
            Landuse Breakdown
          </h2>
          {selectedProjectName && (
            <div className="truncate text-[10px] text-[#6b7280] sm:text-[11px]">
              {selectedProjectName}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-[11px] font-medium text-[#6b7280] sm:text-[12px]">
            Total: {total}
          </span>
          {isCollapsed ? (
            <ChevronUp size={16} className="text-[#5b5b5b]" />
          ) : (
            <ChevronDown size={16} className="text-[#5b5b5b]" />
          )}
        </div>
      </button>

      {!isCollapsed && (
        <div className="flex items-center justify-between gap-3 px-3 py-2 sm:gap-4 sm:px-3 sm:py-2.5">
          {!chartItems.length ? (
            <div className="flex w-full items-center justify-center py-6 text-center text-sm text-gray-400">
              Select a project to load land use summary.
            </div>
          ) : (
            <>
              <div className="flex shrink-0 items-center justify-center">
                <div
                  className="relative h-[100px] w-[100px] rounded-full shadow-[0_10px_24px_rgba(0,0,0,0.10)] sm:h-[130px] sm:w-[130px]"
                  style={{ background: `conic-gradient(${gradientStops})` }}
                >
                  <div className="absolute inset-[18px] flex flex-col items-center justify-center rounded-full border border-[#e5e7eb] bg-white px-1 text-center shadow-inner sm:inset-[22px] sm:px-2">
                    <span className="text-[9px] font-medium text-[#6b7280] sm:text-[11px]">
                      Top Use
                    </span>
                    <span className="text-[15px] font-bold text-[#111827] sm:text-[19px]">
                      {topItem?.percentage || 0}%
                    </span>
                    <span className="max-w-[56px] truncate text-[8px] font-semibold sm:max-w-[72px] sm:text-[10px]">
                      <span
                        style={{
                          color: topItem?.color || MASTER_PLAN_COLORS.fallback,
                        }}
                      >
                        {topItem?.label || "-"}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="max-h-[120px] flex-1 space-y-1.5 overflow-auto pr-1 sm:max-h-[150px]">
                {chartItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-1.5 text-[11px] sm:gap-2 sm:text-[12px]"
                  >
                    <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full sm:h-3 sm:w-3"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate font-medium text-[#374151]">
                        {item.label}
                      </span>
                    </div>
                    <span className="shrink-0 font-semibold text-[#6b7280]">
                      {item.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const COLOR_MAP = {
  Residential: "#2563eb",
  "Residential Plot": "#2563eb",
  Commercial: "#facc15",
  "Commercial Plot": "#facc15",
  "Green Belt": "#22c55e",
  "Barren Land": "#92400e",
  Road: "#ef4444",
  Park: "#15803d",
  "Public Use": "#a855f7",
  "Recreational Facility": "#6366f1",
  Parking: "#f97316",
  "Religious Building": "#c084fc",
  Other: "#9ca3af",
};

const getColor = (label, index) => {
  const fallback = ["#9ca3af", "#14b8a6", "#f43f5e", "#84cc16", "#06b6d4", "#8b5cf6"];
  return COLOR_MAP[label] || fallback[index % fallback.length];
};

export default function LandUseBreakdown({ items = [], selectedProjectName = "" }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const total = items.reduce((sum, item) => sum + Number(item.count || 0), 0);

  const chartItems = useMemo(
    () => items.map((item, index) => ({ ...item, color: getColor(item.label, index) })),
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
        className="flex w-full items-center justify-between gap-3 border-b border-[#d4dbe2] px-3 py-2.5 text-left transition hover:bg-gray-50 sm:px-4 sm:py-3"
      >
        <div className="min-w-0">
          <h2 className="text-[13px] font-bold uppercase tracking-wide text-[#5b5b5b] sm:text-[15px]">
            Landuse Breakdown
          </h2>
          {selectedProjectName && (
            <div className="truncate text-[10px] text-[#6b7280] sm:text-[11px]">{selectedProjectName}</div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-[11px] font-medium text-[#6b7280] sm:text-[12px]">Total: {total}</span>
          {isCollapsed ? (
            <ChevronUp size={16} className="text-[#5b5b5b]" />
          ) : (
            <ChevronDown size={16} className="text-[#5b5b5b]" />
          )}
        </div>
      </button>

      {!isCollapsed && (
        <div className="flex items-center justify-between gap-3 px-3 py-2 sm:gap-4 sm:px-4 sm:py-3">
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
                    <span className="text-[9px] font-medium text-[#6b7280] sm:text-[11px]">Top Use</span>
                    <span className="text-[15px] font-bold text-[#111827] sm:text-[19px]">{topItem?.percentage || 0}%</span>
                    <span className="max-w-[56px] truncate text-[8px] font-semibold text-[#16a34a] sm:max-w-[72px] sm:text-[10px]">
                      {topItem?.label || "-"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="max-h-[120px] flex-1 space-y-1 overflow-auto pr-1 sm:max-h-[150px] sm:space-y-1.5">
                {chartItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-1.5 text-[11px] sm:gap-2 sm:text-[12px]">
                    <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full sm:h-3 sm:w-3" style={{ backgroundColor: item.color }} />
                      <span className="truncate font-medium text-[#374151]">{item.label}</span>
                    </div>
                    <span className="shrink-0 font-semibold text-[#6b7280]">{item.percentage}%</span>
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

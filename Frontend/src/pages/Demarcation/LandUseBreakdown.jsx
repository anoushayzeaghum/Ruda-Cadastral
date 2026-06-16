import React, { useMemo } from "react";

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
    <div className="bg-white border border-[#b8c2cc] shadow-[0_6px_18px_rgba(15,23,42,0.06)] h-[275px] rounded-md overflow-hidden">
      <div className="h-[56px] border-b border-[#d4dbe2] px-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold uppercase tracking-wide text-[#5b5b5b]">
            Landuse Breakdown
          </h2>
          {selectedProjectName && (
            <div className="text-[11px] text-[#6b7280] truncate">{selectedProjectName}</div>
          )}
        </div>
        <span className="text-[12px] text-[#6b7280] font-medium shrink-0">Total: {total}</span>
      </div>

      <div className="px-4 py-3 h-[calc(100%-56px)] flex items-center justify-between gap-4">
        {!chartItems.length ? (
          <div className="w-full h-full flex items-center justify-center text-center text-gray-400 text-sm">
            Select a project to load land use summary.
          </div>
        ) : (
          <>
            <div className="flex-1 flex items-center justify-center">
              <div
                className="relative h-[150px] w-[150px] rounded-full shadow-[0_10px_24px_rgba(0,0,0,0.10)]"
                style={{ background: `conic-gradient(${gradientStops})` }}
              >
                <div className="absolute inset-[26px] rounded-full bg-white shadow-inner flex flex-col items-center justify-center border border-[#e5e7eb] text-center px-2">
                  <span className="text-[12px] font-medium text-[#6b7280]">Top Use</span>
                  <span className="text-[22px] font-bold text-[#111827]">{topItem?.percentage || 0}%</span>
                  <span className="text-[11px] text-[#16a34a] font-semibold truncate max-w-[82px]">
                    {topItem?.label || "-"}
                  </span>
                </div>
              </div>
            </div>

            <div className="w-[145px] space-y-1.5 overflow-auto max-h-[175px] pr-1">
              {chartItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-2 text-[12px]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-[#374151] truncate font-medium">{item.label}</span>
                  </div>
                  <span className="text-[#6b7280] font-semibold shrink-0">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

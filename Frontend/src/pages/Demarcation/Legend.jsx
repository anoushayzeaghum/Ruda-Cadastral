import React, { useState } from "react";
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

export default function Legend({ items = [], selectedParcelNumber = null }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-md border border-[#b8c2cc] bg-white/95 shadow-xl backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setIsCollapsed((prev) => !prev)}
        className="flex h-[46px] w-full items-center justify-between gap-3 border-b border-[#d4dbe2] px-3 text-left transition hover:bg-gray-50 sm:h-[52px] sm:px-4"
      >
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="text-[13px] font-bold uppercase tracking-wide text-[#5b5b5b] sm:text-[15px]">
            Legend
          </h2>
          <span className="hidden truncate text-[11px] text-[#4d4d4d] sm:inline sm:text-xs">
            Selected: {selectedParcelNumber || "None"}
          </span>
        </div>
        {isCollapsed ? (
          <ChevronUp size={16} className="shrink-0 text-[#5b5b5b]" />
        ) : (
          <ChevronDown size={16} className="shrink-0 text-[#5b5b5b]" />
        )}
      </button>

      {!isCollapsed && (
        <div className="max-h-[180px] overflow-auto p-3 sm:max-h-[240px] sm:p-4">
          {!items.length ? (
            <div className="py-6 text-center text-sm text-gray-400">No land use loaded.</div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-2 border-b border-gray-200 pb-2 text-[12px] sm:text-[14px]"
                >
                  <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                    <span
                      className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5"
                      style={{ backgroundColor: getColor(item.label, index) }}
                    />
                    <span className="truncate text-[#4d4d4d]">{item.label}</span>
                  </div>
                  <span className="shrink-0 font-semibold text-[#4d4d4d]">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import React from "react";

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
  return (
    <div className="bg-white border border-[#b8c2cc] shadow-[0_0_0_1px_rgba(0,0,0,0.02)] flex flex-col min-h-0 max-h-[300px]">
      <div className="h-[56px] border-b border-[#d4dbe2] px-4 flex items-center">
        <div className="flex items-center justify-between w-full gap-3">
          <h2 className="text-[17px] font-bold uppercase tracking-wide text-[#5b5b5b]">Legend</h2>
          <div className="text-sm text-[#4d4d4d] truncate">Selected: {selectedParcelNumber || "None"}</div>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-auto">
        {!items.length ? (
          <div className="text-center text-gray-400 text-sm py-6">No land use loaded.</div>
        ) : (
          <div className="space-y-3 pt-1">
            {items.map((item, index) => (
              <div key={item.label} className="flex items-center justify-between border-b border-gray-200 pb-2 text-[15px]">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="h-3.5 w-3.5 inline-block shrink-0" style={{ backgroundColor: getColor(item.label, index) }} />
                  <span className="text-[#4d4d4d] truncate">{item.label}</span>
                </div>
                <span className="font-semibold text-[#4d4d4d] shrink-0">{item.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

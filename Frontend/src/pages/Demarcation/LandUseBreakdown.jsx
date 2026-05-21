import React from "react";

const LANDUSE_DATA = [
  { label: "Residential", value: 73, color: "#209d4e" },
  { label: "Commercial", value: 8, color: "#256fe7" },
  { label: "Roads", value: 5, color: "rgb(255, 166, 12)" },
  { label: "Parks", value: 4, color: "#b163f9" },
  { label: "Public Use", value: 8, color: "#e33d3d" },
  { label: "Others", value: 2, color: "#08b928" },
];

const total = LANDUSE_DATA.reduce((sum, item) => sum + item.value, 0);

const gradientStops = (() => {
  let current = 0;
  return LANDUSE_DATA.map((item) => {
    const start = (current / total) * 360;
    current += item.value;
    const end = (current / total) * 360;
    return `${item.color} ${start}deg ${end}deg`;
  }).join(", ");
})();

export default function LandUseBreakdown() {
  return (
    <div className="bg-white border border-[#b8c2cc] shadow-[0_6px_18px_rgba(15,23,42,0.06)] h-[275px] rounded-md overflow-hidden">
      <div className="h-[56px] border-b border-[#d4dbe2] px-4 flex items-center justify-between">
        <h2 className="text-[17px] font-bold uppercase tracking-wide text-[#5b5b5b]">
          Landuse Breakdown
        </h2>
        <span className="text-[12px] text-[#6b7280] font-medium">
          Total: {total}%
        </span>
      </div>

      <div className="px-4 py-3 h-[calc(100%-56px)] flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center justify-center">
          <div
            className="relative h-[165px] w-[165px] rounded-full shadow-[0_10px_24px_rgba(0,0,0,0.10)]"
            style={{
              background: `conic-gradient(${gradientStops})`,
            }}
          >
            <div className="absolute inset-[28px] rounded-full bg-white shadow-inner flex flex-col items-center justify-center border border-[#e5e7eb]">
              <span className="text-[12px] font-medium text-[#6b7280]">
                Land Use
              </span>
              <span className="text-[22px] font-bold text-[#111827]">
                {LANDUSE_DATA[0].value}%
              </span>
              <span className="text-[11px] text-[#16a34a] font-semibold">
                Residential
              </span>
            </div>
          </div>
        </div>

        {/* <div className="w-[150px] space-y-2">
          {LANDUSE_DATA.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-2 text-[12px]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[#374151] truncate font-medium">
                  {item.label}
                </span>
              </div>
              <span className="text-[#6b7280] font-semibold">
                {item.value}%
              </span>
            </div>
          ))}
        </div> */}
      </div>
    </div>
  );
}

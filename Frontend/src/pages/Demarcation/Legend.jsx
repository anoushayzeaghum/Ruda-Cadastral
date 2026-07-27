import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const MASTER_PLAN_LAND_USE_COLORS = {
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
    .replace(/\s+/g, " ");

const getMasterPlanClass = (label) => {
  const value = normalizeText(label);

  if (
    value.includes("cb - 1 boundary") ||
    value.includes("cb-1 boundary") ||
    value.includes("cb 1 boundary") ||
    value.includes("cb1 boundary")
  )
    return "cb1Boundary";

  if (
    [
      "green area",
      "green areas",
      "green",
      "green belt",
      "open area",
      "open areas",
      "open space",
      "open spaces",
      "park",
      "parks",
    ].includes(value)
  )
    return "greenOpenAreaParks";
  if (value.includes("condominium") || value.includes("condo"))
    return "condominiums";
  if (
    value.includes("mix use") ||
    value.includes("mixed use") ||
    value.includes("mix-use") ||
    value.includes("mixed-use")
  )
    return "mixUse";
  if (value.includes("commercial")) return "commercial";
  if (
    value.includes("public building") ||
    value.includes("public use") ||
    value.includes("public facility")
  )
    return "publicBuilding";
  if (value.includes("residential")) {
    return value.includes("1 kanal") ||
      value.includes("1-kanal") ||
      value.includes("1kanal")
      ? "residential1Kanal"
      : "residential10Marla";
  }
  if (
    value.includes("petrol pump") ||
    value.includes("fuel station") ||
    value.includes("filling station")
  )
    return "petrolPump";
  if (
    value.includes("grand mosque") ||
    value.includes("mosque") ||
    value.includes("masjid") ||
    value.includes("religious building")
  )
    return "grandMosque";
  if (value.includes("ruda office")) return "rudaOffice";
  if (value.includes("convenience shop") || value.includes("convenience store"))
    return "convenienceShops";
  if (value.includes("canal") || value.includes("water channel"))
    return "canal";
  if (
    value.includes("passage") ||
    value.includes("walkway") ||
    value.includes("corridor") ||
    value === "road"
  )
    return "passage";
  if (value.includes("utility")) return "utility";
  return "fallback";
};

const getColor = (label) =>
  MASTER_PLAN_LAND_USE_COLORS[getMasterPlanClass(label)] ||
  MASTER_PLAN_LAND_USE_COLORS.fallback;

export default function Legend({ items = [], selectedParcelNumber = null }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-md border border-[#b8c2cc] bg-white/95 shadow-xl backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setIsCollapsed((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 border-b border-gray-200 bg-gray-50/50 px-3 py-2 text-left transition hover:bg-gray-50 sm:px-3 sm:py-2.5"
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
        <div className="max-h-[180px] overflow-auto p-3 sm:max-h-[240px] sm:p-3">
          {!items.length ? (
            <div className="py-6 text-center text-sm text-gray-400">
              No land use loaded.
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-2 border-b border-gray-100 py-1.5 last:border-0 text-[11px] sm:text-[12px]"
                >
                  <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                    <span
                      className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5"
                      style={{ backgroundColor: getColor(item.label) }}
                    />
                    <span className="truncate text-[#4d4d4d]">
                      {item.label}
                    </span>
                  </div>
                  <span className="shrink-0 font-semibold text-[#4d4d4d]">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

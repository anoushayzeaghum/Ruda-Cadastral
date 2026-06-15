import { CalendarDays, RotateCcw } from "lucide-react";

const filterItems = [
  { id: "project", label: "Projects" },
  { id: "blockNo", label: "Block No" },
  { id: "plotType", label: "Plot Type" },
  { id: "plotNo", label: "Plot No" },
  { id: "area", label: "Area (Marla)" },
];

export default function MetaverseSubHeader({ onReset, onCalendarClick }) {
  return (
    <div className="absolute left-1/2 top-3 z-20 -translate-x-1/2">
      <div className="flex items-center gap-1.5 rounded-lg bg-[#111827] px-2 py-1.5 shadow-xl">
        {filterItems.map((item) => (
          <select
            key={item.id}
            defaultValue=""
            className="h-8 min-w-[118px] rounded-md border border-[#2f3a4d] bg-[#ffffff] px-2 text-xs font-semibold text-[#111827] outline-none"
          >
            <option value="" disabled>
              {item.label}
            </option>
          </select>
        ))}

        <button
          type="button"
          onClick={onCalendarClick}
          title="Calendar"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ffffff] text-[#111827] hover:bg-[#b6bdc8]"
        >
          <CalendarDays size={16} strokeWidth={2.4} />
        </button>

        <button
          type="button"
          onClick={onReset}
          title="Reset"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ffffff] text-[#111827] hover:bg-[#b6bdc8]"
        >
          <RotateCcw size={16} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}
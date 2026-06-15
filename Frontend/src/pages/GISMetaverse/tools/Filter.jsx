import { Filter as FilterIcon, X } from "lucide-react";

const filters = [
  { id: "block", label: "Block" },
  { id: "plotNo", label: "Plot No" },
  { id: "type", label: "Type" },
  { id: "parkFront", label: "Park Front" },
  { id: "roadFacing", label: "Road Facing" },
  { id: "possessionStatus", label: "Possession Status" },
  { id: "plotStatus", label: "Plot Status" },
  { id: "sitePlan", label: "Site Plan" },
  { id: "category", label: "Category" },
  { id: "ownerName", label: "Owner Name" },
];

export default function Filter({ onClose }) {
  return (
    <div className="w-full text-white">
      <div className="flex items-center justify-between border-b border-[#343c4c] px-4 py-3">
        <div className="flex items-center gap-2 text-[13px] font-bold">
          <FilterIcon size={15} />
          <span>FILTER</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded bg-[#263244] p-1 hover:bg-[#334158]"
        >
          <X size={14} />
        </button>
      </div>

      <div className="max-h-[410px] overflow-y-auto p-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="space-y-3">
          {filters.map((item) => (
            <div key={item.id}>
              <label className="mb-1 block text-[11px] font-semibold text-white/80">
                {item.label}
              </label>

              <select
                defaultValue=""
                className="h-8 w-full rounded-md border border-[#344055] bg-[#1d2533] px-2 text-xs text-white outline-none"
              >
                <option value="" disabled>
                  Select {item.label}
                </option>
              </select>
            </div>
          ))}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              className="h-8 flex-1 rounded-md bg-[#8bd66f] text-xs font-bold text-[#111827]"
            >
              Apply
            </button>

            <button
              type="button"
              className="h-8 flex-1 rounded-md border border-[#344055] bg-[#1d2533] text-xs font-bold text-white"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
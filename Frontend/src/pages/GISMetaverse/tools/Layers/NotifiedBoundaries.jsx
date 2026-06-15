import { useState } from "react";
import { ChevronDown, ChevronRight, Grid3X3 } from "lucide-react";

export default function NotifiedBoundaries() {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[#343c4c]">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-white hover:bg-[#293445]"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>NOTIFIED BOUNDARIES</span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>
    </div>
  );
}

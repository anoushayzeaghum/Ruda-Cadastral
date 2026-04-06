import React from "react";

export default function PlotDetails() {
  return (
    <div className="bg-white border border-[#b8c2cc] shadow-[0_0_0_1px_rgba(0,0,0,0.02)] flex-1 min-h-[300px]">
      <div className="h-[56px] border-b border-[#d4dbe2] px-4 flex items-center">
        <h2 className="text-[17px] font-bold uppercase tracking-wide text-[#5b5b5b]">
          Plot Details
        </h2>
      </div>

      <div className="p-4 h-[calc(100%-56px)]">
        <div className="flex h-full items-center justify-center text-gray-400 text-sm">
          No plot selected.
        </div>
      </div>
    </div>
  );
}
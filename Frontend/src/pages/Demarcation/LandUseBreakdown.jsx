import React from "react";

export default function LandUseBreakdown() {
  return (
    <div className="bg-white border border-[#b8c2cc] shadow-[0_0_0_1px_rgba(0,0,0,0.02)] h-[275px]">
      <div className="h-[56px] border-b border-[#d4dbe2] px-4 flex items-center">
        <h2 className="text-[17px] font-bold uppercase tracking-wide text-[#5b5b5b]">
          Landuse Breakdown
        </h2>
      </div>

      <div className="p-4 h-[calc(100%-56px)] flex items-center justify-center">
        <div className="relative h-[170px] w-[170px] rounded-full border-2 border-[#1e293b] bg-[conic-gradient(#18a9f5_0deg_348deg,#f54b35_348deg_353deg,#000000_353deg_356deg,#3f5bd8_356deg_358deg,#f4d03f_358deg_359deg,#cab8f5_359deg_360deg)]">
          <div className="absolute inset-[32px] rounded-full bg-white border border-[#1e293b]" />
        </div>
      </div>
    </div>
  );
}
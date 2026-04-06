import React from "react";

export default function Legend() {
  const legendItems = [
    { name: "Residential", count: 1407, color: "bg-sky-400" },
    { name: "Illegal", count: 20, color: "bg-red-500" },
    { name: "Commercial", count: 11, color: "bg-black" },
    { name: "Recreational Facility", count: 3, color: "bg-indigo-600" },
    { name: "Parking", count: 1, color: "bg-yellow-400" },
    { name: "Religious Building", count: 1, color: "bg-purple-300" },
  ];

  return (
    <div className="bg-white border border-[#b8c2cc] shadow-[0_0_0_1px_rgba(0,0,0,0.02)] h-[295px]">
      <div className="h-[56px] border-b border-[#d4dbe2] px-4 flex items-center">
        <h2 className="text-[17px] font-bold uppercase tracking-wide text-[#5b5b5b]">
          Legend
        </h2>
      </div>

      <div className="p-4 h-[calc(100%-56px)]">
        <div className="space-y-3 pt-1">
          {legendItems.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between border-b border-gray-200 pb-2 text-[15px]"
            >
              <div className="flex items-center gap-3">
                <span className={`h-3.5 w-3.5 ${item.color} inline-block`} />
                <span className="text-[#4d4d4d]">{item.name}</span>
              </div>
              <span className="font-semibold text-[#4d4d4d]">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
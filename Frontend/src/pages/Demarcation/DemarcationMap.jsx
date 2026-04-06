import React from "react";

export default function DemarcationMap() {
  return (
    <div className="col-span-12 lg:col-span-6 xl:col-span-6 bg-white border border-[#b8c2cc] relative overflow-hidden">
      <div className="absolute top-3 left-3 z-10">
        <select className="h-8 rounded border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none">
          <option>Sassnops</option>
        </select>
      </div>

      <div className="absolute top-4 right-4 z-10 flex flex-col border border-gray-300 rounded overflow-hidden bg-white shadow-sm">
        <button className="h-8 w-8 text-lg font-bold border-b border-gray-300">
          +
        </button>
        <button className="h-8 w-8 text-lg font-bold border-b border-gray-300">
          −
        </button>
        <button className="h-8 w-8 text-sm">⌂</button>
      </div>

      <div className="w-full h-full bg-[#ece9e4] relative overflow-hidden">
        <div className="absolute inset-0 opacity-90">
          <svg viewBox="0 0 1000 800" className="w-full h-full">
            <path
              d="M0 120 C200 80, 300 140, 500 100 S800 60, 1000 140"
              stroke="#ffffff"
              strokeWidth="10"
              fill="none"
            />
            <path
              d="M0 220 C180 180, 280 240, 460 220 S780 160, 1000 210"
              stroke="#ffffff"
              strokeWidth="10"
              fill="none"
            />
            <path
              d="M120 0 C100 180, 130 280, 100 800"
              stroke="#ffffff"
              strokeWidth="7"
              fill="none"
            />
            <path
              d="M250 0 C230 180, 260 280, 220 800"
              stroke="#ffffff"
              strokeWidth="5"
              fill="none"
            />
            <path
              d="M400 0 C390 160, 420 300, 380 800"
              stroke="#ffffff"
              strokeWidth="5"
              fill="none"
            />
            <path
              d="M560 0 C540 160, 580 280, 540 800"
              stroke="#ffffff"
              strokeWidth="6"
              fill="none"
            />
            <path
              d="M700 0 C690 180, 710 320, 680 800"
              stroke="#ffffff"
              strokeWidth="5"
              fill="none"
            />
            <path
              d="M860 0 C840 190, 860 300, 820 800"
              stroke="#ffffff"
              strokeWidth="5"
              fill="none"
            />
            <path
              d="M0 360 L1000 320"
              stroke="#ffffff"
              strokeWidth="6"
              fill="none"
            />
            <path
              d="M0 520 L1000 470"
              stroke="#ffffff"
              strokeWidth="6"
              fill="none"
            />
            <path
              d="M0 680 L1000 620"
              stroke="#ffffff"
              strokeWidth="5"
              fill="none"
            />
          </svg>
        </div>

        <div className="absolute bottom-0 right-0 w-[38%] h-[36%] bg-[#e4d9a9] opacity-80 clip-demarcation" />

        <div className="absolute left-[5%] top-[36%] w-[58%] h-[38%] rotate-[-18deg]">
          <div className="grid grid-cols-12 gap-[3px] h-full">
            {Array.from({ length: 180 }).map((_, i) => {
              const special =
                i === 8 ||
                i === 14 ||
                i === 36 ||
                i === 54 ||
                i === 88 ||
                i === 122 ||
                i === 144
                  ? "bg-[#f18a72]"
                  : i === 59 || i === 115 || i === 159
                    ? "bg-[#292929]"
                    : "bg-[#4fc3f7]";

              return (
                <div
                  key={i}
                  className={`rounded-[1px] border border-[#3ca9dd] ${special}`}
                />
              );
            })}
          </div>
        </div>

        <div className="absolute left-[19%] top-[48%] h-[11%] w-[11%] bg-[#6674dc] opacity-90" />
        <div className="absolute left-[47%] top-[42%] h-[9%] w-[10%] bg-[#6674dc] opacity-90" />
        <div className="absolute left-[68%] top-[49%] h-[10%] w-[10%] bg-[#6674dc] opacity-90" />

        <div className="absolute bottom-2 left-3 text-[11px] text-gray-500">
          © Mapbox © OSM
        </div>
        <div className="absolute bottom-2 right-3 text-[11px] text-gray-500">
          © Geoportal
        </div>
      </div>

      <style>{`
        .clip-demarcation {
          clip-path: polygon(20% 5%, 95% 0%, 100% 100%, 0% 100%);
        }
      `}</style>
    </div>
  );
}
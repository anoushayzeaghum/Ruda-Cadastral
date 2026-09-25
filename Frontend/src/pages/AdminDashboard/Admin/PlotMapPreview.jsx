const orange = [
  [40, 260, 80, 66, "101"], [122, 248, 80, 66, "100"], [204, 236, 80, 66, "99"], [286, 224, 80, 66, "98"],
  [368, 212, 80, 66, "127"], [450, 200, 80, 66, "128"], [532, 188, 80, 66, "129"], [614, 176, 80, 66, "130"],
  [696, 164, 80, 66, "131"], [778, 152, 80, 66, "133"],
  [125, 376, 78, 62, "120"], [205, 364, 78, 62, "121"], [285, 352, 78, 62, "122"], [365, 340, 78, 62, "123"],
  [445, 328, 78, 62, "124"], [525, 316, 78, 62, "125"], [605, 304, 78, 62, "126"], [685, 292, 78, 62, "159"], [765, 280, 78, 62, "157"],
];

export default function PlotMapPreview({ selectedPlot = "128" }) {
  return (
    <div className="relative h-full min-h-[420px] overflow-hidden rounded-xl bg-[#e9e4e8]">
      <svg viewBox="0 0 900 520" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
        <rect width="900" height="520" fill="#eee9e6" />
        <path d="M0 110 C220 85 330 115 520 50 C680 -5 820 30 900 5" fill="none" stroke="#8e8d98" strokeWidth="65" />
        <path d="M0 335 C220 318 370 280 540 240 C720 198 805 135 900 105" fill="none" stroke="#8e8d98" strokeWidth="62" />
        <path d="M0 452 C220 430 380 395 540 360 C735 318 835 255 900 222" fill="none" stroke="#8e8d98" strokeWidth="62" />
        <path d="M0 335 C220 318 370 280 540 240 C720 198 805 135 900 105" fill="none" stroke="#d8d8df" strokeWidth="2" strokeDasharray="12 10" />
        <path d="M0 452 C220 430 380 395 540 360 C735 318 835 255 900 222" fill="none" stroke="#d8d8df" strokeWidth="2" strokeDasharray="12 10" />

        <polygon points="245,86 355,45 430,135 330,182" fill="#5ccfa6" stroke="#183b2b" strokeWidth="2" />
        <text x="340" y="113" textAnchor="middle" fontSize="18" fill="#0f5c40" fontWeight="700">Park</text>
        <polygon points="430,45 575,20 640,100 520,145" fill="#fff27d" stroke="#183b2b" strokeWidth="2" />
        <text x="530" y="82" textAnchor="middle" fontSize="16" fill="#6f6310" fontWeight="700">Masjid</text>

        {orange.map(([x, y, w, h, label]) => {
          const selected = label === selectedPlot;
          return (
            <g key={`${label}-${x}`}>
              <polygon
                points={`${x},${y} ${x + w},${y - 12} ${x + w + 10},${y + h - 10} ${x + 10},${y + h}`}
                fill="#ffa21a"
                stroke={selected ? "#007a46" : "#30343b"}
                strokeWidth={selected ? 6 : 1.6}
              />
              <text x={x + w / 2 + 4} y={y + h / 2} textAnchor="middle" fontSize="13" fill="#243244" fontWeight="700">{label}</text>
            </g>
          );
        })}

        <text x="480" y="286" fontSize="15" fill="#fff" fontWeight="700" transform="rotate(-12 480 286)">40' Wide Road</text>
        <text x="460" y="407" fontSize="15" fill="#fff" fontWeight="700" transform="rotate(-12 460 407)">40' Wide Road</text>
      </svg>

      <div className="absolute left-3 top-3 flex gap-2">
        <span className="rounded-lg bg-[#0B7A3B] px-3 py-1.5 text-[10px] font-bold text-white shadow-sm">Map View</span>
        <span className="rounded-lg border border-slate-200 bg-white/95 px-3 py-1.5 text-[10px] font-bold text-slate-600 shadow-sm">Satellite View</span>
      </div>
      <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 rounded-lg bg-white/95 px-3 py-2 text-[9px] shadow-sm">
        {[["#ffa21a", "Residential"], ["#7dd3fc", "Commercial"], ["#5ccfa6", "Park"], ["#fff27d", "Masjid"], ["#007a46", "Selected Plot"]].map(([color, text]) => (
          <span key={text} className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ backgroundColor: color }} />{text}</span>
        ))}
      </div>
    </div>
  );
}

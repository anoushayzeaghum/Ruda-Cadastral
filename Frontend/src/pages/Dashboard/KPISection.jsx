import {
  TrendingUp,
  CheckCircle2,
  Clock3,
  XCircle,
  MapPinned,
  Landmark,
} from "lucide-react";

const kpiCards = [
  {
    title: "Total Khasra Parcel Data",
    value: "750,000",
    subtitle: "Growth this month",
    icon: TrendingUp,
    tone: "green",
    span: "col-span-12 md:col-span-6 xl:col-span-2",
  },
  {
    title: "Khasra Data Status",
    tone: "white",
    span: "col-span-12 md:col-span-6 xl:col-span-3",
    status: [
      {
        label: "Verified",
        value: "650,000",
        color: "bg-emerald-500",
        text: "text-emerald-700 dark:text-emerald-400",
        icon: CheckCircle2,
      },
  
      {
        label: "Not Verified",
        value: "25,000",
        color: "bg-rose-500",
        text: "text-rose-700 dark:text-rose-400",
        icon: XCircle,
      },
    ],
  },
  {
    title: "Tehsil & Mouza Counts",
    value: "148",
    value2: "55,000",
    unit1: "Tehsils",
    unit2: "Mouzas",
    progress: 68,
    icon: MapPinned,
    tone: "softGreen",
    span: "col-span-12 md:col-span-6 xl:col-span-3",
  },
  {
    title: "Acquired Land Progress",
    value: "25,800",
    unit: "Acres",
    ring: 72,
    icon: Landmark,
    tone: "mint",
    span: "col-span-12 md:col-span-3 xl:col-span-2",
  },
  {
    title: "Remaining Land",
    value: "312,134",
    unit: "Kanal",
    subValue: "76,700 Acres",
    tone: "dangerSoft",
    span: "col-span-12 md:col-span-3 xl:col-span-2",
  },
];

function toneClasses(tone) {
  switch (tone) {
    case "green":
      return {
        card: "bg-gradient-to-r from-[#1f6b4f] via-[#2b7b59] to-[#2a6f54] border-[#b8d2c2] text-white",
        title: "text-white/90",
        value: "text-white",
        sub: "text-white/80",
        icon: "text-white/90",
      };
    case "softGreen":
      return {
        card: "bg-gradient-to-r from-[#eef5ef] via-[#f8fbf7] to-[#eef7f1] border-[#d7e5da] text-[#244536]",
        title: "text-[#365346]",
        value: "text-[#1e3d30]",
        sub: "text-[#5d7467]",
        icon: "text-[#2d6c4a]",
      };
    case "mint":
      return {
        card: "bg-gradient-to-r from-[#edf7f1] via-[#f7fbf8] to-[#eff7f2] border-[#d7e6dc] text-[#244536]",
        title: "text-[#365346]",
        value: "text-[#1e3d30]",
        sub: "text-[#5d7467]",
        icon: "text-[#2d6c4a]",
      };
    case "dangerSoft":
      return {
        card: "bg-gradient-to-r from-[#faf4f2] via-[#fffafa] to-[#faf4f2] border-[#ecd9d3] text-[#62352f]",
        title: "text-[#8f5a51]",
        value: "text-[#7b2f27]",
        sub: "text-[#9b6b62]",
        icon: "text-[#9d4a3e]",
      };
    default:
      return {
        card: "bg-[#fbfbf8] border-[#d8ddd5] text-[#244536]",
        title: "text-[#54685f]",
        value: "text-[#20362d]",
        sub: "text-[#708177]",
        icon: "text-[#2d6c4a]",
      };
  }
}

function RingProgress({ value }) {
  const radius = 23;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex h-14 w-14 items-center justify-center">
      <svg viewBox="0 0 60 60" className="-rotate-90 h-14 w-14">
        <circle
          cx="30"
          cy="30"
          r={radius}
          fill="none"
          stroke="#d7dfdb"
          strokeWidth="6"
        />
        <circle
          cx="30"
          cy="30"
          r={radius}
          fill="none"
          stroke="#2f9a59"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={filled}
        />
      </svg>
      <span className="absolute text-[11px] font-semibold text-[#1e5e37]">
        {value}%
      </span>
    </div>
  );
}

function ProgressBar({ value }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[#d7dfdb]">
      <div
        className="h-full rounded-full bg-[#2f9a59]"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export default function KPISection() {
  return (
    <div className="w-full">
      <div className="grid grid-cols-12 gap-3">
        {kpiCards.map((card) => {
          const tone = toneClasses(card.tone);
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className={[
                card.span,
                "relative overflow-hidden rounded-[20px] border px-4 py-3",
                "shadow-[0_4px_12px_rgba(38,65,47,0.08)]",
                tone.card,
              ].join(" ")}
            >
              <div className="relative z-10 flex h-full flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={`text-[11px] font-medium leading-4 ${tone.title}`}>
                      {card.title}
                    </p>
                  </div>

                  {Icon ? (
                    <div className={`${tone.icon} shrink-0`}>
                      <Icon size={18} strokeWidth={2} />
                    </div>
                  ) : null}
                </div>

                {card.status ? (
                  <div className="mt-2 space-y-0">
                    {card.status.map((item) => {
                      const StatusIcon = item.icon;
                      return (
                        <div
                          key={item.label}
                          className="flex items-center justify-between py-1"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${item.color}`} />
                            <StatusIcon size={14} className={item.text} />
                            <span className="text-[11px] text-slate-600 dark:text-slate-300">
                              {item.label}
                            </span>
                          </div>
                          <span className={`text-[13px] font-semibold ${item.text}`}>
                            {item.value}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : card.value2 ? (
                  <div className="mt-1">
                    <div className="flex items-end gap-2 flex-wrap">
                      <span className={`text-[24px] font-semibold leading-none ${tone.value}`}>
                        {card.value}
                      </span>
                      <span className={`pb-0.5 text-[11px] ${tone.sub}`}>{card.unit1}</span>
                      <span className={`pb-0.5 text-[11px] ${tone.sub}`}>/</span>
                      <span className={`text-[22px] font-semibold leading-none ${tone.value}`}>
                        {card.value2}
                      </span>
                      <span className={`pb-0.5 text-[11px] ${tone.sub}`}>{card.unit2}</span>
                    </div>

                    <div className="mt-1">
                      <ProgressBar value={card.progress} />
                    </div>
                  </div>
                ) : card.ring ? (
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <div className="flex items-end gap-1.5">
                      <span className={`text-[24px] font-semibold leading-none ${tone.value}`}>
                        {card.value}
                      </span>
                      <span className={`pb-0.5 text-[11px] ${tone.sub}`}>{card.unit}</span>
                    </div>
                    <RingProgress value={card.ring} />
                  </div>
                ) : (
                  <div className="mt-1">
                    <div className="flex items-end gap-1.5">
                      <span className={`text-[24px] font-semibold leading-none ${tone.value}`}>
                        {card.value}
                      </span>
                      {card.unit ? (
                        <span className={`pb-0.5 text-[11px] ${tone.sub}`}>
                          {card.unit}
                        </span>
                      ) : null}
                    </div>

                    {card.subtitle ? (
                      <p className={`mt-1 text-[11px] ${tone.sub}`}>{card.subtitle}</p>
                    ) : null}

                    {card.subValue ? (
                      <p className={`mt-1 text-[11px] ${tone.sub}`}>{card.subValue}</p>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.14),transparent_32%)]" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
import {
  TrendingUp,
  CheckCircle2,
  XCircle,
  MapPinned,
  Landmark,
} from "lucide-react";

const kpiCards = [
  {
    title: "Total Khasra Parcel Data",
    value: "52,000",
    subtitle: "Growth this month",
    icon: TrendingUp,
    tone: "green",
    filter: "land",
  },
  {
    title: "Khasra Data Status",
    tone: "white",
    filter: "land",
    status: [
      {
        label: "Verified",
        value: "38,500",
        color: "bg-emerald-500",
        text: "text-emerald-700 dark:text-emerald-400",
        icon: CheckCircle2,
      },
      {
        label: "Not Verified",
        value: "13,500",
        color: "bg-rose-500",
        text: "text-rose-700 dark:text-rose-400",
        icon: XCircle,
      },
    ],
  },
  {
    title: "Tehsil & Mouza Counts",
    value: "6",
    value2: "170",
    unit1: "Tehsils",
    unit2: "Mouzas",
    progress: 41,
    icon: MapPinned,
    tone: "softGreen",
    filter: "mouza",
  },
  {
    title: "Acquired Land Progress",
    value: "58,500",
    unit: "Acres",
    ring: 20,
    icon: Landmark,
    tone: "mint",
    filter: "land",
  },
  {
    title: "Remaining Land",
    value: "18,000",
    unit: "Kanal",
    subValue: "113,500 Acres",
    tone: "dangerSoft",
    filter: "land",
  },
];

function toneClasses(tone) {
  const baseCard = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800";
  const baseTitle = "text-slate-500 dark:text-slate-400";
  const baseValue = "text-slate-900 dark:text-white";
  const baseSub = "text-slate-500 dark:text-slate-400";

  switch (tone) {
    case "green":
      return {
        card: baseCard,
        title: baseTitle,
        value: baseValue,
        sub: baseSub,
        icon: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 p-1.5 rounded-lg",
      };
    case "softGreen":
      return {
        card: baseCard,
        title: baseTitle,
        value: baseValue,
        sub: baseSub,
        icon: "text-teal-500 bg-teal-50 dark:bg-teal-500/10 p-1.5 rounded-lg",
      };
    case "mint":
      return {
        card: baseCard,
        title: baseTitle,
        value: baseValue,
        sub: baseSub,
        icon: "text-cyan-500 bg-cyan-50 dark:bg-cyan-500/10 p-1.5 rounded-lg",
      };
    case "dangerSoft":
      return {
        card: baseCard,
        title: baseTitle,
        value: baseValue,
        sub: baseSub,
        icon: "text-rose-500 bg-rose-50 dark:bg-rose-500/10 p-1.5 rounded-lg",
      };
    default:
      return {
        card: baseCard,
        title: baseTitle,
        value: baseValue,
        sub: baseSub,
        icon: "text-slate-500 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-lg",
      };
  }
}

function RingProgress({ value }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
      <svg viewBox="0 0 60 60" className="-rotate-90 h-12 w-12">
        <circle
          cx="30"
          cy="30"
          r={radius}
          fill="none"
          className="stroke-slate-100 dark:stroke-slate-800"
          strokeWidth="6"
        />
        <circle
          cx="30"
          cy="30"
          r={radius}
          fill="none"
          className="stroke-cyan-500"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={filled}
        />
      </svg>
      <span className="absolute text-[10px] font-semibold text-slate-700 dark:text-slate-300">
        {value}%
      </span>
    </div>
  );
}

function ProgressBar({ value }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
      <div
        className="h-full rounded-full bg-teal-500"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export default function KPISection({ activeFilter = "land" }) {
  const displayedCards = kpiCards.filter((card) => card.filter === activeFilter);
  
  return (
    <div className="w-full">
      {/* Dynamic grid columns based on how many cards are displayed */}
      <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 ${displayedCards.length === 4 ? "xl:grid-cols-4" : displayedCards.length === 1 ? "xl:grid-cols-1 lg:max-w-md" : "xl:grid-cols-5"}`}>
        {displayedCards.map((card) => {
          const tone = toneClasses(card.tone);
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className={[
                "relative overflow-hidden rounded-2xl border px-4 py-4",
                "shadow-sm transition-shadow duration-300 hover:shadow-md",
                "flex flex-col justify-between min-h-[110px]",
                tone.card,
              ].join(" ")}
            >
              {/* Top: title + icon */}
              <div className="flex items-start justify-between gap-2">
                <p className={`text-[12px] font-medium leading-[1.3] ${tone.title}`}>
                  {card.title}
                </p>
                {Icon ? (
                  <div className={`${tone.icon} shrink-0`}>
                    <Icon size={16} strokeWidth={2} />
                  </div>
                ) : null}
              </div>

              {/* Bottom: value / content */}
              <div className="mt-3">
                {card.status ? (
                  <div className="space-y-1.5">
                    {card.status.map((item) => {
                      const StatusIcon = item.icon;
                      return (
                        <div
                          key={item.label}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full shrink-0 ${item.color}`} />
                            <StatusIcon size={13} className={item.text} />
                            <span className="text-[12px] font-medium text-slate-600 dark:text-slate-400">
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
                  <div>
                    <div className="flex flex-wrap items-end gap-x-1.5 gap-y-0.5">
                      <span className={`text-[22px] font-bold tracking-tight leading-none ${tone.value}`}>
                        {card.value}
                      </span>
                      <span className={`pb-0.5 text-[11px] font-medium ${tone.sub}`}>{card.unit1}</span>
                      <span className={`pb-0.5 text-[11px] ${tone.sub}`}>/</span>
                      <span className={`text-[22px] font-bold tracking-tight leading-none ${tone.value}`}>
                        {card.value2}
                      </span>
                      <span className={`pb-0.5 text-[11px] font-medium ${tone.sub}`}>{card.unit2}</span>
                    </div>
                    <div className="mt-3">
                      <ProgressBar value={card.progress} />
                    </div>
                  </div>
                ) : card.ring ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-end gap-1">
                      <span className={`text-[22px] font-bold tracking-tight leading-none ${tone.value}`}>
                        {card.value}
                      </span>
                      <span className={`pb-0.5 text-[11px] font-medium ${tone.sub}`}>{card.unit}</span>
                    </div>
                    <RingProgress value={card.ring} />
                  </div>
                ) : (
                  <div>
                    <div className="flex items-end gap-1">
                      <span className={`text-[22px] font-bold tracking-tight leading-none ${tone.value}`}>
                        {card.value}
                      </span>
                      {card.unit ? (
                        <span className={`pb-0.5 text-[11px] font-medium ${tone.sub}`}>{card.unit}</span>
                      ) : null}
                    </div>
                    {card.subtitle ? (
                      <p className={`mt-1.5 text-[11px] font-medium ${tone.sub}`}>{card.subtitle}</p>
                    ) : null}
                    {card.subValue ? (
                      <p className={`mt-1 text-[11px] font-medium ${tone.sub}`}>{card.subValue}</p>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

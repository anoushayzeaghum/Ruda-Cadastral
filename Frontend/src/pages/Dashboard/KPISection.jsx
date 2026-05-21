import {
  TrendingUp,
  Database,
  BadgeCheck,
  Clock,
  AlertTriangle,
  Sprout,
  Ruler,
} from "lucide-react";

const cardBase =
  "rounded-2xl px-5 py-4 border shadow-sm transition hover:shadow-md dark:shadow-none";
const cardTitleClass = "text-xs font-medium text-slate-500 dark:text-slate-400";
const cardValueClass =
  "mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white";
const iconWrapClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl";
const iconSize = 18;
const iconStroke = 1.75;

export default function KPISection() {
  return (
    <div className="w-full min-w-0">
      {/* lg: spans sum to 12 (3+4+2+3) — full-width row; md: 2×2 grid */}
      <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-12">
        {/* Card 1 — Total parcels (emerald / growth) */}
        <div
          className={`min-w-0 md:col-span-1 lg:col-span-3 ${cardBase} border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-white dark:from-emerald-950/40 dark:via-[#0f1720] dark:to-[#0f1720] dark:border-emerald-700/50`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={cardTitleClass}>
                Total Khasra Parcel Data
              </p>
              <h3 className={cardValueClass}>
                750,000
              </h3>
              <p className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <TrendingUp size={14} strokeWidth={iconStroke} aria-hidden />
                Growth this month
              </p>
            </div>
            <div
              className={`${iconWrapClass} bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300`}
              aria-hidden
            >
              <Database size={iconSize} strokeWidth={iconStroke} />
            </div>
          </div>
        </div>

        {/* Card 2 — Data status (indigo / verification) */}
        <div
          className={`min-w-0 md:col-span-1 lg:col-span-4 ${cardBase} border-indigo-200/80 bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/30 dark:from-indigo-950/35 dark:via-[#0f1720] dark:to-[#0f1720] dark:border-indigo-700/45`}
        >
          <p className={cardTitleClass}>
            Khasra Data Status
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-white/80 px-2 py-2 dark:bg-slate-800/50">
              <BadgeCheck
                className="mx-auto mb-1 text-emerald-600 dark:text-emerald-400"
                size={iconSize}
                strokeWidth={iconStroke}
                aria-hidden
              />
              <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Verified
              </p>
              <p className="mt-0.5 text-base font-semibold text-slate-900 dark:text-white">
                650,000
              </p>
            </div>
            <div className="rounded-lg bg-white/80 px-2 py-2 dark:bg-slate-800/50">
              <Clock
                className="mx-auto mb-1 text-amber-500 dark:text-amber-400"
                size={iconSize}
                strokeWidth={iconStroke}
                aria-hidden
              />
              <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Pending
              </p>
              <p className="mt-0.5 text-base font-semibold text-amber-600 dark:text-amber-400">
                75,000
              </p>
            </div>
            <div className="rounded-lg bg-white/80 px-2 py-2 dark:bg-slate-800/50">
              <AlertTriangle
                className="mx-auto mb-1 text-rose-500 dark:text-rose-400"
                size={iconSize}
                strokeWidth={iconStroke}
                aria-hidden
              />
              <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Not verified
              </p>
              <p className="mt-0.5 text-base font-semibold text-rose-600 dark:text-rose-400">
                25,000
              </p>
            </div>
          </div>
        </div>

        {/* Card 4 — Acquired land (amber / progress ring) */}
        <div
          className={`min-w-0 md:col-span-1 lg:col-span-2 ${cardBase} flex items-center justify-between gap-3 border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-orange-50/30 dark:from-amber-950/30 dark:via-[#0f1720] dark:to-[#0f1720] dark:border-amber-700/45`}
        >
          <div>
            <p className={cardTitleClass}>
              Acquired Land Progress
            </p>
            <h3 className={cardValueClass}>
              25,800
              <span className="ml-1 text-sm font-normal text-slate-500 dark:text-slate-400">
                Acres
              </span>
            </h3>
          </div>
          <div className="relative flex shrink-0 items-center justify-center" aria-hidden>
            <div
              className="h-10 w-10 rounded-full p-[2.5px]"
              style={{
                background:
                  "conic-gradient(rgb(16 185 129) 0deg 288deg, rgb(226 232 240) 288deg 360deg)",
              }}
            >
              <div className="flex h-full w-full items-center justify-center rounded-full bg-white dark:bg-[#0f1720]">
                <Sprout
                  className="text-emerald-600 dark:text-emerald-400"
                  size={iconSize}
                  strokeWidth={iconStroke}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 5 — Remaining land (slate / rose accent) */}
        <div
          className={`min-w-0 md:col-span-1 lg:col-span-3 ${cardBase} border-rose-200/70 bg-gradient-to-br from-rose-50/70 via-white to-slate-50/50 dark:from-rose-950/25 dark:via-[#0f1720] dark:to-[#0f1720] dark:border-rose-900/40`}
        >
          <div className="flex items-start justify-between gap-2">
            <p className={cardTitleClass}>
              Remaining Land
            </p>
            <div
              className={`${iconWrapClass} bg-rose-100 text-rose-700 dark:bg-rose-900/45 dark:text-rose-300`}
              aria-hidden
            >
              <Ruler size={iconSize} strokeWidth={iconStroke} />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
            312,134
            <span className="ml-1 text-sm font-normal text-slate-500 dark:text-slate-400">
              Kanal
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            76,700 Acres
          </p>
        </div>
      </div>
    </div>
  );
}

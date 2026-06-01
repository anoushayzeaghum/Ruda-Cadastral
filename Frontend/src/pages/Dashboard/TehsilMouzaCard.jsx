import { Building2, MapPinned } from "lucide-react";

export default function TehsilMouzaCard() {
  return (
    <div className="rounded-2xl border border-sky-200/80 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-sky-700/45 dark:bg-[#0f1720] dark:shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Tehsil &amp; Mouza Counts
          </p>
          <div className="mt-4 flex flex-wrap items-baseline gap-x-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            <span>148</span>
            <span className="text-base font-medium text-slate-500 dark:text-slate-400">
              tehsils
            </span>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span>55,000</span>
            <span className="text-base font-medium text-slate-500 dark:text-slate-400">
              mouzas
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300"
            aria-hidden
          >
            <MapPinned size={20} strokeWidth={1.75} />
          </div>
          <Building2
            className="text-sky-600/70 dark:text-sky-400/60"
            size={18}
            strokeWidth={1.5}
            aria-hidden
          />
        </div>
      </div>

      <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-slate-200/90 dark:bg-slate-700/80">
        <div
          className="h-full w-[80%] rounded-full bg-gradient-to-r from-sky-500 to-cyan-500"
          aria-hidden
        />
      </div>
    </div>
  );
}


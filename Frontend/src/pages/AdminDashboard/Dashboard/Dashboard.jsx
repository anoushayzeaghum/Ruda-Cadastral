import { useNavigate } from "react-router-dom";
import {
  ArrowRightLeft,
  Building2,
  Database,
  Layers3,
  Map,
  MapPinned,
  PackageOpen,
  Upload,
} from "lucide-react";
import AdminPage from "./AdminPage";
import MapPanel from "./MapPanel";
import PieChart from "./PieChart";
import BarChart from "./BarChart";
import { STAT_GROUPS } from "./dashboardData";

const KPI_META = [
  ["Districts", "2", Building2, "bg-emerald-50 text-emerald-700"],
  ["Tehsils", "10", Layers3, "bg-sky-50 text-sky-700"],
  ["Mauzas", "173", MapPinned, "bg-amber-50 text-amber-700"],
  ["Projects", "8", PackageOpen, "bg-violet-50 text-violet-700"],
  ["Phases", "5", Map, "bg-emerald-50 text-emerald-700"],
  ["Khasras", "237,754", Database, "bg-rose-50 text-rose-700"],
  ["Zones", "6", Layers3, "bg-blue-50 text-blue-700"],
  ["Precincts", "9", MapPinned, "bg-teal-50 text-teal-700"],
];

function StatCard({ label, value, icon: Icon, tone }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#0d1b15]">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}
        >
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <div className="text-xl font-black font-normal leading-none text-slate-900 dark:text-white">
            {value}
          </div>
          <div className="mt-1 truncate text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}

const quickActions = [
  [
    "Import Shapefile",
    "Add spatial data",
    Upload,
    "/data-management/import",
    "bg-emerald-50 text-emerald-700",
  ],
  [
    "Manage Layers",
    "Browse GIS datasets",
    Layers3,
    "/data-management",
    "bg-sky-50 text-sky-700",
  ],
  [
    "Open Plot Details",
    "Search & view plots",
    MapPinned,
    "/plot-management/details",
    "bg-amber-50 text-amber-700",
  ],
  [
    "Create Transfer",
    "Open plot transfer form",
    ArrowRightLeft,
    "/plot-management/transfer",
    "bg-violet-50 text-violet-700",
  ],
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <AdminPage>
      <div className="mx-auto max-w-[1680px] space-y-3 p-3 md:p-4 xl:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-black font-semibold tracking-tight text-[#0f2039] dark:text-white md:text-2xl">
              Welcome back, Admin!
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Manage spatial data, monitor projects, and keep RUDA GIS up to
              date.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Live GIS
            Administration Dashboard
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
          {KPI_META.map(([label, value, Icon, tone]) => (
            <StatCard
              key={label}
              label={label}
              value={value}
              icon={Icon}
              tone={tone}
            />
          ))}
        </div>

        <div className="grid gap-3 xl:grid-cols-[1.75fr_.95fr]">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0d1b15]">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-white/10">
              <div>
                <h2 className="text-sm font-semibold text-[#13223a] dark:text-white">
                  RUDA Project Areas Overview
                </h2>
                <p className="text-[10px] text-slate-400">
                  Spatial view of administrative boundaries and development
                  phases
                </p>
              </div>
              <button
                onClick={() => navigate("/data-management")}
                className="text-[10px] font-bold text-[#0B7A3B] hover:underline"
              >
                Open Data Management
              </button>
            </div>
            <div className="h-[420px]">
              <MapPanel />
            </div>
          </section>

          <div className="space-y-3">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0d1b15]">
              <div className="mb-3">
                <h2 className="text-sm font-semibold text-[#13223a] dark:text-white">
                  Quick Actions
                </h2>
                <p className="text-[10px] text-slate-400">
                  Common administrative tasks
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map(([title, text, Icon, path, tone]) => (
                  <button
                    key={title}
                    onClick={() => navigate(path)}
                    className="rounded-xl border border-slate-200 p-3 text-left transition hover:border-[#0B7A3B]/35 hover:shadow-sm dark:border-white/10"
                  >
                    <span
                      className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}
                    >
                      <Icon size={17} />
                    </span>
                    <span className="block text-xs font-extrabold text-slate-800 dark:text-white">
                      {title}
                    </span>
                    <span className="mt-0.5 block text-[9px] text-slate-400">
                      {text}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0d1b15]">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-[#13223a] dark:text-white">
                    System Snapshot
                  </h2>
                  <p className="text-[10px] text-slate-400">
                    Current platform structure
                  </p>
                </div>
              </div>
              <div className="space-y-2.5">
                {STAT_GROUPS.map((group) => (
                  <div
                    key={group.key}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-white/5"
                  >
                    <div>
                      <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                        {group.title}
                      </div>
                      <div className="mt-0.5 text-[9px] text-slate-400">
                        {group.stats.length} monitored indicators
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-bold text-emerald-700">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-[.9fr_1.1fr]">
          <div className="h-[300px]">
            <PieChart />
          </div>
          <div className="h-[300px]">
            <BarChart />
          </div>
        </div>
      </div>
    </AdminPage>
  );
}

import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowRightLeft,
  Building2,
  Database,
  Download,
  Layers3,
  Map,
  MapPinned,
  PackageOpen,
  SquareStack,
} from "lucide-react";
import AdminPage from "./AdminPage";
import MapPanel from "./MapPanel";
import PieChart from "./PieChart";
import BarChart from "./BarChart";
import { STAT_GROUPS } from "./dashboardData";

const coverageStats = [
  ["Districts", "2", Building2, "bg-emerald-50 text-emerald-600"],
  ["Tehsils", "10", Map, "bg-blue-50 text-blue-500"],
  ["Mauzas", "173", MapPinned, "bg-orange-50 text-orange-500"],
  ["Khasras", "237,754", Database, "bg-rose-50 text-rose-500"],
];

const developmentStats = [
  ["Projects", "8", PackageOpen, "bg-emerald-50 text-emerald-500"],
  ["Phases", "5", Map, "bg-blue-50 text-blue-500"],
  ["Zones", "6", Layers3, "bg-violet-50 text-violet-500"],
  ["Precincts", "9", MapPinned, "bg-orange-50 text-orange-500"],
];

const quickActions = [
  [
    "Manage Layers",
    "Browse GIS datasets",
    Layers3,
    "/data-management",
    "bg-emerald-50 text-emerald-500",
  ],
  [
    "Open Plot Details",
    "Search & view plots",
    SquareStack,
    "/plot-management/details",
    "bg-emerald-50 text-emerald-500",
  ],
  [
    "Create Transfer",
    "Open plot transfer form",
    ArrowRightLeft,
    "/plot-management/transfer",
    "bg-emerald-50 text-emerald-500",
  ],
];

const snapshotIconStyles = {
  lis: "bg-violet-50 text-violet-500",
  metaverse: "bg-blue-50 text-blue-500",
  rtw: "bg-orange-50 text-orange-500",
  chaharbagh: "bg-emerald-50 text-emerald-500",
};

const snapshotIcons = {
  lis: Database,
  metaverse: Layers3,
  rtw: PackageOpen,
  chaharbagh: Map,
};

function StatGroup({ title, stats }) {
  return (
    <section className="rounded-[8px] border border-[#e4e8eb] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.02)] dark:border-white/10 dark:bg-[#0d1b15]">
      <h2 className="mb-2.5 text-[12px] font-semibold text-[#314155] dark:text-white">
        {title}
      </h2>

      <div
        className={`grid gap-1.5 ${
          stats.length === 5 ? "grid-cols-5" : "grid-cols-4"
        }`}
      >
        {" "}
        {stats.map(([label, value, Icon, tone], index) => (
          <div
            key={label}
            className={`flex min-w-0 items-center gap-2 ${
              index > 0
                ? "border-l border-[#e4e8eb] pl-4 dark:border-white/10"
                : ""
            }`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone}`}
            >
              <Icon size={20} strokeWidth={1.5} />
            </span>

            <div className="min-w-0">
              <div className="truncate text-[24px] font-normal leading-none text-[#223044] dark:text-white">
                {value}
              </div>

              <div className="mt-1 truncate text-[10px] font-medium uppercase tracking-[0.02em] text-[#9aa6b2]">
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <AdminPage contentClassName="bg-[#f4f6f8] dark:bg-[#08110d]">
      <div className="mx-auto w-full max-w-[1600px] p-4 xl:p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.02em] text-[#253244] dark:text-white">
              Welcome Back, Admin!
            </h1>
            <p className="mt-1.5 text-[12px] text-[#98a3ad]">
              Manage spatial data, monitor projects and keep RUDA GIS up to
              date.
            </p>
          </div>

          <button
            onClick={() => navigate("/data-management/import")}
            className="flex h-9 shrink-0 items-center gap-2 rounded-md bg-[#11965a] px-3.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#0d874f]"
          >
            <Download size={15} />
            Import Shapefile
          </button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <StatGroup title="Administrative Coverage" stats={coverageStats} />
          <StatGroup title="Development Structure" stats={developmentStats} />
        </div>

        <section className="mt-2.5 rounded-[8px] border border-[#e4e8eb] bg-white px-3.5 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.02)] dark:border-white/10 dark:bg-[#0d1b15]">
          <div className="grid items-center sm:grid-cols-[145px_repeat(3,1fr)]">
            <div className="border-b border-[#eef1f3] pb-2 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-3">
              <div className="text-[12px] font-semibold text-[#252e38] dark:text-white">
                Quick Access
              </div>
              <div className="mt-0.5 text-[9px] text-[#6d737a]">
                Common GIS tasks
              </div>
            </div>

            {quickActions.map(([title, text, Icon, path, tone], index) => (
              <button
                key={title}
                onClick={() => navigate(path)}
                className={`group flex min-w-0 items-center gap-2.5 px-3 py-1.5 text-left transition hover:bg-slate-50 dark:hover:bg-white/5 ${
                  index > 0 ? "sm:border-l sm:border-[#eef1f3]" : ""
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${tone}`}
                >
                  <Icon size={20} strokeWidth={1.8} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-semibold text-#20262e5] dark:text-white">
                    {title}
                  </span>
                  <span className="mt-0.5 block truncate text-[9px] text-[#9aa6b2]">
                    {text}
                  </span>
                </span>
                <ArrowRight
                  size={14}
                  className="shrink-0 text-[rgb(83, 89, 94)] transition-transform group-hover:translate-x-0.5"
                />
              </button>
            ))}
          </div>
        </section>

        <div className="mt-2 grid gap-2 sm:grid-cols-[1.55fr_1fr]">
          <section className="overflow-hidden rounded-[8px] border border-[#e4e8eb] bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.02)] dark:border-white/10 dark:bg-[#0d1b15]">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[12px] font-semibold text-[#314155] dark:text-white">
                  Project Areas
                </h2>
                <p className="mt-1 text-[9px] text-[#9aa6b2]">
                  RUDA development footprint
                </p>
              </div>
              <button
                onClick={() => navigate("/data-management")}
                className="flex items-center gap-1 text-[10px] font-semibold text-[#15905a] hover:underline"
              >
                Open Map
                <ArrowRight size={12} className="-rotate-45" />
              </button>
            </div>
            <div className="h-[180px] overflow-hidden rounded-[5px] border border-[#edf0f2] lg:h-[225px] xl:h-[250px]">
              <MapPanel />
            </div>
          </section>

          <div className="h-full">
            <PieChart />
          </div>
        </div>

        <div className="mt-2 grid gap-2 sm:grid-cols-[1.55fr_1fr]">
          <div className="h-[190px] lg:h-[235px] xl:h-[260px]">
            <BarChart />
          </div>

          <section className="rounded-[8px] border border-[#e4e8eb] bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.02)] dark:border-white/10 dark:bg-[#0d1b15]">
            <div className="mb-2.5">
              <h2 className="text-[12px] font-semibold text-[#314155] dark:text-white">
                System Snapshot
              </h2>
              <p className="mt-1 text-[9px] text-[#9aa6b2]">
                Current platform structure
              </p>
            </div>

            <div className="space-y-1.5">
              {STAT_GROUPS.map((group) => {
                const Icon = snapshotIcons[group.key] || Layers3;
                return (
                  <div
                    key={group.key}
                    className="flex items-center gap-2 rounded-md px-1 py-1.5 transition hover:bg-slate-50 dark:hover:bg-white/5"
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                        snapshotIconStyles[group.key] ||
                        "bg-slate-50 text-slate-500"
                      }`}
                    >
                      <Icon size={15} strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11px] font-semibold text-[#3b4655] dark:text-slate-100">
                        {group.title}
                      </div>
                      <div className="mt-0.5 text-[9px] text-[#a1aab4]">
                        {group.stats.length} monitored indicators
                      </div>
                    </div>
                    <span className="rounded-full bg-[#dcf8e7] px-3 py-1 text-[9px] font-semibold text-[#2aa365] dark:bg-emerald-500/15 dark:text-emerald-300">
                      Active
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </AdminPage>
  );
}

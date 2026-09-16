import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Database,
  FileUp,
  Grid2X2,
  Landmark,
  MapPin,
  Search,
  Shapes,
  SquareStack,
  Waypoints,
} from "lucide-react";
import AdminPage from "../dashboard/AdminPage";

const DATASETS = [
  {
    title: "District",
    description: "Administrative district boundaries and details",
    path: "/area/district",
    count: "2",
    icon: Landmark,
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Tehsil",
    description: "Tehsil boundaries and related administrative records",
    path: "/area/tehsil",
    count: "10",
    icon: SquareStack,
    tone: "bg-sky-50 text-sky-700",
  },
  {
    title: "Mauza",
    description: "Mauza boundaries and land record hierarchy",
    path: "/area/mauza",
    count: "173",
    icon: Shapes,
    tone: "bg-amber-50 text-amber-700",
  },
  {
    title: "Khasra",
    description: "Khasra / land parcel records",
    path: "/area/khasra",
    count: "237,754",
    icon: Grid2X2,
    tone: "bg-violet-50 text-violet-700",
  },
  {
    title: "Square",
    description: "Square grid records for parcel organization",
    path: "/area/square",
    count: "—",
    icon: Grid2X2,
    tone: "bg-teal-50 text-teal-700",
  },
  {
    title: "Acre",
    description: "Acre-level land unit records",
    path: "/area/acre",
    count: "—",
    icon: Database,
    tone: "bg-rose-50 text-rose-700",
  },
  {
    title: "Trijunction",
    description: "Reference / trijunction control points",
    path: "/area/trijunction",
    count: "—",
    icon: Waypoints,
    tone: "bg-blue-50 text-blue-700",
  },
  {
    title: "Field Points",
    description: "Field survey and observation points",
    path: "/area/fieldpoints",
    count: "—",
    icon: MapPin,
    tone: "bg-lime-50 text-lime-700",
  },
];

export default function DataManagement({ importOnly = false }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? DATASETS.filter((item) =>
          `${item.title} ${item.description}`.toLowerCase().includes(q),
        )
      : DATASETS;
  }, [search]);

  return (
    <AdminPage>
      <div className="mx-auto max-w-[1650px] p-3 md:p-5">
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="h-8 w-1 rounded-full bg-gradient-to-b from-[#0B7A3B] to-[#70D84F]" />
              <h1 className="text-xl font-black font-semibold text-[#10203a] dark:text-white md:text-2xl">
                {importOnly
                  ? "Shapefile Import Center"
                  : "Spatial Data Management"}
              </h1>
            </div>
            <p className="ml-3 text-xs text-slate-500">
              Choose a spatial dataset, then open its existing import/list page.
              Your current import functionality is preserved.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate("/data-management/import")}
              className="flex items-center gap-2 rounded-lg bg-[#0B7A3B] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#086532]"
            >
              <FileUp size={16} /> Shapefile Imports
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-[#0d1b15] dark:text-white"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0d1b15]">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <Database size={16} />
                </span>
                <div>
                  <h2 className="text-lg font-normal text-[#13223a] dark:text-white">
                    GIS Layers & Datasets
                  </h2>
                  <p className="text-[10px] text-slate-400">
                    Administrative and land-record shapefile modules
                  </p>
                </div>
              </div>
            </div>
            <div className="relative w-full md:w-[330px]">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search layers or datasets..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none transition focus:border-[#0B7A3B] dark:border-white/10 dark:bg-white/5"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  onClick={() => navigate(item.path)}
                  className="group rounded-2xl border border-slate-200 p-4 text-left transition hover:-translate-y-0.5 hover:border-[#0B7A3B]/35 hover:shadow-md dark:border-white/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.tone}`}
                    >
                      <Icon size={20} />
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700">
                      Available
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-extrabold text-[#14233a] dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-1 min-h-[32px] text-[10px] leading-relaxed text-slate-400">
                    {item.description}
                  </p>
                  <div className="mt-3 flex items-end justify-between border-t border-slate-100 pt-3 dark:border-white/10">
                    <div>
                      <span className="block text-[9px] uppercase tracking-wide text-slate-400">
                        Records
                      </span>
                      <span className="text-sm font-black text-slate-800 dark:text-white">
                        {item.count}
                      </span>
                    </div>
                    <span className="rounded-lg bg-[#0B7A3B] px-3 py-2 text-[10px] font-bold text-white transition group-hover:bg-[#086532]">
                      Open Module
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <div className="mt-3 grid gap-3 xl:grid-cols-[1.35fr_.65fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0d1b15]">
            <h2 className="text-sm font-extrabold text-[#13223a] dark:text-white">
              Recommended Import Workflow
            </h2>
            <p className="text-[10px] text-slate-400">
              The module buttons above continue to use your existing
              ImportModal/API flow.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-4">
              {[
                "Choose Dataset",
                "Upload Shapefile",
                "Validate & Import",
                "Refresh Records",
              ].map((step, index) => (
                <div
                  key={step}
                  className="rounded-xl bg-slate-50 p-3 dark:bg-white/5"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0B7A3B] text-[10px] font-black text-white">
                    {index + 1}
                  </span>
                  <div className="mt-2 text-[11px] font-bold text-slate-700 dark:text-slate-200">
                    {step}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-[#043b2c] to-[#08703d] p-4 text-white shadow-sm">
            <FileUp size={24} className="text-[#8FEA67]" />
            <h2 className="mt-3 text-base font-black">One clean entry point</h2>
            <p className="mt-1 text-[10px] leading-relaxed text-white/65">
              Instead of keeping District, Tehsil, Mauza, Khasra and related
              imports nested in the sidebar, this page becomes the visual import
              center.
            </p>
          </section>
        </div>
      </div>
    </AdminPage>
  );
}

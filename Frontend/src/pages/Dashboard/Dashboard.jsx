import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LogOut,
  Menu,
  Home,
  LayoutDashboard,
  Folder,
  ChevronDown,
  Map as MapIcon,
  Layers,
  Package,
  LayoutGrid,
} from "lucide-react";

import rudaFirmLogo from "../../assets/Rudafirm.png";
import MapPanel from "./MapPanel";
import BarChart from "./BarChart";
import PieChart from "./PieChart";
import { STAT_GROUPS, TONE_STYLES } from "./dashboardData";

/* ============================================================
   Brand tokens — lifted straight from LandingPage.jsx so the
   dashboard reads as the same product, not a different app.
   ============================================================ */
const BRAND = {
  deepest: "#00351f",
  dark: "#004225",
  primary: "#0B7A3B",
  accent: "#70D84F",
  accentSoft: "#8FEA67",
  cyan: "#45C8FF",
};

const HEADER_BG = {
  backgroundImage: [
    `linear-gradient(90deg, ${BRAND.deepest}f0 0%, ${BRAND.dark}d1 38%, ${BRAND.primary}b8 65%, ${BRAND.deepest}c7 100%)`,
    "url('/ruda_bg.png')",
  ].join(", "),
  backgroundSize: "cover",
  backgroundPosition: "center center",
  backgroundRepeat: "no-repeat",
};

const GROUP_ICONS = {
  map: MapIcon,
  layers: Layers,
  package: Package,
  grid: LayoutGrid,
};

/* ============================================================
   HEADER — same gradient / logo / actions language as the
   public site header, adapted for the logged-in admin shell.
   ============================================================ */
function DashboardHeader({
  darkMode,
  setDarkMode,
  sidebarOpen,
  toggleSidebar,
}) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div
      className="w-full h-[60px] px-3 md:px-6 flex items-center justify-between shrink-0"
      style={HEADER_BG}
    >
      {/* LEFT */}
      <div className="flex items-center gap-2 md:gap-4 min-w-0">
        <button
          onClick={toggleSidebar}
          className="text-white hover:bg-white/10 p-1.5 md:p-2 rounded-md transition shrink-0"
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        <div className="bg-white rounded-full p-0.5 md:p-1 flex items-center justify-center shrink-0">
          <img
            src={rudaFirmLogo}
            alt="RLIMS"
            className="h-7 w-7 md:h-10 md:w-10 object-contain"
          />
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-base sm:text-xl md:text-2xl font-black tracking-tight text-white truncate">
            <span className="hidden sm:inline">
              RUDA GIS — Administration Portal
            </span>
            <span className="sm:hidden">Admin Portal</span>
          </h1>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`hidden sm:flex w-10 h-5 md:w-12 md:h-6 items-center rounded-full p-0.5 md:p-1 transition ${
            darkMode ? "bg-[#70D84F]" : "bg-white/30"
          }`}
        >
          <div
            className={`w-3.5 h-3.5 md:w-4 md:h-4 bg-white rounded-full transition-transform ${
              darkMode ? "translate-x-5 md:translate-x-6" : "translate-x-0"
            }`}
          />
        </button>

        <button
          onClick={() => navigate("/")}
          className="bg-white/15 hover:bg-white/25 text-white p-1.5 md:p-2 rounded-md flex items-center justify-center transition"
          aria-label="Go to landing page"
          title="Home"
        >
          <Home size={16} className="md:hidden" />
          <Home size={18} className="hidden md:block" />
        </button>

        <button
          onClick={handleLogout}
          className="bg-[#0B7A3B] hover:bg-[#004225] text-white text-xs md:text-sm px-2.5 md:px-4 py-1.5 rounded-full font-bold flex items-center gap-1.5 md:gap-2 transition-all hover:-translate-y-px hover:shadow-lg"
        >
          <LogOut size={14} className="md:hidden" />
          <LogOut size={16} className="hidden md:block" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   SIDEBAR
   ============================================================ */
function DashboardSidebar({ sidebarOpen }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;
  const isAreaPath = location.pathname.startsWith("/area/");
  const isMauzaGroupPath =
    location.pathname === "/area/mauza" ||
    location.pathname === "/area/khasra" ||
    location.pathname === "/area/murabba";

  const menu = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  ];
  const areaItems = [
    { label: "District", path: "/area/district" },
    { label: "Tehsil", path: "/area/tehsil" },
    { label: "Mauza", path: "/area/mauza" },
  ];
  const mauzaItems = [
    { label: "Khasra", path: "/area/khasra" },
    { label: "Murabba", path: "/area/murabba" },
  ];

  const [areaOpen, setAreaOpen] = useState(false);
  const [mauzaOpen, setMauzaOpen] = useState(isMauzaGroupPath);

  useMemo(() => {
    if (!isMauzaGroupPath) setMauzaOpen(false);
  }, [isMauzaGroupPath]);

  const handleAreaItemClick = (path) => {
    navigate(path);
    if (path === "/area/mauza") {
      setAreaOpen(true);
      setMauzaOpen(true);
    }
  };

  return (
    <aside
      className={`
        bg-white dark:bg-[#0f1720] border-r border-[#0B7A3B]/20 dark:border-[#0B7A3B]/30 flex flex-col
        transition-all duration-300 ease-in-out overflow-hidden
        absolute md:relative z-50 h-[calc(100vh-60px)] md:h-auto shadow-xl md:shadow-none
        ${sidebarOpen ? "w-64 opacity-100" : "w-0 opacity-0 border-r-0"}
      `}
    >
      <div
        className={`flex-1 px-4 py-6 space-y-2 transition-opacity duration-200 ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {menu.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition
                ${
                  isActive(item.path)
                    ? "bg-[#0B7A3B] text-white shadow-sm"
                    : "hover:bg-[#edf8ef] dark:hover:bg-white/5 text-slate-600 dark:text-slate-400"
                }`}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}

        <div className="mt-2">
          <button
            onClick={() => setAreaOpen((p) => !p)}
            className={`flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition
              ${
                isAreaPath || areaOpen
                  ? "bg-[#edf8ef] dark:bg-[#0B7A3B]/15 text-[#0B7A3B] dark:text-[#70D84F] border border-[#0B7A3B]/25"
                  : "hover:bg-[#edf8ef] dark:hover:bg-white/5 text-slate-600 dark:text-slate-400"
              }`}
          >
            <Folder size={18} />
            <span className="flex-1 text-left">Area Management</span>
            <ChevronDown
              size={16}
              className={`${areaOpen ? "rotate-180" : ""} transition-transform`}
            />
          </button>

          <div
            className={`mt-2 space-y-1 pl-8 pr-2 transition-all overflow-hidden ${
              areaOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            {areaItems.map((it) => {
              const mauzaIsSelected =
                it.path === "/area/mauza" && isMauzaGroupPath;
              return (
                <div key={it.label}>
                  <button
                    onClick={() => handleAreaItemClick(it.path)}
                    className={`flex w-full items-center gap-3 px-2 py-2 rounded-lg text-sm transition text-left
                      ${
                        isActive(it.path) || mauzaIsSelected
                          ? "bg-black/5 dark:bg-white/5 text-black dark:text-white"
                          : "hover:bg-black/3 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400"
                      }`}
                  >
                    <span className="flex-1 text-[13px]">{it.label}</span>
                    {it.path === "/area/mauza" && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setMauzaOpen((p) => !p);
                        }}
                        className="inline-flex items-center justify-center p-1"
                      >
                        <ChevronDown
                          size={14}
                          className={`${mauzaOpen ? "rotate-180" : ""} transition-transform`}
                        />
                      </span>
                    )}
                  </button>

                  {it.path === "/area/mauza" && (
                    <div
                      className={`mt-1 space-y-1 pl-5 overflow-hidden transition-all ${
                        mauzaOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      {mauzaItems.map((sub) => (
                        <button
                          key={sub.label}
                          onClick={() => navigate(sub.path)}
                          className={`flex w-full items-center gap-3 px-2 py-2 rounded-lg text-sm transition text-left
                            ${
                              isActive(sub.path)
                                ? "bg-black/5 dark:bg-white/5 text-black dark:text-white"
                                : "hover:bg-black/3 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400"
                            }`}
                        >
                          <span className="text-[13px]">{sub.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ============================================================
   LIVE STAT TICKER — same rotating-band pattern as the hero
   section of LandingPage.jsx, reusing the identical STAT_GROUPS
   data so the two pages tell the same story.
   ============================================================ */
function StatTicker() {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % STAT_GROUPS.length);
        setFade(true);
      }, 350);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const goTo = (i) => {
    setFade(false);
    setTimeout(() => {
      setIndex(i);
      setFade(true);
    }, 350);
  };

  const group = STAT_GROUPS[index];
  const Icon = GROUP_ICONS[group.icon];

  return (
    <div
      className="w-full shrink-0"
      style={{
        backgroundImage: `linear-gradient(90deg, ${BRAND.deepest} 0%, ${BRAND.dark} 55%, ${BRAND.primary} 100%)`,
      }}
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 py-2.5 sm:flex-row sm:gap-6 sm:px-6">
        <div className="flex shrink-0 items-center gap-2 text-center sm:border-r sm:border-white/15 sm:pr-6 sm:text-left">
          {Icon ? (
            <span className="hidden sm:flex h-7 w-7 items-center justify-center rounded-md bg-white/10 text-[#8FEA67]">
              <Icon size={15} />
            </span>
          ) : null}
          <span className="text-[11px] font-black uppercase leading-tight tracking-[0.14em] text-[#8FEA67] sm:text-sm">
            {group.title}
          </span>
        </div>

        <div
          className={`grid flex-1 gap-2 text-center text-white transition-all duration-300 ease-out sm:gap-6 ${
            group.stats.length === 3
              ? "grid-cols-3"
              : "grid-cols-2 sm:grid-cols-4"
          } ${fade ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1.5"}`}
        >
          {group.stats.map(({ value, label }) => (
            <div key={label} className="py-0.5">
              <div className="text-base font-black text-[#70D84F] xs:text-lg sm:text-xl">
                {value}
              </div>
              <div className="text-[8px] font-semibold uppercase tracking-[0.1em] text-white/60 sm:text-[10px]">
                {label}
              </div>
            </div>
          ))}
        </div>

        <div className="flex shrink-0 justify-center gap-1.5">
          {STAT_GROUPS.map((g, i) => (
            <button
              key={g.key}
              onClick={() => goTo(i)}
              aria-label={`Show ${g.title} stats`}
              className={`rounded-full transition-all duration-300 ${
                i === index
                  ? "h-1.5 w-5 bg-[#70D84F]"
                  : "h-1.5 w-1.5 bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   KPI GROUP CARD — one card per STAT_GROUPS entry, all visible
   at once (unlike the rotating ticker) so nothing is hidden.
   ============================================================ */
function GroupCard({ group }) {
  const tone = TONE_STYLES[group.tone] ?? TONE_STYLES.green;
  const Icon = GROUP_ICONS[group.icon];
  const cols = group.stats.length === 3 ? "grid-cols-3" : "grid-cols-2";

  return (
    <div
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900
      px-4 py-4 shadow-sm ring-1 ring-transparent transition-all duration-300 hover:shadow-md ${tone.ring}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone.iconWrap}`}
        >
          {Icon ? <Icon size={18} /> : null}
        </div>
        <h3 className="text-[13.5px] font-bold text-slate-800 dark:text-slate-100 leading-tight">
          {group.title}
        </h3>
      </div>

      <div className={`mt-4 grid ${cols} gap-3`}>
        {group.stats.map((s) => (
          <div key={s.label}>
            <div
              className={`text-[18px] font-black tracking-tight leading-none ${tone.value}`}
            >
              {s.value}
            </div>
            <div className="mt-1 text-[10.5px] font-medium leading-tight text-slate-500 dark:text-slate-400">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function KPISection() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {STAT_GROUPS.map((group) => (
        <GroupCard key={group.key} group={group} />
      ))}
    </div>
  );
}

/* ============================================================
   DASHBOARD — top-level page
   ============================================================ */
export default function Dashboard() {
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") setDarkMode(false);

    const savedSidebar = localStorage.getItem("sidebarOpen");
    if (savedSidebar !== null) setSidebarOpen(savedSidebar === "true");
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("sidebarOpen", sidebarOpen);
  }, [sidebarOpen]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <div className="h-screen overflow-hidden bg-white text-gray-800 dark:bg-[#0b0f14] dark:text-white font-sans">
      <div className="flex h-full flex-col">
        <DashboardHeader
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          sidebarOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
        />

        <StatTicker />

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <DashboardSidebar sidebarOpen={sidebarOpen} />

          <main className="min-h-0 flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto px-3 pt-3 pb-3 xl:px-4 xl:pt-3 xl:pb-3">
              <div className="space-y-4">
                {/* Page header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 border-b border-slate-100 dark:border-slate-800/50 pb-3">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Dashboard Overview
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Land Information System, RUDA Metaverse, RTW Packages
                      &amp; Chahar Bagh — live snapshot
                    </p>
                  </div>
                </div>

                {/* KPI cards, one per STAT_GROUPS entry */}
                <KPISection />

                {/* Map + land-use chart */}
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.6fr_1fr]">
                  <div className="h-[300px] sm:h-[360px] xl:h-[380px] overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <MapPanel />
                  </div>
                  <div className="h-[300px] sm:h-[360px] xl:h-[380px]">
                    <PieChart />
                  </div>
                </div>

                {/* Structural comparison chart */}
                <div className="grid grid-cols-1 gap-3">
                  <div className="h-[300px] sm:h-[340px]">
                    <BarChart />
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

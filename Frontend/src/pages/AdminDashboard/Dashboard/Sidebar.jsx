import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  ChevronDown,
  Database,
  LayoutDashboard,
  MapPinned,
  Settings,
  SlidersHorizontal,
  Users,
  Map,
  Workflow,
} from "lucide-react";

const groups = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  {
    label: "Data Management",
    icon: Database,
    path: "/data-management/import",
    match: ["/data-management", "/area/"],
    children: [
      { label: "Shapefile Import", path: "/data-management/import" },
    ],
  },
  {
    label: "Plot Management",
    icon: MapPinned,
    path: "/plot-management",
    match: ["/plot-management"],
    children: [
      { label: "Plot Explorer", path: "/plot-management" },
      { label: "Plot Details", path: "/plot-management/details" },
      { label: "Transfer Plot Data", path: "/plot-management/transfer" },
    ],
  },
  { label: "Transfers", icon: Workflow, path: "/transfers" },
  { label: "KMZ Map Logs", icon: Map, path: "/kmz-map-logs" },
  { label: "Reports", icon: BarChart3, path: "/reports" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export default function Sidebar({ sidebarOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState({ data: false, plots: false });

  const isGroupActive = (item) => {
    if (item.path === "/dashboard") return location.pathname === "/dashboard";
    const prefixes = item.match || [item.path];
    return prefixes.some((prefix) => location.pathname.startsWith(prefix));
  };

  useEffect(() => {
    setOpenGroups((prev) => ({
      ...prev,
      data: location.pathname.startsWith("/data-management") || location.pathname.startsWith("/area/"),
      plots: location.pathname.startsWith("/plot-management"),
    }));
  }, [location.pathname]);

  const toggle = (label) => {
    const key = label === "Data Management" ? "data" : "plots";
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <aside
      className={`relative z-30 flex h-full shrink-0 flex-col overflow-hidden border-r border-white/5 bg-gradient-to-b from-[#043b2c] via-[#064b38] to-[#033829] text-white shadow-xl transition-all duration-300 ${
        sidebarOpen ? "w-[224px] opacity-100" : "w-0 opacity-0"
      }`}
    >
      <div className="flex-1 overflow-y-auto px-2.5 py-4">
        <nav className="space-y-1">
          {groups.map((item) => {
            const Icon = item.icon;
            const active = isGroupActive(item);
            const hasChildren = item.children?.length;
            const key = item.label === "Data Management" ? "data" : item.label === "Plot Management" ? "plots" : null;
            const expanded = key ? openGroups[key] : false;

            return (
              <div key={item.label}>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => navigate(item.path)}
                    className={`flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-semibold transition ${
                      active
                        ? "bg-[#118548] text-white shadow-[inset_3px_0_0_#70D84F]"
                        : "text-white/78 hover:bg-white/8 hover:text-white"
                    }`}
                  >
                    <Icon size={18} className={active ? "text-white" : "text-white/75"} />
                    <span className="truncate">{item.label}</span>
                  </button>

                  {hasChildren ? (
                    <button
                      onClick={() => toggle(item.label)}
                      className="rounded-lg p-2 text-white/65 transition hover:bg-white/10 hover:text-white"
                      aria-label={`Toggle ${item.label}`}
                    >
                      <ChevronDown size={15} className={`transition ${expanded ? "rotate-180" : ""}`} />
                    </button>
                  ) : null}
                </div>

                {hasChildren && expanded ? (
                  <div className="ml-7 mt-1 space-y-1 border-l border-white/10 pl-3">
                    {item.children.map((child) => {
                      const childActive = location.pathname === child.path;
                      return (
                        <button
                          key={child.path}
                          onClick={() => navigate(child.path)}
                          className={`block w-full rounded-md px-2.5 py-2 text-left text-[12px] transition ${
                            childActive
                              ? "bg-white/10 font-bold text-[#8FEA67]"
                              : "text-white/55 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          {child.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
      </div>

      <div className="m-3 rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-center gap-2 text-[11px] font-bold text-white/90">
          <SlidersHorizontal size={15} className="text-[#70D84F]" />
          RUDA GIS Administration
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-white/50">
          Sustainable · People-Centric · Prosperous Punjab
        </p>
      </div>
    </aside>
  );
}

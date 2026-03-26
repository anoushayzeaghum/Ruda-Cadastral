import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Map, FileText, Settings } from "lucide-react";

export default function Sidebar({ sidebarOpen }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const menu = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Map, label: "Map View", path: "/mapview" },
    { icon: FileText, label: "Reports", path: "/reports" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <aside
      className={`
        bg-white dark:bg-[#0f1720] border-r border-green-900/40 flex flex-col
        transition-all duration-300 ease-in-out overflow-hidden
        ${sidebarOpen ? "w-64 opacity-100" : "w-0 opacity-0 border-r-0"}
      `}
    >
      <div
        className={`
          flex-1 px-4 py-6 space-y-2 transition-opacity duration-200
          ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
      >
        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm transition
                ${
                  isActive(item.path)
                    ? "bg-green-500/20 text-black dark:text-white border border-green-500/30"
                    : "hover:bg-black/5 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400"
                }
              `}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
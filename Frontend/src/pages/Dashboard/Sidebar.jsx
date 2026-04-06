import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Map,
  FileText,
  Settings,
  Folder,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

export default function Sidebar({ sidebarOpen }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const menu = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Map, label: "Map View", path: "/mapview" },
    { icon: FileText, label: "Reports", path: "/reports" },
    { icon: Settings, label: "Settings", path: "/settings" },
    { icon: Settings, label: "Demarcation", path: "/demarcation" },
  ];

  const areaItems = [
    { label: "Division", path: "/area/division" },
    { label: "District", path: "/area/district" },
    { label: "Tehsil", path: "/area/tehsil" },
    { label: "Mouza", path: "/area/mouza" },
    { label: "Khasra", path: "/area/khasra" },
  ];

  const [areaOpen, setAreaOpen] = useState(true);

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

        {/* Area Management group */}
        <div className="mt-2">
          <button
            onClick={() => setAreaOpen((s) => !s)}
            className={`flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm transition
                ${
                  isActive("/area") || areaOpen
                    ? "bg-green-500/20 text-black dark:text-white border border-green-500/30"
                    : "hover:bg-black/5 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400"
                }
              `}
          >
            <Folder size={18} />
            <span className="flex-1 text-left">Area Management</span>
            <ChevronDown
              size={16}
              className={`${areaOpen ? "rotate-180" : ""} transition-transform`}
            />
          </button>

          <div
            className={`mt-2 space-y-1 pl-8 pr-2 transition-all ${areaOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}
          >
            {areaItems.map((it) => (
              <button
                key={it.label}
                onClick={() => navigate(it.path)}
                className={`flex w-full items-center gap-3 px-2 py-2 rounded-lg text-sm transition text-left
                  ${isActive(it.path) ? "bg-black/5 dark:bg-white/5 text-black dark:text-white" : "hover:bg-black/3 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400"}
                `}
              >
                <span className="text-[13px]">{it.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

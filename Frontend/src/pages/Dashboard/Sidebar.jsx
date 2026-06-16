import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Map,
  Settings,
  Folder,
  ChevronDown,
} from "lucide-react";
import { useMemo, useState } from "react";

export default function Sidebar({ sidebarOpen }) {
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
    // { icon: Map, label: "Map View", path: "/mapview" },
    // { icon: Settings, label: "Demarcation", path: "/demarcation" },
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
    if (!isMauzaGroupPath) {
      setMauzaOpen(false);
    }
  }, [isMauzaGroupPath]);

  const handleAreaToggle = () => {
    setAreaOpen((prev) => !prev);
  };

  const handleAreaItemClick = (path) => {
    navigate(path);

    if (path === "/area/mauza") {
      setAreaOpen(true);
      setMauzaOpen(true);
    }
  };

  const handleMauzaToggle = () => {
    setMauzaOpen((prev) => !prev);
  };

  return (
    <aside
      className={`
        bg-white dark:bg-[#0f1720] border-r border-green-900/40 flex flex-col
        transition-all duration-300 ease-in-out overflow-hidden
        absolute md:relative z-50 h-[calc(100vh-60px)] md:h-auto shadow-xl md:shadow-none
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

        <div className="mt-2">
          <button
            onClick={handleAreaToggle}
            className={`flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm transition
              ${
                isAreaPath || areaOpen
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
                      }
                    `}
                  >
                    <span className="flex-1 text-[13px]">{it.label}</span>

                    {it.path === "/area/mauza" && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMauzaToggle();
                        }}
                        className="inline-flex items-center justify-center p-1"
                      >
                        <ChevronDown
                          size={14}
                          className={`${
                            mauzaOpen ? "rotate-180" : ""
                          } transition-transform`}
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
                            }
                          `}
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

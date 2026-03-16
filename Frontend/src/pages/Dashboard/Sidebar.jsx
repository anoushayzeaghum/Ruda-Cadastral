import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Map,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";

export default function Sidebar() {
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
    <div className="w-64 bg-[#0f1720] border-r border-green-900/40 flex flex-col">

      {/* Header */}
      <div className="px-6 py-6 border-b border-green-900/40">
        <h1 className="text-xl font-semibold tracking-wide">
          RCMS
        </h1>
        <p className="text-xs text-gray-400">
          RUDA Cadastral Management System
        </p>
      </div>

      {/* Menu */}
      <div className="flex-1 px-4 py-6 space-y-2">

        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm transition
                ${
                  isActive(item.path)
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "hover:bg-white/5 text-gray-400"
                }
              `}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-green-900/40">
        <button className="flex w-full items-center justify-center gap-2 bg-green-600 hover:bg-green-500 rounded-lg py-3 text-sm">
          <LogOut size={16} />
          Logout
        </button>
      </div>

    </div>
  );
}
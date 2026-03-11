import { useNavigate, useLocation } from "react-router-dom";
import {
  LogOut,
  LayoutDashboard,
  Map,
  Settings,
  FileText,
  Clipboard,
} from "lucide-react";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    window.location.href = "/login";
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-64 bg-white text-slate-700 flex flex-col shadow-lg border-r">

      {/* Header */}
      <div className="p-5 border-b">
        <h1 className="text-3xl font-medium tracking-widest uppercase text-green-700">
          RCMS
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 flex flex-col gap-2">

        {/* Dashboard */}
        <button
          onClick={() => navigate("/dashboard")}
          className={`flex items-center gap-3 text-left px-4 py-3 rounded-lg transition-colors duration-200 font-normal
          ${isActive("/dashboard")
            ? "bg-green-700 text-white"
            : "bg-green-200 text-black hover:bg-green-300"}`}
        >
          <LayoutDashboard size={20} />
          Dashboard
        </button>

        {/* Map */}
        <button
          onClick={() => navigate("/mapview")}
          className={`flex items-center gap-3 text-left px-4 py-3 rounded-lg transition-colors duration-200 font-normal
          ${isActive("/mapview")
            ? "bg-green-700 text-white"
            : "bg-green-200 text-black hover:bg-green-300"}`}
        >
          <Map size={20} />
          Map View
        </button>

        {/* Area Management */}
        <button className="flex items-center gap-3 text-left px-4 py-3 rounded-lg bg-green-200 text-black hover:bg-green-300 transition-colors duration-200 font-normal">
          <Clipboard size={20} />
          Area Management
        </button>

        {/* Survey */}
        <button className="flex items-center gap-3 text-left px-4 py-3 rounded-lg bg-green-200 text-black hover:bg-green-300 transition-colors duration-200 font-normal">
          <Settings size={20} />
          Survey
        </button>

        {/* Reports */}
        <button className="flex items-center gap-3 text-left px-4 py-3 rounded-lg bg-green-200 text-black hover:bg-green-300 transition-colors duration-200 font-normal">
          <FileText size={20} />
          Reports
        </button>

      </nav>

      {/* Logout */}
      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200 text-white font-normal"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>

    </div>
  );
}
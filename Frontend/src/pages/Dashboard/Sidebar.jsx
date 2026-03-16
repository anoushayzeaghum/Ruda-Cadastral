import { useNavigate, useLocation } from "react-router-dom";
import rudaFirmLogo from "../../assets/Rudafirm.png";
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
    <div className="w-64 min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-gray-300 flex flex-col shadow-xl border-r border-green-700/30">
      {/* Header */}
      <div className="px-5 py-6 border-b border-green-700/30 flex items-center gap-3 bg-gradient-to-r from-green-900/40 to-slate-800">
        {/* Logo */}
        <img
          src={rudaFirmLogo}
          alt="RUDA"
          className="h-10 w-auto object-contain"
        />

        {/* Title */}
        <h1 className="text-3xl font-normal tracking-wider text-white">RCMS</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-2">
        {/* Dashboard */}
        <button
          onClick={() => navigate("/dashboard")}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
          ${
            isActive("/dashboard")
              ? "bg-green-700 text-white shadow-lg shadow-green-700/30"
              : "hover:bg-slate-700 hover:text-white"
          }`}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </button>

        {/* Map */}
        <button
          onClick={() => navigate("/mapview")}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
          ${
            isActive("/mapview")
              ? "bg-green-700 text-white shadow-lg shadow-green-700/30"
              : "hover:bg-slate-700 hover:text-white"
          }`}
        >
          <Map size={18} />
          Map View
        </button>

        {/* Area Management */}
        <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all hover:bg-slate-700 hover:text-white">
          <Clipboard size={18} />
          Area
        </button>

        {/* Survey */}
        <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all hover:bg-slate-700 hover:text-white">
          <Settings size={18} />
          Survey
        </button>

        {/* Reports */}
        <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all hover:bg-slate-700 hover:text-white">
          <FileText size={18} />
          Reports
        </button>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-green-700/30">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-green-700 hover:bg-green-600 transition text-white text-sm font-medium shadow-lg shadow-green-700/30"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
}

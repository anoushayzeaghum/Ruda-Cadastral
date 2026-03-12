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
    <div className="w-64 min-h-screen bg-[#1f2937] text-gray-300 flex flex-col shadow-xl">
      {/* Header */}
      <div className="px-5 py-6 border-b border-slate-700 flex items-center gap-3">
        {/* Logo */}
        <img
          src={rudaFirmLogo}
          alt="RUDA"
          className="h-10 w-auto object-contain"
        />

        {/* Title */}
        <h1 className="text-3xl font-normal tracking-wider text-white-400">
          RCMS
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-2">
        {/* Dashboard */}
        <button
          onClick={() => navigate("/dashboard")}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
          ${
            isActive("/dashboard")
              ? "bg-[#111827] text-white shadow-inner"
              : "hover:bg-[#374151] hover:text-white"
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
              ? "bg-[#111827] text-white shadow-inner"
              : "hover:bg-[#374151] hover:text-white"
          }`}
        >
          <Map size={18} />
          Map View
        </button>

        {/* Area Management */}
        <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all hover:bg-[#374151] hover:text-white">
          <Clipboard size={18} />
          Area Management
        </button>

        {/* Survey */}
        <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all hover:bg-[#374151] hover:text-white">
          <Settings size={18} />
          Survey
        </button>

        {/* Reports */}
        <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all hover:bg-[#374151] hover:text-white">
          <FileText size={18} />
          Reports
        </button>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 transition text-white text-sm font-medium"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
}

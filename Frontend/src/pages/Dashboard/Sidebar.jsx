import { useNavigate } from "react-router-dom";
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

  const handleLogout = () => {
    // Clear any auth tokens or user data here if needed
    // localStorage.removeItem("token");
    // Redirect to login page
    window.location.href = "/login";
  };

  return (
    <div className="w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col shadow-lg">
      {/* Header */}
      <div className="p-5 border-b border-slate-700">
        <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
          RCMS
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 flex flex-col gap-2">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-3 text-left px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors duration-200 text-slate-100 hover:text-white font-medium"
        >
          <LayoutDashboard size={20} />
          Dashboard
        </button>

        <button
          onClick={() => navigate("/mapview")}
          className="flex items-center gap-3 text-left px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors duration-200 text-slate-100 hover:text-white font-medium"
        >
          <Map size={20} />
          Map View
        </button>

        <button className="flex items-center gap-3 text-left px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors duration-200 text-slate-100 hover:text-white font-medium">
          <Clipboard size={20} />
          Area Management
        </button>

        <button className="flex items-center gap-3 text-left px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors duration-200 text-slate-100 hover:text-white font-medium">
          <Settings size={20} />
          Survey
        </button>

        <button className="flex items-center gap-3 text-left px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors duration-200 text-slate-100 hover:text-white font-medium">
          <FileText size={20} />
          Reports
        </button>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200 text-white font-medium"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
}

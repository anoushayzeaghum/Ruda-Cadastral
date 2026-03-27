import { LogOut, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import rudaFirmLogo from "../../assets/Rudafirm.png";

const headerBackgroundStyle = {
  backgroundImage: [
    "linear-gradient(90deg, rgba(20, 83, 45, 0.94) 0%, rgba(22, 101, 52, 0.82) 38%, rgba(21, 128, 61, 0.72) 65%, rgba(20, 83, 45, 0.78) 100%)",
    "url('/ruda_bg.png')",
  ].join(", "),
  backgroundSize: "cover",
  backgroundPosition: "center center",
  backgroundRepeat: "no-repeat",
};

export default function Header({
  darkMode,
  setDarkMode,
  sidebarOpen,
  toggleSidebar,
}) {
  return (
    <div
      className="
        w-full h-[60px] px-4 md:px-6 flex items-center justify-between"
      style={headerBackgroundStyle}
    >
      {/* LEFT */}
      <div className="flex items-center gap-3 md:gap-4 min-w-0">
        {/* SIDEBAR TOGGLE */}
        <button
          onClick={toggleSidebar}
          className="text-white hover:bg-white/10 p-2 rounded-md transition"
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
        >
          <Menu size={22} />
        </button>

        {/* Circular Logo */}
        <div className="bg-white rounded-full p-1 flex items-center justify-center shrink-0">
          <img
            src={rudaFirmLogo}
            alt="RLIMS"
            className="h-10 w-10 object-contain"
          />
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-2xl md:text-3xl font-normal text-white whitespace-nowrap">
            RCMS
          </h1>
          <span className="text-gray-300 hidden sm:inline">|</span>
          <span className="text-sm md:text-lg font-normal text-white/90 dark:text-gray-300 truncate hidden sm:inline">
            RUDA Cadastral Management System
          </span>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3 shrink-0">
        {/* THEME TOGGLE */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`w-12 h-6 flex items-center rounded-full p-1 transition ${
            darkMode ? "bg-green-600" : "bg-gray-300"
          }`}
        >
          <div
            className={`w-4 h-4 bg-white rounded-full transition-transform ${
              darkMode ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </button>

        {/* LOGOUT BUTTON */}
        <button className="bg-green-600 hover:bg-green-800 text-white text-sm px-4 py-2 rounded-md font-medium flex items-center gap-2 transition">
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </div>
  );
}

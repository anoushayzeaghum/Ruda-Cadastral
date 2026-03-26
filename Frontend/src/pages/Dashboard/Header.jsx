import { LogOut } from "lucide-react";
import rudaFirmLogo from "../../assets/Rudafirm.png";

export default function Header({ darkMode, setDarkMode }) {
  return (
    <div
      className="
      w-full h-[60px] px-6 flex items-center justify-between
      bg-gradient-to-r from-green-900 via-green-800 to-green-900 dark:bg-[#0b1218]
      border-b border-gray-200 dark:border-slate-800
      shadow-md dark:shadow-[0_4px_20px_rgba(0,0,0,0.6)]
    "
    >
      {/* LEFT */}
      <div className="flex items-center gap-4">
        {/* Circular Logo */}
        <div className="bg-white rounded-full p-1 flex items-center justify-center">
          <img
            src={rudaFirmLogo}
            alt="RLIMS"
            className="h-10 w-10 object-contain"
          />
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-normal text-white dark:text-white">
            RCMS
          </h1>
          <span className="text-gray-400">|</span>
          <span className="text-lg font-normal text-white dark:text-gray-400">
            RUDA Cadastral Management System
          </span>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3">
        {/* TOGGLE */}
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
        <button className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-md font-medium flex items-center gap-2 transition">
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );
}

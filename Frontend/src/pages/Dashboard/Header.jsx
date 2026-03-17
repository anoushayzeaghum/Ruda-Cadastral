import { Search } from "lucide-react";
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
        {/* 🔥 TOGGLE */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-12 h-6 flex items-center bg-gray-300 dark:bg-green-600 rounded-full p-1 transition"
        >
          <div
            className={`w-4 h-4 bg-white rounded-full transition-transform ${
              darkMode ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </button>

        {/* SEARCH */}
        <div className="relative w-[280px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />

          <input
            type="text"
            placeholder="Global Search"
            className="
              w-full pl-9 pr-4 py-2 rounded-lg
              bg-gray-100 dark:bg-[#111827]
              border border-gray-300 dark:border-slate-700
              text-gray-700 dark:text-gray-300
              focus:outline-none focus:ring-1 focus:ring-green-500
            "
          />
        </div>
      </div>
    </div>
  );
}

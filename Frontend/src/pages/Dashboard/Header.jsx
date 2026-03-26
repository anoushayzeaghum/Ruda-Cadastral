import { LogOut } from "lucide-react";
import rudaFirmLogo from "../../assets/Rudafirm.png";

/** Same asset as map header: `Frontend/public/ruda_bg.png` → `/ruda_bg.png` */
const headerBgBase = {
  backgroundSize: "cover",
  backgroundPosition: "center center",
  backgroundRepeat: "no-repeat",
};

const headerBackgroundLight = {
  ...headerBgBase,
  backgroundImage: [
    "linear-gradient(90deg, rgba(20, 83, 45, 0.94) 0%, rgba(22, 101, 52, 0.82) 38%, rgba(21, 128, 61, 0.72) 65%, rgba(20, 83, 45, 0.78) 100%)",
    "url('/ruda_bg.png')",
  ].join(", "),
};

const headerBackgroundDark = {
  ...headerBgBase,
  backgroundImage: [
    "linear-gradient(90deg, rgba(8, 23, 16, 0.93) 0%, rgba(20, 83, 45, 0.86) 42%, rgba(11, 18, 24, 0.9) 100%)",
    "url('/ruda_bg.png')",
  ].join(", "),
};

export default function Header({ darkMode }) {
  return (
    <div
      className="relative w-full h-[60px] border-b border-gray-200/30 dark:border-slate-800 shadow-md dark:shadow-[0_4px_20px_rgba(0,0,0,0.6)]"
      style={darkMode ? headerBackgroundDark : headerBackgroundLight}
    >
      <div className="relative z-10 flex h-full items-center justify-between px-6">
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
        {/* LOGOUT BUTTON */}
        <button className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-md font-medium flex items-center gap-2 transition">
          <LogOut size={16} />
          Logout
        </button>
      </div>
      </div>
    </div>
  );
}

import { Search, ChevronDown } from "lucide-react";
import rudaFirmLogo from "../../assets/Rudafirm.png";

export default function Header() {
  return (
    <div className="w-full bg-gradient-to-r from-green-900 via-green-800 to-green-900 text-white px-6 py-2 shadow-md">
      
      <div className="flex items-center justify-between">

        {/* LEFT SECTION */}
        <div className="flex items-center gap-4">

          {/* Circular Logo */}
          <div className="bg-white rounded-full p-1 flex items-center justify-center">
            <img
              src={rudaFirmLogo}
              alt="RLIMS"
              className="h-10 w-10 object-contain"
            />
          </div>

          {/* Title */}
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-normal tracking-wide">RCMS</h1>

            <span className="text-white/60 text-xl">|</span>

            <p className="text-lg font-normal text-white/90">
              RUDA Cadastral Management System
            </p>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-3">

          {/* Search */}
          <div className="flex items-center bg-white/95 rounded-md border border-white/30 px-3 py-1 w-[420px]">

            <Search className="text-gray-500 mr-2" size={16} />

            <input
              type="text"
              placeholder="Parcel ID / Khasra No., Owner Name,"
              className="flex-1 text-sm text-gray-700 bg-transparent focus:outline-none"
            />

            <ChevronDown className="text-gray-500 ml-2" size={16} />
          </div>

          {/* Export Button */}
          <button className="bg-green-700 hover:bg-green-600 text-white text-sm px-4 py-1.5 rounded-md font-medium">
            Export Report
          </button>

        </div>
      </div>
    </div>
  );
}
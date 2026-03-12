import rudaFirmLogo from "../../assets/Rudafirm.png";

export default function Header() {
  return (
    <div className="w-full bg-gradient-to-r from-green-800 via-green-700 to-green-600 text-white px-6 py-3 shadow-md">
      <div className="flex items-center justify-between gap-4">
        {/* Left Logo */}
        <div className="flex items-center gap-2">
          <img src={rudaFirmLogo} className="h-12 object-contain" />
          <div>
            <h1 className="text-sm font-bold tracking-wide">RLIMS</h1>
            <p className="text-xs font-light">
              RUDA Land Information Management System
            </p>
          </div>
        </div>

        {/* Center Search Bar */}
        <div className="flex-1 mx-6">
          <input
            type="text"
            placeholder="Parcel ID / Khasra No., Owner Name, Land Type"
            className="w-full px-4 py-2 rounded text-sm text-gray-700 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 bg-white/90"
          />
        </div>

        {/* Right Export Button */}
        <button className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm font-semibold text-white whitespace-nowrap">
          Export Report
        </button>
      </div>
    </div>
  );
}

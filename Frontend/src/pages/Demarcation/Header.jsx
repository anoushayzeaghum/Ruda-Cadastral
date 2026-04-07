import { Search, ChevronDown, LayoutDashboard } from "lucide-react";
import rudaFirmLogo from "../../assets/Rudafirm.png";
import { useNavigate } from "react-router-dom";

const headerBackgroundStyle = {
  backgroundImage: [
    "linear-gradient(90deg, rgba(20, 83, 45, 0.94) 0%, rgba(22, 101, 52, 0.82) 38%, rgba(21, 128, 61, 0.72) 65%, rgba(20, 83, 45, 0.78) 100%)",
    "url('/ruda_bg.png')",
  ].join(", "),
  backgroundSize: "cover",
  backgroundPosition: "center center",
  backgroundRepeat: "no-repeat",
};

export default function Header() {
  const navigate = useNavigate();

  return (
    <div
      className="relative w-full text-white px-6 py-2 shadow-md"
      style={headerBackgroundStyle}
    >
      <div className="relative z-10 flex items-center justify-between">
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
          {/* Dashboard Button */}
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-green-700 hover:bg-green-600 text-white text-sm px-4 py-1.5 rounded-md font-medium flex items-center gap-2 transition"
          >
            <LayoutDashboard size={16} />
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

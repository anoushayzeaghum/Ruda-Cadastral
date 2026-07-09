import { LogOut, Home } from "lucide-react";
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

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <div
      className="relative w-full text-white px-3 sm:px-6 py-2 shadow-md"
      style={headerBackgroundStyle}
    >
      <div className="relative z-10 flex items-center justify-between">
        {/* LEFT SECTION */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          {/* Circular Logo */}
          <div className="bg-white rounded-full p-1 flex items-center justify-center shrink-0">
            <img
              src={rudaFirmLogo}
              alt="RLIMS"
              className="h-7 w-7 sm:h-10 sm:w-10 object-contain"
            />
          </div>

          {/* Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <h1 className="text-lg sm:text-3xl font-normal tracking-wide whitespace-nowrap">RCMS</h1>

            <span className="text-white/60 text-base sm:text-xl hidden sm:block">|</span>

            <p className="text-xs sm:text-lg font-normal text-white/90 truncate hidden sm:block">
              RUDA Cadastral Management System
            </p>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Home Button */}
          <button
            onClick={() => navigate("/")}
            className="bg-white/15 hover:bg-white/25 text-white p-1.5 sm:p-2 rounded-md flex items-center justify-center transition"
            aria-label="Go to landing page"
            title="Home"
          >
            <Home size={16} className="sm:hidden" />
            <Home size={18} className="hidden sm:block" />
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="bg-white/15 hover:bg-white/25 text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-md flex items-center gap-1.5 sm:gap-2 transition"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut size={16} className="sm:hidden" />
            <LogOut size={18} className="hidden sm:block" />
            <span className="text-xs sm:text-sm font-medium hidden sm:block">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
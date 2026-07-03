import { LogOut, Menu, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div
      className="w-full h-[60px] px-3 md:px-6 flex items-center justify-between shrink-0"
      style={headerBackgroundStyle}
    >
      {/* LEFT */}
      <div className="flex items-center gap-2 md:gap-4 min-w-0">
        <button
          onClick={toggleSidebar}
          className="text-white hover:bg-white/10 p-1.5 md:p-2 rounded-md transition shrink-0"
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        <div className="bg-white rounded-full p-0.5 md:p-1 flex items-center justify-center shrink-0">
          <img
            src={rudaFirmLogo}
            alt="RLIMS"
            className="h-7 w-7 md:h-10 md:w-10 object-contain"
          />
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-base sm:text-xl md:text-3xl font-normal text-white truncate">
            <span className="hidden sm:inline">Administration Portal</span>
            <span className="sm:hidden">Admin Portal</span>
          </h1>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
        {/* Dark mode toggle — hidden on very small screens */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`hidden sm:flex w-10 h-5 md:w-12 md:h-6 items-center rounded-full p-0.5 md:p-1 transition ${
            darkMode ? "bg-green-600" : "bg-gray-300"
          }`}
        >
          <div
            className={`w-3.5 h-3.5 md:w-4 md:h-4 bg-white rounded-full transition-transform ${
              darkMode ? "translate-x-5 md:translate-x-6" : "translate-x-0"
            }`}
          />
        </button>

        <button
          onClick={() => navigate("/")}
          className="bg-white/15 hover:bg-white/25 text-white p-1.5 md:p-2 rounded-md flex items-center justify-center transition"
          aria-label="Go to landing page"
          title="Home"
        >
          <Home size={16} className="md:hidden" />
          <Home size={18} className="hidden md:block" />
        </button>

        <button
          onClick={handleLogout}
          className="bg-green-700 hover:bg-green-600 text-white text-xs md:text-sm px-2.5 md:px-4 py-1.5 rounded-md font-medium flex items-center gap-1.5 md:gap-2 transition"
        >
          <LogOut size={14} className="md:hidden" />
          <LogOut size={16} className="hidden md:block" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </div>
  );
}

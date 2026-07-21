import { LogOut, Home } from "lucide-react";
import rudaFirmLogo from "../../assets/Rudafirm.png";
import { useNavigate } from "react-router-dom";

export default function Header({
  darkMode,
  setDarkMode,
  sidebarOpen,
  toggleSidebar,
} = {}) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <div className="relative z-40 w-full bg-[#0f3d2e] px-3 py-2 text-white shadow-md sm:px-6">
      <div className="relative z-10 flex items-center justify-between">
        {/* LEFT SECTION */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          {/* Circular Logo */}
          <div className="flex shrink-0 items-center justify-center rounded-full bg-white p-1">
            <img
              src={rudaFirmLogo}
              alt="RLIMS"
              className="h-7 w-7 object-contain sm:h-10 sm:w-10"
            />
          </div>

          {/* Title */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <h1 className="whitespace-nowrap text-lg font-normal tracking-wide sm:text-3xl">
              Plot Information System
            </h1>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex shrink-0 items-center gap-2">
          <IconButton
            title="Home"
            onClick={() => navigate("/")}
            icon={<Home size={18} />}
          />

          <IconButton
            title="Logout"
            onClick={handleLogout}
            icon={<LogOut size={18} />}
          />
        </div>
      </div>
    </div>
  );
}

function IconButton({ title, icon, onClick }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/25 bg-white/15 text-white shadow-sm transition hover:border-white/40 hover:bg-white/25"
    >
      {icon}
    </button>
  );
}

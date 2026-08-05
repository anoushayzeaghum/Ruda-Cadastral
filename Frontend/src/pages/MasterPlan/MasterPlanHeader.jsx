import { Home, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import rudaFirmLogo from "../../assets/Rudafirm.png";

export default function MasterPlanHeader() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const handleHome = () => {
    navigate("/");
  };

  return (
    <header className="relative z-40 w-full bg-[#0f3d2e] px-3 py-2 text-white shadow-md sm:px-5">
      <div className="relative z-10 flex items-center justify-between">
        {/* Left: logo + title */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="flex shrink-0 items-center justify-center rounded-full bg-white p-1">
            <img
              src={rudaFirmLogo}
              alt="RUDA Masterplan"
              className="h-7 w-7 object-contain sm:h-9 sm:w-9"
            />
          </div>

          <h1 className="truncate text-sm font-normal tracking-wide sm:text-xl md:text-2xl">
            RUDA MASTERPLAN
          </h1>
        </div>

        {/* Right: Home + Logout */}
        <div className="flex shrink-0 items-center gap-2">
          <IconButton
            title="Home"
            icon={<Home size={18} />}
            onClick={handleHome}
          />

          <IconButton
            title="Logout"
            icon={<LogOut size={18} />}
            onClick={handleLogout}
          />
        </div>
      </div>
    </header>
  );
}

function IconButton({ title, icon, onClick, disabled = false }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/25 bg-white/15 text-white shadow-sm transition hover:border-white/40 hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {icon}
    </button>
  );
}

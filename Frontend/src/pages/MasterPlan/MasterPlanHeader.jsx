import { Home, LogOut, MapPinned } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MasterPlanHeader() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <header className="relative z-50 flex h-14 w-full items-center border-b border-white/10 bg-[#0f3d2e] px-3 text-white shadow-lg sm:px-5">
      <div className="flex w-full items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10">
            <MapPinned size={19} />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold tracking-[0.08em] sm:text-lg">
              RUDA MASTERPLAN
            </h1>
            <p className="hidden truncate text-[10px] text-white/60 sm:block">
              Planning, land information and infrastructure management
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <HeaderButton
            title="Home"
            icon={<Home size={17} />}
            onClick={() => navigate("/")}
          />

          <HeaderButton
            title="Logout"
            icon={<LogOut size={17} />}
            onClick={handleLogout}
          />
        </div>
      </div>
    </header>
  );
}

function HeaderButton({ title, icon, onClick }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition hover:border-white/40 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
    >
      {icon}
    </button>
  );
}
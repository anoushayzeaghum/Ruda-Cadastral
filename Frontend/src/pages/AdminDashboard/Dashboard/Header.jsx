import { Bell, Home, LogOut, Menu, Moon, Search, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import rudaFirmLogo from "../../../assets/Rudafirm.png";

export default function Header({ darkMode, setDarkMode, toggleSidebar }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  let userName = "Admin User";
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    userName = user?.name || user?.full_name || user?.username || userName;
  } catch (_) {
    // Keep the safe default when localStorage has a non-JSON user value.
  }

  return (
    <header className="h-[68px] shrink-0 border-b border-white/10 bg-gradient-to-r from-[#00351f] via-[#064e35] to-[#003b29] px-3 text-white shadow-sm md:px-5">
      <div className="flex h-full items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-white/90 transition hover:bg-white/10"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        <button onClick={() => navigate("/dashboard")} className="flex min-w-0 items-center gap-3 text-left">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white p-1 shadow-sm">
            <img src={rudaFirmLogo} alt="RUDA" className="h-full w-full object-contain" />
          </span>
          <span className="hidden min-w-0 lg:block">
            <span className="block truncate text-[20px] font-extrabold tracking-tight">
              RUDA GIS — Administration Portal
            </span>
            <span className="block text-[10px] font-medium tracking-wide text-white/60">
              Urban Development for a Better Tomorrow
            </span>
          </span>
        </button>

        <div className="mx-auto hidden w-full max-w-[520px] md:block">
          <div className="flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 backdrop-blur-sm">
            <Search size={16} className="text-white/65" />
            <input
              type="text"
              placeholder="Search plots, projects, layers, mauzas..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/50"
            />
            <span className="rounded-md bg-black/15 px-2 py-1 text-[10px] font-semibold text-white/55">Ctrl K</span>
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 md:gap-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="hidden h-9 items-center gap-1 rounded-lg border border-white/10 bg-white/10 px-2 transition hover:bg-white/15 sm:flex"
            title="Toggle theme"
          >
            {darkMode ? <Moon size={15} /> : <Sun size={15} />}
            <span className={`relative h-4 w-8 rounded-full ${darkMode ? "bg-[#70D84F]" : "bg-white/25"}`}>
              <span
                className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${
                  darkMode ? "left-[18px]" : "left-0.5"
                }`}
              />
            </span>
          </button>

          <button className="relative rounded-lg p-2 text-white/85 transition hover:bg-white/10" title="Notifications">
            <Bell size={18} />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#064e35]" />
          </button>

          <button
            onClick={() => navigate("/")}
            className="rounded-lg p-2 text-white/85 transition hover:bg-white/10"
            title="Home"
          >
            <Home size={18} />
          </button>

          <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-2.5 py-1.5 xl:flex">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#75a9ff] text-xs font-bold text-white">AD</span>
            <span className="max-w-[130px]">
              <span className="block truncate text-xs font-bold">{userName}</span>
              <span className="block text-[9px] text-white/55">System Administrator</span>
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold transition hover:bg-white/20"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

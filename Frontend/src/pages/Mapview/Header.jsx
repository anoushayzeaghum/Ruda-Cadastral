import { LayoutDashboard, LogOut, Home } from "lucide-react";
import rudaFirmLogo from "../../assets/Rudafirm.png";
import { useNavigate } from "react-router-dom";

// const headerBackgroundStyle = {
//   backgroundImage: [
//     "linear-gradient(90deg, rgba(20, 83, 45, 0.96) 0%, rgba(22, 101, 52, 0.86) 42%, rgba(21, 128, 61, 0.72) 70%, rgba(20, 83, 45, 0.82) 100%)",
//     "url('/ruda_bg.png')",
//   ].join(", "),
//   backgroundSize: "cover",
//   backgroundPosition: "center center",
//   backgroundRepeat: "no-repeat",
// };

const headerBackgroundStyle = {
  backgroundColor: "#0f3d2e",
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
      className="relative w-full text-white px-3 sm:px-5 py-1.5 sm:py-2 shadow-md z-40"
      style={headerBackgroundStyle}
    >
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="bg-white rounded-full p-0.5 sm:p-1 flex items-center justify-center shrink-0">
            <img
              src={rudaFirmLogo}
              alt="RLIMS"
              className="h-7 w-7 sm:h-9 sm:w-9 object-contain"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <h1 className="text-xs sm:text-sm md:text-base lg:text-xl font-normal tracking-wide truncate">
              <span className="hidden sm:inline">RUDA CADASTRAL MANAGEMENT SYSTEM</span>
              <span className="sm:hidden">RUDA CADASTRAL</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={() => navigate("/")}
            className="bg-white/15 hover:bg-white/25 text-white p-1.5 sm:p-2 rounded-md flex items-center justify-center transition"
            aria-label="Go to landing page"
            title="Home"
          >
            <Home size={15} className="sm:hidden" />
            <Home size={18} className="hidden sm:block" />
          </button>

          <IconButton
            title="Logout"
            onClick={handleLogout}
            icon={<LogOut size={15} className="sm:hidden" />}
            iconLg={<LogOut size={18} className="hidden sm:block" />}
          />
        </div>
      </div>
    </div>
  );
}

function IconButton({ title, icon, iconLg, onClick }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="h-7 w-7 sm:h-9 sm:w-9 rounded-lg bg-white/15 border border-white/25 text-white flex items-center justify-center shadow-sm transition hover:bg-white/25 hover:border-white/40"
    >
      {icon}
      {iconLg}
    </button>
  );
}

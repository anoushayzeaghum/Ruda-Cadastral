import { LayoutDashboard, LogOut } from "lucide-react";
import rudaFirmLogo from "../../assets/Rudafirm.png";
import { useNavigate } from "react-router-dom";

const headerBackgroundStyle = {
  backgroundImage: [
    "linear-gradient(90deg, rgba(20, 83, 45, 0.96) 0%, rgba(22, 101, 52, 0.86) 42%, rgba(21, 128, 61, 0.72) 70%, rgba(20, 83, 45, 0.82) 100%)",
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
      className="relative w-full text-white px-5 py-2 shadow-md z-40"
      style={headerBackgroundStyle}
    >
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-white rounded-full p-1 flex items-center justify-center shrink-0">
            <img
              src={rudaFirmLogo}
              alt="RLIMS"
              className="h-9 w-9 object-contain"
            />
          </div>

          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-2xl font-normal tracking-wide shrink-0">RCMS</h1>
            <span className="text-white/55 text-lg">|</span>
            <p className="text-base font-normal text-white/90 truncate">
              RUDA Cadastral Management System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <IconButton
            title="Dashboard"
            onClick={() => navigate("/dashboard")}
            icon={<LayoutDashboard size={18} />}
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
      className="h-9 w-9 rounded-lg bg-white/15 border border-white/25 text-white flex items-center justify-center shadow-sm transition hover:bg-white/25 hover:border-white/40"
    >
      {icon}
    </button>
  );
}

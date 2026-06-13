import { Box, Home, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import rudaFirmLogo from "../../assets/Rudafirm.png";

const headerBackgroundStyle = {
  backgroundImage: [
    "linear-gradient(90deg, rgba(20, 83, 45, 0.96) 0%, rgba(22, 101, 52, 0.86) 42%, rgba(21, 128, 61, 0.72) 70%, rgba(20, 83, 45, 0.82) 100%)",
    "url('/ruda_bg.png')",
  ].join(", "),
  backgroundSize: "cover",
  backgroundPosition: "center center",
  backgroundRepeat: "no-repeat",
};

export default function Society3DHeader() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <header
      className="relative z-40 w-full px-5 py-2 text-white shadow-md"
      style={headerBackgroundStyle}
    >
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white p-1">
            <img src={rudaFirmLogo} alt="RUDA" className="h-9 w-9 object-contain" />
          </div>

          <div className="flex min-w-0 items-center gap-3">
            <h1 className="shrink-0 text-2xl font-normal tracking-wide">RCMS</h1>
            <span className="text-lg text-white/55">|</span>
            <p className="truncate text-base font-normal text-white/90">
              RUDA 3D Society Management System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <IconButton title="Back to Dashboard" onClick={() => navigate("/landing")} icon={<Home size={18} />} />
          <IconButton title="3D View" icon={<Box size={18} />} />
          <IconButton title="Logout" onClick={handleLogout} icon={<LogOut size={18} />} />
        </div>
      </div>
    </header>
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

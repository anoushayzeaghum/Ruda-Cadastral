import { LogOut, Home } from "lucide-react";
import rudaFirmLogo from "../../assets/Rudafirm.png";
import { useNavigate } from "react-router-dom";

// Old green image background commented
// const headerBackgroundStyle = {
//   backgroundImage: [
//     "linear-gradient(90deg, rgba(20, 83, 45, 0.96) 0%, rgba(22, 101, 52, 0.86) 42%, rgba(21, 128, 61, 0.72) 70%, rgba(20, 83, 45, 0.82) 100%)",
//     "url('/ruda_bg.png')",
//   ].join(", "),
//   backgroundSize: "cover",
//   backgroundPosition: "center center",
//   backgroundRepeat: "no-repeat",
// };

export default function Header() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="relative z-40 w-full bg-[#0f3d2e] px-3 py-2 text-white shadow-md sm:px-5">
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="flex shrink-0 items-center justify-center rounded-full bg-white p-1">
            <img
              src={rudaFirmLogo}
              alt="GIS Metaverse"
              className="h-7 w-7 object-contain sm:h-9 sm:w-9"
            />
          </div>

          <h1 className="truncate text-sm font-normal tracking-wide sm:text-xl md:text-2xl">
            RUDA GIS METAVERSE
          </h1>
        </div>

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
      className="h-9 w-9 rounded-lg bg-white/15 border border-white/25 text-white flex items-center justify-center shadow-sm transition hover:bg-white/25 hover:border-white/40"
    >
      {icon}
    </button>
  );
}

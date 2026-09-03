import { LayoutDashboard, LogOut, Home, Loader2, Printer } from "lucide-react";
import rudaFirmLogo from "../../assets/Rudafirm.png";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PRINT_EVENTS,
  dispatchPrintEvent,
} from "../GISMetaverse/Printing/PrintEvents";
import PrintTitleModal from "./Printing/PrintTitleModal";

const headerBackgroundStyle = {
  backgroundColor: "#0f3d2e",
};

export default function Header() {
  const navigate = useNavigate();
  const [printState, setPrintState] = useState({
    mapReady: false,
    printLoading: false,
  });

  const [titleModal, setTitleModal] = useState({
    open: false,
    defaultTitle: "RUDA Cadastral Management Map",
  });

  useEffect(() => {
    const handlePrintState = (event) => {
      if (event.detail?.mode && event.detail.mode !== "cadastral") return;
      setPrintState({
        mapReady: Boolean(event.detail?.mapReady),
        printLoading: Boolean(event.detail?.printLoading),
      });
    };

    window.addEventListener(PRINT_EVENTS.PRINT_STATE, handlePrintState);
    dispatchPrintEvent(PRINT_EVENTS.REQUEST_PRINT_STATE);

    return () => {
      window.removeEventListener(PRINT_EVENTS.PRINT_STATE, handlePrintState);
    };
  }, []);

  const handlePrint = () => {
    setTitleModal({ open: true, defaultTitle: "RUDA Cadastral Management Map" });
  };

  const handleTitleConfirm = (title) => {
    setTitleModal((prev) => ({ ...prev, open: false }));
    dispatchPrintEvent(PRINT_EVENTS.PRINT_CURRENT_MAP, { customTitle: title });
  };

  const handleTitleCancel = () => {
    setTitleModal((prev) => ({ ...prev, open: false }));
  };

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
      <PrintTitleModal
        isOpen={titleModal.open}
        defaultTitle={titleModal.defaultTitle}
        onConfirm={handleTitleConfirm}
        onCancel={handleTitleCancel}
      />
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
              <span className="hidden sm:inline">
                RUDA LAND INFORMATION SYSTEM
              </span>
              <span className="sm:hidden">RUDA CADASTRAL</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            disabled={!printState.mapReady || printState.printLoading}
            className="h-7 sm:h-9 rounded-lg bg-white/15 border border-white/25 px-2 sm:px-3 text-white flex items-center justify-center gap-1.5 shadow-sm transition hover:bg-white/25 hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Print current cadastral map"
            title={printState.mapReady ? "Print current cadastral map" : "Map is still loading"}
          >
            {printState.printLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Printer size={16} />
            )}
            <span className="hidden sm:inline text-xs font-semibold">PRINT</span>
          </button>

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

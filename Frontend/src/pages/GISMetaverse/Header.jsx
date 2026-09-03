import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Home,
  Loader2,
  LogOut,
  Map,
  PackageOpen,
  Printer,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import rudaFirmLogo from "../../assets/Rudafirm.png";
import { PRINT_EVENTS, dispatchPrintEvent } from "./Printing/PrintEvents";
import PrintTitleModal from "./Printing/PrintTitleModal";

export default function Header() {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [isPrintMenuOpen, setIsPrintMenuOpen] = useState(false);

  const [mapPrintState, setMapPrintState] = useState({
    mapReady: false,
    printLoading: false,
  });

  const [importPrintState, setImportPrintState] = useState({
    hasKmz: false,
    printLoading: false,
  });

  useEffect(() => {
    const handleMapPrintState = (event) => {
      setMapPrintState({
        mapReady: Boolean(event.detail?.mapReady),
        printLoading: Boolean(event.detail?.printLoading),
      });
    };

    const handleImportPrintState = (event) => {
      setImportPrintState({
        hasKmz: Boolean(event.detail?.hasKmz),
        printLoading: Boolean(event.detail?.printLoading),
      });
    };

    window.addEventListener(PRINT_EVENTS.PRINT_STATE, handleMapPrintState);

    window.addEventListener(PRINT_EVENTS.IMPORT_STATE, handleImportPrintState);

    dispatchPrintEvent(PRINT_EVENTS.REQUEST_PRINT_STATE);
    dispatchPrintEvent(PRINT_EVENTS.REQUEST_IMPORT_STATE);

    return () => {
      window.removeEventListener(PRINT_EVENTS.PRINT_STATE, handleMapPrintState);

      window.removeEventListener(
        PRINT_EVENTS.IMPORT_STATE,
        handleImportPrintState,
      );
    };
  }, []);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        setIsPrintMenuOpen(false);
      }
    };

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setIsPrintMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const isAnyPrintLoading =
    mapPrintState.printLoading || importPrintState.printLoading;

  // ── Title modal state ──────────────────────────────────────────────────────
  const [titleModal, setTitleModal] = useState({
    open: false,
    defaultTitle: "",
    eventName: "",
  });

  const openTitleModal = (eventName, defaultTitle) => {
    setIsPrintMenuOpen(false);
    setTitleModal({ open: true, defaultTitle, eventName });
  };

  const handleTitleConfirm = (title) => {
    setTitleModal((prev) => ({ ...prev, open: false }));
    dispatchPrintEvent(titleModal.eventName, { customTitle: title });
  };

  const handleTitleCancel = () => {
    setTitleModal((prev) => ({ ...prev, open: false }));
  };

  const handleCurrentMapPrint = () => {
    openTitleModal(PRINT_EVENTS.PRINT_CURRENT_MAP, "RUDA GIS Metaverse Map");
  };

  const handleImportedKmzPrint = () => {
    openTitleModal(PRINT_EVENTS.PRINT_IMPORTED_KMZ, "RUDA Imported KMZ Map");
  };

  const handleHome = () => {
    setIsPrintMenuOpen(false);

    // Use a complete page navigation because client-side navigation from
    // the Mapbox page leaves some map state active and causes a blank screen.
    window.location.assign("/landing");
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    navigate("/login", { replace: true });
  };

  return (
    <header className="relative z-40 w-full bg-[#0f3d2e] px-3 py-2 text-white shadow-md sm:px-5">
      <PrintTitleModal
        isOpen={titleModal.open}
        defaultTitle={titleModal.defaultTitle}
        onConfirm={handleTitleConfirm}
        onCancel={handleTitleCancel}
      />
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="flex shrink-0 items-center justify-center rounded-full bg-white p-1">
            <img
              src={rudaFirmLogo}
              alt="RUDA GIS Metaverse"
              className="h-7 w-7 object-contain sm:h-9 sm:w-9"
            />
          </div>

          <h1 className="truncate text-sm font-normal tracking-wide sm:text-xl md:text-2xl">
            RUDA GIS METAVERSE
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={isPrintMenuOpen}
              onClick={() => setIsPrintMenuOpen((current) => !current)}
              className="flex h-9 items-center justify-center gap-2 rounded-lg border border-white/30 bg-white/15 px-3 text-xs font-normal tracking-wide text-white shadow-sm transition hover:border-white/50 hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/50 sm:text-sm"
            >
              {isAnyPrintLoading ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Printer size={17} />
              )}

              <span>Print</span>

              <ChevronDown
                size={15}
                className={`transition-transform ${
                  isPrintMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isPrintMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-11 z-50 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 text-slate-800 shadow-2xl"
              >
                <PrintMenuButton
                  icon={<Map size={17} />}
                  label="Print Map Page"
                  description="Print only the layers currently visible on the map."
                  onClick={handleCurrentMapPrint}
                  disabled={
                    !mapPrintState.mapReady || mapPrintState.printLoading
                  }
                />

                <div className="my-1 h-px bg-slate-200" />

                <PrintMenuButton
                  icon={<PackageOpen size={17} />}
                  label="Print Imported .KMZ"
                  description={
                    importPrintState.hasKmz
                      ? "Print the imported KMZ with the approved layout."
                      : "Import a KMZ file first to enable this option."
                  }
                  onClick={handleImportedKmzPrint}
                  disabled={
                    !importPrintState.hasKmz || importPrintState.printLoading
                  }
                />
              </div>
            )}
          </div>

          <IconButton
            title="Home"
            onClick={handleHome}
            icon={<Home size={18} />}
          />

          <IconButton
            title="Logout"
            onClick={handleLogout}
            icon={<LogOut size={18} />}
          />
        </div>
      </div>
    </header>
  );
}

function PrintMenuButton({
  icon,
  label,
  description,
  onClick,
  disabled = false,
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent"
    >
      <span className="mt-0.5 text-[#0f3d2e]">{icon}</span>

      <span>
        <span className="block text-sm font-semibold">{label}</span>

        <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">
          {description}
        </span>
      </span>
    </button>
  );
}

function IconButton({ title, ariaLabel, icon, onClick, disabled = false }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={ariaLabel || title}
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/25 bg-white/15 text-white shadow-sm transition hover:border-white/40 hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {icon}
    </button>
  );
}

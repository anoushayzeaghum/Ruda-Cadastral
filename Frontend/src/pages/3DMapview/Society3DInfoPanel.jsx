import { useEffect, useState } from "react";
import {
  Building2,
  FileText,
  Grid2X2,
  HelpCircle,
  MapPin,
  Ruler,
  X,
} from "lucide-react";
import { getFeatureId } from "./cesiumHelpers";

// Hook — true when viewport width is below the sm breakpoint (640 px)
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 640,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isMobile;
}

function readProp(feature, keys = [], fallback = "N/A") {
  const props = feature?.properties || {};
  for (const key of keys) {
    const value = props[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return fallback;
}

export default function Society3DInfoPanel({ feature, isOpen, onClose }) {
  const isMobile = useIsMobile();
  
  if (!isOpen || !feature) return null;

  const featureType =
    feature?._layerKey || feature?.properties?._layerKey || "3D Feature";

  const rows = [
    ["Feature ID", getFeatureId(feature)],
    [
      "Plot No",
      readProp(feature, [
        "plot_no",
        "plot",
        "parcel_no",
        "parcel_id",
        "kh",
        "khasra_no",
      ]),
    ],
    [
      "Land Use",
      readProp(feature, ["landuse", "land_use", "use", "type", "category"]),
    ],

    ["Area", readProp(feature, ["area", "area_kanal", "kanal", "shape_area"])],
    [
      "Height",
      readProp(feature, [
        "height",
        "height_m",
        "height_ft",
        "floors",
        "floor_count",
      ]),
    ],
    ["Status", readProp(feature, ["status", "remarks"])],
  ];

  return (
    <>
      <style>{`
        @keyframes society3dPanelDrop {
          from {
            opacity: 0;
            transform: translateY(-18px) scaleY(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scaleY(1);
          }
        }
        
        @keyframes society3dPanelSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Mobile backdrop overlay */}
      {isMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={onClose}
        />
      )}

      <aside
        className={`z-50 overflow-hidden border border-[#13593f] bg-[#06291f] text-white shadow-2xl ${
          isMobile
            ? 'fixed bottom-0 left-0 right-0 rounded-t-xl'
            : 'absolute right-3 sm:right-5 top-3 sm:top-5 w-[280px] sm:w-[330px] rounded-md'
        }`}
        style={{
          animation: isMobile 
            ? "society3dPanelSlideUp 220ms ease-out both"
            : "society3dPanelDrop 220ms ease-out both",
          transformOrigin: isMobile ? "bottom center" : "top center",
          maxHeight: isMobile ? '65vh' : 'calc(100vh - 40px)',
        }}
      >
        {/* Mobile drag handle */}
        {isMobile && (
          <div className="flex justify-center py-2">
            <div className="h-1 w-10 rounded-full bg-white/30" />
          </div>
        )}
        
        <div className="flex items-center justify-between border-b border-[#0c3d2d] bg-[#06291f] px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex min-w-0 items-center gap-2">
            <MapPin size={16} className="shrink-0 text-[#9be37b] sm:w-[18px] sm:h-[18px]" />
            <h2 className="truncate text-xs sm:text-sm font-bold uppercase tracking-wide">
              3D Feature Info
            </h2>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Grid2X2 size={14} className="text-white/45 hidden sm:block sm:w-[15px] sm:h-[15px]" />
            <FileText size={14} className="text-white/45 hidden sm:block sm:w-[15px] sm:h-[15px]" />
            <HelpCircle size={14} className="text-white/45 hidden sm:block sm:w-[15px] sm:h-[15px]" />
            <button
              type="button"
              title="Close"
              aria-label="Close information panel"
              onClick={onClose}
              className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md text-white/55 transition hover:bg-white/10 hover:text-white"
            >
              <X size={14} className="sm:w-[15px] sm:h-[15px]" />
            </button>
          </div>
        </div>

        <div className="space-y-2 sm:space-y-3 overflow-y-auto p-3 sm:p-4"
          style={{ maxHeight: isMobile ? 'calc(65vh - 80px)' : 'calc(100vh - 160px)' }}
        >
          <div className="rounded-md border border-[#13593f] bg-[#06291f] p-2 sm:p-3">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-white/45">
                  Selected Layer
                </p>
                <p className="truncate text-xs sm:text-sm font-bold text-white/90">
                  {featureType}
                </p>
              </div>
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-md border border-[#0c3d2d] bg-[#06291f]">
                <Building2 size={16} className="text-[#9be37b] sm:w-[18px] sm:h-[18px]" />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-[#13593f]">
            <div className="flex items-center gap-1.5 sm:gap-2 border-b border-[#0c3d2d] bg-[#06291f] px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-[12px] font-semibold text-white/80">
              <Ruler size={13} className="text-[#9be37b] sm:w-[14px] sm:h-[14px]" />
              Attribute Details
            </div>

            <div className="divide-y divide-[#0c3d2d] bg-[#06291f]">
              {rows.map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-[90px_1fr] sm:grid-cols-[110px_1fr] items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5"
                >
                  <p className="truncate text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-white/45">
                    {label}
                  </p>
                  <p className="truncate text-right text-[11px] sm:text-[12px] font-semibold text-white/85">
                    {String(value ?? "N/A")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

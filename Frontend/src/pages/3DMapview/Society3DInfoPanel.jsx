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

function readProp(feature, keys = [], fallback = "N/A") {
  const props = feature?.properties || {};
  for (const key of keys) {
    const value = props[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return fallback;
}

export default function Society3DInfoPanel({ feature, isOpen, onClose }) {
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
      `}</style>

      <aside
        className="absolute right-5 top-5 z-50 w-[330px] overflow-hidden rounded-md border border-[#13593f] bg-[#06291f] text-white shadow-2xl"
        style={{
          animation: "society3dPanelDrop 220ms ease-out both",
          transformOrigin: "top center",
        }}
      >
        <div className="flex items-center justify-between border-b border-[#0c3d2d] bg-[#06291f] px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <MapPin size={18} className="shrink-0 text-[#9be37b]" />
            <h2 className="truncate text-sm font-bold uppercase tracking-wide">
              3D Feature Info
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Grid2X2 size={15} className="text-white/45" />
            <FileText size={15} className="text-white/45" />
            <HelpCircle size={15} className="text-white/45" />
            <button
              type="button"
              title="Close"
              aria-label="Close information panel"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-md text-white/55 transition hover:bg-white/10 hover:text-white"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(100vh-120px)] space-y-3 overflow-y-auto p-4">
          <div className="rounded-md border border-[#13593f] bg-[#06291f] p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/45">
                  Selected Layer
                </p>
                <p className="truncate text-sm font-bold text-white/90">
                  {featureType}
                </p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#0c3d2d] bg-[#06291f]">
                <Building2 size={18} className="text-[#9be37b]" />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-[#13593f]">
            <div className="flex items-center gap-2 border-b border-[#0c3d2d] bg-[#06291f] px-3 py-2 text-[12px] font-semibold text-white/80">
              <Ruler size={14} className="text-[#9be37b]" />
              Attribute Details
            </div>

            <div className="divide-y divide-[#0c3d2d] bg-[#06291f]">
              {rows.map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-[110px_1fr] items-center gap-3 px-3 py-2.5"
                >
                  <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-white/45">
                    {label}
                  </p>
                  <p className="truncate text-right text-[12px] font-semibold text-white/85">
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

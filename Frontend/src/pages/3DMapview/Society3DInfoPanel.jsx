import { Building2, FileText, Grid2X2, HelpCircle, MapPin, Ruler, X } from "lucide-react";
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

  const featureType = feature?._layerKey || feature?.properties?._layerKey || "3D Feature";

  const rows = [
    ["Feature ID", getFeatureId(feature)],
    ["Plot No", readProp(feature, ["plot_no", "plot", "parcel_no", "parcel_id", "kh", "khasra_no"])],
    ["Land Use", readProp(feature, ["landuse", "land_use", "use", "type", "category"])],
    ["Society", readProp(feature, ["society", "society_name"])],
    ["Mauza", readProp(feature, ["mauza", "mauza_name"])],
    ["Area", readProp(feature, ["area", "area_kanal", "kanal", "shape_area"])],
    ["Height", readProp(feature, ["height", "height_m", "height_ft", "floors", "floor_count"])],
    ["Status", readProp(feature, ["status", "remarks"])],
  ];

  return (
    <aside className="absolute bottom-5 left-4 z-20 w-[360px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
      <div className="flex items-center justify-between bg-[#0f3d2e] px-4 py-3 text-white">
        <div className="flex min-w-0 items-center gap-2">
          <MapPin size={18} className="shrink-0" />
          <h2 className="truncate text-sm font-bold uppercase tracking-wide">3D Feature Information</h2>
        </div>
        <div className="flex items-center gap-2">
          <Grid2X2 size={16} />
          <FileText size={16} />
          <HelpCircle size={16} />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 transition hover:bg-white/10"
            aria-label="Close information panel"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-3 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Selected Layer</p>
            <p className="text-sm font-bold text-slate-900">{featureType}</p>
          </div>
          <Building2 size={25} className="text-green-700" />
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-slate-700">
            <Ruler size={14} /> Attribute Details
          </div>
          <div className="grid grid-cols-2 gap-3">
            {rows.map(([label, value]) => (
              <div key={label} className="min-w-0">
                <p className="text-[11px] font-medium text-slate-500">{label}</p>
                <p className="truncate text-[12px] font-semibold text-slate-900">{String(value ?? "N/A")}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

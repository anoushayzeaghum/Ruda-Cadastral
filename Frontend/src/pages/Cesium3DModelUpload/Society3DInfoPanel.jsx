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

const INTERNAL_KEYS = new Set(["_layerKey", "_metadataCount"]);

function formatLabel(key = "") {
  return String(key)
    .replace(/^_+/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatValue(value) {
  if (value === undefined || value === null || value === "") return "N/A";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch (error) {
      return String(value);
    }
  }
  return String(value);
}

function readProp(feature, keys = [], fallback = "N/A") {
  const props = feature?.properties || {};
  for (const key of keys) {
    const value = props[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return fallback;
}

function getBimRows(feature) {
  const props = feature?.properties || {};
  const priorityKeys = [
    "ElementId",
    "elementId",
    "element_id",
    "Name",
    "name",
    "Category",
    "category",
    "Family",
    "family",
    "Type",
    "type",
    "Level",
    "level",
    "Material",
    "material",
    "GUID",
    "Guid",
    "guid",
    "GlobalId",
  ];

  const orderedKeys = [];
  priorityKeys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(props, key) && !orderedKeys.includes(key)) {
      orderedKeys.push(key);
    }
  });

  Object.keys(props)
    .filter((key) => !INTERNAL_KEYS.has(key) && !orderedKeys.includes(key))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .forEach((key) => orderedKeys.push(key));

  return orderedKeys.map((key) => [formatLabel(key), formatValue(props[key])]);
}

function getGisRows(feature) {
  return [
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
    ["Area", readProp(feature, ["area", "area_kanal", "kanal", "shape_area"])],
    ["Status", readProp(feature, ["status", "remarks"])],
  ];
}

export default function Society3DInfoPanel({ feature, isOpen, onClose }) {
  if (!isOpen || !feature) return null;

  const isBimComponent = feature?._featureType === "bim-component";
  const featureType =
    feature?._layerKey || feature?.properties?._layerKey || "3D Feature";
  const rows = isBimComponent ? getBimRows(feature) : getGisRows(feature);

  return (
    <>
      <style>{`
        @keyframes society3dPanelDrop {
          from { opacity: 0; transform: translateY(-18px) scaleY(0.96); }
          to { opacity: 1; transform: translateY(0) scaleY(1); }
        }
      `}</style>

      <aside
        className="absolute right-5 top-5 z-50 w-[370px] max-w-[calc(100vw-40px)] overflow-hidden rounded-md border border-[#13593f] bg-[#06291f] text-white shadow-2xl"
        style={{
          animation: "society3dPanelDrop 220ms ease-out both",
          transformOrigin: "top center",
        }}
      >
        <div className="flex items-center justify-between border-b border-[#0c3d2d] bg-[#06291f] px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <MapPin size={18} className="shrink-0 text-[#9be37b]" />
            <h2 className="truncate text-sm font-bold uppercase tracking-wide">
              {isBimComponent ? "BIM Component Information" : "3D Feature Info"}
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
                {isBimComponent && (
                  <p className="mt-1 text-[10px] text-white/45">
                    {rows.length} metadata properties found
                  </p>
                )}
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#0c3d2d] bg-[#06291f]">
                <Building2 size={18} className="text-[#9be37b]" />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-[#13593f]">
            <div className="flex items-center gap-2 border-b border-[#0c3d2d] bg-[#06291f] px-3 py-2 text-[12px] font-semibold text-white/80">
              <Ruler size={14} className="text-[#9be37b]" />
              {isBimComponent ? "Component Metadata" : "Attribute Details"}
            </div>

            {rows.length ? (
              <div className="divide-y divide-[#0c3d2d] bg-[#06291f]">
                {rows.map(([label, value], index) => (
                  <div
                    key={`${label}-${index}`}
                    className="grid grid-cols-[130px_minmax(0,1fr)] items-start gap-3 px-3 py-2.5"
                  >
                    <p className="break-words text-[10px] font-semibold uppercase tracking-wide text-white/45">
                      {label}
                    </p>
                    <p
                      className="break-words text-right text-[12px] font-semibold text-white/85"
                      title={value}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#06291f] px-4 py-5 text-center text-[12px] text-white/55">
                This BIM component was picked, but the tiled asset does not expose component metadata.
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

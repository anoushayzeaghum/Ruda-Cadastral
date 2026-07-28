import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Download,
  ListChecks,
  Trash2,
} from "lucide-react";
import { exportSelectedParcelsKMZ } from "../exportKMZ.jsx";

const firstValue = (...values) =>
  values.find(
    (value) =>
      value !== undefined && value !== null && String(value).trim() !== "",
  ) ?? "N/A";

const getKhasra = (properties = {}) =>
  firstValue(
    properties.kh,
    properties.KH,
    properties.k,
    properties.K,
    properties.khasra,
    properties.khasra_no,
    properties.khasra_id,
    properties.join_shp,
  );

const getAreaAcres = (parcel) => {
  const props = parcel?.properties || {};
  const direct = Number(props._area_acres);
  if (Number.isFinite(direct)) return direct;

  const squareMetres = Number(props._area_m2);
  if (Number.isFinite(squareMetres)) return squareMetres / 4046.8564224;

  const areaSqFt = Number(props.area_sqft ?? props.area_sq_ft);
  if (Number.isFinite(areaSqFt)) return areaSqFt / 43560;

  return null;
};

export default function MultipleParcelPanel({
  parcels = [],
  isOpen = false,
  onClear = () => {},
  boundaryStatus = "verified",
}) {
  const [minimized, setMinimized] = useState(false);

  const rows = useMemo(
    () =>
      parcels.map((parcel, index) => {
        const props = parcel?.properties || {};
        const areaAcres = getAreaAcres(parcel);
        return {
          key: String(
            props.gid ?? props.id ?? props.khasra_id ?? parcel?.id ?? index,
          ),
          parcelId: firstValue(parcel?.id, props.gid, props.id),
          khasra: getKhasra(props),
          mauza: firstValue(props.mauza, props.mauza_name, props.Mauza),
          tehsil: firstValue(props.tehsil, props.tehsil_name, props.Tehsil),
          district: firstValue(
            props.district,
            props.district_name,
            props.District,
          ),
          areaAcres,
          ownership: firstValue(
            props.ownership,
            props.owner,
            props.owner_name,
            props.land_owner,
          ),
          landType: firstValue(props.type, props.land_type),
          assessmentCircle: firstValue(props.asse_cir, props.rthIff),
        };
      }),
    [parcels],
  );

  const totalArea = useMemo(() => {
    const available = rows
      .map((row) => row.areaAcres)
      .filter((value) => Number.isFinite(value));
    if (!available.length) return null;
    return available.reduce((sum, value) => sum + value, 0);
  }, [rows]);

  if (!isOpen) return null;

  return (
    <div className="absolute right-1 bottom-4 z-20 flex w-[calc(100vw-24px)] max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:right-3 sm:bottom-6 sm:w-[min(760px,calc(100vw-90px))]">
      {" "}
      <div className="flex items-center justify-between gap-2 bg-[#0f3d2e] px-3 py-2.5 text-white">
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold uppercase tracking-wide">
          <ListChecks size={18} className="shrink-0" />
          <span className="truncate">Multiple Parcel Information</span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() =>
              exportSelectedParcelsKMZ(parcels, {
                verified: boundaryStatus === "verified",
              })
            }
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/25 bg-white/15 px-2.5 text-[11px] font-semibold transition hover:bg-white/25"
            title="Download selected parcels as KMZ"
          >
            <Download size={15} /> KMZ
          </button>
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/25 bg-white/15 px-2.5 text-[11px] font-semibold transition hover:bg-white/25"
            title="Clear all selected parcels"
          >
            <Trash2 size={15} /> Clear
          </button>
          <button
            type="button"
            onClick={() => setMinimized((value) => !value)}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-white/10"
            title={minimized ? "Expand panel" : "Minimize panel"}
          >
            {minimized ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        </div>
      </div>
      {!minimized && (
        <>
          <div className="grid grid-cols-2 gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <div>
              <p className="text-[11px] font-medium text-slate-500">
                Selected Parcels
              </p>
              <p className="font-bold text-slate-900">{rows.length}</p>
            </div>
            {totalArea !== null && (
              <div>
                <p className="text-[11px] font-medium text-slate-500">
                  Total Area
                </p>
                <p className="font-bold text-slate-900">
                  {totalArea.toFixed(3)} acres
                </p>
              </div>
            )}
          </div>

          <div className="max-h-[45vh] overflow-auto">
            <table className="min-w-full border-collapse text-left text-[11px]">
              <thead className="sticky top-0 z-10 bg-slate-100 text-slate-600">
                <tr>
                  {[
                    "Parcel ID",
                    "KH",
                    "Mauza",
                    "Tehsil",
                    "District",
                    "Area",
                    "Verified",
                    "Ownership",
                    "Land Type",
                    "Assessment Circle",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap border-b border-slate-200 px-3 py-2 font-semibold"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key} className="hover:bg-slate-50">
                    <Cell value={row.parcelId} />
                    <Cell value={row.khasra} />
                    <Cell value={row.mauza} />
                    <Cell value={row.tehsil} />
                    <Cell value={row.district} />
                    <Cell
                      value={
                        Number.isFinite(row.areaAcres)
                          ? `${row.areaAcres.toFixed(3)} ac`
                          : "N/A"
                      }
                    />
                    <Cell
                      value={boundaryStatus === "verified" ? "Yes" : "No"}
                    />
                    <Cell value={row.ownership} />
                    <Cell value={row.landType} />
                    <Cell value={row.assessmentCircle} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Cell({ value }) {
  return (
    <td className="max-w-[180px] whitespace-nowrap border-b border-slate-100 px-3 py-2 font-medium text-slate-700">
      <span className="block truncate" title={String(value ?? "N/A")}>
        {value ?? "N/A"}
      </span>
    </td>
  );
}

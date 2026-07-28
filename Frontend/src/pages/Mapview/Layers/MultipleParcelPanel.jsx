import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Download,
  ListChecks,
  Trash2,
} from "lucide-react";
import { exportSelectedParcelsKMZ } from "../exportKMZ.jsx";

const hasValue = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

const firstValue = (...values) =>
  values.find((value) => hasValue(value)) ?? "N/A";

const firstKhasraValue = (...values) =>
  values.find((value) => hasValue(value) && String(value).trim() !== "0") ??
  "N/A";

const valueFromObject = (item, keys = []) => {
  if (!item || typeof item !== "object") return undefined;

  for (const key of keys) {
    const value = item?.[key];
    if (hasValue(value) && typeof value !== "object") return value;
  }

  return undefined;
};

const getSelectionName = (selection, keys = []) => {
  const items = Array.isArray(selection)
    ? selection
    : selection
      ? [selection]
      : [];

  for (const item of items) {
    if (hasValue(item) && typeof item !== "object") return item;

    const value = valueFromObject(item, keys);
    if (hasValue(value)) return value;
  }

  return undefined;
};

const getKhasraNumber = (properties = {}) =>
  firstKhasraValue(
    properties.kh,
    properties.KH,
    properties.k,
    properties.K,
    properties.khasra,
    properties.khasra_no,
    properties.khasra_id,
    properties.join_shp,
  );

const getMauzaName = (properties = {}, boundaryStatus, fallbackName) => {
  if (boundaryStatus === "unverified") {
    return firstValue(
      properties.mauza_name,
      properties.mauza_text,
      properties.mouza_name,
      properties.moza,
      properties.mouza,
      fallbackName,
    );
  }

  return firstValue(
    properties.mauza_name,
    properties.mauza,
    properties.Mauza,
    properties.moza,
    properties.mouza,
    fallbackName,
  );
};

const getTehsilName = (properties = {}, boundaryStatus, fallbackName) => {
  if (boundaryStatus === "unverified") {
    return firstValue(
      properties.tehsil_name,
      properties.tehsil_text,
      properties.Tehsil,
      fallbackName,
    );
  }

  return firstValue(
    properties.tehsil_name,
    properties.tehsil,
    properties.Tehsil,
    fallbackName,
  );
};

const getDistrictName = (properties = {}, boundaryStatus, fallbackName) => {
  if (boundaryStatus === "unverified") {
    return firstValue(
      properties.district_name,
      properties.district_text,
      properties.District,
      fallbackName,
    );
  }

  return firstValue(
    properties.district_name,
    properties.district,
    properties.District,
    fallbackName,
  );
};

const getOwnership = (properties = {}) =>
  firstValue(
    properties.ownership,
    properties.owner,
    properties.owner_name,
    properties.land_owner,
    properties.lp_name,
  );

const getAreaAcres = (parcel) => {
  const props = parcel?.properties || {};

  const directAcres = Number(
    props._area_acres ?? props.area_acres ?? props.area_acre,
  );
  if (Number.isFinite(directAcres)) return directAcres;

  const squareMetres = Number(props._area_m2 ?? props.area_m2);
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
  selectedMauza = null,
  selectedDistrict = [],
  selectedTehsil = [],
}) {
  const [minimized, setMinimized] = useState(false);

  const selectedMauzaName = getSelectionName(selectedMauza, [
    "mauza_name",
    "mauza",
    "name",
    "Mauza",
    "moza",
    "mouza",
    "label",
  ]);
  const selectedTehsilName = getSelectionName(selectedTehsil, [
    "tehsil_name",
    "tehsil",
    "name",
    "Tehsil",
    "label",
  ]);
  const selectedDistrictName = getSelectionName(selectedDistrict, [
    "district_name",
    "district",
    "name",
    "District",
    "label",
  ]);

  const rows = useMemo(
    () =>
      parcels.map((parcel, index) => {
        const props = parcel?.properties || {};

        return {
          key: String(
            props.gid ?? props.id ?? props.khasra_id ?? parcel?.id ?? index,
          ),
          khasra: getKhasraNumber(props),
          mauza: getMauzaName(props, boundaryStatus, selectedMauzaName),
          tehsil: getTehsilName(props, boundaryStatus, selectedTehsilName),
          district: getDistrictName(
            props,
            boundaryStatus,
            selectedDistrictName,
          ),
          areaAcres: getAreaAcres(parcel),
          ownership: getOwnership(props),
        };
      }),
    [
      parcels,
      boundaryStatus,
      selectedMauzaName,
      selectedTehsilName,
      selectedDistrictName,
    ],
  );

  const totalArea = useMemo(() => {
    const available = rows
      .map((row) => row.areaAcres)
      .filter((value) => Number.isFinite(value));

    if (!available.length) return null;
    return available.reduce((sum, value) => sum + value, 0);
  }, [rows]);

  const datasetLabel = boundaryStatus === "verified" ? "Khasra" : "RUDA Khasra";

  if (!isOpen) return null;

  return (
    <div className="absolute right-1 bottom-4 z-20 flex w-[calc(100vw-28px)] max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:right-3 sm:bottom-6 sm:w-[min(620px,calc(100vw-90px))]">
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
          <div className="max-h-[45vh] overflow-auto">
            <table className="min-w-full border-collapse text-left text-[11px]">
              <thead className="sticky top-0 z-10 bg-slate-100 text-slate-600">
                <tr>
                  {[
                    "Khasra No",
                    "Mauza",
                    "Tehsil",
                    "District",
                    "Area",
                    "Verified",
                    "Ownership",
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

function SummaryMetric({ label, value }) {
  return (
    <div className="min-w-0 px-2 text-center sm:px-3">
      <p className="truncate text-[10px] font-medium text-slate-500 sm:text-[11px]">
        {label}
      </p>
      <p
        className="truncate text-[12px] font-bold text-slate-900 sm:text-sm"
        title={String(value ?? "N/A")}
      >
        {value ?? "N/A"}
      </p>
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

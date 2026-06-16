import { useState } from "react";
import {
  MapPin,
  User,
  Grid2X2,
  FileText,
  HelpCircle,
  ChevronDown,
  Landmark,
  Ruler,
  CheckCircle,
  Download,
  X,
} from "lucide-react";

export default function ParcelPanel({
  parcel = null,
  isOpen = false,
  onClose = () => { },
}) {
  const [activeTab, setActiveTab] = useState("parcelInfo");

  const areaAcres =
    typeof parcel?.properties?._area_acres === "number"
      ? parcel.properties._area_acres
      : null;

  const areaSqFt =
    areaAcres !== null ? (areaAcres * 43560).toFixed(2) : null;

  const rawLandType = parcel?.properties?.type ?? "N/A";

  const formatLandType = (type) => {
    if (type === "MU") return "Murabba Bandi";
    if (type === "QB") return "Qilla Bandi";
    return type || "N/A";
  };

  const parcelData = {
    khasraNo:
      parcel?.properties?.kh ??
      parcel?.properties?.KH ??
      parcel?.properties?.k ??
      parcel?.properties?.K ??
      parcel?.properties?.khasra ??
      parcel?.properties?.khasra_no ??
      parcel?.properties?.khasra_id ??
      "N/A",

    murabbaNo:
      parcel?.properties?.m ??
      parcel?.properties?.M ??
      parcel?.properties?.murabba_no ??
      parcel?.properties?.murabba ??
      parcel?.id ??
      "N/A",

    mauza: parcel?.properties?.mauza ?? parcel?.properties?.mauza_name ?? "N/A",

    area:
      areaSqFt !== null
        ? `${Number(areaSqFt).toLocaleString()} sq ft`
        : parcel?.properties?.area ?? parcel?.properties?.mn ?? "N/A",

    agricultureArea:
      areaSqFt !== null ? `${Number(areaSqFt).toLocaleString()} sq ft` : "N/A",

    landType: formatLandType(rawLandType),
    parcelId: parcel?.id ?? parcel?.properties?.gid ?? "N/A",
    rthIff: parcel?.properties?.rthIff ?? "N/A",
  };

  const isMurabbaType = rawLandType === "MU";
  const isViewByKhasra = parcel?.properties?._layerType !== "murabba";
  const showMurabbaWithKhasra = isMurabbaType && isViewByKhasra;

  const timelineData = [
    { year: "2018", label: "Personal Ownership" },
    { year: "2020", label: "Bequisition Notice" },
    { year: "2023", label: "Acquisition Notice" },
    { year: "2023", label: "RUDA Owned & Planning Zone" },
  ];

  if (!isOpen) return null;

  return (
    <div className="absolute right-3 top-24 z-20 w-96 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[calc(100vh-170px)]">
      <div className="border-b border-slate-200">
        <div className="flex items-center justify-between gap-2 bg-[#0f3d2e] px-3 py-2.5">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white min-w-0">
            <MapPin className="text-white shrink-0" size={18} />
            <span className="truncate">Parcel Information</span>
          </div>

          <div className="flex items-center gap-2 shrink-0 text-white">
            <User size={17} className="cursor-default" />
            <Grid2X2 size={17} className="cursor-default" />
            <FileText size={17} className="cursor-default" />
            <HelpCircle size={17} className="cursor-default" />
            <button
              type="button"
              onClick={() => onClose()}
              className="ml-1 rounded-lg p-1.5 text-white transition hover:bg-white/10"
              aria-label="Close parcel panel"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        <div className="flex gap-2 px-4 pt-3 pb-3">
          <TabButton
            label="Parcel Info"
            value="parcelInfo"
            active={activeTab}
            onChange={setActiveTab}
          />
          <TabButton
            label="Ownership"
            value="ownership"
            active={activeTab}
            onChange={setActiveTab}
          />
          <TabButton
            label="Land Use"
            value="landUse"
            active={activeTab}
            onChange={setActiveTab}
          />
          <TabButton
            label="Documents"
            value="documents"
            active={activeTab}
            onChange={setActiveTab}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === "parcelInfo" && (
          <>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex justify-between items-center gap-4">
                {parcel?.properties?._layerType === "murabba" ? (
                  <>
                    <span className="text-slate-700 text-[12px] font-medium leading-tight">
                      Murabba No:{" "}
                      <strong className="text-slate-900">
                        {parcelData.murabbaNo}
                      </strong>
                    </span>
                    <ChevronDown size={16} className="text-slate-400 shrink-0" />
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-6 flex-wrap min-w-0">
                      <span className="text-slate-700 text-[12px] font-medium leading-tight whitespace-nowrap">
                        Khasra No:{" "}
                        <strong className="text-slate-900">
                          {parcelData.khasraNo}
                        </strong>
                      </span>

                      {showMurabbaWithKhasra && (
                        <span className="ml-14 text-slate-700 text-[12px] font-medium leading-tight whitespace-nowrap">
                          Murabba No:{" "}
                          <strong className="text-slate-900">
                            {parcelData.murabbaNo}
                          </strong>
                        </span>
                      )}
                    </div>

                    <ChevronDown size={16} className="text-slate-400 shrink-0" />
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <InfoBlock label="Mauza" value={parcelData.mauza} />

                <div>
                  <p className="text-[12px] font-medium leading-tight text-slate-500 flex items-center gap-1">
                    <Ruler size={12} /> Area
                  </p>
                  <p className="text-[13px] font-semibold leading-tight text-slate-900">
                    {parcelData.area}
                  </p>
                </div>

                <div>
                  <p className="text-[12px] font-medium leading-tight text-slate-500">
                    Land Type
                  </p>
                  <span className="bg-green-700 text-white text-[12px] px-3 py-1 rounded-md inline-flex items-center">
                    {parcelData.landType}
                  </span>
                </div>

                <div>
                  <p className="text-[12px] font-medium leading-tight text-slate-500 flex items-center gap-1">
                    <Landmark size={12} /> Agriculture
                  </p>
                  <p className="flex items-center gap-1 text-[13px] text-green-700 font-semibold leading-tight">
                    <CheckCircle size={14} /> {parcelData.agricultureArea}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-200">
                <InfoBlock
                  label={
                    parcel?.properties?._layerType === "murabba"
                      ? "Sheet"
                      : "Parcel ID"
                  }
                  value={
                    parcel?.properties?._layerType === "murabba"
                      ? parcel?.properties?.sheets ?? parcelData.parcelId
                      : parcelData.parcelId
                  }
                />
                <InfoBlock label="Assessment Circle" value={parcelData.rthIff} />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h3 className="text-[12px] font-semibold leading-tight text-slate-700 mb-3">
                Past Status Timeline
              </h3>

              <div className="flex items-center justify-between text-[11px] text-slate-600">
                {timelineData.map((item, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <span className="font-semibold text-slate-700">
                      {item.year}
                    </span>
                    <div className="w-3 h-3 bg-green-600 rounded-full mt-2 mb-2" />
                    <span className="text-center text-[11px] text-slate-600">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "documents" && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl divide-y">
            <DocumentLink name="Fard Document" />
            <DocumentLink name="Mutation Record" />
            <DocumentLink name="Survey Sheet" />
            <DocumentLink name="Acquisition Notice" />
          </div>
        )}
      </div>
    </div>
  );
}

function InfoBlock({ label, value }) {
  return (
    <div>
      <p className="text-[12px] font-medium leading-tight text-slate-500">
        {label}
      </p>
      <p className="text-[13px] font-semibold leading-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

function TabButton({ label, value, active, onChange }) {
  const isActive = active === value;

  return (
    <button
      onClick={() => onChange(value)}
      className={`text-[12px] px-3 py-1.5 rounded-md font-semibold leading-tight transition ${isActive
          ? "bg-green-700 text-white"
          : "bg-slate-200 text-slate-700 hover:bg-slate-300"
        }`}
    >
      {label}
    </button>
  );
}

function DocumentLink({ name }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-100 text-[12px]">
      <div className="flex items-center gap-3">
        <FileText size={16} className="text-slate-500" />
        <span className="text-slate-700">{name}</span>
      </div>

      <Download size={16} className="text-slate-400" />
    </div>
  );
}
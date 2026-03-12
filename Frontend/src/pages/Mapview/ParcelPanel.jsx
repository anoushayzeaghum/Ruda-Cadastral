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
  MessageSquare,
  List,
} from "lucide-react";

export default function ParcelPanel() {
  const [activeTab, setActiveTab] = useState("parcelInfo");

  const parcelData = {
    khasraNo: 245,
    mouza: "Bhaini Par",
    area: "3 Kanal 5 Marla",
    landType: "Agriculture",
    parcelId: "3544A245",
    rthIff: "3544A245",
  };

  const timelineData = [
    { year: "2018", label: "Personal Ownership" },
    { year: "2020", label: "Bequisition Notice" },
    { year: "2023", label: "Acquisition Notice" },
    { year: "2023", label: "RUDA Owned & Planning Zone" },
  ];

  return (
    <div className="absolute right-3 top-3 w-96 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[calc(100vh-200px)]">

      {/* Header */}
      <div className="px-4 pt-4 border-b border-slate-200">

        <div className="flex items-center gap-2 text-slate-800 font-semibold text-lg">
          <MapPin className="text-green-700" size={20} />
          Parcel Information
          <div className="flex gap-5 py-2 px-3 text-slate-400">
          <User size={18}/>
          <Grid2X2 size={18}/>
          <FileText size={18}/>
          <HelpCircle size={18}/>
        </div>
        </div>

        {/* Icon Toolbar */}
        

        {/* Tabs */}
        <div className="flex gap-2 mt-3 pb-3">
          <TabButton label="Parcel Info" value="parcelInfo" active={activeTab} onChange={setActiveTab}/>
          <TabButton label="Ownership" value="ownership" active={activeTab} onChange={setActiveTab}/>
          <TabButton label="Land Use" value="landUse" active={activeTab} onChange={setActiveTab}/>
          <TabButton label="Documents" value="documents" active={activeTab} onChange={setActiveTab}/>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {activeTab === "parcelInfo" && (
          <>
            {/* Parcel Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">

              <div className="flex justify-between items-center">
                <span className="text-slate-700 text-sm">
                  Khasra No: <strong className="text-slate-900">{parcelData.khasraNo}</strong>
                </span>

                <ChevronDown size={16} className="text-slate-400"/>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">

                <div>
                  <p className="text-xs text-slate-500">Mouza</p>
                  <p className="font-semibold text-slate-900">{parcelData.mouza}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Ruler size={12}/> Area
                  </p>
                  <p className="font-semibold text-slate-900">{parcelData.area}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Land Type</p>
                  <span className="bg-green-700 text-white text-xs px-3 py-1 rounded-md inline-flex items-center gap-1">
                    <ChevronDown size={12}/>
                    {parcelData.landType}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Landmark size={12}/> Agriculture
                  </p>
                  <p className="flex items-center gap-1 text-green-700 font-semibold">
                    <CheckCircle size={14}/> 25,800 Acres
                  </p>
                </div>

              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-200">
                <div>
                  <p className="text-xs text-slate-500">Parcel ID</p>
                  <p className="font-semibold text-slate-900">{parcelData.parcelId}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Rth: Iff</p>
                  <p className="font-semibold text-slate-900">{parcelData.rthIff}</p>
                </div>
              </div>

            </div>

            {/* Timeline */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">

              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                Past Status Timeline
              </h3>

              <div className="flex items-center justify-between text-xs text-slate-600">

                {timelineData.map((item, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">

                    <span className="font-semibold text-slate-700">
                      {item.year}
                    </span>

                    <div className="w-3 h-3 bg-green-600 rounded-full mt-2 mb-2"/>

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

            <DocumentLink name="Fard Document"/>
            <DocumentLink name="Mutation Record"/>
            <DocumentLink name="Survey Sheet"/>
            <DocumentLink name="Acquisition Notice"/>

          </div>
        )}

      </div>
    </div>
  );
}

function TabButton({ label, value, active, onChange }) {
  const isActive = active === value;

  return (
    <button
      onClick={() => onChange(value)}
      className={`text-xs px-3 py-1.5 rounded-md font-medium transition ${
        isActive
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
    <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-100 text-sm">

      <div className="flex items-center gap-3">
        <FileText size={16} className="text-slate-500"/>
        <span className="text-slate-700">{name}</span>
      </div>

      <Download size={16} className="text-slate-400"/>

    </div>
  );
}
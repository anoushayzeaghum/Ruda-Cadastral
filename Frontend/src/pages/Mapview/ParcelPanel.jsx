import { useState } from "react";

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
    { year: "2020", label: "Beaurocqtion Notice" },
    { year: "2023", label: "Acquisition Notice" },
    { year: "2023", label: "RUDA Planning Zone" },
  ];

  return (
    <div className="absolute right-5 top-32 w-96 z-20 bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[calc(100vh-200px)]">
      {/* Header */}
      <div className="flex items-center justify-between bg-green-700 text-white px-4 py-3 font-semibold">
        <h2 className="flex items-center gap-2">
          <span className="text-lg">📍</span>
          Parcel Info
        </h2>
        <button className="text-white text-xl font-bold hover:bg-green-600 rounded-full w-6 h-6 flex items-center justify-center transition-colors">
          ×
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50">
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "parcelInfo" && (
          <div className="space-y-4">
            <DetailRow
              label="Khasra No"
              value={parcelData.khasraNo}
              highlight
            />
            <DetailRow label="Mouza" value={parcelData.mouza} />
            <DetailRow label="Area" value={parcelData.area} />
            <DetailRow
              label="Land Type"
              value={parcelData.landType}
              withBadge
            />
            <DetailRow label="Parcel ID" value={parcelData.parcelId} />
            <DetailRow label="Rth Iff" value={parcelData.rthIff} />

            {/* Timeline */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">
                Past Status Timeline
              </h3>
              <div className="space-y-2">
                {timelineData.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="text-xs font-semibold text-slate-600 min-w-10">
                      {item.year}
                    </div>
                    <div className="flex-1">
                      <div className="w-2 h-2 bg-green-600 rounded-full" />
                    </div>
                    <div className="text-xs text-slate-700 font-medium flex-1">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "ownership" && (
          <div className="space-y-4">
            <DetailRow label="Owner Name" value="Owner Name" />
            <DetailRow label="Owner Type" value="Individual" />
            <DetailRow label="Contact" value="+92 300 1234567" />
            <DetailRow label="Email" value="owner@example.com" />
            <DetailRow label="CNIC" value="12345-1234567-1" />
          </div>
        )}

        {activeTab === "landUse" && (
          <div className="space-y-4">
            <DetailRow label="Land Type" value="Agricultural" withBadge />
            <DetailRow label="Usage" value="Cultivated" />
            <DetailRow label="Classification" value="Class A" />
            <DetailRow label="Zone" value="RUDA Planning Zone" />
            <DetailRow label="Sub Zone" value="Development" />
          </div>
        )}

        {activeTab === "documents" && (
          <div className="space-y-3">
            <DocumentLink icon="📄" name="Fard Document" />
            <DocumentLink icon="📋" name="Mutation Record" />
            <DocumentLink icon="📊" name="Survey Sheet" />
            <DocumentLink icon="📃" name="Acquisition Notice" />
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
      className={`flex-1 px-3 py-2 text-xs font-medium border-b-2 transition-all text-center ${
        isActive
          ? "border-green-700 text-green-700 bg-white"
          : "border-transparent text-slate-600 hover:text-slate-900"
      }`}
    >
      {label}
    </button>
  );
}

function DetailRow({ label, value, highlight = false, withBadge = false }) {
  return (
    <div
      className={`pb-3 border-b border-slate-200 ${highlight ? "bg-yellow-50 -mx-4 px-4 py-2" : ""}`}
    >
      <p className="text-xs font-semibold text-slate-600 uppercase mb-1">
        {label}
      </p>
      {withBadge ? (
        <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
          {value}
        </span>
      ) : (
        <p className="text-sm font-semibold text-slate-900">{value}</p>
      )}
    </div>
  );
}

function DocumentLink({ icon, name }) {
  return (
    <button className="w-full flex items-center justify-between p-3 rounded border border-slate-200 hover:bg-slate-50 group transition-colors">
      <div className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <span className="text-sm text-slate-700 font-medium">{name}</span>
      </div>
      <span className="text-slate-400 group-hover:text-slate-600 text-lg">
        ↓
      </span>
    </button>
  );
}

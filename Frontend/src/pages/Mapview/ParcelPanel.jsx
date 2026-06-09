import { useState, useEffect } from "react";
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

const CATEGORY_COLORS = {
  hospitals: { bg: "bg-red-500",    dot: "#ef4444" },
  schools:   { bg: "bg-blue-500",   dot: "#3b82f6" },
  parks:     { bg: "bg-green-500",  dot: "#22c55e" },
  mosques:   { bg: "bg-yellow-500", dot: "#eab308" },
  transport: { bg: "bg-purple-500", dot: "#a855f7" },
};

export default function ParcelPanel({
  parcel = null,
  isOpen = false,
  onClose = () => {},
  activeParcel = null,
  analysisMode = "idle",
  selectedBufferRadius = 1,
  onBufferRadiusChange = () => {},
  proximityResults = [],
  nearestResults = {},
  suitabilityScore = null,
  suitabilityWeights = { hospitals: 0.25, schools: 0.25, parks: 0.25, transport: 0.25 },
  onSuitabilityWeightChange = () => {},
  onComputeSuitability = () => {},
  routeData = null,
  onRouteRequest = () => {},
  onAnalysisModeChange = () => {},
  bufferResults = null,
  amenitiesGeojson = null,
  gisError = null,
}) {
  const [activeTab, setActiveTab] = useState("parcelInfo");
  const [selectedDestination, setSelectedDestination] = useState(null);

  useEffect(() => {
    if (analysisMode === "idle") {
      setActiveTab("parcelInfo");
    } else {
      setActiveTab(analysisMode);
    }
  }, [analysisMode]);

  useEffect(() => {
    setActiveTab("parcelInfo");
  }, [activeParcel]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    onAnalysisModeChange(tab === "parcelInfo" ? "idle" : tab);
  };

  const areaAcres =
    typeof parcel?.properties?._area_acres === "number"
      ? parcel.properties._area_acres
      : null;

  const areaKanal = areaAcres !== null ? (areaAcres * 8).toFixed(2) : null;

  const areaMarla = areaAcres !== null ? (areaAcres * 160).toFixed(2) : null;

  const rawLandType = parcel?.properties?.type ?? "N/A";

  const formatLandType = (type) => {
    if (type === "MU") return "Murabba Bandi";
    if (type === "QB") return "Qilla Bandi";
    return type || "N/A";
  };

  const parcelData = {
    khasraNo:
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

    mouza: parcel?.properties?.mouza ?? parcel?.properties?.mouza_name ?? "N/A",

    area:
      areaKanal !== null
        ? `${areaKanal} Kanal`
        : (parcel?.properties?.area ?? parcel?.properties?.mn ?? "N/A"),

    agricultureArea: areaMarla !== null ? `${areaMarla} Marla` : "N/A",

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
    <div className="absolute right-3 top-3 z-20 w-96 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[calc(100vh-200px)]">
      {/* Header */}
      <div className="px-4 pt-4 border-b border-slate-200">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-lg min-w-0">
            <MapPin className="text-green-700 shrink-0" size={20} />
            <span className="truncate">Parcel Information</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 text-slate-400">
            <User size={18} className="cursor-default" />
            <Grid2X2 size={18} className="cursor-default" />
            <FileText size={18} className="cursor-default" />
            <HelpCircle size={18} className="cursor-default" />
            <button
              type="button"
              onClick={() => onClose()}
              className="ml-1 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              aria-label="Close parcel panel"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mt-3 pb-3 flex-wrap">
          {activeParcel ? (
            <>
              <TabButton label="📍 Info"        value="parcelInfo"   active={activeTab} onChange={handleTabChange} />
              <TabButton label="🧭 Proximity"   value="proximity"    active={activeTab} onChange={handleTabChange} />
              <TabButton label="📦 Buffer"      value="buffer"       active={activeTab} onChange={handleTabChange} />
              <TabButton label="🚗 Routing"     value="routing"      active={activeTab} onChange={handleTabChange} />
              <TabButton label="🧠 Nearest"     value="nearest"      active={activeTab} onChange={handleTabChange} />
              <TabButton label="📊 Suitability" value="suitability"  active={activeTab} onChange={handleTabChange} />
            </>
          ) : (
            <>
              <TabButton label="Parcel Info" value="parcelInfo" active={activeTab} onChange={handleTabChange} />
              <TabButton label="Ownership"   value="ownership"  active={activeTab} onChange={handleTabChange} />
              <TabButton label="Land Use"    value="landUse"    active={activeTab} onChange={handleTabChange} />
              <TabButton label="Documents"   value="documents"  active={activeTab} onChange={handleTabChange} />
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === "parcelInfo" && (
          <>
            {/* Parcel Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex justify-between items-center gap-4">
                {parcel?.properties?._layerType === "murabba" ? (
                  <>
                    <span className="text-slate-700 text-sm">
                      Murabba No:{" "}
                      <strong className="text-slate-900">
                        {parcelData.murabbaNo}
                      </strong>
                    </span>
                    <ChevronDown
                      size={16}
                      className="text-slate-400 shrink-0"
                    />
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-6 flex-wrap min-w-0">
                      <span className="text-slate-700 text-sm whitespace-nowrap">
                        Khasra No:{" "}
                        <strong className="text-slate-900">
                          {parcelData.khasraNo}
                        </strong>
                      </span>

                      {showMurabbaWithKhasra && (
                        <span className="ml-14 text-slate-700 text-sm whitespace-nowrap">
                          Murabba No:{" "}
                          <strong className="text-slate-900">
                            {parcelData.murabbaNo}
                          </strong>
                        </span>
                      )}
                    </div>

                    <ChevronDown
                      size={16}
                      className="text-slate-400 shrink-0"
                    />
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-xs text-slate-500">Mouza</p>
                  <p className="font-semibold text-slate-900">
                    {parcelData.mouza}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Ruler size={12} /> Area
                  </p>
                  <p className="font-semibold text-slate-900">
                    {parcelData.area}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Land Type</p>
                  <span className="bg-green-700 text-white text-xs px-3 py-1 rounded-md inline-flex items-center">
                    {parcelData.landType}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Landmark size={12} /> Agriculture
                  </p>
                  <p className="flex items-center gap-1 text-green-700 font-semibold">
                    <CheckCircle size={14} /> {parcelData.agricultureArea}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-200">
                <div>
                  <p className="text-xs text-slate-500">
                    {parcel?.properties?._layerType === "murabba"
                      ? "Sheet"
                      : "Parcel ID"}
                  </p>
                  <p className="font-semibold text-slate-900">
                    {parcel?.properties?._layerType === "murabba"
                      ? (parcel?.properties?.sheets ?? parcelData.parcelId)
                      : parcelData.parcelId}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Assessment Circle</p>
                  <p className="font-semibold text-slate-900">
                    {parcelData.rthIff}
                  </p>
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
                  <div
                    key={index}
                    className="flex flex-col items-center flex-1"
                  >
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

        {activeTab === "proximity" && (
          <div>
            {proximityResults.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <p className="text-slate-500 text-sm text-center">
                  No proximity results yet.
                </p>
                <button
                  onClick={() => onAnalysisModeChange("proximity")}
                  className="px-4 py-2 bg-green-700 text-white text-sm rounded-lg hover:bg-green-800 transition"
                >
                  Run Proximity Analysis
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-2 text-slate-500 font-semibold">Category</th>
                      <th className="text-left py-2 px-2 text-slate-500 font-semibold">Facility</th>
                      <th className="text-right py-2 px-2 text-slate-500 font-semibold">Dist (km)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proximityResults.map((r, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-2 px-2">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-white text-[10px] font-medium ${CATEGORY_COLORS[r.category]?.bg ?? "bg-slate-400"}`}>
                            {r.category}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-slate-700">{r.name}</td>
                        <td className="py-2 px-2 text-right text-slate-700 font-mono">{r.distance.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {activeTab === "buffer" && (
          <div className="space-y-4">
            {/* Radius selector */}
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-2">Select Buffer Radius</p>
              <div className="flex gap-2">
                {[1, 2, 5].map((r) => (
                  <button
                    key={r}
                    onClick={() => onBufferRadiusChange(r)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                      selectedBufferRadius === r
                        ? "bg-green-700 text-white border-green-700"
                        : "bg-white text-slate-700 border-slate-300 hover:border-green-500"
                    }`}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            </div>

            {/* Count cards */}
            {bufferResults ? (
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-2">
                  Amenities within {selectedBufferRadius} km
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(bufferResults.counts || {}).map(([cat, count]) => (
                    <div
                      key={cat}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center gap-2"
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[cat]?.dot ?? "#94a3b8" }}
                      />
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500 capitalize truncate">{cat}</p>
                        <p className="font-bold text-slate-800 text-sm">{count}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-sm text-center py-4">
                Select a radius above to run buffer analysis.
              </p>
            )}
          </div>
        )}
        {activeTab === "routing" && (
          <div className="space-y-4">
            {/* Destination selector */}
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-2">Select Destination</p>
              <select
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={selectedDestination ? JSON.stringify(selectedDestination) : ""}
                onChange={(e) => {
                  if (e.target.value) setSelectedDestination(JSON.parse(e.target.value));
                  else setSelectedDestination(null);
                }}
              >
                <option value="">— Choose a destination —</option>
                {amenitiesGeojson && Object.entries(amenitiesGeojson).map(([cat, fc]) =>
                  (fc?.features || []).map((f, i) => (
                    <option key={`${cat}-${i}`} value={JSON.stringify(f)}>
                      [{cat}] {f.properties?.name ?? "Unnamed"}
                    </option>
                  ))
                )}
              </select>
              <button
                disabled={!selectedDestination}
                onClick={() => selectedDestination && onRouteRequest(selectedDestination)}
                className="mt-2 w-full py-2 bg-green-700 text-white text-sm rounded-lg hover:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Get Route
              </button>
            </div>

            {/* Error banner */}
            {gisError && !routeData && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">
                {gisError}
              </div>
            )}

            {/* Route results */}
            {routeData && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100">
                      <th className="text-left py-2 px-3 text-slate-600 font-semibold">Destination</th>
                      <th className="text-right py-2 px-3 text-slate-600 font-semibold">Time (min)</th>
                      <th className="text-right py-2 px-3 text-slate-600 font-semibold">Dist (km)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2 px-3 text-slate-700">{routeData.destinationName}</td>
                      <td className="py-2 px-3 text-right text-slate-700 font-mono">{routeData.durationMinutes}</td>
                      <td className="py-2 px-3 text-right text-slate-700 font-mono">{routeData.distanceKm}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {activeTab === "nearest" && (
          <div className="space-y-3">
            <button
              onClick={() => onAnalysisModeChange("nearest")}
              className="w-full py-2 bg-green-700 text-white text-sm rounded-lg hover:bg-green-800 transition"
            >
              Find Nearest Facilities
            </button>

            {Object.keys(nearestResults).length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">
                Click above to find the nearest facility in each category.
              </p>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100">
                      <th className="text-left py-2 px-3 text-slate-600 font-semibold">Category</th>
                      <th className="text-left py-2 px-3 text-slate-600 font-semibold">Name</th>
                      <th className="text-right py-2 px-3 text-slate-600 font-semibold">Dist (km)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(nearestResults).map(([cat, info]) => (
                      <tr key={cat} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-2 px-3">
                          <span className="flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: CATEGORY_COLORS[cat]?.dot ?? "#94a3b8" }}
                            />
                            <span className="capitalize text-slate-700">{cat}</span>
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-700">{info.name}</td>
                        <td className="py-2 px-3 text-right text-slate-700 font-mono">{info.distance.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {activeTab === "suitability" && (
          <div className="space-y-4">
            {/* Weight sliders */}
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-2">Adjust Category Weights</p>
              <div className="space-y-3">
                {Object.entries(suitabilityWeights).map(([cat, val]) => (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize text-slate-700">{cat}</span>
                      <span className="text-slate-500 font-mono">{val.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={val}
                      onChange={(e) => onSuitabilityWeightChange(cat, parseFloat(e.target.value))}
                      className="w-full accent-green-600"
                    />
                  </div>
                ))}
              </div>

              {/* Weight sum indicator */}
              {(() => {
                const sum = Object.values(suitabilityWeights).reduce((a, b) => a + b, 0);
                const isValid = Math.abs(sum - 1.0) <= 0.001;
                return (
                  <p className={`text-xs mt-2 font-mono ${isValid ? "text-green-600" : "text-red-500"}`}>
                    Weights sum: {sum.toFixed(3)} {isValid ? "✓" : "— must equal 1.0"}
                  </p>
                );
              })()}
            </div>

            <button
              onClick={onComputeSuitability}
              className="w-full py-2 bg-green-700 text-white text-sm rounded-lg hover:bg-green-800 transition"
            >
              Compute Suitability Score
            </button>

            {/* Score display */}
            {suitabilityScore !== null && typeof suitabilityScore === "object" && suitabilityScore.error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">
                {suitabilityScore.error}
              </div>
            ) : suitabilityScore !== null ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                <p className="text-4xl font-bold text-slate-800">
                  {typeof suitabilityScore === "object" ? suitabilityScore.score : suitabilityScore}
                </p>
                <p className="text-xs text-slate-500 mt-1">out of 100</p>
                {(() => {
                  const score = typeof suitabilityScore === "object" ? suitabilityScore.score : suitabilityScore;
                  const label = typeof suitabilityScore === "object" ? suitabilityScore.label : (score >= 75 ? "Excellent" : score >= 50 ? "Good" : "Poor");
                  const color = label === "Excellent" ? "bg-green-100 text-green-700" : label === "Good" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
                  return (
                    <span className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-semibold ${color}`}>
                      {label}
                    </span>
                  );
                })()}
              </div>
            ) : null}
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
        <FileText size={16} className="text-slate-500" />
        <span className="text-slate-700">{name}</span>
      </div>

      <Download size={16} className="text-slate-400" />
    </div>
  );
}

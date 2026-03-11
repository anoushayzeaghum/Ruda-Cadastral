export default function FilterPanel({ filters, isCollapsed, onToggle }) {
  if (!filters) return null;

  const {
    divisions,
    districts,
    tehsils,
    mouzas,
    errorMessage,
    hasSelection,
    resetFilters,
    selectedDivisionOption,
    selectedDistrictOption,
    selectedTehsilOption,
    selectedMouzaOption,
  } = filters;

  return (
    <div
      className={`absolute top-5 left-5 z-30 transition-all ${isCollapsed ? "w-14" : "w-[340px]"}`}
    >
      {!isCollapsed && (
        <aside className="bg-white/95 backdrop-blur-md border rounded-2xl shadow-xl p-6 max-h-[540px] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <p className="text-lg font-semibold text-green-700 uppercase">
              Filter Panel
            </p>
            <button
              onClick={onToggle}
              className="w-8 h-8 rounded-full bg-white border flex items-center justify-center text-lg hover:bg-gray-100"
            >
              ›
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <Stat label="Divisions" value={divisions.length} />
            <Stat label="Districts" value={districts.length} />
            <Stat label="Tehsils" value={tehsils.length} />
            <Stat label="Mouzas" value={mouzas.length} />
          </div>

          {errorMessage && (
            <p className="bg-red-100 text-red-700 p-2 rounded mb-3">
              {errorMessage}
            </p>
          )}

          <button
            onClick={resetFilters}
            disabled={!hasSelection}
            className="w-full bg-[#1e3a5f] text-white py-2 rounded-lg mb-5 disabled:opacity-50"
          >
            Reset Filters
          </button>

          <div className="bg-[#1e3a5f] text-white rounded-xl p-4">
            <h3 className="font-bold mb-3">Current Selection</h3>

            <ul className="space-y-2 text-sm">
              <Row label="Division" value={selectedDivisionOption?.division} />
              <Row label="District" value={selectedDistrictOption?.name} />
              <Row label="Tehsil" value={selectedTehsilOption?.name} />
              <Row label="Mouza" value={selectedMouzaOption?.mouza} />
              <Row label="Mouza ID" value={selectedMouzaOption?.mouza_id} />
            </ul>
          </div>
        </aside>
      )}

      {isCollapsed && (
        <button
          onClick={onToggle}
          className="w-12 h-12 rounded-full bg-white border border-gray-300 flex items-center justify-center text-2xl hover:bg-gray-100 shadow-lg"
        >
          ‹
        </button>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-white rounded-lg border p-3 text-center shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-bold text-[#1e3a5f]">{value}</p>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <li className="flex justify-between">
      <span className="opacity-70">{label}</span>
      <strong>{value ?? "Not selected"}</strong>
    </li>
  );
}

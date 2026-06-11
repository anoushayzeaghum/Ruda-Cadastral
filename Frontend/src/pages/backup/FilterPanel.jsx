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
      className={`absolute top-5 right-5 z-30 transition-all ${
        isCollapsed ? "w-auto" : "w-[340px]"
      }`}
    >
      {!isCollapsed && (
        <aside className="bg-white/95 backdrop-blur-md border rounded-2xl shadow-xl p-6 max-h-[650px] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-lg font-semibold text-green-700 uppercase">
              Filter Panel
            </p>

            <button
              onClick={onToggle}
              className="w-8 h-8 rounded-full border bg-green-600 text-white-600 flex items-center justify-center text-lg hover:bg-green-700"
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

          {/* Reset Button */}
          <button
            onClick={resetFilters}
            disabled={!hasSelection}
            className="w-full bg-red-600 text-white py-2 rounded-lg mb-5 disabled:opacity-50"
          >
            Reset Filters
          </button>

          {/* Current Selection */}
          {hasSelection && (
            <div className="bg-green-700 text-white rounded-xl p-4">
              <h3 className="font-bold mb-3">Current Selection</h3>

              <ul className="space-y-2 text-sm">
                <Row
                  label="Division"
                  value={selectedDivisionOption?.division}
                />
                <Row label="District" value={selectedDistrictOption?.name} />
                <Row label="Tehsil" value={selectedTehsilOption?.name} />
                <Row label="Mouza" value={selectedMouzaOption?.mouza} />
                <Row label="Mouza ID" value={selectedMouzaOption?.mouza_id} />
              </ul>
            </div>
          )}
        </aside>
      )}

      {/* Collapsed Panel */}
      {isCollapsed && (
        <button
          onClick={onToggle}
          className="flex items-center gap-2 bg-white border border-green-600 rounded-full px-3 py-2 shadow-lg hover:bg-green-50"
        >
          <span className="w-9 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-lg hover:bg-green-700">
            ‹
          </span>{" "}
          <span className="text-sm font-semibold text-green-700">
            Filter Panel
          </span>
        </button>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-white rounded-lg border p-3 text-center shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-bold text-green-700">{value}</p>
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

export default function SubHeader({ filters }) {
  if (!filters) return null;

  const mouzaCount = Array.isArray(filters.mouzas)
    ? filters.mouzas.length
    : 128;

  return (
    <div className="w-full bg-white border-b border-slate-200 shadow-sm">
      <div className="flex items-center gap-4 px-6 py-4">
        {/* Search Data Button */}
        <button className="flex items-center gap-2 px-3 py-2 bg-green-700 text-white rounded text-sm font-semibold hover:bg-green-800 whitespace-nowrap">
          <span>🔍</span>
          <span>Search Data</span>
        </button>

        {/* Filters */}
        <div className="flex items-end gap-3 flex-1">
          {/* Division */}
          <div className="flex flex-col">
            <label className="text-[10px] font-semibold text-slate-600 mb-1">
              Division
            </label>
            <select
              value={filters.selectedDivision}
              onChange={filters.handleDivisionChange}
              disabled={filters.loading?.divisions}
              className="border border-slate-300 rounded px-3 py-2 text-sm bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:bg-slate-100"
            >
              <option value="">-- Division --</option>
              {filters.divisions.map((d) => (
                <option key={d.division_i} value={d.division_i}>
                  {d.division}
                </option>
              ))}
            </select>
          </div>

          {/* District */}
          <div className="flex flex-col">
            <label className="text-[10px] font-semibold text-slate-600 mb-1">
              District
            </label>
            <select
              value={filters.selectedDistrict}
              onChange={filters.handleDistrictChange}
              disabled={!filters.selectedDivision || filters.loading?.districts}
              className="border border-slate-300 rounded px-3 py-2 text-sm bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:bg-slate-100"
            >
              <option value="">-- District --</option>
              {filters.districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tehsil */}
          <div className="flex flex-col">
            <label className="text-[10px] font-semibold text-slate-600 mb-1">
              Tehsil
            </label>
            <select
              value={filters.selectedTehsil}
              onChange={filters.handleTehsilChange}
              disabled={!filters.selectedDistrict || filters.loading?.tehsils}
              className="border border-slate-300 rounded px-3 py-2 text-sm bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:bg-slate-100"
            >
              <option value="">-- Tehsil --</option>
              {filters.tehsils.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mouza */}
          <div className="flex flex-col">
            <label className="text-[10px] font-semibold text-slate-600 mb-1">
              Mouza
            </label>
            <select
              value={filters.selectedMouza}
              onChange={filters.handleMouzaChange}
              disabled={!filters.selectedTehsil || filters.loading?.mouzas}
              className="border border-slate-300 rounded px-3 py-2 text-sm bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:bg-slate-100"
            >
              <option value="">-- Mouza --</option>
              {filters.mouzas.map((m) => (
                <option key={m.mouza_id} value={m.mouza_id}>
                  {m.mouza}
                </option>
              ))}
            </select>
          </div>

          {/* View By */}
          <div className="flex flex-col">
            <label className="text-[10px] font-semibold text-slate-600 mb-1">
              View By
            </label>
            <select
              value={filters.viewBy}
              onChange={filters.handleViewByChange}
              disabled={!filters.selectedMouza}
              className="border border-slate-300 rounded px-3 py-2 text-sm bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:bg-slate-100"
            >
              <option value="">-- Select View --</option>
              <option value="khasra">Khasra</option>
              <option value="murabba">Murabba</option>
            </select>
          </div>
        </div>

        {/* Parcel ID Display */}
        <div className="flex items-center gap-4 pl-4 border-l border-slate-200">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 font-semibold">
              Parcel ID / JID
            </p>
            <p className="text-sm font-bold text-slate-900">25,800 Acres</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 font-semibold">
              Remaining Land
            </p>
            <p className="text-sm font-bold text-slate-900">76,700 Acres</p>
          </div>
        </div>
      </div>

      {/* Statistics Bar */}
      <div className="flex items-center gap-8 px-6 py-3 bg-slate-50 border-t border-slate-200">
        <StatItem label="Total Mouzas:" value={mouzaCount} />
        <StatItem label="Total Parcels:" value="82,400" />
        <StatItem label="Total Area" value="102,500 Acres" />
        <StatItem label="Acquired Land:" value="25,800 Acres" />
      </div>
    </div>
  );
}

function StatItem({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-600 font-semibold">{label}</p>
      <p className="text-sm font-bold text-green-700">{value}</p>
    </div>
  );
}

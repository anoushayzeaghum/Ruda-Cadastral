import { ChevronDown, Database, BarChart3 } from "lucide-react";

export default function SubHeader({ filters }) {
  if (!filters) return null;

  const mouzaCount = Array.isArray(filters.mouzas)
    ? filters.mouzas.length
    : 128;

  return (
    <div className="w-full bg-gray-100 border-b border-gray-300 shadow-sm">
      {/* FILTER BAR */}
      <div className="flex items-center gap-3 px-4 py-2">
        {/* Search Button */}
        <button className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white text-sm rounded-md hover:bg-green-800 whitespace-nowrap">
          <Database size={16} />
          Search Data
          <ChevronDown size={14} />
        </button>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-1">
          <FilterCard
            label="Division"
            value={
              filters.divisions.find(
                (d) => d.division_i === filters.selectedDivision,
              )?.division || "Select"
            }
          >
            <select
              value={filters.selectedDivision}
              onChange={filters.handleDivisionChange}
              disabled={filters.loading?.divisions}
              className="absolute inset-0 opacity-0 cursor-pointer"
            >
              <option value="">-- Division --</option>
              {filters.divisions.map((d) => (
                <option key={d.division_i} value={d.division_i}>
                  {d.division}
                </option>
              ))}
            </select>
          </FilterCard>

          <FilterCard
            label="District"
            value={
              filters.districts.find((d) => d.id === filters.selectedDistrict)
                ?.name || "Select"
            }
          >
            <select
              value={filters.selectedDistrict}
              onChange={filters.handleDistrictChange}
              disabled={!filters.selectedDivision || filters.loading?.districts}
              className="absolute inset-0 opacity-0 cursor-pointer"
            >
              <option value="">-- District --</option>
              {filters.districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </FilterCard>

          <FilterCard
            label="Tehsil"
            value={
              filters.tehsils.find((t) => t.id === filters.selectedTehsil)
                ?.name || "Select"
            }          >
            <select
              value={filters.selectedTehsil}
              onChange={filters.handleTehsilChange}
              disabled={!filters.selectedDistrict || filters.loading?.tehsils}
              className="absolute inset-0 opacity-0 cursor-pointer"
            >
              <option value="">-- Tehsil --</option>
              {filters.tehsils.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </FilterCard>

          <FilterCard
            label="Mouza"
            value={
              filters.mouzas.find((m) => m.mouza_id === filters.selectedMouza)
                ?.mouza || "Select"
            }
          >
            <select
              value={filters.selectedMouza}
              onChange={filters.handleMouzaChange}
              disabled={!filters.selectedTehsil || filters.loading?.mouzas}
              className="absolute inset-0 opacity-0 cursor-pointer"
            >
              <option value="">-- Mouza --</option>
              {filters.mouzas.map((m) => (
                <option key={m.mouza_id} value={m.mouza_id}>
                  {m.mouza}
                </option>
              ))}
            </select>
          </FilterCard>

          {/* View By */}
          <FilterCard label="View By" value={filters.viewBy || "Select"}>
            <select
              value={filters.viewBy}
              onChange={filters.handleViewByChange}
              disabled={!filters.selectedMouza}
              className="absolute inset-0 opacity-0 cursor-pointer"
            >
              <option value="">-- Select View --</option>
              <option value="khasra">Khasra</option>
              <option value="murabba">Murabba</option>
            </select>
          </FilterCard>
        </div>

        {/* Right Stats */}
        <div className="flex items-center gap-6 text-sm border-l border-gray-300 pl-4">
          <div>
            <p className="text-xs text-gray-500">Parcel ID / JID</p>
            <p className="font-semibold text-green-700">25,800 Acres</p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Remaining Land</p>
            <p className="font-semibold text-green-700">76,700 Acres</p>
          </div>
        </div>
      </div>

      {/* STATISTICS BAR */}
      <div className="flex items-center gap-8 px-4 py-2 bg-gray-50 border-t border-gray-200 text-sm">
        <StatItem label="Total Mouzas" value={mouzaCount} />
        <StatItem label="Total Parcels" value="82,400" />
        <StatItem label="Total Area" value="102,500 Acres" />
        <StatItem label="Acquired Land" value="25,800 Acres" />
      </div>
    </div>
  );
}

/* Filter Card UI */
function FilterCard({ label, value, children }) {
  return (
    <div className="relative bg-white border border-gray-200 rounded-md px-3 py-2 min-w-[180px] hover:border-green-600 cursor-pointer">
      <p className="text-[10px] text-gray-500">{label}</p>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
        <ChevronDown size={14} className="text-gray-400 ml-2" />
      </div>
      {children}
    </div>
  );
}

/* Stats */
function StatItem({ label, value }) {
  return (
    <div className="flex items-center gap-2">
      <BarChart3 size={16} className="text-green-700" />
      <p className="text-gray-600">{label}:</p>
      <span className="font-semibold text-green-700">{value}</span>
    </div>
  );
}

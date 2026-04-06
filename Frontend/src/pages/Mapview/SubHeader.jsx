import { useEffect, useRef, useState } from "react";
import { ChevronDown, Database, BarChart3 } from "lucide-react";

export default function SubHeader({
  filters,
  parcelOptions = [],
  selectedParcelNumber = "",
  onParcelNumberChange = () => {},
}) {
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
            value={getMultiValueDisplay({
              options: filters.divisions,
              selected: filters.selectedDivision,
              idKey: "division_i",
              labelKey: "division",
            })}
          >
            <MultiSelectDropdown
              options={filters.divisions.map((d) => ({
                value: String(d.division_i),
                label: d.division,
              }))}
              selectedValues={filters.selectedDivision}
              onToggle={filters.handleDivisionChange}
              disabled={filters.loading?.divisions}
            />
          </FilterCard>

          <FilterCard
            label="District"
            value={getMultiValueDisplay({
              options: filters.districts,
              selected: filters.selectedDistrict,
              idKey: "id",
              labelKey: "name",
            })}
          >
            <MultiSelectDropdown
              options={filters.districts.map((d) => ({
                value: String(d.id),
                label: d.name,
              }))}
              selectedValues={filters.selectedDistrict}
              onToggle={filters.handleDistrictChange}
              disabled={
                !filters.selectedDivision.length || filters.loading?.districts
              }
            />
          </FilterCard>

          <FilterCard
            label="Tehsil"
            value={getMultiValueDisplay({
              options: filters.tehsils,
              selected: filters.selectedTehsil,
              idKey: "id",
              labelKey: "name",
            })}
          >
            <MultiSelectDropdown
              options={filters.tehsils.map((t) => ({
                value: String(t.id),
                label: t.name,
              }))}
              selectedValues={filters.selectedTehsil}
              onToggle={filters.handleTehsilChange}
              disabled={
                !filters.selectedDistrict.length || filters.loading?.tehsils
              }
            />
          </FilterCard>

          <FilterCard
            label="Mouza"
            value={
              filters.mouzas.find(
                (m) => String(m.mouza_id) === String(filters.selectedMouza),
              )?.mouza || "Select"
            }
          >
            <select
              value={filters.selectedMouza}
              onChange={filters.handleMouzaChange}
              disabled={
                !filters.selectedTehsil.length || filters.loading?.mouzas
              }
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
          <FilterCard
            label="View By"
            value={
              filters.viewBy
                ? filters.viewBy.charAt(0).toUpperCase() +
                  filters.viewBy.slice(1)
                : "Select"
            }
          >
            {" "}
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

          {/* Dependent parcel number dropdown: appears only when mouza + viewBy set */}
          {filters.selectedMouza && filters.viewBy && (
            <FilterCard
              label={filters.viewBy === "khasra" ? "Khasra No" : "Murabba No"}
              value={selectedParcelNumber || "Select"}
            >
              <SearchableSingleSelect
                options={parcelOptions}
                selectedValue={selectedParcelNumber}
                onChange={onParcelNumberChange}
                disabled={!parcelOptions || parcelOptions.length === 0}
                placeholder={
                  filters.viewBy === "khasra"
                    ? "Search Khasra No..."
                    : "Search Murabba No..."
                }
              />
            </FilterCard>
          )}
        </div>

        {/* Right Stats */}
        <div className="flex items-center gap-6 text-sm border-l border-gray-300 pl-4">
          {/* <div>
            <p className="text-xs text-gray-500">Parcel ID / JID</p>
            <p className="font-semibold text-green-700">25,800 Acres</p>
          </div> */}

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

function getMultiValueDisplay({ options, selected, idKey, labelKey }) {
  if (!selected?.length) return "Select";
  const labels = options
    .filter((item) => selected.includes(String(item[idKey])))
    .map((item) => item[labelKey])
    .filter(Boolean);
  return labels.join(", ") || "Select";
}

function MultiSelectDropdown({ options, selectedValues, onToggle, disabled }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const safeSelectedValues = Array.isArray(selectedValues)
    ? selectedValues
    : [];

  return (
    <div ref={containerRef} className="absolute inset-0">
      <button
        type="button"
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className="h-full w-full cursor-pointer bg-transparent"
        disabled={disabled}
        aria-label="Open multi-select filter"
      />

      {open && !disabled && (
        <div className="absolute left-0 top-full z-30 mt-1 max-h-64 w-full overflow-auto rounded-md border border-gray-200 bg-white p-2 shadow-lg">
          {options.length ? (
            options.map((option) => {
              const checked = safeSelectedValues.includes(String(option.value));
              return (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(option.value)}
                    className="h-4 w-4 rounded border-gray-300 text-green-700 focus:ring-green-500"
                  />
                  <span className="truncate text-gray-700">{option.label}</span>
                </label>
              );
            })
          ) : (
            <div className="px-2 py-1.5 text-sm text-gray-500">No options</div>
          )}
        </div>
      )}
    </div>
  );
}

function SearchableSingleSelect({
  options = [],
  selectedValue = "",
  onChange,
  disabled = false,
  placeholder = "Search...",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    String(opt.label).toLowerCase().includes(query.toLowerCase()),
  );

  const selectedLabel =
    options.find((opt) => String(opt.value) === String(selectedValue))?.label ||
    "";

  return (
    <div ref={containerRef} className="absolute inset-0">
      <button
        type="button"
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className="h-full w-full cursor-pointer bg-transparent"
        disabled={disabled}
        aria-label="Open parcel number selector"
      />

      {open && !disabled && (
        <div className="absolute left-0 top-full z-30 mt-1 w-full rounded-md border border-gray-200 bg-white p-2 shadow-lg">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="mb-2 w-full rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-green-600"
            autoFocus
          />

          <div className="max-h-64 overflow-auto">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
                setQuery("");
              }}
              className={`block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-gray-50 ${
                !selectedValue
                  ? "bg-green-50 text-green-700 font-medium"
                  : "text-gray-700"
              }`}
            >
              -- Select --
            </button>

            {filteredOptions.length ? (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(selectedValue);

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(String(opt.value));
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-gray-50 ${
                      isSelected
                        ? "bg-green-50 text-green-700 font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })
            ) : (
              <div className="px-2 py-1.5 text-sm text-gray-500">
                No matching options
              </div>
            )}
          </div>
        </div>
      )}
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

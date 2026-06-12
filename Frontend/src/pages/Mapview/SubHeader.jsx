import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function SubHeader({
  filters,
  parcelOptions = [],
  selectedParcelNumber = "",
  onParcelNumberChange = () => {},
  isMurabbaBasedKhasra = false,
  murabbaOptions = [],
  selectedMurabbaNumber = "",
  onMurabbaNumberChange = () => {},
  khasraOptions = [],
}) {
  if (!filters) return null;

  const districts = Array.isArray(filters.districts) ? filters.districts : [];
  const tehsils = Array.isArray(filters.tehsils) ? filters.tehsils : [];
  const mauzas = Array.isArray(filters.mauzas) ? filters.mauzas : [];

  const selectedDistrict = Array.isArray(filters.selectedDistrict)
    ? filters.selectedDistrict
    : [];
  const selectedTehsil = Array.isArray(filters.selectedTehsil)
    ? filters.selectedTehsil
    : [];

  const selectedMauza = filters.selectedMauza ?? "";
  const viewBy = filters.viewBy ?? "";

  const mauzaCount = mauzas.length;

  const showStandardParcelDropdown =
    selectedMauza && viewBy && !(viewBy === "khasra" && isMurabbaBasedKhasra);

  const showMurabbaKhasraDropdowns =
    selectedMauza && viewBy === "khasra" && isMurabbaBasedKhasra;

  return (
    <div className="absolute top-4 left-1/2 z-30 w-fit max-w-[calc(100vw-96px)] -translate-x-1/2 overflow-visible rounded-xl border border-white/40 bg-[#0f3d2e] shadow-xl backdrop-blur-md">
      <div className="flex w-fit items-center justify-center gap-2 px-2 py-2 overflow-visible">
        <div className="flex w-fit items-center justify-center gap-2 overflow-visible">
          <FilterCard
            label="District — ضلع"
            value={getMultiValueDisplay({
              options: districts,
              selected: selectedDistrict,
              idKey: "id",
              labelKey: "name",
            })}
          >
            <MultiSelectDropdown
              options={districts.map((d) => ({
                value: String(d.id),
                label: d.name,
              }))}
              selectedValues={selectedDistrict}
              onToggle={filters.handleDistrictChange}
              disabled={filters.loading?.districts}
            />
          </FilterCard>

          <FilterCard
            label="Tehsil — تحصیل"
            value={getMultiValueDisplay({
              options: tehsils,
              selected: selectedTehsil,
              idKey: "id",
              labelKey: "name",
            })}
          >
            <MultiSelectDropdown
              options={tehsils.map((t) => ({
                value: String(t.id),
                label: t.name,
              }))}
              selectedValues={selectedTehsil}
              onToggle={filters.handleTehsilChange}
              disabled={!selectedDistrict.length || filters.loading?.tehsils}
            />
          </FilterCard>

          <FilterCard
            label="Mauza — موضع"
            value={
              mauzas.find((m) => String(m.mauza_id) === String(selectedMauza))
                ?.mauza || "Select"
            }
          >
            <NativeSelectOverlay
              value={selectedMauza}
              onChange={filters.handleMauzaChange}
              disabled={!selectedTehsil.length || filters.loading?.mauzas}
            >
              <option value="">-- Mauza --</option>
              {mauzas.map((m) => (
                <option key={m.mauza_id} value={m.mauza_id}>
                  {m.mauza}
                </option>
              ))}
            </NativeSelectOverlay>
          </FilterCard>

          <FilterCard
            label="View By — انتخاب کریں"
            value={
              viewBy
                ? viewBy.charAt(0).toUpperCase() + viewBy.slice(1)
                : "Select"
            }
          >
            <NativeSelectOverlay
              value={viewBy}
              onChange={filters.handleViewByChange}
              disabled={!selectedMauza}
            >
              <option value="">-- Select View --</option>
              <option value="khasra">Khasra</option>
              <option value="murabba">Murabba</option>
            </NativeSelectOverlay>
          </FilterCard>

          {showStandardParcelDropdown && (
            <FilterCard
              label={viewBy === "khasra" ? "Khasra No" : "Murabba No"}
              value={selectedParcelNumber || "Select"}
            >
              <SearchableSingleSelect
                options={parcelOptions}
                selectedValue={selectedParcelNumber}
                onChange={onParcelNumberChange}
                disabled={!parcelOptions?.length}
                placeholder={
                  viewBy === "khasra"
                    ? "Search Khasra No..."
                    : "Search Murabba No..."
                }
              />
            </FilterCard>
          )}

          {showMurabbaKhasraDropdowns && (
            <>
              <FilterCard
                label="Murabba No"
                value={selectedMurabbaNumber || "Select"}
              >
                <SearchableSingleSelect
                  options={murabbaOptions}
                  selectedValue={selectedMurabbaNumber}
                  onChange={onMurabbaNumberChange}
                  disabled={!murabbaOptions?.length}
                  placeholder="Search Murabba No..."
                />
              </FilterCard>

              <FilterCard
                label="Khasra No"
                value={selectedParcelNumber || "Select"}
              >
                <SearchableSingleSelect
                  options={khasraOptions}
                  selectedValue={selectedParcelNumber}
                  onChange={onParcelNumberChange}
                  disabled={!selectedMurabbaNumber || !khasraOptions?.length}
                  placeholder="Search Khasra No..."
                />
              </FilterCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterCard({ label, value, children }) {
  return (
    <div className="relative w-[128px] overflow-visible rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 shadow-sm hover:border-green-600">
      <p className="text-[9px] text-gray-500">{label}</p>
      <div className="flex items-center justify-between">
        <p className="max-w-[108px] truncate text-xs font-semibold text-gray-800">
          {value}
        </p>
        <ChevronDown size={13} className="text-gray-400 ml-2 shrink-0" />
      </div>
      {children}
    </div>
  );
}

function NativeSelectOverlay({ value, onChange, disabled, children }) {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="absolute inset-0 opacity-0 cursor-pointer"
    >
      {children}
    </select>
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
        className="absolute inset-0 bg-transparent cursor-pointer"
        disabled={disabled}
        aria-label="Open multi-select filter"
      />

      {open && !disabled && (
        <div className="absolute left-0 top-full mt-1 z-[999] max-h-64 w-full overflow-auto rounded-md border border-gray-200 bg-white p-2 shadow-xl">
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

  return (
    <div ref={containerRef} className="absolute inset-0">
      <button
        type="button"
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className="absolute inset-0 bg-transparent cursor-pointer"
        disabled={disabled}
        aria-label="Open selector"
      />

      {open && !disabled && (
        <div className="absolute left-0 top-full mt-1 z-[999] w-full rounded-md border border-gray-200 bg-white p-2 shadow-xl">
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

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function SubHeader({
  filters,
  societyOptions = [],
  societyLoading = false,
  societyError = "",
  selectedSocietyId = "",
  onSocietyChange = () => {},
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

  const getMauzaId = (mauza) =>
    mauza?.mauza_id ?? mauza?.properties?.mauza_id ?? mauza?.id ?? mauza?.gid;

  const getSocietyPk = (society) =>
    society?.gid ?? society?.properties?.gid ?? society?.id ?? society?.objectid;

  const selectedMauzaName =
    mauzas.find((m) => String(getMauzaId(m)) === String(selectedMauza))
      ?.mauza || "Select";

  const selectedSocietyName =
    societyOptions.find(
      (s) => String(getSocietyPk(s)) === String(selectedSocietyId),
    )?.society || "Select";

  const societyDisplayValue = societyLoading
    ? "Loading..."
    : selectedMauza && !societyOptions.length
      ? "No Society"
      : selectedSocietyName;

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

          <FilterCard label="Mauza — موضع" value={selectedMauzaName}>
            <NativeSelectOverlay
              value={selectedMauza}
              onChange={filters.handleMauzaChange}
              disabled={!selectedTehsil.length || filters.loading?.mauzas}
            >
              <option value="">-- Mauza --</option>
              {mauzas.map((m) => {
                const id = getMauzaId(m);
                return (
                  <option key={id} value={id}>
                    {m.mauza}
                  </option>
                );
              })}
            </NativeSelectOverlay>
          </FilterCard>

          <FilterCard label="Society" value={societyDisplayValue}>
            <NativeSelectOverlay
              value={selectedSocietyId}
              onChange={(e) => onSocietyChange(e.target.value)}
              disabled={!selectedMauza || societyLoading || !societyOptions.length}
              title={societyError || undefined}
            >
              <option value="">
                {societyLoading
                  ? "Loading societies..."
                  : societyOptions.length
                    ? "-- Society --"
                    : "No society found"}
              </option>
              {societyOptions.map((society) => {
                const id = getSocietyPk(society);
                const label = society.society || society.name || `Society ${id}`;
                return (
                  <option key={id} value={id}>
                    {label}
                  </option>
                );
              })}
            </NativeSelectOverlay>
          </FilterCard>
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
      className="absolute inset-0 z-10 opacity-0 cursor-pointer disabled:cursor-not-allowed"
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

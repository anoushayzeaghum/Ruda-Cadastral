import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

  const parcelDropdownMeta = getParcelDropdownMeta(viewBy);

  return (
    <div
      className="absolute top-2 sm:top-4 left-1/2 z-40 -translate-x-1/2"
      style={{ maxWidth: "calc(100vw - 16px)", width: "max-content" }}
    >
      <div className="flex items-center gap-1 sm:gap-2 px-1 sm:px-2 py-1 sm:py-2 overflow-x-auto rounded-lg sm:rounded-xl border border-white/40 bg-[#0f3d2e] shadow-xl backdrop-blur-md [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
          value={getViewByDisplay(viewBy)}
        >
          <NativeSelectOverlay
            value={viewBy}
            onChange={filters.handleViewByChange}
            disabled={!selectedMauza}
          >
            <option value="">-- Select View --</option>
            <option value="khasra">Khasra</option>
            <option value="square">Square</option>
            <option value="acre">Acre</option>
          </NativeSelectOverlay>
        </FilterCard>

        {showStandardParcelDropdown && (
          <FilterCard
            label={parcelDropdownMeta.label}
            value={selectedParcelNumber || "Select"}
          >
            <SearchableSingleSelect
              options={parcelOptions}
              selectedValue={selectedParcelNumber}
              onChange={onParcelNumberChange}
              disabled={!parcelOptions?.length}
              placeholder={parcelDropdownMeta.placeholder}
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
  );
}

function FilterCard({ label, value, children }) {
  return (
    <div
      className="relative rounded-md sm:rounded-lg border border-gray-200 bg-white px-1.5 sm:px-2 py-1 sm:py-1.5 shadow-sm hover:border-green-600 shrink-0"
      style={{ minWidth: "68px", width: "clamp(68px, 15vw, 120px)" }}
    >
      <p className="text-[7px] sm:text-[9px] text-gray-500 leading-tight truncate">{label}</p>
      <div className="flex items-center justify-between gap-0.5 sm:gap-1">
        <p className="flex-1 min-w-0 truncate text-[9px] sm:text-[11px] font-semibold text-gray-800">
          {value}
        </p>
        <ChevronDown size={9} className="shrink-0 text-gray-400" />
      </div>
      {children}
    </div>
  );
}


function getViewByDisplay(viewBy) {
  const labels = {
    khasra: "Khasra",
    square: "Square",
    acre: "Acre",
  };

  return labels[viewBy] || "Select";
}

function getParcelDropdownMeta(viewBy) {
  const meta = {
    khasra: { label: "Khasra No", placeholder: "Search Khasra No..." },
    square: { label: "Square No", placeholder: "Search Square No..." },
    acre: { label: "Acre No", placeholder: "Search Acre No..." },
  };

  return meta[viewBy] || { label: "Parcel No", placeholder: "Search Parcel No..." };
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
  const dropdownRef = useRef(null);
  const [dropPos, setDropPos] = useState(null);

  const calcPos = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropH = Math.min(options.length * 36 + 60, 240);
    const openUp = spaceBelow < dropH + 8;
    setDropPos({
      left: Math.min(rect.left, window.innerWidth - 180),
      top: openUp ? rect.top - dropH - 4 : rect.bottom + 4,
      width: Math.max(rect.width, 160),
    });
  };

  useEffect(() => {
    if (!open) return;
    calcPos();
    const handleOutside = (e) => {
      if (
        containerRef.current?.contains(e.target) ||
        dropdownRef.current?.contains(e.target)
      ) return;
      setOpen(false);
    };
    window.addEventListener("resize", calcPos);
    document.addEventListener("mousedown", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("resize", calcPos);
    };
  }, [open]);

  const safeSelectedValues = Array.isArray(selectedValues) ? selectedValues : [];

  return (
    <div ref={containerRef} className="absolute inset-0">
      <button
        type="button"
        onClick={() => { if (!disabled) { setOpen((prev) => !prev); } }}
        className="absolute inset-0 bg-transparent cursor-pointer"
        disabled={disabled}
        aria-label="Open multi-select filter"
      />
      {open && !disabled && dropPos && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{ position: "fixed", left: dropPos.left, top: dropPos.top, width: dropPos.width, zIndex: 9999 }}
            className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-xl"
          >
            <div className="max-h-[240px] overflow-y-auto p-1.5">
              {options.length ? (
                options.map((option) => {
                  const checked = safeSelectedValues.includes(String(option.value));
                  return (
                    <label
                      key={option.value}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-[11px] sm:text-xs hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggle(option.value)}
                        className="h-3 w-3 rounded border-gray-300 text-green-700"
                      />
                      <span className="truncate text-gray-700">{option.label}</span>
                    </label>
                  );
                })
              ) : (
                <div className="px-2 py-1.5 text-[11px] text-gray-500">No options</div>
              )}
            </div>
          </div>,
          document.body,
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
  const dropdownRef = useRef(null);
  const [dropPos, setDropPos] = useState(null);

  const calcPos = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropH = Math.min(options.length * 32 + 80, 280);
    const openUp = spaceBelow < dropH + 8;
    setDropPos({
      left: Math.min(rect.left, window.innerWidth - 180),
      top: openUp ? rect.top - dropH - 4 : rect.bottom + 4,
      width: Math.max(rect.width, 160),
    });
  };

  useEffect(() => {
    if (!open) return;
    calcPos();
    const handleOutside = (e) => {
      if (
        containerRef.current?.contains(e.target) ||
        dropdownRef.current?.contains(e.target)
      ) return;
      setOpen(false);
      setQuery("");
    };
    window.addEventListener("resize", calcPos);
    document.addEventListener("mousedown", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("resize", calcPos);
    };
  }, [open]);

  const filteredOptions = options.filter((opt) =>
    String(opt.label).toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div ref={containerRef} className="absolute inset-0">
      <button
        type="button"
        onClick={() => { if (!disabled) setOpen((prev) => !prev); }}
        className="absolute inset-0 bg-transparent cursor-pointer"
        disabled={disabled}
        aria-label="Open selector"
      />
      {open && !disabled && dropPos && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{ position: "fixed", left: dropPos.left, top: dropPos.top, width: dropPos.width, zIndex: 9999 }}
            className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-xl"
          >
            <div className="p-1.5 border-b border-gray-100">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded border border-gray-300 px-2 py-1 text-[11px] sm:text-xs outline-none focus:border-green-600"
                autoFocus
              />
            </div>
            <div className="max-h-[220px] overflow-auto">
              <button
                type="button"
                onClick={() => { onChange(""); setOpen(false); setQuery(""); }}
                className={`block w-full px-2 py-1.5 text-left text-[11px] sm:text-xs hover:bg-gray-50 ${!selectedValue ? "bg-green-50 text-green-700 font-medium" : "text-gray-700"}`}
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
                      onClick={() => { onChange(String(opt.value)); setOpen(false); setQuery(""); }}
                      className={`block w-full px-2 py-1.5 text-left text-[11px] sm:text-xs hover:bg-gray-50 ${isSelected ? "bg-green-50 text-green-700 font-medium" : "text-gray-700"}`}
                    >
                      {opt.label}
                    </button>
                  );
                })
              ) : (
                <div className="px-2 py-1.5 text-[11px] text-gray-500">No matching options</div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Video, X } from "lucide-react";

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
  const tehsils  = Array.isArray(filters.tehsils)  ? filters.tehsils  : [];
  const mauzas   = Array.isArray(filters.mauzas)   ? filters.mauzas   : [];

  const selectedDistrict = Array.isArray(filters.selectedDistrict)
    ? filters.selectedDistrict : [];
  const selectedTehsil = Array.isArray(filters.selectedTehsil)
    ? filters.selectedTehsil : [];
  const selectedMauza = filters.selectedMauza ?? "";

  const getMauzaId = (mauza) =>
    mauza?.mauza_id ?? mauza?.properties?.mauza_id ?? mauza?.id ?? mauza?.gid;

  const getSocietyPk = (society) =>
    society?.gid ?? society?.properties?.gid ?? society?.id ?? society?.objectid;

  const selectedMauzaName =
    mauzas.find((m) => String(getMauzaId(m)) === String(selectedMauza))?.mauza || "Select";

  const selectedSocietyName =
    societyOptions.find((s) => String(getSocietyPk(s)) === String(selectedSocietyId))?.society || "Select";

  const societyDisplayValue = societyLoading
    ? "Loading..."
    : selectedMauza && !societyOptions.length
      ? "No Society"
      : selectedSocietyName;

  const [videoOpen, setVideoOpen] = useState(false);

  // Show drone video button only when a society is selected
  const showDroneBtn = !!selectedSocietyId;

  return (
    <>
      {/* ── Drone video modal ── */}
      {videoOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setVideoOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl mx-4 rounded-2xl overflow-hidden shadow-2xl bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            {/* header */}
            <div className="flex items-center justify-between bg-[#0f3d2e] px-4 py-2.5">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <Video size={16} />
                Drone Video — {selectedSocietyName}
              </div>
              <button
                type="button"
                onClick={() => setVideoOpen(false)}
                className="text-white/70 hover:text-white transition"
                aria-label="Close video"
              >
                <X size={20} />
              </button>
            </div>

            {/* video */}
            <video
              src="/Ruda Chahar Bagh Drone Video 1.mp4"
              controls
              autoPlay
              className="w-full max-h-[70vh] bg-black"
            />
          </div>
        </div>,
        document.body,
      )}

      {/* ── Filter bar ── */}
      <div className="absolute top-4 left-[46%] z-30 w-fit max-w-[calc(100vw-96px)] -translate-x-1/2 overflow-visible rounded-xl border border-white/40 bg-[#0f3d2e] shadow-xl backdrop-blur-md">
        <div
          className="flex items-center gap-1.5 px-2 py-1.5"
          style={{
            overflowX: "auto",
            overflowY: "visible",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <style>{`.sh-scroll-row::-webkit-scrollbar { display: none; }`}</style>

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
              options={districts.map((d) => ({ value: String(d.id), label: d.name }))}
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
              options={tehsils.map((t) => ({ value: String(t.id), label: t.name }))}
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
                return <option key={id} value={id}>{m.mauza}</option>;
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
                return <option key={id} value={id}>{label}</option>;
              })}
            </NativeSelectOverlay>
          </FilterCard>

          {/* Drone video button — appears after society is selected */}
          {showDroneBtn && (
            <button
              type="button"
              onClick={() => setVideoOpen(true)}
              title="Watch drone video for this society"
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-400/60 bg-amber-400/15 px-2.5 py-1.5 text-amber-300 transition hover:bg-amber-400/30 hover:text-amber-200"
            >
              <Video size={13} />
              <span className="text-[11px] font-semibold leading-none whitespace-nowrap">
                Drone Video
              </span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}

/* ── FilterCard ─────────────────────────────────────────────────────────── */

function FilterCard({ label, value, children }) {
  return (
    <div className="relative shrink-0 min-w-[100px] max-w-[148px] rounded-lg border border-gray-200 bg-white px-2 py-1 shadow-sm hover:border-green-600">
      <p className="text-[8px] leading-tight text-gray-500">{label}</p>
      <div className="flex items-center justify-between gap-1">
        <p className="truncate text-[11px] font-semibold leading-snug text-gray-800">
          {value}
        </p>
        <ChevronDown size={11} className="shrink-0 text-gray-400" />
      </div>
      {children}
    </div>
  );
}

/* ── NativeSelectOverlay ────────────────────────────────────────────────── */

function NativeSelectOverlay({ value, onChange, disabled, title, children }) {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      title={title}
      className="absolute inset-0 z-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
    >
      {children}
    </select>
  );
}

/* ── helpers ────────────────────────────────────────────────────────────── */

function getMultiValueDisplay({ options, selected, idKey, labelKey }) {
  if (!selected?.length) return "Select";
  const labels = options
    .filter((item) => selected.includes(String(item[idKey])))
    .map((item) => item[labelKey])
    .filter(Boolean);
  return labels.join(", ") || "Select";
}

/* ── MultiSelectDropdown — portals menu to <body> to escape any clip ──── */

function MultiSelectDropdown({ options, selectedValues, onToggle, disabled }) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const anchorRef   = useRef(null);
  const menuRef     = useRef(null);

  /* Position menu relative to anchor on every open */
  useEffect(() => {
    if (!open || !anchorRef.current) return;

    const rect = anchorRef.current.getBoundingClientRect();
    setMenuStyle({
      position: "fixed",
      top:  rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 180),
      zIndex: 9999,
    });
  }, [open]);

  /* Close on outside click */
  useEffect(() => {
    if (!open) return;

    const handleOutside = (e) => {
      if (
        !anchorRef.current?.contains(e.target) &&
        !menuRef.current?.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const safeSelected = Array.isArray(selectedValues) ? selectedValues : [];

  return (
    /* Invisible overlay that covers the FilterCard and captures clicks */
    <button
      ref={anchorRef}
      type="button"
      onClick={() => !disabled && setOpen((prev) => !prev)}
      disabled={disabled}
      aria-label="Open multi-select filter"
      className="absolute inset-0 z-10 cursor-pointer bg-transparent disabled:cursor-not-allowed"
    >
      {/* Portal: render menu outside any overflow-clipping ancestor */}
      {open && !disabled && createPortal(
        <div
          ref={menuRef}
          style={menuStyle}
          className="max-h-64 overflow-auto rounded-md border border-gray-200 bg-white p-2 shadow-xl"
        >
          {options.length ? (
            options.map((option) => {
              const checked = safeSelected.includes(String(option.value));
              return (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-50"
                  onMouseDown={(e) => e.stopPropagation()}
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
        </div>,
        document.body,
      )}
    </button>
  );
}

/* ── SearchableSingleSelect (unchanged, kept for completeness) ─────────── */

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
              onClick={() => { onChange(""); setOpen(false); setQuery(""); }}
              className={`block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-gray-50 ${
                !selectedValue ? "bg-green-50 text-green-700 font-medium" : "text-gray-700"
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
                    onClick={() => { onChange(String(opt.value)); setOpen(false); setQuery(""); }}
                    className={`block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-gray-50 ${
                      isSelected ? "bg-green-50 text-green-700 font-medium" : "text-gray-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })
            ) : (
              <div className="px-2 py-1.5 text-sm text-gray-500">No matching options</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

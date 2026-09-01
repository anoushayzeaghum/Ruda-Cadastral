import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, RotateCcw } from "lucide-react";
import {
  getProjects,
  getProjectsByPhase,
  getProjectsByPhaseAndType,
  getProjectGeoJSON,
} from "../../services/metaverseApi";

const normalizeSortValue = (value) => String(value ?? "").trim();

const getFirstNumber = (value) => {
  const match = normalizeSortValue(value).match(/\d+/);
  return match ? Number(match[0]) : null;
};

const naturalSort = (items = [], getValue = (item) => item) =>
  [...items].sort((a, b) => {
    const av = normalizeSortValue(getValue(a));
    const bv = normalizeSortValue(getValue(b));

    const an = getFirstNumber(av);
    const bn = getFirstNumber(bv);

    if (an !== null && bn !== null && an !== bn) return an - bn;
    if (an !== null && bn === null) return -1;
    if (an === null && bn !== null) return 1;

    return av.localeCompare(bv, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

const uniqueSorted = (items = []) =>
  naturalSort([...new Set(items.filter(Boolean))]);

function SearchableSelect({
  value,
  label,
  placeholder = "Select",
  disabled,
  options = [],
  onChange,
  className,
}) {
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState(null);

  const selectedOption = options.find(
    (option) => String(option.value) === String(value),
  );

  const filteredOptions = options.filter((option) =>
    String(option.label ?? "")
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  const updateDropdownPosition = () => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownPosition({
      left: rect.left,
      top: rect.bottom + 4,
      width: rect.width,
    });
  };

  useEffect(() => {
    if (!open) return;

    updateDropdownPosition();

    const handleOutsideClick = (event) => {
      if (
        buttonRef.current?.contains(event.target) ||
        dropdownRef.current?.contains(event.target)
      ) {
        return;
      }

      setOpen(false);
      setSearch("");
    };

    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (disabled) {
      setOpen(false);
      setSearch("");
    }
  }, [disabled]);

  const handleToggle = () => {
    if (disabled) return;

    setOpen((prev) => {
      const nextOpen = !prev;
      if (nextOpen) setSearch("");
      return nextOpen;
    });
  };

  const handleSelect = (nextValue) => {
    onChange(nextValue);
    setOpen(false);
    setSearch("");
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`${className} flex items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[8px] sm:text-[9px] font-medium leading-none text-[#7b8794]">
            {label}
          </span>
          <span className="mt-0.5 block truncate text-[10px] sm:text-xs font-semibold leading-none text-[#06291f]">
            {selectedOption?.label || placeholder}
          </span>
        </span>
        <span className="shrink-0 text-[10px] leading-none text-[#8b96a1]">
          ▾
        </span>
      </button>

      {open &&
        dropdownPosition &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              left: dropdownPosition.left,
              top: dropdownPosition.top,
              width: Math.max(dropdownPosition.width, 120),
            }}
            className="fixed z-[9999] overflow-hidden rounded-md border border-[#2f3a4d] bg-white shadow-xl"
          >
            <div className="border-b border-gray-200 p-1">
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${label}`}
                className="h-6 sm:h-7 w-full rounded border border-gray-300 px-1.5 sm:px-2 text-[10px] sm:text-xs font-semibold text-[#06291f] outline-none"
              />
            </div>

            <div className="max-h-48 sm:max-h-52 overflow-y-auto py-1">
            

              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`block w-full px-1.5 sm:px-2 py-1 sm:py-1.5 text-left text-[10px] sm:text-xs font-semibold text-[#06291f] hover:bg-gray-100 ${
                      String(option.value) === String(value)
                        ? "bg-gray-100"
                        : ""
                    }`}
                  >
                    {option.label}
                  </button>
                ))
              ) : (
                <div className="px-1.5 sm:px-2 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-gray-500">
                  No results found
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

export default function MetaverseSubHeader({
  filters,
  setFilters,
  setLayerVisibility,
  onReset,
  onCalendarClick,
  onBoundaryChange,
}) {
  const [projects, setProjects] = useState([]);
  // const [blocks, setBlocks] = useState([]);
  // const [options, setOptions] = useState({
  //   plotTypes: [],
  //   plotNos: [],
  //   areas: [],
  // });

  useEffect(() => {
    getProjects()
      .then((data) => {
        setProjects(
          naturalSort(
            data,
            (project) =>
              project.brief_name || project.name || project.gid || project.id,
          ),
        );
      })
      .catch((err) => {
        console.error("PROJECTS ERROR:", err);
      });
  }, []);

  // Fetch and surface the boundary GeoJSON for whichever filter stage is
  // currently the most specific: Project > Type+Phase > Phase alone.
  useEffect(() => {
    let cancelled = false;

    const loadBoundary = async () => {
      if (!onBoundaryChange) return;

      try {
        let geojson;

        if (filters.projectId) {
          geojson = await getProjectGeoJSON(filters.projectId);
        } else if (filters.phase && filters.projectType) {
          geojson = await getProjectsByPhaseAndType(
            filters.phase,
            filters.projectType,
          );
        } else if (filters.phase) {
          geojson = await getProjectsByPhase(filters.phase);
        } else {
          geojson = { type: "FeatureCollection", features: [] };
        }

        if (!cancelled) onBoundaryChange(geojson);
      } catch (err) {
        console.error("BOUNDARY FETCH ERROR:", err);
        if (!cancelled)
          onBoundaryChange({ type: "FeatureCollection", features: [] });
      }
    };

    loadBoundary();

    return () => {
      cancelled = true;
    };
  }, [filters.phase, filters.projectType, filters.projectId, onBoundaryChange]);

  // const updateFilter = (key, value) => {
  //   setFilters(prev => {
  //     const next = {
  //       ...prev,
  //       [key]: value,
  //     };

  //     if (key === "projectId") {
  //       next.block = "";
  //       next.plotType = "";
  //       next.area = "";
  //       next.plotNo = "";
  //     }

  //     if (key === "block") {
  //       next.plotType = "";
  //       next.area = "";
  //       next.plotNo = "";
  //     }

  //     if (key === "plotType") {
  //       next.area = "";
  //       next.plotNo = "";
  //     }

  //     if (key === "area") {
  //       next.plotNo = "";
  //     }

  //     return next;
  //   });
  // };
  const updateFilter = (key, value) => {
    setFilters((prev) => {
      const next = {
        ...prev,
        [key]: value,
      };

      if (key === "phase") {
        next.projectType = "";
        next.projectId = "";
      }

      if (key === "projectType") {
        next.projectId = "";
      }

      return next;
    });
  };

  const projectOptions = projects.map((p) => ({
    value: String(p.gid || p.id),
    label: p.brief_name || p.name,
  }));

  const phaseOptions = [
    ...new Set(projects.map((p) => p.phase).filter(Boolean)),
  ].map((phase) => ({
    value: phase,
    label: phase,
  }));

  const projectTypeOptions = [
    ...new Set(
      projects
        .filter((p) => !filters.phase || p.phase === filters.phase)
        .map((p) => p.type)
        .filter(Boolean),
    ),
  ].map((type) => ({
    value: type,
    label: type,
  }));

  const filteredProjectOptions = projects
    .filter((p) => {
      if (filters.phase && p.phase !== filters.phase) return false;
      if (filters.projectType && p.type !== filters.projectType) return false;
      return true;
    })
    .map((p) => ({
      value: String(p.gid || p.id),
      label: p.brief_name || p.name,
    }));

  const filterClassName =
    "h-10 sm:h-9 shrink-0 rounded-lg border border-[#d8dee5] bg-white px-2.5 sm:px-3 outline-none transition-colors hover:border-[#9aa5ad]";

  return (
    <div
      className="absolute left-1/2 top-2 sm:top-3 z-40 -translate-x-1/2"
      style={{ maxWidth: "calc(100vw - 120px)" }}
    >
      <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto rounded-md sm:rounded-lg bg-[#06291f] px-1.5 sm:px-2 py-1 sm:py-1.5 shadow-xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <SearchableSelect
          value={filters.phase}
          label="Phase"
          placeholder="Select"
          options={phaseOptions}
          onChange={(value) => updateFilter("phase", value)}
          className={`${filterClassName} w-[120px]`}
        />

        <SearchableSelect
          value={filters.projectType}
          label="Project Type"
          placeholder="Select"
          options={projectTypeOptions}
          disabled={!filters.phase}
          onChange={(value) => updateFilter("projectType", value)}
          className={`${filterClassName} w-[150px]`}
        />

        <SearchableSelect
          value={filters.projectId}
          label="Project"
          placeholder="Select"
          options={filteredProjectOptions}
          disabled={!filters.projectType}
          onChange={(value) => updateFilter("projectId", value)}
          className={`${filterClassName} w-[180px]`}
        />

        <button
          type="button"
          onClick={onCalendarClick}
          title="Calendar"
          className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#06291f] hover:bg-[#b6bdc8]"
        >
          <CalendarDays size={14} strokeWidth={2.4} className="sm:hidden" />
          <CalendarDays
            size={16}
            strokeWidth={2.4}
            className="hidden sm:block"
          />
        </button>

        <button
          type="button"
          onClick={onReset}
          title="Reset"
          className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#06291f] hover:bg-[#b6bdc8]"
        >
          <RotateCcw size={14} strokeWidth={2.4} className="sm:hidden" />
          <RotateCcw size={16} strokeWidth={2.4} className="hidden sm:block" />
        </button>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, RotateCcw } from "lucide-react";
import {
  getBlocks,
  getPlotOptions,
  getProjects,
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
  placeholder,
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
        className={`${className} flex items-center justify-between gap-1 disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <span className="truncate">{selectedOption?.label || placeholder}</span>
        <span className="text-[10px] leading-none">▾</span>
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
              width: dropdownPosition.width,
            }}
            className="fixed z-[9999] overflow-hidden rounded-md border border-[#2f3a4d] bg-white shadow-xl"
          >
            <div className="border-b border-gray-200 p-1">
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${placeholder}`}
                className="h-7 w-full rounded border border-gray-300 px-2 text-xs font-semibold text-[#111827] outline-none"
              />
            </div>

            <div className="max-h-52 overflow-y-auto py-1">
              <button
                type="button"
                onClick={() => handleSelect("")}
                className={`block w-full px-2 py-1.5 text-left text-xs font-semibold text-[#111827] hover:bg-gray-100 ${
                  value === "" ? "bg-gray-100" : ""
                }`}
              >
                {placeholder}
              </button>

              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`block w-full px-2 py-1.5 text-left text-xs font-semibold text-[#111827] hover:bg-gray-100 ${
                      String(option.value) === String(value)
                        ? "bg-gray-100"
                        : ""
                    }`}
                  >
                    {option.label}
                  </button>
                ))
              ) : (
                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
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
}) {
  const [projects, setProjects] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [options, setOptions] = useState({
    plotTypes: [],
    plotNos: [],
    areas: [],
  });

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

  useEffect(() => {
    let cancelled = false;

    const loadBlocks = async () => {
      if (!filters.projectId) {
        setBlocks([]);
        return;
      }

      try {
        const data = await getBlocks(filters.projectId);
        if (!cancelled)
          setBlocks(
            naturalSort(data, (block) => block.block || block.gid || block.id),
          );
      } catch (err) {
        console.error(err);
        if (!cancelled) setBlocks([]);
      }
    };

    loadBlocks();

    return () => {
      cancelled = true;
    };
  }, [filters.projectId]);

  useEffect(() => {
    let cancelled = false;

    const loadCascadingOptions = async () => {
      if (!filters.projectId) {
        setOptions({ plotTypes: [], plotNos: [], areas: [] });
        return;
      }

      try {
        // Plot Type depends on Project + Block
        const plotTypeOptions = await getPlotOptions({
          project_id: filters.projectId,
          block: filters.block || undefined,
        });

        // Area depends on Project + Block + Plot Type
        const areaOptions = await getPlotOptions({
          project_id: filters.projectId,
          block: filters.block || undefined,
          type: filters.plotType || undefined,
        });

        // Plot No depends on Project + Block + Plot Type + Area
        const plotNoOptions = await getPlotOptions({
          project_id: filters.projectId,
          block: filters.block || undefined,
          type: filters.plotType || undefined,
          plot_area: filters.area || undefined,
        });
        if (cancelled) return;

        setOptions({
          plotTypes: uniqueSorted(plotTypeOptions.plotTypes || []),
          areas: uniqueSorted(areaOptions.areas || []),
          plotNos: uniqueSorted(plotNoOptions.plotNos || []),
        });
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setOptions({
            plotTypes: [],
            areas: [],
            plotNos: [],
          });
        }
      }
    };

    loadCascadingOptions();

    return () => {
      cancelled = true;
    };
  }, [filters.projectId, filters.block, filters.plotType, filters.area]);

  const updateFilter = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };

      if (key === "projectId") {
        next.block = "";
        next.plotType = "";
        next.plotNo = "";
        next.area = "";

        setLayerVisibility((prev) => ({
          ...prev,
          boundary: !!value,
          masterPlan: false,
          spotLevel: false,
          contours: false,
          roads: false,
          waterSupplyPoints: false,
          waterSupplyLines: false,
          sewagePoints: false,
          cameraLocations: false,
          notifiedBoundary: false,
        }));
      }

      if (key === "block") {
        next.plotType = "";
        next.area = "";
        next.plotNo = "";
      }

      if (key === "plotType") {
        next.area = "";
        next.plotNo = "";
      }

      if (key === "area") {
        next.plotNo = "";
      }

      return next;
    });
  };

  const projectOptions = projects.map((p) => ({
    value: String(p.gid || p.id),
    label: p.brief_name || p.name,
  }));

  const blockOptions = blocks.map((b) => ({
    value: String(b.block),
    label: b.block,
  }));

  const areaToMarla = (value) => {
    const text = String(value || "")
      .toLowerCase()
      .trim();

    const number = parseFloat(text.match(/[\d.]+/)?.[0] || 0);

    if (text.includes("acre")) return number * 160; // 1 acre = 160 marla
    if (text.includes("kanal")) return number * 20; // 1 kanal = 20 marla
    if (text.includes("marla")) return number;

    return number;
  };

  const areaOptions = (options.areas || [])
    .map((area) => ({
      value: String(area),
      label: area,
    }))
    .sort((a, b) => {
      const av = areaToMarla(a.label);
      const bv = areaToMarla(b.label);

      // primary sort: actual size
      if (av !== bv) return av - bv;

      // secondary: unit priority (optional but makes it stable)
      const unitRank = (label) => {
        const l = label.toLowerCase();
        if (l.includes("marla")) return 1;
        if (l.includes("kanal")) return 2;
        if (l.includes("acre")) return 3;
        return 4;
      };

      const unitDiff = unitRank(a.label) - unitRank(b.label);
      if (unitDiff !== 0) return unitDiff;

      return a.label.localeCompare(b.label);
    });

  const plotTypeOptions = options.plotTypes?.map((type) => ({
    value: String(type),
    label: type,
  }));

  const plotNoOptions = options.plotNos?.map((plotNo) => ({
    value: String(plotNo),
    label: plotNo,
  }));

  const filterClassName =
    "h-8 w-[105px] shrink-0 rounded-md border border-[#2f3a4d] bg-white px-2 text-xs font-semibold text-[#111827] outline-none";

  return (
    <div className="absolute left-1/2 top-3 z-20 w-[calc(100vw-4.5rem)] max-w-[720px] -translate-x-1/2">
      <div className="flex items-center gap-1.5 overflow-x-auto rounded-lg bg-[#0f3d2e] px-2 py-1.5 shadow-xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <SearchableSelect
          value={filters.projectId}
          placeholder="Projects"
          options={projectOptions}
          onChange={(value) => updateFilter("projectId", value)}
          className="h-8 w-[130px] shrink-0 rounded-md border border-[#2f3a4d] bg-white px-2 text-xs font-semibold text-[#111827] outline-none"
        />

        <SearchableSelect
          value={filters.block}
          placeholder="Block No"
          disabled={!filters.projectId}
          options={blockOptions}
          onChange={(value) => updateFilter("block", value)}
          className={filterClassName}
        />
        <SearchableSelect
          value={filters.plotType}
          placeholder="Plot Type"
          disabled={!filters.projectId}
          options={plotTypeOptions}
          onChange={(value) => updateFilter("plotType", value)}
          className={filterClassName}
        />
        <SearchableSelect
          value={filters.area}
          placeholder="Area"
          disabled={!filters.projectId}
          options={areaOptions}
          onChange={(value) => updateFilter("area", value)}
          className={filterClassName}
        />

        <SearchableSelect
          value={filters.plotNo}
          placeholder="Plot No"
          disabled={!filters.projectId}
          options={plotNoOptions}
          onChange={(value) => updateFilter("plotNo", value)}
          className={filterClassName}
        />

        <button
          type="button"
          onClick={onCalendarClick}
          title="Calendar"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#111827] hover:bg-[#b6bdc8]"
        >
          <CalendarDays size={16} strokeWidth={2.4} />
        </button>

        <button
          type="button"
          onClick={onReset}
          title="Reset"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#111827] hover:bg-[#b6bdc8]"
        >
          <RotateCcw size={16} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}

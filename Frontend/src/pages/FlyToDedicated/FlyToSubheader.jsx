import { useEffect, useState } from "react";
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

export default function FlyToSubHeader({
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
        // Area depends on Project + Block only.
        const areaOptions = await getPlotOptions({
          project_id: filters.projectId,
          block: filters.block || undefined,
        });

        // Plot Type depends on Project + Block + Area.
        const plotTypeOptions = await getPlotOptions({
          project_id: filters.projectId,
          block: filters.block || undefined,
          plot_area: filters.area || undefined,
        });

        // Plot No depends on Project + Block + Area + Plot Type.
        const plotNoOptions = await getPlotOptions({
          project_id: filters.projectId,
          block: filters.block || undefined,
          plot_area: filters.area || undefined,
          type: filters.plotType || undefined,
        });

        if (cancelled) return;

        setOptions({
          plotTypes: uniqueSorted(plotTypeOptions.plotTypes || []),
          plotNos: uniqueSorted(plotNoOptions.plotNos || []),
          areas: uniqueSorted(areaOptions.areas || []),
        });
      } catch (err) {
        console.error(err);
        if (!cancelled) setOptions({ plotTypes: [], plotNos: [], areas: [] });
      }
    };

    loadCascadingOptions();

    return () => {
      cancelled = true;
    };
  }, [filters.projectId, filters.block, filters.area, filters.plotType]);

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
        }));
      }

      if (key === "block") {
        next.area = "";
        next.plotType = "";
        next.plotNo = "";
      }

      if (key === "area") {
        next.plotType = "";
        next.plotNo = "";
      }

      if (key === "plotType") {
        next.plotNo = "";
      }

      return next;
    });
  };

  return (
    <div className="absolute left-1/2 top-3 z-20 w-[calc(100vw-4.5rem)] max-w-[720px] -translate-x-1/2">
      <div className="flex items-center gap-1.5 overflow-x-auto rounded-lg bg-[#111827] px-2 py-1.5 shadow-xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <select
          value={filters.projectId}
          onChange={(e) => updateFilter("projectId", e.target.value)}
          className="h-8 w-[130px] shrink-0 rounded-md border border-[#2f3a4d] bg-white px-2 text-xs font-semibold text-[#111827] outline-none"
        >
          <option value="">Projects</option>
          {projects.map((p) => (
            <option key={p.gid || p.id} value={p.gid || p.id}>
              {p.brief_name || p.name}
            </option>
          ))}
        </select>

        <select
          value={filters.block}
          disabled={!filters.projectId}
          onChange={(e) => updateFilter("block", e.target.value)}
          className="h-8 w-[105px] shrink-0 rounded-md border border-[#2f3a4d] bg-white px-2 text-xs font-semibold text-[#111827] outline-none"
        >
          <option value="">Block No</option>
          {blocks.map((b) => (
            <option key={b.gid || b.id || b.block} value={b.block}>
              {b.block}
            </option>
          ))}
        </select>

        <select
          value={filters.area}
          disabled={!filters.projectId}
          onChange={(e) => updateFilter("area", e.target.value)}
          className="h-8 w-[105px] shrink-0 rounded-md border border-[#2f3a4d] bg-white px-2 text-xs font-semibold text-[#111827] outline-none"
        >
          <option value="">Area</option>
          {options.areas?.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>

        <select
          value={filters.plotType}
          disabled={!filters.projectId}
          onChange={(e) => updateFilter("plotType", e.target.value)}
          className="h-8 w-[105px] shrink-0 rounded-md border border-[#2f3a4d] bg-white px-2 text-xs font-semibold text-[#111827] outline-none"
        >
          <option value="">Plot Type</option>
          {options.plotTypes?.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select
          value={filters.plotNo}
          disabled={!filters.projectId}
          onChange={(e) => updateFilter("plotNo", e.target.value)}
          className="h-8 w-[105px] shrink-0 rounded-md border border-[#2f3a4d] bg-white px-2 text-xs font-semibold text-[#111827] outline-none"
        >
          <option value="">Plot No</option>
          {options.plotNos?.map((plotNo) => (
            <option key={plotNo} value={plotNo}>
              {plotNo}
            </option>
          ))}
        </select>

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

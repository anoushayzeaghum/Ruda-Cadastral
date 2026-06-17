import { useEffect, useState } from "react";
import { CalendarDays, RotateCcw } from "lucide-react";
import {
  getBlocks,
  getPlotOptions,
  getProjects,
} from "../../services/metaverseApi";

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
        console.log("PROJECTS DATA:", data);
        setProjects(data);
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
        if (!cancelled) setBlocks(data);
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
        // Plot Type depends on Project + Block only.
        const plotTypeOptions = await getPlotOptions({
          project_id: filters.projectId,
          block: filters.block || undefined,
        });

        // Plot No depends on Project + Block + Plot Type.
        const plotNoOptions = await getPlotOptions({
          project_id: filters.projectId,
          block: filters.block || undefined,
          type: filters.plotType || undefined,
        });

        // Area depends on Project + Block + Plot Type + Plot No.
        const areaOptions = await getPlotOptions({
          project_id: filters.projectId,
          block: filters.block || undefined,
          type: filters.plotType || undefined,
          plot_no: filters.plotNo || undefined,
        });

        if (cancelled) return;

        setOptions({
          plotTypes: plotTypeOptions.plotTypes || [],
          plotNos: plotNoOptions.plotNos || [],
          areas: areaOptions.areas || [],
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
  }, [filters.projectId, filters.block, filters.plotType, filters.plotNo]);

  const updateFilter = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };

      if (key === "projectId") {
        next.block = "";
        next.plotType = "";
        next.plotNo = "";
        next.area = "";

        setLayerVisibility({
          boundary: !!value,
          masterPlan: false,
          spotLevel: false,
          contours: false,
          roads: false,
          waterSupplyPoints: false,
          waterSupplyLines: false,
          sewagePoints: false,
          cameraLocations: false,
        });
      }

      if (key === "block") {
        next.plotType = "";
        next.plotNo = "";
        next.area = "";
      }

      if (key === "plotType") {
        next.plotNo = "";
        next.area = "";
      }

      if (key === "plotNo") {
        next.area = "";
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

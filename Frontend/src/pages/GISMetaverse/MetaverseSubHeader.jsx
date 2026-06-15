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
    if (!filters.projectId) {
      setBlocks([]);
      setOptions({ plotTypes: [], plotNos: [], areas: [] });
      return;
    }

    getBlocks(filters.projectId).then(setBlocks).catch(console.error);

    getPlotOptions({ project_id: filters.projectId })
      .then(setOptions)
      .catch(console.error);
  }, [filters.projectId]);

  useEffect(() => {
    if (!filters.projectId) return;

    getPlotOptions({
      project_id: filters.projectId,
      block: filters.block || undefined,
      type: filters.plotType || undefined,
      plot_no: filters.plotNo || undefined,
      plot_area: filters.area || undefined,
    })
      .then(setOptions)
      .catch(console.error);
  }, [
    filters.projectId,
    filters.block,
    filters.plotType,
    filters.plotNo,
    filters.area,
  ]);

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

      return next;
    });
  };

  return (
    <div className="absolute left-1/2 top-3 z-20 -translate-x-1/2">
      <div className="flex items-center gap-1.5 rounded-lg bg-[#111827] px-2 py-1.5 shadow-xl">
        <select
          value={filters.projectId}
          onChange={(e) => updateFilter("projectId", e.target.value)}
          className="h-8 min-w-[145px] rounded-md border border-[#2f3a4d] bg-white px-2 text-xs font-semibold text-[#111827] outline-none"
        >
          <option value="">Projects</option>
          {projects.map((p) => (
            <option key={p.gid || p.id} value={p.gid || p.id}>
              {" "}
              {p.brief_name || p.name}
            </option>
          ))}
        </select>

        <select
          value={filters.block}
          disabled={!filters.projectId}
          onChange={(e) => updateFilter("block", e.target.value)}
          className="h-8 min-w-[118px] rounded-md border border-[#2f3a4d] bg-white px-2 text-xs font-semibold text-[#111827] outline-none "
        >
          <option value="">Block No</option>
          {blocks.map((b) => (
            <option key={b.gid} value={b.block}>
              {b.block}
            </option>
          ))}
        </select>

        <select
          value={filters.plotType}
          disabled={!filters.projectId}
          onChange={(e) => updateFilter("plotType", e.target.value)}
          className="h-8 min-w-[118px] rounded-md border border-[#2f3a4d] bg-white px-2 text-xs font-semibold text-[#111827] outline-none "
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
          className="h-8 min-w-[118px] rounded-md border border-[#2f3a4d] bg-white px-2 text-xs font-semibold text-[#111827] outline-none "
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
          className="h-8 min-w-[118px] rounded-md border border-[#2f3a4d] bg-white px-2 text-xs font-semibold text-[#111827] outline-none "
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
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#111827] hover:bg-[#b6bdc8]"
        >
          <CalendarDays size={16} strokeWidth={2.4} />
        </button>

        <button
          type="button"
          onClick={onReset}
          title="Reset"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#111827] hover:bg-[#b6bdc8]"
        >
          <RotateCcw size={16} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}

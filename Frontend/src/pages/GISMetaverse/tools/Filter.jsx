import { useEffect, useMemo, useState } from "react";
import { Filter as FilterIcon, X } from "lucide-react";
import {
  getBlocks,
  getPlotOptionsAll,
  getProjects,
} from "../../../services/metaverseApi";

const initialSelectedFilters = {
  projectId: "",
  block: "",
  plotNo: "",
  plotType: "",
  parkfront: "",
  rd_facing: "",
  poss_st: "",
  plotStatus: "",
  tr_cate: "",
  tr_own: "",
  site_plan: "",
};

export default function Filter({
  filters,
  projectId,
  setLayerVisibility,
  onClose,
  onApply,
}) {
  const activeProjectId = filters?.projectId || projectId || "";

  const [projects, setProjects] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [plotOptions, setPlotOptions] = useState({
    plotTypes: [],
    plotNos: [],
    parkFronts: [],
    roadFacing: [],
    possessionStatus: [],
    plotStatus: [],
    categories: [],
    owners: [],
    sitePlans: [],
  });

  const [selectedFilters, setSelectedFilters] = useState({
    ...initialSelectedFilters,
    projectId: activeProjectId,
    block: filters?.block || "",
    plotNo: filters?.plotNo || "",
    plotType: filters?.plotType || "",
  });

  const selectedProjectId = useMemo(
    () => selectedFilters.projectId || activeProjectId,
    [selectedFilters.projectId, activeProjectId],
  );

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await getProjects();
        setProjects(res || []);
      } catch (err) {
        console.error("Projects error:", err);
      }
    };

    loadProjects();
  }, []);

  useEffect(() => {
    setSelectedFilters((prev) => ({
      ...prev,
      projectId: activeProjectId || prev.projectId || "",
      block: filters?.block || prev.block || "",
      plotNo: filters?.plotNo || prev.plotNo || "",
      plotType: filters?.plotType || prev.plotType || "",
    }));
  }, [activeProjectId, filters?.block, filters?.plotNo, filters?.plotType]);

  useEffect(() => {
    const loadFilterData = async () => {
      try {
        if (!selectedProjectId) {
          setBlocks([]);
          setPlotOptions({
            plotTypes: [],
            plotNos: [],
            parkFronts: [],
            roadFacing: [],
            possessionStatus: [],
            plotStatus: [],
            categories: [],
            owners: [],
            sitePlans: [],
          });
          return;
        }

        const [blockRes, plotRes] = await Promise.all([
          getBlocks(selectedProjectId),
          getPlotOptionsAll({ project_id: selectedProjectId }),
        ]);

        setBlocks(blockRes || []);
        setPlotOptions(plotRes || {});
      } catch (err) {
        console.error("Filter API error:", err);
      }
    };

    loadFilterData();
  }, [selectedProjectId]);

  const handleChange = (key, value) => {
    setSelectedFilters((prev) => {
      const updated = {
        ...prev,
        [key]: value,
      };

      if (key === "projectId") {
        updated.block = "";
        updated.plotNo = "";
        updated.plotType = "";
        updated.parkfront = "";
        updated.rd_facing = "";
        updated.poss_st = "";
        updated.plotStatus = "";
        updated.tr_cate = "";
        updated.tr_own = "";
        updated.site_plan = "";
      }

      return updated;
    });
  };

  const handleApply = () => {
    const cleanedFilters = {
      projectId: selectedFilters.projectId || "",
      block: selectedFilters.block || "",
      plotNo: selectedFilters.plotNo || "",
      plotType: selectedFilters.plotType || "",
      parkfront: selectedFilters.parkfront || "",
      rd_facing: selectedFilters.rd_facing || "",
      poss_st: selectedFilters.poss_st || "",
      plotStatus: selectedFilters.plotStatus || "",
      tr_cate: selectedFilters.tr_cate || "",
      tr_own: selectedFilters.tr_own || "",
      site_plan: selectedFilters.site_plan || "",
    };

    onApply?.(cleanedFilters);

    if (cleanedFilters.projectId) {
      setLayerVisibility?.((prev) => ({
        ...prev,
        boundary: true,
        masterPlan: true,
        roads: true,
      }));
    }
  };

  const handleReset = () => {
    setSelectedFilters({
      ...initialSelectedFilters,
      projectId: activeProjectId,
    });
  };

  return (
    <div className="w-full text-white">
      <div className="flex items-center justify-between border-b border-[#343c4c] px-4 py-3">
        <div className="flex items-center gap-2 text-[13px] font-bold">
          <FilterIcon size={15} />
          <span>FILTER</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded bg-[#263244] p-1 hover:bg-[#334158]"
        >
          <X size={14} />
        </button>
      </div>

      <div className="max-h-[410px] overflow-y-auto p-4">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-white/80">
              Project Name
            </label>

            <select
              className="h-8 w-full rounded-md border border-[#344055] bg-[#1d2533] px-2 text-xs text-white"
              value={selectedFilters.projectId || ""}
              onChange={(e) => handleChange("projectId", e.target.value)}
            >
              <option value="">Select Project</option>

              {projects.map((p) => (
                <option key={p.gid || p.id} value={p.gid || p.id}>
                  {p.name || p.project_name || `Project ${p.gid || p.id}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-white/80">
              Block
            </label>

            <select
              className="h-8 w-full rounded-md border border-[#344055] bg-[#1d2533] px-2 text-xs text-white"
              value={selectedFilters.block || ""}
              onChange={(e) => handleChange("block", e.target.value)}
              disabled={!selectedProjectId}
            >
              <option value="">Select Block</option>

              {blocks.map((b) => (
                <option
                  key={b.gid || b.id}
                  value={b.block || b.name || b.block_name}
                >
                  {b.block || b.name || b.block_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-white/80">
              Plot No
            </label>

            <select
              className="h-8 w-full rounded-md border border-[#344055] bg-[#1d2533] px-2 text-xs text-white"
              value={selectedFilters.plotNo || ""}
              onChange={(e) => handleChange("plotNo", e.target.value)}
              disabled={!selectedProjectId}
            >
              <option value="">Select Plot No</option>

              {(plotOptions.plotNos || []).map((p, i) => (
                <option key={i} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-white/80">
              Type
            </label>

            <select
              className="h-8 w-full rounded-md border border-[#344055] bg-[#1d2533] px-2 text-xs text-white"
              value={selectedFilters.plotType || ""}
              onChange={(e) => handleChange("plotType", e.target.value)}
              disabled={!selectedProjectId}
            >
              <option value="">Select Type</option>

              {(plotOptions.plotTypes || []).map((t, i) => (
                <option key={i} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-white/80">
              Park Front
            </label>

            <select
              className="h-8 w-full rounded-md border border-[#344055] bg-[#1d2533] px-2 text-xs text-white"
              value={selectedFilters.parkfront || ""}
              onChange={(e) => handleChange("parkfront", e.target.value)}
              disabled={!selectedProjectId}
            >
              <option value="">Select Park Front</option>
              {(plotOptions.parkFronts || []).map((p, i) => (
                <option key={i} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-white/80">
              Road Facing
            </label>

            <select
              className="h-8 w-full rounded-md border border-[#344055] bg-[#1d2533] px-2 text-xs text-white"
              value={selectedFilters.rd_facing || ""}
              onChange={(e) => handleChange("rd_facing", e.target.value)}
              disabled={!selectedProjectId}
            >
              <option value="">Select Road Facing</option>
              {(plotOptions.roadFacing || []).map((p, i) => (
                <option key={i} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-white/80">
              Possession Status
            </label>

            <select
              className="h-8 w-full rounded-md border border-[#344055] bg-[#1d2533] px-2 text-xs text-white"
              value={selectedFilters.poss_st || ""}
              onChange={(e) => handleChange("poss_st", e.target.value)}
              disabled={!selectedProjectId}
            >
              <option value="">Select Status</option>
              {(plotOptions.possessionStatus || []).map((p, i) => (
                <option key={i} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-white/80">
              Plot Status
            </label>

            <select
              className="h-8 w-full rounded-md border border-[#344055] bg-[#1d2533] px-2 text-xs text-white"
              value={selectedFilters.plotStatus || ""}
              onChange={(e) => handleChange("plotStatus", e.target.value)}
              disabled={!selectedProjectId}
            >
              <option value="">Select Plot Status</option>
              {(plotOptions.plotStatus || []).map((p, i) => (
                <option key={i} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-white/80">
              Category
            </label>

            <select
              className="h-8 w-full rounded-md border border-[#344055] bg-[#1d2533] px-2 text-xs text-white"
              value={selectedFilters.tr_cate || ""}
              onChange={(e) => handleChange("tr_cate", e.target.value)}
              disabled={!selectedProjectId}
            >
              <option value="">Select Category</option>
              {(plotOptions.categories || []).map((p, i) => (
                <option key={i} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-white/80">
              Owner Name
            </label>

            <select
              className="h-8 w-full rounded-md border border-[#344055] bg-[#1d2533] px-2 text-xs text-white"
              value={selectedFilters.tr_own || ""}
              onChange={(e) => handleChange("tr_own", e.target.value)}
              disabled={!selectedProjectId}
            >
              <option value="">Select Owner</option>
              {(plotOptions.owners || []).map((p, i) => (
                <option key={i} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-white/80">
              Site Plan
            </label>

            <select
              className="h-8 w-full rounded-md border border-[#344055] bg-[#1d2533] px-2 text-xs text-white"
              value={selectedFilters.site_plan || ""}
              onChange={(e) => handleChange("site_plan", e.target.value)}
              disabled={!selectedProjectId}
            >
              <option value="">Select Site Plan</option>
              {(plotOptions.sitePlans || []).map((p, i) => (
                <option key={i} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleApply}
              className="h-8 flex-1 rounded-md bg-[#8bd66f] text-xs font-bold text-[#111827]"
            >
              Apply
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="h-8 flex-1 rounded-md border border-[#344055] bg-[#1d2533] text-xs font-bold text-white"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
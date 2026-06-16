import { useEffect, useState } from "react";
import { Filter as FilterIcon, X } from "lucide-react";
import { getBlocks, getPlotOptionsAll, getProjects } from "../../../services/metaverseApi";

const filters = [
  { id: "project", label: "Project" },
  { id: "block", label: "Block" },
  { id: "plotNo", label: "Plot No" },
  { id: "type", label: "Type" },
  { id: "parkFront", label: "Park Front" },
  { id: "roadFacing", label: "Road Facing" },
  { id: "possessionStatus", label: "Possession Status" },
  { id: "plotStatus", label: "Plot Status" },
  { id: "sitePlan", label: "Site Plan" },
  { id: "category", label: "Category" },
  { id: "ownerName", label: "Owner Name" },
];

export default function Filter({ projectId, onClose, onApply }) {
  const [blocks, setBlocks] = useState([]);
  const [plotOptions, setPlotOptions] = useState({
    plotTypes: [],
    plotNos: [],
    areas: [],
  });

  const [selectedFilters, setSelectedFilters] = useState({});
   const [projects, setProjects] = useState([]);

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

  // ✅ FETCH DATA
  useEffect(() => {
    const load = async () => {
      try {
        // BLOCKS
        const blockRes = await getBlocks(projectId);
        setBlocks(blockRes || []);

        // PLOT OPTIONS
        const plotRes = await getPlotOptionsAll({ project_id: projectId });
        setPlotOptions(plotRes || {});
      } catch (err) {
        console.error("Filter API error:", err);
      }
    };

    load();
  }, [projectId]);

  const handleChange = (key, value) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApply = () => {
  const cleanedFilters = {
    project_id: projectId,
    block: selectedFilters.block,
    plot_no: selectedFilters.plot_no,
    type: selectedFilters.type,
    parkfront: selectedFilters.parkfront,
    rd_facing: selectedFilters.rd_facing,
    poss_st: selectedFilters.poss_st,
    canceled: selectedFilters.plotStatus,
    tr_cate: selectedFilters.tr_cate,
    tr_own: selectedFilters.tr_own,
    site_plan: selectedFilters.site_plan,
  };

  onApply?.(cleanedFilters);
};

  return (
    <div className="w-full text-white">
      {/* HEADER */}
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

      {/* BODY */}
      <div className="max-h-[410px] overflow-y-auto p-4">
        <div className="space-y-3">

          <div>
            <label className="block text-[11px] mb-1 text-white/80">
              Project Name
            </label>

            <select
              className="w-full h-8 bg-[#1d2533] border border-[#344055] rounded-md text-xs px-2"
              value={selectedFilters.project_id || ""}
              onChange={(e) => handleChange("project_id", e.target.value)}
            >
              <option value="">Select Project</option>

              {projects.map((p) => (
                <option key={p.gid || p.id} value={p.gid || p.id}>
                  {p.name}
                </option>
              ))}
            </select>
        </div>
          {/* BLOCK (FIXED) */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-white/80">
              Block
            </label>

            <select
              className="h-8 w-full rounded-md border border-[#344055] bg-[#1d2533] px-2 text-xs text-white"
              onChange={(e) => handleChange("block", e.target.value)}
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

          {/* PLOT NO */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-white/80">
              Plot No
            </label>

            <select
              className="h-8 w-full rounded-md border border-[#344055] bg-[#1d2533] px-2 text-xs text-white"
              onChange={(e) => handleChange("plot_no", e.target.value)}
            >
              <option value="">Select Plot No</option>

              {(plotOptions.plotNos || []).map((p, i) => (
                <option key={i} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* TYPE */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-white/80">
              Type
            </label>

            <select
              className="h-8 w-full rounded-md border border-[#344055] bg-[#1d2533] px-2 text-xs text-white"
              onChange={(e) => handleChange("type", e.target.value)}
            >
              <option value="">Select Type</option>

              {plotOptions.plotTypes.map((t, i) => (
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
              onChange={(e) => handleChange("parkfront", e.target.value)}
            >
              <option value="">Select Park Front</option>
              {plotOptions.parkFronts?.map((p, i) => (
                <option key={i} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-white/80">
              Road Facing
            </label>

            <select
              className="h-8 w-full rounded-md border border-[#344055] bg-[#1d2533] px-2 text-xs text-white"
              onChange={(e) => handleChange("rd_facing", e.target.value)}
            >
              <option value="">Select Road Facing</option>
              {plotOptions.roadFacing?.map((p, i) => (
                <option key={i} value={p}>{p}</option>
              ))}
            </select>
          </div>
            
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-white/80">
              Possession Status
            </label>

            <select
              className="h-8 w-full rounded-md border border-[#344055] bg-[#1d2533] px-2 text-xs text-white"
              onChange={(e) => handleChange("poss_st", e.target.value)}
            >
              <option value="">Select Status</option>
              {plotOptions.possessionStatus?.map((p, i) => (
                <option key={i} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-white/80">
              Category
            </label>

            <select
              className="h-8 w-full rounded-md border border-[#344055] bg-[#1d2533] px-2 text-xs text-white"
              onChange={(e) => handleChange("tr_cate", e.target.value)}
            >
              <option value="">Select Category</option>
              {plotOptions.categories?.map((p, i) => (
                <option key={i} value={p}>{p}</option>
              ))}
            </select>
          </div>

            <div>
            <label className="mb-1 block text-[11px] font-semibold text-white/80">
              Owner Name
            </label>

            <select
              className="h-8 w-full rounded-md border border-[#344055] bg-[#1d2533] px-2 text-xs text-white"
              onChange={(e) => handleChange("tr_own", e.target.value)}
            >
              <option value="">Select Owner</option>
              {plotOptions.owners?.map((p, i) => (
                <option key={i} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-white/80">
              Site Plan
            </label>

            <select
              className="h-8 w-full rounded-md border border-[#344055] bg-[#1d2533] px-2 text-xs text-white"
              onChange={(e) => handleChange("site_plan", e.target.value)}
            >
              <option value="">Select Site Plan</option>
              {plotOptions.sitePlans?.map((p, i) => (
                <option key={i} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* APPLY / RESET */}
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
              onClick={() => setSelectedFilters({})}
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
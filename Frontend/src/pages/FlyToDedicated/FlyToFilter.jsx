import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { getBlocks, getPlotOptionsAll, getProjects } from "../../services/metaverseApi";

export default function FlyToFilter({
  filters,
  onApply,
  onClose,
}) {
  const activeProjectId = filters?.projectId || "";

  const [projects, setProjects] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [plotOptions, setPlotOptions] = useState({
    plotTypes: [],
    plotNos: [],
  });

  const [selected, setSelected] = useState({
    projectId: activeProjectId,
    block: filters?.block || "",
    plotType: filters?.plotType || "",
    plotNo: filters?.plotNo || "",
  });

  const selectedProjectId = selected.projectId;

  // load projects
  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch(console.error);
  }, []);

  // load dependent data
  useEffect(() => {
    if (!selectedProjectId) return;

    Promise.all([
      getBlocks(selectedProjectId),
      getPlotOptionsAll({ project_id: selectedProjectId }),
    ])
      .then(([b, p]) => {
        setBlocks(b || []);
        setPlotOptions({
          plotTypes: p?.plotTypes || [],
          plotNos: p?.plotNos || [],
        });
      })
      .catch(console.error);
  }, [selectedProjectId]);

  const handleChange = (key, value) => {
    setSelected((prev) => {
      const updated = { ...prev, [key]: value };

      if (key === "projectId") {
        updated.block = "";
        updated.plotType = "";
        updated.plotNo = "";
      }

      return updated;
    });
  };

  const handleApply = () => {
    onApply?.(selected);
  };

  return (
    <div className="w-[300px] text-white">
      {/* header */}
      <div className="flex items-center justify-between border-b border-[#343c4c] px-3 py-2">
        <div className="text-xs font-bold">FILTER</div>
        <button onClick={onClose}>
          <X size={14} />
        </button>
      </div>

      <div className="p-3 space-y-3 text-xs">

        {/* PROJECT */}
        <select
          className="w-full h-8 bg-[#1d2533] border border-[#344055] rounded px-2"
          value={selected.projectId}
          onChange={(e) => handleChange("projectId", e.target.value)}
        >
          <option value="">Select Project</option>
          {projects.map((p) => (
            <option key={p.gid || p.id} value={p.gid || p.id}>
              {p.name || p.project_name}
            </option>
          ))}
        </select>

        {/* BLOCK */}
        <select
          className="w-full h-8 bg-[#1d2533] border border-[#344055] rounded px-2"
          value={selected.block}
          onChange={(e) => handleChange("block", e.target.value)}
          disabled={!selectedProjectId}
        >
          <option value="">Select Block</option>
          {blocks.map((b, i) => (
            <option key={i} value={b.block || b.name}>
              {b.block || b.name}
            </option>
          ))}
        </select>

        {/* TYPE */}
        <select
          className="w-full h-8 bg-[#1d2533] border border-[#344055] rounded px-2"
          value={selected.plotType}
          onChange={(e) => handleChange("plotType", e.target.value)}
          disabled={!selectedProjectId}
        >
          <option value="">Select Type</option>
          {plotOptions.plotTypes.map((t, i) => (
            <option key={i} value={t}>{t}</option>
          ))}
        </select>

        {/* PLOT NO */}
        <select
          className="w-full h-8 bg-[#1d2533] border border-[#344055] rounded px-2"
          value={selected.plotNo}
          onChange={(e) => handleChange("plotNo", e.target.value)}
          disabled={!selectedProjectId}
        >
          <option value="">Select Plot No</option>
          {plotOptions.plotNos.map((p, i) => (
            <option key={i} value={p}>{p}</option>
          ))}
        </select>

        {/* ACTIONS */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleApply}
            className="flex-1 h-8 bg-[#8bd66f] text-black font-bold rounded"
          >
            Apply
          </button>

          <button
            onClick={onClose}
            className="flex-1 h-8 border border-[#344055] rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
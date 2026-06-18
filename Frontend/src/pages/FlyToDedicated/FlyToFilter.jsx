import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  getBlocks,
  getPlotOptionsAll,
  getProjects,
} from "../../services/metaverseApi";

export default function FlyToFilter({ filters, onApply, onClose }) {
  const [projects, setProjects] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [plotTypes, setPlotTypes] = useState([]);
  const [plotNos, setPlotNos] = useState([]);

  const [selected, setSelected] = useState({
    projectId: filters?.projectId || "",
    block: filters?.block || "",
    plotType: filters?.plotType || "",
    plotNo: filters?.plotNo || "",
  });

  const selectedProjectId = selected.projectId;

  useEffect(() => {
    getProjects()
      .then((data) => setProjects(data || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    setSelected({
      projectId: filters?.projectId || "",
      block: filters?.block || "",
      plotType: filters?.plotType || "",
      plotNo: filters?.plotNo || "",
    });
  }, [filters?.projectId, filters?.block, filters?.plotType, filters?.plotNo]);

  useEffect(() => {
    if (!selectedProjectId) {
      setBlocks([]);
      setPlotTypes([]);
      setPlotNos([]);
      return;
    }

    getBlocks(selectedProjectId)
      .then((data) => setBlocks(data || []))
      .catch(console.error);
  }, [selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId || !selected.block) {
      setPlotTypes([]);
      setPlotNos([]);
      return;
    }

    getPlotOptionsAll({
      project_id: selectedProjectId,
      projectId: selectedProjectId,
      block: selected.block,
    })
      .then((data) => {
        setPlotTypes(data?.plotTypes || []);
        setPlotNos([]);
      })
      .catch(console.error);
  }, [selectedProjectId, selected.block]);

  useEffect(() => {
    if (!selectedProjectId || !selected.block || !selected.plotType) {
      setPlotNos([]);
      return;
    }

    getPlotOptionsAll({
      project_id: selectedProjectId,
      projectId: selectedProjectId,
      block: selected.block,
      type: selected.plotType,
      plot_type: selected.plotType,
    })
      .then((data) => setPlotNos(data?.plotNos || []))
      .catch(console.error);
  }, [selectedProjectId, selected.block, selected.plotType]);

  const handleChange = (key, value) => {
    setSelected((prev) => {
      const updated = { ...prev, [key]: value };

      if (key === "projectId") {
        updated.block = "";
        updated.plotType = "";
        updated.plotNo = "";
      }

      if (key === "block") {
        updated.plotType = "";
        updated.plotNo = "";
      }

      if (key === "plotType") {
        updated.plotNo = "";
      }

      return updated;
    });
  };

  const fieldClass =
    "h-8 w-full rounded border border-[#344055] bg-[#1d2533] px-2 text-xs text-white outline-none focus:border-[#8bd66f] disabled:cursor-not-allowed disabled:opacity-50";

  const labelClass = "mb-1 text-[11px] font-semibold text-white/80";

  return (
    <div className="w-[320px] overflow-hidden rounded-md border border-[#3a4354] bg-[#202736] text-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-[#343c4c] px-3 py-2">
        <div className="text-xs font-bold uppercase tracking-wide">
          Plot Selector
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-white/80 transition hover:bg-[#293445] hover:text-white"
        >
          <X size={14} />
        </button>
      </div>

      <div className="space-y-3 p-3 text-xs">
        <div>
          <div className={labelClass}>Select Project</div>
          <select
            className={fieldClass}
            value={selected.projectId}
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
          <div className={labelClass}>Select Block</div>
          <select
            className={fieldClass}
            value={selected.block}
            onChange={(e) => handleChange("block", e.target.value)}
            disabled={!selectedProjectId}
          >
            <option value="">Select Block</option>
            {blocks.map((b, i) => (
              <option
                key={b.gid || b.id || i}
                value={b.block || b.name || b.block_name}
              >
                {b.block || b.name || b.block_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className={labelClass}>Select Plot Type</div>
          <select
            className={fieldClass}
            value={selected.plotType}
            onChange={(e) => handleChange("plotType", e.target.value)}
            disabled={!selectedProjectId || !selected.block}
          >
            <option value="">Select Plot Type</option>
            {plotTypes.map((t, i) => (
              <option key={`${t}-${i}`} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className={labelClass}>Select Plot Number</div>
          <select
            className={fieldClass}
            value={selected.plotNo}
            onChange={(e) => handleChange("plotNo", e.target.value)}
            disabled={
              !selectedProjectId || !selected.block || !selected.plotType
            }
          >
            <option value="">Select Plot Number</option>
            {plotNos.map((p, i) => (
              <option key={`${p}-${i}`} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => onApply?.(selected)}
            className="h-8 flex-1 rounded bg-[#8bd66f] text-xs font-bold text-black transition hover:brightness-110"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-8 flex-1 rounded border border-[#344055] text-xs text-white transition hover:bg-[#293445]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  getBlocks,
  getPlotOptions,
  getProjects,
} from "../../../services/metaverseApi";

/* ---------------- utils ---------------- */
const uniqueSorted = (arr = []) =>
  [...new Set(arr.filter(Boolean))].sort((a, b) =>
    String(a).localeCompare(String(b), undefined, {
      numeric: true,
      sensitivity: "base",
    })
  );

/* ---------------- dropdown ---------------- */
function SelectBox({ value, onChange, options, placeholder, disabled }) {
  return (
    <select
      className="w-full h-8 bg-[#1d2533] border border-[#344055] rounded px-2 text-xs"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      <option value="">{placeholder}</option>
      {options.map((o, i) => (
        <option key={i} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/* ---------------- main component ---------------- */
export default function FlyToFilter({ filters, onApply, onClose }) {
  const [projects, setProjects] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [options, setOptions] = useState({
    areas: [],
    plotTypes: [],
    plotNos: [],
  });

  const [selected, setSelected] = useState({
    projectId: filters?.projectId || "",
    block: filters?.block || "",
    area: filters?.area || "",
    plotType: filters?.plotType || "",
    plotNo: filters?.plotNo || "",
  });

  /* ---------------- load projects ---------------- */
  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch(console.error);
  }, []);

  /* ---------------- load blocks ---------------- */
  useEffect(() => {
    if (!selected.projectId) {
      setBlocks([]);
      return;
    }

    getBlocks(selected.projectId)
      .then(setBlocks)
      .catch(console.error);
  }, [selected.projectId]);

  /* ---------------- load cascading options ---------------- */
  useEffect(() => {
    if (!selected.projectId) {
      setOptions({ areas: [], plotTypes: [], plotNos: [] });
      return;
    }

    getPlotOptions({
      project_id: selected.projectId,
      block: selected.block || undefined,
      plot_area: selected.area || undefined,
      type: selected.plotType || undefined,
    })
      .then((res) => {
        setOptions({
          areas: uniqueSorted(res?.areas || []),
          plotTypes: uniqueSorted(res?.plotTypes || []),
          plotNos: uniqueSorted(res?.plotNos || []),
        });
      })
      .catch(console.error);
  }, [
    selected.projectId,
    selected.block,
    selected.area,
    selected.plotType,
  ]);

  /* ---------------- handle change ---------------- */
  const handleChange = (key, value) => {
    setSelected((prev) => {
      const next = { ...prev, [key]: value };

      if (key === "projectId") {
        next.block = "";
        next.area = "";
        next.plotType = "";
        next.plotNo = "";
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

  const handleApply = () => {
    onApply?.(selected);
  };

  const handleClear = () => {
    const cleared = {
      projectId: "",
      block: "",
      area: "",
      plotType: "",
      plotNo: "",
    };
    setSelected(cleared);
    onApply?.(cleared);
  };

  /* ---------------- mapped options ---------------- */
  const projectOptions = projects.map((p) => ({
    value: String(p.gid || p.id),
    label: p.name || p.project_name,
  }));

  const blockOptions = blocks.map((b) => ({
    value: String(b.block || b.name),
    label: b.block || b.name,
  }));

  const areaOptions = options.areas.map((a) => ({
    value: a,
    label: a,
  }));

  const plotTypeOptions = options.plotTypes.map((t) => ({
    value: t,
    label: t,
  }));

  const plotNoOptions = options.plotNos.map((p) => ({
    value: p,
    label: p,
  }));

  /* ---------------- UI ---------------- */
  return (
    <div className="w-[320px] text-white bg-[#111827] rounded-md">
      {/* header */}
      <div className="flex items-center justify-between border-b border-[#343c4c] px-3 py-2">
        <div className="text-xs font-bold">FLY TO FILTER</div>
        <button onClick={onClose}>
          <X size={14} />
        </button>
      </div>

      <div className="p-3 space-y-2 text-xs">

        {/* PROJECT */}
        <SelectBox
          value={selected.projectId}
          onChange={(v) => handleChange("projectId", v)}
          options={projectOptions}
          placeholder="Select Project"
        />

        {/* BLOCK */}
        <SelectBox
          value={selected.block}
          onChange={(v) => handleChange("block", v)}
          options={blockOptions}
          placeholder="Select Block"
          disabled={!selected.projectId}
        />

        {/* AREA */}
        <SelectBox
          value={selected.area}
          onChange={(v) => handleChange("area", v)}
          options={areaOptions}
          placeholder="Select Area"
          disabled={!selected.projectId}
        />

        {/* TYPE */}
        <SelectBox
          value={selected.plotType}
          onChange={(v) => handleChange("plotType", v)}
          options={plotTypeOptions}
          placeholder="Select Plot Type"
          disabled={!selected.projectId}
        />

        {/* PLOT NO */}
        <SelectBox
          value={selected.plotNo}
          onChange={(v) => handleChange("plotNo", v)}
          options={plotNoOptions}
          placeholder="Select Plot No"
          disabled={!selected.projectId}
        />

        {/* ACTIONS */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleApply}
            className="flex-1 h-8 bg-[#8bd66f] text-black font-bold rounded hover:bg-[#7bc262]"
          >
            Apply
          </button>

          <button
            onClick={handleClear}
            className="flex-1 h-8 bg-red-500/80 text-white font-bold rounded hover:bg-red-500 transition-colors"
          >
            Clear
          </button>

          <button
            onClick={onClose}
            className="flex-1 h-8 border border-[#344055] rounded hover:bg-[#344055]/50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
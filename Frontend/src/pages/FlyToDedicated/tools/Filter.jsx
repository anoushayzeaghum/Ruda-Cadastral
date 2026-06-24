import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  getBlocks,
  getPlotOptions,
  getProjects,
} from "../../../services/metaverseApi";

/* ---------------- utils ---------------- */
const normalizeSortValue = (value) => String(value ?? "").trim();

const getFirstNumber = (value) => {
  const match = normalizeSortValue(value).match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
};

const naturalSort = (items = [], getValue = (item) => item) =>
  [...items].sort((a, b) => {
    const av = normalizeSortValue(getValue(a));
    const bv = normalizeSortValue(getValue(b));

    const an = getFirstNumber(av);
    const bn = getFirstNumber(bv);

    if (an !== null && bn !== null && an !== bn) {
      return an - bn;
    }

    if (an !== null && bn === null) return -1;
    if (an === null && bn !== null) return 1;

    return av.localeCompare(bv, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

const uniqueSorted = (arr = []) =>
  naturalSort([...new Set(arr.filter(Boolean))]);

/* ---------------- dropdown ---------------- */
function SelectBox({ value, onChange, options, placeholder, disabled }) {
  return (
    <select
      className="w-full h-8 bg-[#031a14] border border-[#0c3d2d] rounded px-2 text-xs"
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
    .then((data) =>
      setProjects(
        naturalSort(
          data,
          (p) => p.brief_name || p.name || p.project_name || p.id
        )
      )
    )
    .catch(console.error);
}, []);

  /* ---------------- load blocks ---------------- */
  useEffect(() => {
    if (!selected.projectId) {
      setBlocks([]);
      return;
    }

    getBlocks(selected.projectId)
      .then((data) =>
        setBlocks(
          naturalSort(
            data,
            (b) => b.block || b.name
          )
        )
      )
      .catch(console.error);
  }, [selected.projectId]);

  /* ---------------- load cascading options ---------------- */
/* ---------------- load cascading options ---------------- */
useEffect(() => {
  if (!selected.projectId) {
    setOptions({ areas: [], plotTypes: [], plotNos: [] });
    return;
  }

  const loadOptions = async () => {
    try {
      // Plot Type depends on Project + Block
      const plotTypeRes = await getPlotOptions({
        project_id: selected.projectId,
        block: selected.block || undefined,
      });

      // Area depends on Project + Block + Plot Type
      const areaRes = await getPlotOptions({
        project_id: selected.projectId,
        block: selected.block || undefined,
        type: selected.plotType || undefined,
      });

      // Plot No depends on Project + Block + Plot Type + Area
      const plotNoRes = await getPlotOptions({
        project_id: selected.projectId,
        block: selected.block || undefined,
        type: selected.plotType || undefined,
        plot_area: selected.area || undefined,
      });

      setOptions({
        plotTypes: uniqueSorted(plotTypeRes?.plotTypes || []),
        areas: uniqueSorted(areaRes?.areas || []),
        plotNos: uniqueSorted(plotNoRes?.plotNos || []),
      });
    } catch (err) {
      console.error(err);
      setOptions({
        areas: [],
        plotTypes: [],
        plotNos: [],
      });
    }
  };

  loadOptions();
}, [
  selected.projectId,
  selected.block,
  selected.plotType,
  selected.area,
]);

  /* ---------------- handle change ---------------- */
const handleChange = (key, value) => {
  setSelected((prev) => {
    const next = { ...prev, [key]: value };

    if (key === "projectId") {
      next.block = "";
      next.plotType = "";
      next.area = "";
      next.plotNo = "";
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
const projectOptions = naturalSort(
  projects.map((p) => ({
    value: String(p.gid || p.id),
    label: p.brief_name || p.name || p.project_name,
  })),
  (p) => p.label
);

const blockOptions = naturalSort(
  blocks.map((b) => ({
    value: String(b.block || b.name),
    label: b.block || b.name,
  })),
  (b) => b.label
);

const plotTypeOptions = naturalSort(
  options.plotTypes.map((t) => ({
    value: t,
    label: t,
  })),
  (t) => t.label
);

const areaToMarla = (value) => {
  const text = String(value || "").toLowerCase().trim();

  const number = parseFloat(text.match(/[\d.]+/)?.[0] || 0);

  if (text.includes("acre")) return number * 160;
  if (text.includes("kanal")) return number * 20;
  if (text.includes("marla")) return number;

  return number;
};

const areaOptions = options.areas
  .map((a) => ({
    value: a,
    label: a,
  }))
  .sort((a, b) => areaToMarla(a.label) - areaToMarla(b.label));

const plotNoOptions = naturalSort(
  options.plotNos.map((p) => ({
    value: p,
    label: p,
  })),
  (p) => p.label
);

  /* ---------------- UI ---------------- */
  return (
    <div className="w-[320px] text-white bg-[#06291f] border border-[#13593f] rounded-md">
      {/* header */}
      <div className="flex items-center justify-between border-b border-[#0c3d2d] px-3 py-2">
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

        {/* TYPE */}
        <SelectBox
          value={selected.plotType}
          onChange={(v) => handleChange("plotType", v)}
          options={plotTypeOptions}
          placeholder="Select Plot Type"
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
            className="flex-1 h-8 bg-[#9be37b] text-black font-bold rounded hover:bg-[#7bc262]"
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
            className="flex-1 h-8 border border-[#0c3d2d] rounded hover:bg-[#0c3d2d]/50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
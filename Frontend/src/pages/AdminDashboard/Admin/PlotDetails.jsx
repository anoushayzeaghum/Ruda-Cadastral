import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { ArrowRightLeft, History, Printer, RefreshCcw, Search } from "lucide-react";
import AdminPage from "../dashboard/AdminPage";
import PlotMapPreview from "./PlotMapPreview";
import {
  getBlocks,
  getPlotOptions,
  getPlotsGeoJSON,
  getProjects,
} from "../../../services/metaverseApi";

const EMPTY_FC = { type: "FeatureCollection", features: [] };
const dash = (v) => (v === undefined || v === null || v === "" ? "—" : String(v));
const option = (value, label = value, raw = null) => ({ value, label: String(label ?? value), raw });

const selectStyles = {
  control: (base, state) => ({ ...base, minHeight: 42, borderRadius: 9, borderColor: state.isFocused ? "#0B7A3B" : "#e2e8f0", boxShadow: state.isFocused ? "0 0 0 1px #0B7A3B" : "none", fontSize: 12 }),
  valueContainer: (base) => ({ ...base, padding: "0 10px" }),
  indicatorSeparator: () => ({ display: "none" }),
  menu: (base) => ({ ...base, zIndex: 50, fontSize: 12 }),
};

function Field({ label, children }) {
  return <label className="block min-w-0"><span className="mb-1.5 block text-[10px] font-semibold text-slate-500">{label}</span>{children}</label>;
}

function DetailRow({ label, value }) {
  return <div className="flex items-start justify-between gap-4 py-1.5 text-[11px]"><span className="text-slate-400">{label}</span><span className="max-w-[60%] break-words text-right font-semibold text-slate-700 dark:text-slate-100">{dash(value)}</span></div>;
}

export default function PlotDetails() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [plotTypes, setPlotTypes] = useState([]);
  const [plotNos, setPlotNos] = useState([]);
  const [project, setProject] = useState(null);
  const [block, setBlock] = useState(null);
  const [plotType, setPlotType] = useState(null);
  const [plotNo, setPlotNo] = useState(null);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [contextGeojson, setContextGeojson] = useState(EMPTY_FC);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getProjects().then((rows) => setProjects(rows.map((p) => option(p.gid ?? p.id ?? p.project_id, p.name ?? p.brief_name ?? p.type, p)))).catch(() => setError("Could not load projects."));
  }, []);

  useEffect(() => {
    setBlock(null); setPlotType(null); setPlotNo(null); setSelectedPlot(null); setBlocks([]); setPlotTypes([]); setPlotNos([]); setContextGeojson(EMPTY_FC);
    if (!project?.value) return;
    getBlocks(project.value).then((rows) => setBlocks(rows.map((b) => option(b.gid ?? b.block_id ?? b.id, b.block ?? b.name, b)))).catch(() => setError("Could not load blocks."));
  }, [project?.value]);

  useEffect(() => {
    setPlotType(null); setPlotNo(null); setSelectedPlot(null); setPlotTypes([]); setPlotNos([]);
    if (!project?.value) return;
    getPlotOptions({ project_id: project.value, block_id: block?.value || undefined, block: block?.label || undefined })
      .then((r) => setPlotTypes([...(new Set(r?.plotTypes || []))].sort().map((x) => option(x))))
      .catch(() => setError("Could not load plot types."));
  }, [project?.value, block?.value]);

  useEffect(() => {
    setPlotNo(null); setSelectedPlot(null); setPlotNos([]);
    if (!project?.value || !plotType?.value) return;
    getPlotOptions({ project_id: project.value, block_id: block?.value || undefined, block: block?.label || undefined, type: plotType.value })
      .then((r) => setPlotNos([...(new Set(r?.plotNos || []))].sort((a,b) => String(a).localeCompare(String(b), undefined, { numeric:true })).map((x) => option(x))))
      .catch(() => setError("Could not load plot numbers."));
  }, [project?.value, block?.value, plotType?.value]);

  const search = async () => {
    if (!project?.value || !plotNo?.value) return;
    setLoading(true); setError("");
    try {
      const base = { project_id: project.value, block_id: block?.value || undefined, block: block?.label || undefined };
      const [context, result] = await Promise.all([
        getPlotsGeoJSON(base),
        getPlotsGeoJSON({ ...base, type: plotType?.value || undefined, plot_no: plotNo.value }),
      ]);
      setContextGeojson(context || EMPTY_FC);
      const exact = (result?.features || []).find((f) => String(f?.properties?.plot_no) === String(plotNo.value)) || result?.features?.[0] || null;
      setSelectedPlot(exact);
      if (!exact) setError("No plot record was found for the selected filters.");
    } catch (e) {
      console.error(e); setSelectedPlot(null); setError("Unable to load the selected plot from the backend.");
    } finally { setLoading(false); }
  };

  const reset = () => { setProject(null); setBlock(null); setPlotType(null); setPlotNo(null); setSelectedPlot(null); setContextGeojson(EMPTY_FC); setError(""); };
  const p = selectedPlot?.properties || {};

  const landUse = useMemo(() => {
    const counts = new Map();
    for (const f of contextGeojson?.features || []) { const name = f?.properties?.type || "Other"; counts.set(name, (counts.get(name) || 0) + 1); }
    const total = [...counts.values()].reduce((a,b) => a+b, 0);
    return [...counts.entries()].map(([label,count]) => ({ label, count, pct: total ? Math.round(count * 100 / total) : 0 })).sort((a,b) => b.count-a.count);
  }, [contextGeojson]);

  const status = String(p.canceled || "").toLowerCase() === "yes" ? "Canceled" : (p.tr_own ? "Allotted" : "Available");

  return (
    <AdminPage>
      <div className="mx-auto max-w-[1680px] p-3 md:p-5">
        <div className="mb-4"><h1 className="text-2xl font-black text-[#10203a] dark:text-white">Plot Explorer</h1><p className="text-xs text-slate-500">Find a plot, inspect its location and review its backend record.</p></div>

        <section className="mb-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0d1b15]">
          <h2 className="mb-3 text-sm font-extrabold text-[#10203a] dark:text-white">Find a Plot</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.35fr_1fr_1fr_1fr_auto_auto] xl:items-end">
            <Field label="Project"><Select styles={selectStyles} options={projects} value={project} onChange={setProject} placeholder="Select project" isSearchable /></Field>
            <Field label="Block"><Select styles={selectStyles} options={blocks} value={block} onChange={setBlock} placeholder="Select block" isDisabled={!project} isSearchable /></Field>
            <Field label="Plot Type"><Select styles={selectStyles} options={plotTypes} value={plotType} onChange={setPlotType} placeholder="Select type" isDisabled={!project} isSearchable /></Field>
            <Field label="Plot Number"><Select styles={selectStyles} options={plotNos} value={plotNo} onChange={setPlotNo} placeholder="Select plot" isDisabled={!plotType} isSearchable /></Field>
            <button onClick={search} disabled={!project || !plotNo || loading} className="flex h-[42px] items-center justify-center gap-2 rounded-lg bg-[#0B7A3B] px-5 text-xs font-bold text-white hover:bg-[#086532] disabled:opacity-50"><Search size={15}/>{loading ? "Loading..." : "Search"}</button>
            <button onClick={reset} className="flex h-[42px] items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-xs font-bold text-slate-600 dark:border-white/10 dark:text-white"><RefreshCcw size={14}/>Reset</button>
          </div>
          {error && <p className="mt-2 text-xs font-medium text-rose-600">{error}</p>}
        </section>

        <div className="grid gap-3 xl:grid-cols-[1.7fr_0.9fr]">
          <div className="space-y-3">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0d1b15]">
              <div className="mb-3 flex items-center gap-2"><h2 className="text-sm font-extrabold text-[#10203a] dark:text-white">Plot Location</h2>{project && <span className="text-[10px] text-slate-400">{project.label}{block ? ` · ${block.label}` : ""}</span>}</div>
              <div className="h-[520px] overflow-hidden rounded-xl"><PlotMapPreview contextGeojson={contextGeojson} selectedPlot={selectedPlot} /></div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0d1b15]">
              <h3 className="text-sm font-extrabold text-[#10203a] dark:text-white">Land Use in {block?.label || "Selected Area"}</h3>
              <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-slate-100">{landUse.map((x,i) => <div key={x.label} style={{width:`${x.pct}%`, backgroundColor:["#f59e0b","#38bdf8","#22c55e","#fde047","#94a3b8"][i%5]}} title={`${x.label}: ${x.pct}%`} />)}</div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[10px]">{landUse.length ? landUse.map((x) => <span key={x.label} className="text-slate-500"><b className="text-slate-700 dark:text-white">{x.label}</b> {x.pct}% ({x.count})</span>) : <span className="text-slate-400">Search a plot to load actual land-use records.</span>}</div>
            </section>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0d1b15]">
            {!selectedPlot ? <div className="flex min-h-[420px] items-center justify-center text-center text-xs text-slate-400">Select Project → Block → Plot Type → Plot Number and click Search.</div> : <>
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-white/10"><div><div className="flex items-center gap-2"><h2 className="text-xl font-black text-[#10203a] dark:text-white">Plot {dash(p.plot_no)}</h2><span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700">{status}</span></div><p className="mt-1 text-[10px] text-slate-400">{dash(p.type)} · {project?.label || dash(p.project)} · {block?.label || dash(p.block)}</p></div></div>

              <div className="grid grid-cols-2 gap-3 border-b border-slate-100 py-4 dark:border-white/10"><div><div className="text-lg font-black text-[#10203a] dark:text-white">{dash(p.plot_area)}</div><div className="text-[10px] text-slate-400">Plot Area</div></div><div className="border-l border-slate-100 pl-4 dark:border-white/10"><div className="text-lg font-black text-[#10203a] dark:text-white">{dash(p.dimension)}</div><div className="text-[10px] text-slate-400">Dimensions</div></div></div>

              <div className="border-b border-slate-100 py-4 dark:border-white/10"><h3 className="mb-2 text-xs font-extrabold">Plot Details</h3><DetailRow label="Plot Number" value={p.plot_no}/><DetailRow label="Plot Type / Landuse" value={p.type}/><DetailRow label="Road Width" value={p.rd_ft}/><DetailRow label="Storeys" value={p.storey}/><DetailRow label="Road Facing" value={p.rd_facing}/><DetailRow label="Park Front" value={p.parkfront}/><DetailRow label="Demarcation" value={p.demar}/><DetailRow label="Possession" value={p.possession}/><DetailRow label="Possession Status" value={p.poss_st}/><DetailRow label="Site Plan" value={p.site_plan}/><DetailRow label="Unique ID" value={p.unique_id}/><DetailRow label="Remarks" value={p.remarks}/></div>

              <div className="py-4"><h3 className="mb-2 text-xs font-extrabold">Ownership / Transfer</h3><DetailRow label="Owner" value={p.tr_own || "Not Assigned"}/><DetailRow label="Transfer Plot No." value={p.tr_p_no}/><DetailRow label="Transfer Category" value={p.tr_cate}/><DetailRow label="Transfer Serial No." value={p.tr_srno}/><DetailRow label="Canceled" value={p.canceled}/></div>

              <button onClick={() => navigate("/plot-management/transfer", { state: { plot: selectedPlot } })} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0B7A3B] py-3 text-xs font-bold text-white hover:bg-[#086532]"><ArrowRightLeft size={15}/>Transfer Plot Data</button>
              <div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => window.print()} className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-xs font-semibold dark:border-white/10"><Printer size={14}/>Print</button><button className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-xs font-semibold dark:border-white/10"><History size={14}/>View History</button></div>
            </>}
          </section>
        </div>
      </div>
    </AdminPage>
  );
}

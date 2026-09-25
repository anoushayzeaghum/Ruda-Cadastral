import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, History, Printer, Search, RefreshCcw, ArrowRightLeft } from "lucide-react";
import AdminPage from "../Dashboard/AdminPage";
import PlotMapPreview from "./PlotMapPreview";

const Field = ({ label, value, children }) => (
  <label className="block min-w-0">
    <span className="mb-1 block text-[9px] font-semibold text-slate-500">{label}</span>
    {children || <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-white">{value}</div>}
  </label>
);

export default function PlotDetails() {
  const navigate = useNavigate();
  const [plotNo, setPlotNo] = useState("128");

  return (
    <AdminPage>
      <div className="mx-auto max-w-[1680px] p-3 md:p-5">
        <div className="mb-3">
          <h1 className="text-xl font-black text-[#10203a] dark:text-white md:text-2xl">Plot Details</h1>
          <p className="text-xs text-slate-500">Search a plot and review its spatial and administrative information.</p>
        </div>

        <section className="mb-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0d1b15]">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[1.2fr_1.15fr_1.25fr_1fr_1fr_1fr_auto_auto] xl:items-end">
            <Field label="Phase"><select className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-white/10 dark:bg-white/5"><option>Chahar Bagh Phase-I</option></select></Field>
            <Field label="Project Type"><select className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-white/10 dark:bg-white/5"><option>All Types</option><option>RUDA</option></select></Field>
            <Field label="Project"><select className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-white/10 dark:bg-white/5"><option>Chahar Bagh</option></select></Field>
            <Field label="Block"><select className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-white/10 dark:bg-white/5"><option>Block-A</option></select></Field>
            <Field label="Plot Type"><select className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-white/10 dark:bg-white/5"><option>All Types</option><option>Residential</option></select></Field>
            <Field label="Plot Number"><select value={plotNo} onChange={(e) => setPlotNo(e.target.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-white/10 dark:bg-white/5"><option>128</option><option>129</option><option>130</option></select></Field>
            <button className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0B7A3B] px-5 text-xs font-bold text-white hover:bg-[#086532]"><Search size={15}/> Search</button>
            <button className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-xs font-bold text-slate-600 dark:border-white/10 dark:text-white"><RefreshCcw size={14}/> Reset</button>
          </div>
        </section>

        <div className="grid gap-3 xl:grid-cols-[1.45fr_1fr]">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-[#0d1b15]">
            <div className="h-[610px]"><PlotMapPreview selectedPlot={plotNo} /></div>
          </section>

          <div className="space-y-3">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0d1b15]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-black text-[#10203a] dark:text-white">Plot Information</h2>
                  <p className="text-[10px] text-slate-400">Selected plot record</p>
                </div>
                <button onClick={() => navigate("/plot-management/transfer")} className="flex items-center justify-center gap-2 rounded-lg bg-[#0B7A3B] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#086532]"><ArrowRightLeft size={15}/> Transfer Plot Data</button>
              </div>

              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-600 dark:border-white/10 dark:text-white"><Printer size={13}/> Print</button>
                <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-600 dark:border-white/10 dark:text-white"><History size={13}/> View History</button>
                <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-600 dark:border-white/10 dark:text-white"><Download size={13}/> Export PDF</button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[['Plot No.', plotNo, 'bg-sky-50 text-sky-700'], ['Plot Type', 'Residential', 'bg-orange-50 text-orange-700'], ['Plot Area', '10 Marla', 'bg-violet-50 text-violet-700'], ['Status', 'Available', 'bg-emerald-50 text-emerald-700']].map(([label, value, tone]) => (
                  <div key={label} className={`rounded-xl p-3 ${tone}`}><div className="text-[9px] font-semibold opacity-70">{label}</div><div className="mt-1 text-sm font-black">{value}</div></div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-2 text-[11px]">
                {[
                  ["Project", "Chahar Bagh Phase-I"], ["Road Facing", "No"], ["Block", "Block-A"], ["Park Front", "No"], ["Plot No.", plotNo], ["Storey", "2"], ["Plot Type / Landuse", "Residential"], ["Status", "Available"], ["Plot Area", "10 Marla (2,722 sqft)"], ["Owner", "Not Assigned"], ["Dimensions", "35' × 65'"], ["Allotment Date", "—"], ["Road Width", "40 ft"], ["Remarks", "—"],
                ].map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[105px_1fr] gap-2 border-b border-slate-100 py-2 dark:border-white/5"><span className="text-slate-400">{label}</span><span className="font-semibold text-slate-700 dark:text-slate-200">{value}</span></div>
                ))}
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0d1b15]">
                <h3 className="text-xs font-extrabold text-[#10203a] dark:text-white">Land Use in Block-A</h3>
                <div className="mt-3 space-y-2 text-[10px]">
                  {[["Residential",90,"#f59e0b"],["Commercial",6,"#38bdf8"],["Park",3,"#22c55e"],["Masjid",1,"#fde047"]].map(([label,val,color]) => (
                    <div key={label} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{backgroundColor:color}}/><span className="flex-1 text-slate-500">{label}</span><span className="font-bold">{val}%</span></div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0d1b15]">
                <h3 className="text-xs font-extrabold text-[#10203a] dark:text-white">Nearby Features</h3>
                <div className="mt-3 space-y-2 text-[10px] text-slate-500">
                  <div className="flex justify-between"><span>Park</span><b className="text-slate-700 dark:text-white">120 m</b></div>
                  <div className="flex justify-between"><span>Masjid</span><b className="text-slate-700 dark:text-white">250 m</b></div>
                  <div className="flex justify-between"><span>Main Boulevard</span><b className="text-slate-700 dark:text-white">400 m</b></div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AdminPage>
  );
}

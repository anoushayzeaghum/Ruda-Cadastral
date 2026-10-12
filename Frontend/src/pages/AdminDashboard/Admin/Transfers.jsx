import { useNavigate } from "react-router-dom";
import { ArrowRightLeft, CheckCircle2, Clock3, FileText, Plus } from "lucide-react";
import AdminPage from "../Dashboard/AdminPage";

export default function Transfers() {
  const navigate = useNavigate();
  const requests = [];

  return (
    <AdminPage>
      <div className="mx-auto max-w-[1600px] p-3 md:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div><h1 className="text-xl font-black text-[#10203a] dark:text-white md:text-2xl">Transfers</h1><p className="text-xs text-slate-500">Manage plot transfer workflows and approvals.</p></div>
          <button onClick={() => navigate("/plot-management/transfer")} className="flex items-center gap-2 rounded-lg bg-[#0B7A3B] px-4 py-2.5 text-xs font-bold text-white"><Plus size={15}/> New Transfer</button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {[["Total Requests","0",ArrowRightLeft,"bg-sky-50 text-sky-700"],["Pending Review","0",Clock3,"bg-amber-50 text-amber-700"],["Approved","0",CheckCircle2,"bg-emerald-50 text-emerald-700"],["Documents","0",FileText,"bg-violet-50 text-violet-700"]].map(([label,value,Icon,tone])=><div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0d1b15]"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon size={18}/></span><div className="mt-3 text-xl font-black">{value}</div><div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div></div>)}
        </div>

        <section className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0d1b15]">
          <div className="flex items-center justify-between"><div><h2 className="text-sm font-extrabold text-[#10203a] dark:text-white">Transfer Requests</h2><p className="text-[10px] text-slate-400">Live requests will appear here when connected to your transfer service.</p></div></div>
          {requests.length === 0 ? <div className="mt-4 flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center dark:border-white/10 dark:bg-white/5"><ArrowRightLeft size={28} className="text-slate-300"/><div className="mt-3 text-sm font-bold text-slate-600 dark:text-slate-300">No transfer requests loaded</div><p className="mt-1 max-w-md text-[10px] text-slate-400">The UI is ready. Connect this table to your existing/new transfer API when the backend module is implemented.</p></div> : null}
        </section>
      </div>
    </AdminPage>
  );
}

import { useNavigate } from "react-router-dom";
import { Check, FileText, Map, Save, Send, UploadCloud, X } from "lucide-react";
import AdminPage from "../dashboard/AdminPage";

const Input = ({ label, required, ...props }) => (
  <label className="block min-w-0">
    <span className="mb-1 block text-[9px] font-semibold text-slate-500">{label}{required ? <span className="text-red-500"> *</span> : null}</span>
    <input {...props} className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[11px] outline-none transition focus:border-[#0B7A3B] dark:border-white/10 dark:bg-white/5" />
  </label>
);

const Section = ({ number, title, subtitle, children }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-white/10 dark:bg-[#0d1b15]">
    <div className="mb-3 flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-sm font-black text-emerald-800">{number}</span>
      <div><h2 className="text-xs font-extrabold text-[#10203a] dark:text-white">{title}</h2><p className="text-[9px] text-slate-400">{subtitle}</p></div>
    </div>
    {children}
  </section>
);

const UploadBox = ({ label, required }) => (
  <div>
    <div className="mb-1 text-[9px] font-semibold text-slate-500">{label}{required ? <span className="text-red-500"> *</span> : null}</div>
    <button className="flex h-[62px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-[9px] text-slate-500 transition hover:border-[#0B7A3B] dark:border-white/15 dark:bg-white/5">
      <UploadCloud size={16} className="mb-1 text-[#0B7A3B]" /> Click to upload or drag & drop
    </button>
  </div>
);

export default function TransferPlotData() {
  const navigate = useNavigate();

  return (
    <AdminPage>
      <div className="mx-auto max-w-[1680px] p-3 md:p-5">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-[#10203a] dark:text-white md:text-2xl">Transfer Plot Data</h1>
            <p className="text-[10px] text-slate-400">Plot Management / Plot Details / Transfer Plot Data</p>
          </div>
          <button onClick={() => navigate("/plot-management/details")} className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-600 sm:flex dark:border-white/10 dark:bg-[#0d1b15] dark:text-white"><Map size={14}/> View Plot</button>
        </div>

        <div className="grid gap-3 xl:grid-cols-[1fr_260px]">
          <div className="space-y-3">
            <section className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-white/10 dark:bg-[#0d1b15]">
              <div className="mb-3 flex items-center gap-2"><FileText size={16} className="text-[#0B7A3B]"/><h2 className="text-xs font-extrabold text-[#10203a] dark:text-white">Selected Plot</h2></div>
              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
                {[["Plot No", "128"],["Project","Chahar Bagh Phase-I"],["Block","Block-A"],["Plot Type","Residential"],["Plot Area","10 Marla"],["Current Owner","Ali Khan"]].map(([k,v]) => <div key={k}><div className="text-[8px] uppercase tracking-wide text-slate-400">{k}</div><div className="mt-1 text-[10px] font-bold text-slate-700 dark:text-white">{v}</div></div>)}
              </div>
            </section>

            <Section number="1" title="Transfer Information" subtitle="Basic details about the plot transfer request">
              <div className="grid gap-2 md:grid-cols-4">
                <label><span className="mb-1 block text-[9px] font-semibold text-slate-500">Transfer Type *</span><select className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[11px] dark:border-white/10 dark:bg-white/5"><option>Sale / Purchase</option><option>Gift</option><option>Inheritance</option></select></label>
                <Input label="Application Date" required type="date" defaultValue="2026-09-16" />
                <Input label="Effective Date" required type="date" />
                <Input label="Reference No. (Optional)" placeholder="Enter reference number" />
              </div>
            </Section>

            <Section number="2" title="Current Owner Details" subtitle="Existing owner details as per record">
              <div className="grid gap-2 md:grid-cols-4">
                <Input label="Owner Name" required defaultValue="Ali Khan" />
                <Input label="CNIC / Passport" required defaultValue="35201-1234567-1" />
                <Input label="Contact Number" defaultValue="+92 300 1234567" />
                <Input label="Email (Optional)" defaultValue="ali.khan@email.com" />
              </div>
              <div className="mt-2"><Input label="Address" required defaultValue="House No. 123, Model Town, Lahore" /></div>
            </Section>

            <Section number="3" title="New Owner Details" subtitle="Details of the new owner / buyer">
              <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
                <Input label="Owner Name" required placeholder="New owner name" />
                <Input label="CNIC / Passport" required placeholder="CNIC / Passport" />
                <Input label="Contact Number" required placeholder="+92 ..." />
                <Input label="Email (Optional)" placeholder="name@email.com" />
                <label><span className="mb-1 block text-[9px] font-semibold text-slate-500">Buyer Type *</span><select className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[11px] dark:border-white/10 dark:bg-white/5"><option>Individual Buyer</option><option>Company</option></select></label>
                <Input label="Address" required placeholder="Address" />
              </div>
            </Section>

            <Section number="4" title="Supporting Documents" subtitle="Upload required documents for the transfer process">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <UploadBox label="Current Owner CNIC" required/><UploadBox label="New Owner CNIC" required/><UploadBox label="Allotment Letter" required/><UploadBox label="Transfer Deed" required/><UploadBox label="Affidavit"/><UploadBox label="Other Documents"/>
              </div>
            </Section>

            <Section number="5" title="Review & Submission" subtitle="Additional information and declaration">
              <div className="grid gap-2 lg:grid-cols-[1fr_1.2fr_1.1fr] lg:items-end">
                <Input label="Plot Price / Consideration (PKR)" placeholder="Enter plot price" />
                <Input label="Additional Notes (Optional)" placeholder="Notes / remarks" />
                <label className="flex min-h-9 items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 text-[9px] text-emerald-800"><input type="checkbox" defaultChecked className="accent-[#0B7A3B]"/> I confirm that the provided information is accurate.</label>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <button onClick={() => navigate("/plot-management/details")} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-600 dark:border-white/10 dark:text-white"><X size={13}/> Cancel</button>
                <div className="flex flex-wrap gap-2">
                  <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-600 dark:border-white/10 dark:text-white"><Save size={13}/> Save Draft</button>
                  <button className="flex items-center gap-2 rounded-lg border border-[#0B7A3B]/25 bg-emerald-50 px-3 py-2 text-[10px] font-bold text-[#0B7A3B]"><Send size={13}/> Send for Approval</button>
                  <button className="flex items-center gap-2 rounded-lg bg-[#0B7A3B] px-4 py-2 text-[10px] font-bold text-white"><Check size={13}/> Submit Transfer</button>
                </div>
              </div>
            </Section>
          </div>

          <aside className="space-y-3">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0d1b15]">
              <h3 className="text-xs font-extrabold text-[#10203a] dark:text-white">Transfer Summary</h3>
              <div className="mt-3 space-y-2 text-[10px]">
                {[["Plot No","128"],["Project","Chahar Bagh Phase-I"],["Block","Block-A"],["Plot Type","Residential"],["Plot Area","10 Marla"],["Current Owner","Ali Khan"],["New Owner","Not entered"]].map(([k,v]) => <div key={k} className="flex gap-2 border-b border-slate-100 pb-2 dark:border-white/5"><span className="flex-1 text-slate-400">{k}</span><span className="text-right font-bold text-slate-700 dark:text-white">{v}</span></div>)}
              </div>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0d1b15]">
              <h3 className="text-xs font-extrabold text-[#10203a] dark:text-white">Process Checklist</h3>
              <div className="mt-3 space-y-2 text-[10px]">
                {["Complete transfer application","Upload required documents","Verify information","Send for approval","Department review","Final approval"].map((s,i)=><div key={s} className="flex items-center gap-2"><span className={`flex h-4 w-4 items-center justify-center rounded-full border ${i<2?"border-emerald-600 bg-emerald-600 text-white":"border-slate-300 text-transparent"}`}>{i<2?<Check size={10}/>:"·"}</span><span className="text-slate-500">{s}</span></div>)}
              </div>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0d1b15]">
              <h3 className="text-xs font-extrabold text-[#10203a] dark:text-white">Approval Workflow</h3>
              <div className="mt-3 space-y-3 text-[10px]">
                {["Application Submission","Department Review","Legal Verification","Final Approval"].map((s,i)=><div key={s} className="flex gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 font-black text-emerald-800">{i+1}</span><div><div className="font-bold text-slate-700 dark:text-white">{s}</div><div className="text-[9px] text-slate-400">Pending</div></div></div>)}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AdminPage>
  );
}

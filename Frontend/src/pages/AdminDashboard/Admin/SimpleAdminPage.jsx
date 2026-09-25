import AdminPage from "../dashboard/AdminPage";

export default function SimpleAdminPage({ title = "Administration", description = "This module is ready for your existing content." }) {
  return (
    <AdminPage>
      <div className="mx-auto max-w-[1500px] p-3 md:p-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0d1b15]">
          <h1 className="text-xl font-black text-[#10203a] dark:text-white md:text-2xl">{title}</h1>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-xs text-slate-400 dark:border-white/10 dark:bg-white/5">
            Keep your existing {title.toLowerCase()} functionality here. This placeholder only provides the redesigned RUDA admin shell.
          </div>
        </div>
      </div>
    </AdminPage>
  );
}

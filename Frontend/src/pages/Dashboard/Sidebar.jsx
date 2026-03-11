export default function Sidebar() {
  return (
    <div className="w-60 bg-slate-900 text-white flex flex-col">
      <div className="p-6 text-xl font-bold border-b border-slate-700">
        RUDA GIS
      </div>

      <nav className="flex flex-col p-4 gap-3">
        <button className="text-left px-3 py-2 rounded hover:bg-slate-700">
          Dashboard
        </button>

        <button className="text-left px-3 py-2 rounded hover:bg-slate-700">
          Map View
        </button>

        <button className="text-left px-3 py-2 rounded hover:bg-slate-700">
          Area Management
        </button>

        <button className="text-left px-3 py-2 rounded hover:bg-slate-700">
          Survey
        </button>

        <button className="text-left px-3 py-2 rounded hover:bg-slate-700">
          Reports
        </button>
      </nav>
    </div>
  );
}

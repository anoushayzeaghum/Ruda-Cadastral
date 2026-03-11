import Sidebar from "./Sidebar";
import KPISection from "./KPISection";
import MapPanel from "./MapPanel";
import ChartsPanel from "./ChartsPanel";

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <Sidebar />

      <div className="flex-1 p-8 overflow-auto">
        {/* Header */}
        {/* <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-slate-500 mt-2">
            Cadastral Management System Overview
          </p>
        </div> */}

        {/* KPI Section */}
        <KPISection />

        {/* Charts Section */}
        <div className="grid grid-cols-3 gap-6 mt-8">
          <div className="col-span-2">
            <MapPanel />
          </div>

          <ChartsPanel />
        </div>
      </div>
    </div>
  );
}

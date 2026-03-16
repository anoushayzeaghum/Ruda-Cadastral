import Sidebar from "./Sidebar";
import KPISection from "./KPISection";
import MapPanel from "./MapPanel";
import ChartsPanel from "./ChartsPanel";

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-[#0b0f14] text-white overflow-hidden">

      <Sidebar />

      <div className="flex-1 flex flex-col">

        {/* KPI SECTION */}
        <div className="px-6 pt-6">
          <KPISection />
        </div>

        {/* MAP + CHARTS */}
        <div className="flex-1 grid grid-cols-4 gap-3 p-6 pt-4">

          {/* MAP */}
          <div className="col-span-3 h-full">
            <MapPanel />
          </div>

          {/* RIGHT SIDE PANELS */}
          <div className="col-span-1 h-full">
            <ChartsPanel />
          </div>

        </div>

      </div>
    </div>
  );
}
import Sidebar from "./Sidebar";
import KPISection from "./KPISection";
import MapPanel from "./MapPanel";
import ChartsPanel from "./ChartsPanel";

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 p-6 overflow-auto">
        <KPISection />

        <div className="grid grid-cols-3 gap-6 mt-6">
          <div className="col-span-2">
            <MapPanel />
          </div>

          <ChartsPanel />
        </div>
      </div>
    </div>
  );
}

import PieChart from "./PieChart";
import BarChart from "./BarChart";

export default function ChartsPanel() {
  return (
    <div className="flex flex-col gap-3 h-full overflow-hidden">

      <div className="flex-1 min-h-0">
        <PieChart />
      </div>

      <div className="flex-1 min-h-0">
        <BarChart />
      </div>

    </div>
  );
}
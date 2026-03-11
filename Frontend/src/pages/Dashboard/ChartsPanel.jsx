import PieChart from "./PieChart";
import BarChart from "./BarChart";

export default function ChartsPanel() {
  return (
    <div className="flex flex-col gap-6">
      <BarChart />
      <PieChart />
    </div>
  );
}

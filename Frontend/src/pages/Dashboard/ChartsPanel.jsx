import PieChart from "./PieChart";
import BarChart from "./BarChart";

export default function ChartsPanel() {

  return (
    <div className="flex flex-col gap-6 h-full">

      <div className="h-[45%]">
        <PieChart />
      </div>

      <div className="h-[55%]">
        <BarChart />
      </div>

    </div>
  );
}
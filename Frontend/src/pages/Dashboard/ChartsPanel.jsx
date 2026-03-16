import PieChart from "./PieChart";
import BarChart from "./BarChart";

export default function ChartsPanel() {

  return (
    <div className="flex flex-col gap-3 h-full">

      <div className="h-[30%]">
        <PieChart />
      </div>

      <div className="h-[50%]">
        <BarChart />
      </div>

    </div>
  );
}
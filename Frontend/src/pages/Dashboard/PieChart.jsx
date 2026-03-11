import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function PieChart() {
  const data = {
    labels: ["Residential", "Commercial", "Industrial"],
    datasets: [
      {
        data: [40, 30, 30],
        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b"],
      },
    ],
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <h3 className="font-semibold mb-4">Land Use</h3>

      <Pie data={data} />
    </div>
  );
}

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement);

export default function BarChart() {
  const data = {
    labels: ["Lahore", "Sheikhupura", "Kasur", "Nankana"],
    datasets: [
      {
        label: "Surveyed Areas",
        data: [120, 90, 70, 50],
        backgroundColor: "#3b82f6",
      },
    ],
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <h3 className="font-semibold mb-4">Survey Statistics</h3>

      <Bar data={data} />
    </div>
  );
}

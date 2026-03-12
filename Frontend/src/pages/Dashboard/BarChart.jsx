import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

export default function BarChart() {

  const data = {
    labels: ["100", "200", "300", "400", "500", "600", "700", "800"],
    datasets: [
      {
        type: "bar",
        label: "Surveyed",
        data: [20, 65, 55, 50, 30, 25, 50, 70],
        backgroundColor: [
          "rgba(34,211,238,0.9)",
          "rgba(59,130,246,0.9)",
          "rgba(139,92,246,0.9)",
          "rgba(168,85,247,0.9)",
          "rgba(99,102,241,0.9)",
          "rgba(147,51,234,0.9)",
          "rgba(59,130,246,0.9)",
          "rgba(34,211,238,0.9)"
        ],
        borderRadius: 10,
        barThickness: 18,
      },
      {
        type: "line",
        label: "Trend",
        data: [25, 45, 42, 40, 18, 22, 28, 45],
        borderColor: "#facc15",
        backgroundColor: "#facc15",
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "#facc15",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#111",
        padding: 10,
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgba(255,255,255,0.05)",
        },
        ticks: {
          color: "#9ca3af",
        },
      },
      y: {
        grid: {
          color: "rgba(255,255,255,0.05)",
        },
        ticks: {
          color: "#9ca3af",
        },
      },
    },
  };

  return (
    <div className="bg-[#1f2937] rounded-2xl shadow-xl p-6 w-full max-w-3xl">

      {/* Top Stats */}
      <div className="flex justify-between mb-6">

        <div>
          <p className="text-gray-400 text-sm">Total Area Surveyed</p>
          <h2 className="text-xl font-bold text-white">8,097 Kanal</h2>
          <p className="text-green-400 text-sm">↑ 19.6% increase</p>
        </div>

        <div>
          <p className="text-gray-400 text-sm">Total Area Remaining</p>
          <h2 className="text-xl font-bold text-white">312,134 Kanal</h2>
          <p className="text-green-400 text-sm">↑ 2.5% change</p>
        </div>

      </div>

      {/* Chart */}
      <div className="h-64">
        <Bar data={data} options={options} />
      </div>

    </div>
  );
}
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function BarChart() {
  const data = {
    labels: ["2018", "2019", "2020", "2021", "2022", "2023"],
    datasets: [
      {
        label: "Verified",
        data: [45, 52, 68, 75, 82, 88],
        backgroundColor: "rgba(34, 197, 94, 0.85)",
        borderRadius: 6,
      },
      {
        label: "Pending",
        data: [30, 28, 22, 18, 14, 10],
        backgroundColor: "rgba(251, 146, 60, 0.85)",
        borderRadius: 6,
      },
      {
        label: "Not Verified",
        data: [25, 20, 10, 7, 4, 2],
        backgroundColor: "rgba(239, 68, 68, 0.85)",
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: {
          color: "#9ca3af",
          font: { size: 12 },
          boxWidth: 12,
          padding: 15,
        },
      },
    },

    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#9ca3af" },
      },
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: "rgba(255,255,255,0.05)",
        },
        ticks: { color: "#9ca3af" },
      },
    },
  };

  return (
    <div className="h-full flex flex-col p-0 rounded-xl bg-white dark:bg-gradient-to-br dark:from-gray-700 dark:to-gray-900 overflow-hidden ring-1 ring-emerald-300/30 shadow-[0_10px_24px_rgba(34,197,94,0.06)]">
      {/* TITLE */}
      <h3 className="text-g font-bold text-gray-500 dark:text-white mb-1 px-3 pt-3">
        Verification Timeline & Status
      </h3>

      {/* CHART */}
      <div className="flex-1 min-h-0 p-0">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}

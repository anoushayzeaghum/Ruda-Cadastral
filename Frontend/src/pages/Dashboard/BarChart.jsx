import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { STRUCTURE_COMPARISON } from "./dashboardData";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function BarChart() {
  const { categories, series } = STRUCTURE_COMPARISON;

  const data = {
    labels: categories,
    datasets: series.map((s) => ({
      label: s.label,
      data: s.data,
      backgroundColor: s.color,
      borderRadius: 6,
      maxBarThickness: 42,
    })),
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
        grid: {
          color: "rgba(255,255,255,0.05)",
        },
        ticks: { color: "#9ca3af" },
      },
    },
  };

  return (
    <div className="h-full flex flex-col p-0 rounded-xl bg-white dark:bg-gradient-to-br dark:from-gray-700 dark:to-gray-900 overflow-hidden ring-1 ring-[#0B7A3B]/20 shadow-sm">
      {/* TITLE */}
      <div className="px-3 pt-3">
        <h3 className="text-[15px] font-bold text-gray-800 dark:text-white">
          Platform Structure
        </h3>
        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
          RUDA Metaverse vs RTW Packages
        </p>
      </div>

      {/* CHART */}
      <div className="flex-1 min-h-0 p-2">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}

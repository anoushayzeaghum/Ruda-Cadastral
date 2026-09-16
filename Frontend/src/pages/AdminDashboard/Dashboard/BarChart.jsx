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
  const data = {
    labels: STRUCTURE_COMPARISON.categories,
    datasets: STRUCTURE_COMPARISON.series.map((s) => ({
      label: s.label,
      data: s.data,
      backgroundColor: s.color,
      borderRadius: 8,
      maxBarThickness: 32,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: { color: "#64748b", font: { size: 10 }, boxWidth: 9, padding: 12 },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#64748b", font: { size: 10 } } },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(148,163,184,.15)" },
        ticks: { color: "#94a3b8", precision: 0, font: { size: 9 } },
      },
    },
  };

  return (
    <div className="h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0d1b15]">
      <div className="mb-2">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Platform Structure</h3>
        <p className="mt-0.5 text-[10px] text-slate-400">RUDA Metaverse vs RTW Packages</p>
      </div>
      <div className="h-[calc(100%-38px)]">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}

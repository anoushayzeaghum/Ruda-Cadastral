import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";
import { LAND_USE_DATA } from "./dashboardData";

ChartJS.register(ArcElement, Tooltip);

const COLORS = ["#0B7A3B", "#45C8FF", "#70D84F", "#f5b942"];

export default function PieChart() {
  const data = {
    labels: LAND_USE_DATA.map((d) => d.label),
    datasets: [
      {
        data: LAND_USE_DATA.map((d) => d.value),
        backgroundColor: COLORS,
        borderColor: "#ffffff",
        borderWidth: 3,
        cutout: "67%",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed}%` } },
    },
  };

  return (
    <div className="h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0d1b15]">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Land Use Distribution</h3>
          <p className="mt-0.5 text-[10px] text-slate-400">Chahar Bagh Phase 1</p>
        </div>
        <span className="text-[10px] font-bold text-[#0B7A3B]">LIVE</span>
      </div>

      <div className="grid h-[calc(100%-42px)] grid-cols-[150px_1fr] items-center gap-3">
        <div className="relative h-[150px]">
          <Doughnut data={data} options={options} />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] text-slate-400">Total</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">100%</span>
            <span className="text-[9px] text-slate-400">Land Use</span>
          </div>
        </div>

        <div className="space-y-2.5">
          {LAND_USE_DATA.map((item, i) => (
            <div key={item.label} className="flex items-center gap-2 text-[11px]">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLORS[i] }} />
              <span className="flex-1 text-slate-600 dark:text-slate-300">{item.label}</span>
              <span className="font-extrabold text-slate-900 dark:text-white">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

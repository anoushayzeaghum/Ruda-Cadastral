import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";
import { LAND_USE_DATA } from "./dashboardData";

ChartJS.register(ArcElement, Tooltip);

const COLORS = ["#08753f", "#2db8df", "#64c85b", "#f3b82f"];

export default function PieChart() {
  const data = {
    labels: LAND_USE_DATA.map((d) => d.label),
    datasets: [
      {
        data: LAND_USE_DATA.map((d) => d.value),
        backgroundColor: COLORS,
        borderColor: "#ffffff",
        borderWidth: 0,
        spacing: 0,
        cutout: "68%",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    rotation: -90,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed}%` },
      },
    },
  };

  return (
    <div className="h-full rounded-[8px] border border-[#e4e8eb] bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.02)] dark:border-white/10 dark:bg-[#0d1b15]">
      <div>
        <h3 className="text-[12px] font-semibold text-[#314155] dark:text-white">Land Use</h3>
        <p className="mt-1 text-[12px] text-[#9aa6b2]">Chahar Bagh Phase 1</p>
      </div>

      <div className="mt-1 flex justify-center">
        <div className="relative h-[132px] w-[132px]">
          <Doughnut data={data} options={options} />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[20px] font-bold leading-none text-[#223044] dark:text-white">100%</span>
            <span className="mt-1 text-[9px] text-[#9aa6b2]">Total land use</span>
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {LAND_USE_DATA.map((item, i) => (
          <div key={item.label} className="grid grid-cols-[78px_1fr_34px] items-center gap-2">
            <span className="truncate text-[12px] text-[#8f99a5]">{item.label}</span>
            <div className="h-1 overflow-hidden rounded-full bg-[#eef2f4] dark:bg-white/10">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${item.value}%`,
                  backgroundColor: COLORS[i],
                }}
              />
            </div>
            <span className="text-right text-[12px] font-semibold text-[#596574] dark:text-slate-300">
              {item.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

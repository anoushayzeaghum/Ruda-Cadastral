import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";
import { LAND_USE_DATA } from "./dashboardData";

ChartJS.register(ArcElement, Tooltip);

// Brand-aligned slice colors, one per LAND_USE_DATA entry
// (Residential, Commercial, Green Spaces, Utilities)
const SLICE_COLORS = ["#0B7A3B", "#70D84F", "#4CCBFF", "#f5b942"];
const LEGEND_SWATCH = ["bg-[#0B7A3B]", "bg-[#70D84F]", "bg-[#4CCBFF]", "bg-[#f5b942]"];

export default function PieChart() {
  const data = {
    labels: LAND_USE_DATA.map((d) => d.label),
    datasets: [
      {
        data: LAND_USE_DATA.map((d) => d.value),
        backgroundColor: SLICE_COLORS,
        borderWidth: 0,
        cutout: "70%",
        circumference: 180,
        rotation: 270,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.label}: ${ctx.parsed}%`,
        },
      },
    },
  };

  return (
    <div
      className="h-full flex flex-col justify-between p-5 rounded-xl
      bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900
      border border-slate-200 dark:border-gray-600 shadow-sm"
    >
      {/* TITLE */}
      <div>
        <h3 className="text-gray-800 dark:text-white text-[15px] font-bold">
          Chahar Bagh Phase 1
        </h3>
        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
          Land use classification
        </p>
      </div>

      {/* CONTENT */}
      <div className="flex items-center justify-between flex-1 mt-2">
        {/* CHART */}
        <div className="w-[55%] h-[160px] flex items-center justify-center">
          <Doughnut data={data} options={options} />
        </div>

        {/* LEGEND */}
        <div className="flex flex-col gap-3 text-sm">
          {LAND_USE_DATA.map((item, i) => (
            <LegendItem
              key={item.label}
              color={LEGEND_SWATCH[i]}
              label={item.label}
              value={`${item.value}%`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* SMALL COMPONENT */
function LegendItem({ color, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-3 h-3 rounded-sm shrink-0 ${color}`} />
      <span className="text-gray-600 dark:text-gray-300">{label}</span>
      <span className="font-semibold text-gray-800 dark:text-white">{value}</span>
    </div>
  );
}

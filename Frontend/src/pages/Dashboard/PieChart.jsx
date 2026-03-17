import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";

ChartJS.register(ArcElement, Tooltip);

export default function PieChart() {
  const data = {
    labels: [
      "Agricultural",
      "Residential",
      "Commercial",
      "Industrial",
      "Institutional",
    ],
    datasets: [
      {
        data: [25800, 10000, 5000, 2000, 1000],
        backgroundColor: [
          "#15803d",
          "#86efac",
          "#fde047",
          "#f59e0b",
          "#3b82f6",
        ],
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
    },
  };

  return (
    <div className="h-full flex flex-col justify-between p-5 rounded-xl
    bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900
    border border-gray-600 shadow-lg">

      {/* TITLE */}
      <h3 className="text-gray-800 dark:text-white text-lg font-semibold mb-2">
        Land Use Classification
      </h3>

      {/* CONTENT */}
      <div className="flex items-center justify-between flex-1">

        {/* CHART */}
        <div className="w-[55%] h-[160px] flex items-center justify-center">
          <Doughnut data={data} options={options} />
        </div>

        {/* LEGEND */}
        <div className="flex flex-col gap-3 text-sm">

          <LegendItem color="bg-green-300" label="Residential" />
          <LegendItem color="bg-yellow-300" label="Commercial" />
          <LegendItem color="bg-orange-400" label="Industrial" />
          <LegendItem color="bg-blue-400" label="Institutional" />

        </div>
      </div>
    </div>
  );
}

/* SMALL COMPONENT */
function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-3 h-3 rounded-sm ${color}`} />
      <span className="text-gray-600 dark:text-gray-300">{label}</span>
    </div>
  );
}
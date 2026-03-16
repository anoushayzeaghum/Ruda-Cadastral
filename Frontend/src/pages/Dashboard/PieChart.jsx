import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";

ChartJS.register(ArcElement, Tooltip);

/* NEEDLE PLUGIN */
const gaugeNeedle = {
  id: "gaugeNeedle",
  afterDatasetDraw(chart) {
    const { ctx } = chart;
    const needleValue = 35;

    const data = chart.data.datasets[0].data;
    const total = data.reduce((a, b) => a + b, 0);

    const angle = Math.PI + (1 / total) * needleValue * Math.PI;

    const cx = chart.getDatasetMeta(0).data[0].x;
    const cy = chart.getDatasetMeta(0).data[0].y;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.lineTo(80, 0);
    ctx.lineTo(0, 2);
    ctx.fillStyle = "#e5e7eb";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, 2 * Math.PI);
    ctx.fillStyle = "#e5e7eb";
    ctx.fill();

    ctx.restore();
  },
};

ChartJS.register(gaugeNeedle);

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
        cutout: "65%",
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
    <div
      className="rounded-xl p-5 w-full h-full
      bg-gradient-to-br from-gray-800 to-gray-900
      border border-gray-600 shadow-lg"
    >
      {/* TITLE */}
      <h3 className="text-white text-lg font-semibold">
        Land Use Classification
      </h3>

      <div className="flex items-center">
        {/* CHART */}
        <div className="w-1/2 h-48">
          <Doughnut data={data} options={options} />
        </div>

        {/* LEGEND */}
        <div className="flex flex-col gap-3 text-sm ml-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-300 rounded-sm"></span>
            <span className="text-gray-300">Residential</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-yellow-300 rounded-sm"></span>
            <span className="text-gray-300">
              Commercial
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-orange-400 rounded-sm"></span>
            <span className="text-gray-300">
              Industrial
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-blue-400 rounded-sm"></span>
            <span className="text-gray-300">
              Institutional
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

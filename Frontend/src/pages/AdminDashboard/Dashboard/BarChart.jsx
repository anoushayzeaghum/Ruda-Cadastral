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

const valueLabels = {
  id: "valueLabels",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    ctx.save();
    ctx.fillStyle = "#607080";
    ctx.font = "500 11px sans-serif";
    ctx.textBaseline = "middle";

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      meta.data.forEach((bar, index) => {
        const value = dataset.data[index];
        ctx.fillText(String(value), bar.x + 4, bar.y);
      });
    });

    ctx.restore();
  },
};

export default function BarChart() {
  const data = {
    labels: STRUCTURE_COMPARISON.categories,
    datasets: STRUCTURE_COMPARISON.series.map((series) => ({
      label: series.label,
      data: series.data,
      backgroundColor: series.color,
      borderRadius: 2,
      borderSkipped: false,
      barThickness: 6,
      categoryPercentage: 0.7,
      barPercentage: 0.85,
    })),
  };

  const options = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: { right: 18 },
    },
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: {
          color: "#8c98a4",
          font: { size: 9, weight: "500" },
          boxWidth: 8,
          boxHeight: 8,
          padding: 10,
          usePointStyle: false,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.x}`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        suggestedMax: 25,
        grid: { color: "rgba(148,163,184,.14)", drawBorder: false },
        border: { display: false },
        ticks: {
          color: "#99a5b1",
          font: { size: 9 },
          stepSize: 5,
        },
      },
      y: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: "#8b98a5",
          font: { size: 9 },
        },
      },
    },
  };

  return (
    <div className="h-full rounded-[8px] border border-[#e4e8eb] bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.02)] dark:border-white/10 dark:bg-[#0d1b15]">
      <div>
        <h3 className="text-[12px] font-semibold text-[#314155] dark:text-white">Platform Structure</h3>
        <p className="mt-1 text-[12px] text-[#9aa6b2]">RUDA Metaverse vs RTW Packages</p>
      </div>
      <div className="mt-2 h-[calc(100%-34px)]">
        <Bar data={data} options={options} plugins={[valueLabels]} />
      </div>
    </div>
  );
}

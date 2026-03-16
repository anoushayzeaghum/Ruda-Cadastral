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
        backgroundColor: "rgba(34, 197, 94, 0.8)",
        borderColor: "rgba(22, 163, 74, 1)",
        borderWidth: 1,
        borderRadius: 6,
      },
      {
        label: "Pending",
        data: [30, 28, 22, 18, 14, 10],
        backgroundColor: "rgba(251, 146, 60, 0.8)",
        borderColor: "rgba(234, 88, 12, 1)",
        borderWidth: 1,
        borderRadius: 6,
      },
      {
        label: "Not Verified",
        data: [25, 20, 10, 7, 4, 2],
        backgroundColor: "rgba(239, 68, 68, 0.8)",
        borderColor: "rgba(220, 38, 38, 1)",
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "x",
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          color: "#9ca3af",
          font: {
            size: 12,
            weight: "500",
          },
          padding: 15,
          boxWidth: 12,
          boxHeight: 12,
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 10,
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "#374151",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        stacked: false,
        grid: {
          color: "rgba(255, 255, 255, 0.05)",
          drawBorder: false,
        },
        ticks: {
          color: "#9ca3af",
          font: {
            size: 11,
          },
        },
      },
      y: {
        stacked: false,
        grid: {
          color: "rgba(255, 255, 255, 0.05)",
          drawBorder: false,
        },
        ticks: {
          color: "#9ca3af",
          font: {
            size: 11,
          },
          beginAtZero: true,
          max: 100,
        },
      },
    },
  };

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-xl border border-gray-700/50 p-6 w-full h-full">
      {/* Title */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white">
          Verification Timeline & Status
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          Yearly verification progress trends
        </p>
      </div>

      {/* Chart */}
      <div className="h-80">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}

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
    labels: ["Lahore", "Sheikhupura", "Kasur", "Nankana"],
    datasets: [
      {
        label: "Surveyed Areas",
        data: [120, 90, 70, 50],
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(239, 68, 68, 0.8)",
        ],
        borderColor: ["#1e40af", "#047857", "#d97706", "#dc2626"],
        borderWidth: 2,
        borderRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: {
          font: { size: 12, weight: "500" },
          padding: 15,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
      <h3 className="font-bold text-lg text-gray-800 mb-4">
        Survey Statistics
      </h3>
      <Bar data={data} options={options} />
    </div>
  );
}

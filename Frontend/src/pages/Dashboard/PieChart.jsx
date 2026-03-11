import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function PieChart() {
  const data = {
    labels: ["Residential", "Commercial", "Industrial"],
    datasets: [
      {
        data: [40, 30, 30],
        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b"],
        borderColor: ["#1e40af", "#047857", "#d97706"],
        borderWidth: 2,
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
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
      <h3 className="font-bold text-lg text-gray-800 mb-4">Land Use</h3>
      <Pie data={data} options={options} />
    </div>
  );
}

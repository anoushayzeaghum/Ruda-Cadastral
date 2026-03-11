export default function KPISection() {
  const kpis = [
    {
      title: "Total Divisions",
      value: 9,
      color: "bg-red-100",
    },
    {
      title: "Total Districts",
      value: 36,
      color: "bg-yellow-100",
    },
    {
      title: "Total Tehsils",
      value: 148,
      color: "bg-green-100",
    },
    {
      title: "Total Mouzas",
      value: "55,000",
      color: "bg-blue-100",
    },
    {
      title: "Total Khasras",
      value: "750,000",
      color: "bg-purple-100",
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-6">
      {kpis.map((kpi, index) => (
        <div
          key={index}
          className={`${kpi.color} rounded-2xl shadow-md p-6 flex flex-col items-center justify-center`}
        >
          {/* Number */}
          <div className="text-3xl font-bold text-gray-800">{kpi.value}</div>

          {/* Title */}
          <p className="mt-2 text-gray-600 font-medium text-center">
            {kpi.title}
          </p>
        </div>
      ))}
    </div>
  );
}

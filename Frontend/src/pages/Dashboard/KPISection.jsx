export default function KPISection() {
  const kpis = [
    { title: "Total Divisions", value: 9, gradient: "from-blue-500 to-blue-600", icon: "📍" },
    { title: "Total Districts", value: 36, gradient: "from-green-500 to-green-600", icon: "🗺️" },
    { title: "Total Tehsils", value: 148, gradient: "from-purple-500 to-purple-600", icon: "📊" },
    { title: "Total Mouzas", value: "55k", gradient: "from-orange-500 to-orange-600", icon: "📋" },
  ];

  return (
    <div className="grid grid-cols-4 gap-6">
      {kpis.map((kpi, index) => (
        <div
          key={index}
          className={`bg-gradient-to-br ${kpi.gradient} rounded-xl shadow-lg p-6 text-white border border-white/20 hover:shadow-2xl transition-shadow duration-300`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-4xl font-bold">{kpi.value}</p>
              <p className="text-blue-50 mt-2 font-medium">{kpi.title}</p>
            </div>
            <span className="text-4xl">{kpi.icon}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

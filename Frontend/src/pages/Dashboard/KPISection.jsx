export default function KPISection() {
  const kpis = [
    { title: "Total Divisions", value: 9 },
    { title: "Total Districts", value: 36 },
    { title: "Total Tehsils", value: 148 },
    { title: "Total Mouzas", value: "55k" },
  ];

  return (
    <div className="grid grid-cols-4 gap-6">
      {kpis.map((kpi, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm p-6 border">
          <h3 className="text-3xl font-bold text-gray-800">{kpi.value}</h3>

          <p className="text-gray-500 mt-1">{kpi.title}</p>
        </div>
      ))}
    </div>
  );
}

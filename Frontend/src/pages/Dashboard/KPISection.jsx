import { Map, MapPin, Layers, Grid3X3, SquareDashed } from "lucide-react";

export default function KPISection() {
  const kpis = [
    {
      title: "Total Divisions",
      value: 9,
      icon: Map,
      accent: "border-l-red-500",
      bg: "bg-gradient-to-br from-white via-white to-red-50",
      blob: "bg-red-500/10",
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
    },
    {
      title: "Total Districts",
      value: 36,
      icon: MapPin,
      accent: "border-l-yellow-500",
      bg: "bg-gradient-to-br from-white via-white to-yellow-50",
      blob: "bg-yellow-500/10",
      iconBg: "bg-yellow-50",
      iconColor: "text-yellow-600",
    },
    {
      title: "Total Tehsils",
      value: 148,
      icon: Layers,
      accent: "border-l-green-500",
      bg: "bg-gradient-to-br from-white via-white to-green-50",
      blob: "bg-green-500/10",
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      title: "Total Mouzas",
      value: "55,000",
      icon: Grid3X3,
      accent: "border-l-blue-500",
      bg: "bg-gradient-to-br from-white via-white to-blue-50",
      blob: "bg-blue-500/10",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Total Khasras",
      value: "750,000",
      icon: SquareDashed,
      accent: "border-l-purple-500",
      bg: "bg-gradient-to-br from-white via-white to-purple-50",
      blob: "bg-purple-500/10",
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;

        return (
          <div
            key={index}
            className={`relative overflow-hidden rounded-2xl border border-gray-200 shadow-sm transition-all hover:shadow-lg border-l-4 ${kpi.accent} ${kpi.bg}`}
          >
            {/* Background glow */}
            <div
              className={`absolute top-0 right-0 h-28 w-28 rounded-full blur-2xl -mr-12 -mt-12 ${kpi.blob}`}
            />

            <div className="p-4 flex flex-col gap-2 relative">
              <div className="flex items-center justify-between">
                <p className="text-s text-gray-500 font-medium">{kpi.title}</p>

                <div
                  className={`h-8 w-8 rounded-lg flex items-center justify-center ${kpi.iconBg}`}
                >
                  <Icon className={`h-4 w-4 ${kpi.iconColor}`} />
                </div>
              </div>

              <div className="text-2xl font-bold text-gray-800">
                {kpi.value}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

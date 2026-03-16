import { Map, MapPin, Layers, Grid3X3, SquareDashed } from "lucide-react";

export default function KPISection() {
  const kpis = [
    {
      title: "Total Divisions",
      value: 9,
      icon: Map,
      accent: "border-l-green-600",
      bg: "bg-gradient-to-br from-white via-white to-green-50",
      blob: "bg-green-500/10",
      iconBg: "bg-green-50",
      iconColor: "text-green-700",
    },
    {
      title: "Total Districts",
      value: 36,
      icon: MapPin,
      accent: "border-l-green-700",
      bg: "bg-gradient-to-br from-white via-white to-emerald-50",
      blob: "bg-emerald-500/10",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-700",
    },
    {
      title: "Total Tehsils",
      value: 148,
      icon: Layers,
      accent: "border-l-green-800",
      bg: "bg-gradient-to-br from-white via-white to-teal-50",
      blob: "bg-teal-500/10",
      iconBg: "bg-teal-50",
      iconColor: "text-teal-700",
    },
    {
      title: "Total Mouzas",
      value: "55,000",
      icon: Grid3X3,
      accent: "border-l-lime-600",
      bg: "bg-gradient-to-br from-white via-white to-lime-50",
      blob: "bg-lime-500/10",
      iconBg: "bg-lime-50",
      iconColor: "text-lime-700",
    },
    {
      title: "Total Khasras",
      value: "750,000",
      icon: SquareDashed,
      accent: "border-l-slate-600",
      bg: "bg-gradient-to-br from-white via-white to-slate-50",
      blob: "bg-slate-500/10",
      iconBg: "bg-slate-50",
      iconColor: "text-slate-700",
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

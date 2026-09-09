import { createElement, useEffect, useState } from "react";
import {
  Blocks,
  Grid2X2,
  LandPlot,
  MapPinned,
  Ruler,
  SquareStack,
} from "lucide-react";
import {
  getAcres,
  getDistricts,
  getKhasras,
  getMauzas,
  getSquares,
  getTehsils,
} from "../../services/api";

const countRecords = (data) => {
  if (Array.isArray(data)) return data.length;
  if (Array.isArray(data?.features)) return data.features.length;
  return 0;
};

const metrics = [
  { key: "districts", label: "Districts", icon: MapPinned, accent: "text-emerald-300 bg-emerald-400/15" },
  { key: "tehsils", label: "Tehsils", icon: Grid2X2, accent: "text-sky-300 bg-sky-400/15" },
  { key: "mauzas", label: "Mauzas", icon: Blocks, accent: "text-amber-300 bg-amber-400/15" },
  { key: "khasras", label: "Khasras", icon: SquareStack, accent: "text-violet-300 bg-violet-400/15" },
  { key: "squares", label: "Squares", icon: LandPlot, accent: "text-rose-300 bg-rose-400/15" },
  { key: "acres", label: "Acres", icon: Ruler, accent: "text-teal-300 bg-teal-400/15" },
];

function KpiCard({ icon, label, value, accent }) {
  return (
    <div
      className="min-w-0 rounded-lg border border-white/20 border-l-[#61d7a3] bg-[#06291f] px-2.5 py-4 shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
      style={{ opacity: 1 }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-normal uppercase tracking-[0.16em] text-white/65">
            {label}
          </p>
          <p className="mt-1 text-[12px] font-normal leading-none text-white">
            {value}
          </p>
        </div>
        <span className={`shrink-0 rounded-md p-1.5 ${accent}`}>
          {createElement(icon, { size: 15, strokeWidth: 2.2 })}
        </span>
      </div>
    </div>
  );
}

const selectedValues = (value) =>
  Array.isArray(value) ? value.filter(Boolean).map(String) : value ? [String(value)] : [];

const countFromRequests = async (loader, ids) => {
  const responses = await Promise.all(ids.map((id) => loader(id)));
  return responses.reduce((total, response) => total + countRecords(response), 0);
};

export default function MapviewKpiCards({ filters, selectedMauzaIds = [] }) {
  const [counts, setCounts] = useState({});

  useEffect(() => {
    let cancelled = false;

    const extractIds = (data) => {
      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.features)
          ? data.features
          : [];
      return items
        .map(
          (item) =>
            item?.id ??
            item?.gid ??
            item?.tehsil_id ??
            item?.mauza_id ??
            item?.properties?.id ??
            item?.properties?.gid,
        )
        .filter((v) => v !== undefined && v !== null && v !== "")
        .map(String);
    };

    const run = async () => {
      try {
        const districtIds = selectedValues(filters?.selectedDistrict);
        const tehsilIdsSelected = selectedValues(filters?.selectedTehsil);
        const mauzaIdsSelected = selectedMauzaIds.filter(Boolean); // ← real IDs now

        const districtsCount = districtIds.length
          ? districtIds.length
          : await getDistricts().then(countRecords);

        let tehsilIds = tehsilIdsSelected;
        let tehsilsCount;
        if (tehsilIdsSelected.length) {
          tehsilsCount = tehsilIdsSelected.length;
        } else if (districtIds.length) {
          const results = await Promise.all(districtIds.map((id) => getTehsils(id)));
          tehsilIds = results.flatMap(extractIds);
          tehsilsCount = results.reduce((t, r) => t + countRecords(r), 0);
        } else {
          tehsilsCount = await getTehsils().then(countRecords);
        }

        let mauzaIds = mauzaIdsSelected;
        let mauzasCount;
        if (mauzaIdsSelected.length) {
          mauzasCount = mauzaIdsSelected.length;
        } else if (tehsilIds.length) {
          const results = await Promise.all(tehsilIds.map((id) => getMauzas(id)));
          mauzaIds = results.flatMap(extractIds);
          mauzasCount = results.reduce((t, r) => t + countRecords(r), 0);
        } else {
          mauzasCount = await getMauzas().then(countRecords);
        }

        let khasrasCount, squaresCount, acresCount;
        if (mauzaIds.length) {
          [khasrasCount, squaresCount, acresCount] = await Promise.all([
            countFromRequests(getKhasras, mauzaIds),
            countFromRequests(getSquares, mauzaIds),
            countFromRequests(getAcres, mauzaIds),
          ]);
        } else {
          [khasrasCount, squaresCount, acresCount] = await Promise.all([
            getKhasras().then(countRecords),
            getSquares().then(countRecords),
            getAcres().then(countRecords),
          ]);
        }

        if (!cancelled) {
          setCounts({
            districts: districtsCount,
            tehsils: tehsilsCount,
            mauzas: mauzasCount,
            khasras: khasrasCount,
            squares: squaresCount,
            acres: acresCount,
          });
        }
      } catch (error) {
        console.error("MAPVIEW KPI DATA ERROR:", error);
        if (!cancelled) setCounts({});
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [filters?.selectedDistrict, filters?.selectedTehsil, selectedMauzaIds.join("|")]);



  return (
    <section className="pointer-events-none absolute bottom-3 left-[180px] right-3 z-[100] sm:bottom-4 sm:left-[210px] sm:right-4">
      <div
        className="pointer-events-auto mx-auto w-full gap-2 pb-1"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
          maxWidth: "1080px",
        }}
      >
        {metrics.map((metric) => (
          <KpiCard
            key={metric.key}
            icon={metric.icon}
            label={metric.label}
            value={counts[metric.key] ?? "-"}
            accent={metric.accent}
          />
        ))}
      </div>
    </section>
  );
}
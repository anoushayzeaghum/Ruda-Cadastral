import { createElement, useEffect, useMemo, useState } from "react";
import {
  Layers3,
  MapPinned,
  PanelsTopLeft,
  Ruler,
  SquareStack,
} from "lucide-react";
import {
  getBlocks,
  getPrecientBoundaryGeoJSON,
  getProjects,
} from "../../services/metaverseApi";

const getProjectValue = (project, keys) => {
  for (const key of keys) {
    const value = project?.[key];
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }

  return "";
};

function KpiCard({ icon, label, value, detail, accent }) {
  return (
    <div
      className="min-w-[148px] flex-1 rounded-lg border border-white/20 border-l-[#61d7a3] px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.45)] sm:min-w-0"
      style={{ backgroundColor: "#06291f", opacity: 1 }}
    >
      <div className="flex h-full items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[8px] font-bold uppercase tracking-[0.16em] text-white/65">
            {label}
          </p>
          <p className="mt-1 truncate text-base font-bold leading-none text-white">
            {value}
          </p>
          <p className="mt-1 truncate text-[8px] text-white/50">{detail}</p>
        </div>
        <span className={`shrink-0 rounded-md p-1.5 ${accent}`}>
          {createElement(icon, { size: 14, strokeWidth: 2.2 })}
        </span>
      </div>
    </div>
  );
}

export default function MetaverseKpiCards({
  filters,
}) {
  const [projects, setProjects] = useState([]);
  const [precinctBoundaryCount, setPrecinctBoundaryCount] = useState(null);
  const [blockCount, setBlockCount] = useState(null);
  const [projectsLoading, setProjectsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getProjects(), getPrecientBoundaryGeoJSON(), getBlocks()])
      .then(([projectData, precinctData, blockData]) => {
        if (cancelled) return;

        setProjects(Array.isArray(projectData) ? projectData : []);
        setPrecinctBoundaryCount(precinctData?.features?.length ?? 0);
        setBlockCount(Array.isArray(blockData) ? blockData.length : 0);
      })
      .catch((error) => {
        console.error("KPI DATA ERROR:", error);
        if (cancelled) return;

        setProjects([]);
        setPrecinctBoundaryCount(0);
        setBlockCount(0);
      })
      .finally(() => {
        if (!cancelled) setProjectsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const phaseCount = useMemo(() => {
    const phases = projects
      .map((project) =>
        getProjectValue(project, ["phase", "phases", "phase_name"]),
      )
      .filter(Boolean);

    return new Set(phases).size;
  }, [projects]);

  const selectedProject = projects.find(
    (project) =>
      String(project?.gid ?? project?.id ?? "") ===
      String(filters?.projectId ?? ""),
  );

  const selectedProjectName = selectedProject
    ? getProjectValue(selectedProject, ["brief_name", "name", "project_name"])
    : "No project selected";
  const projectCount = projectsLoading ? "-" : projects.length;
  const phaseValue = projectsLoading ? "-" : phaseCount;
  const precinctValue = precinctBoundaryCount === null ? "-" : precinctBoundaryCount;
  const blockValue = blockCount === null ? "-" : blockCount;

  return (
    <section className="pointer-events-none absolute bottom-3 left-3 right-3 z-[100] sm:bottom-4 sm:left-16 sm:right-4">
      <div className="pointer-events-auto mx-auto flex max-w-[1180px] gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-5 sm:overflow-visible">
        <KpiCard
          icon={MapPinned}
          label="Total phases"
          value={phaseValue}
          detail="From project records"
          accent="bg-emerald-400/15 text-emerald-300"
        />
        <KpiCard
          icon={PanelsTopLeft}
          label="Total projects"
          value={projectCount}
          detail="From backend projects"
          accent="bg-sky-400/15 text-sky-300"
        />
        <KpiCard
          icon={Layers3}
          label="Precinct boundaries"
          value={precinctValue}
          detail="From precinct boundary records"
          accent="bg-amber-400/15 text-amber-300"
        />
        <KpiCard
          icon={SquareStack}
          label="Total blocks"
          value={blockValue}
          detail="From backend block records"
          accent="bg-violet-400/15 text-violet-300"
        />
        <KpiCard
          icon={Ruler}
          label="Current project"
          value={filters?.projectId ? selectedProjectName || "Selected" : "-"}
          detail="Selected backend project"
          accent="bg-rose-400/15 text-rose-300"
        />
      </div>
    </section>
  );
}
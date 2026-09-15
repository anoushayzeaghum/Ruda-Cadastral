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
  getProjectsByPhase,
  getProjectsByPhaseAndType,
  getProjectGeoJSON,
  getRudaNotifiedPhasesBoundaryGeoJSON,
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

export default function MetaverseKpiCards({ filters }) {
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [phaseCount, setPhaseCount] = useState(null);
  const [precinctBoundaryCount, setPrecinctBoundaryCount] = useState(null);
  const [blockCount, setBlockCount] = useState(null);

  // All projects fetched once — used to derive phase/type/project counts client-side.
  useEffect(() => {
    let cancelled = false;

    getProjects()
      .then((data) => {
        if (!cancelled) setProjects(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error("KPI PROJECTS ERROR:", error);
        if (!cancelled) setProjects([]);
      })
      .finally(() => {
        if (!cancelled) setProjectsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Filtered project set, mirroring MetaverseSubHeader's filteredProjectOptions logic.
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (filters?.projectId) {
        return String(p.gid ?? p.id) === String(filters.projectId);
      }
      if (filters?.phase && p.phase !== filters.phase) return false;
      if (filters?.projectType && p.type !== filters.projectType) return false;
      return true;
    });
  }, [projects, filters?.phase, filters?.projectType, filters?.projectId]);

  // Keep this KPI aligned with Layers > Administrative > Phases Boundary,
  // rather than with the subheader's project filters.
  useEffect(() => {
    let cancelled = false;

    getRudaNotifiedPhasesBoundaryGeoJSON()
      .then((geojson) => {
        const phases = (geojson?.features || [])
          .map((feature) =>
            getProjectValue(feature?.properties, [
              "phases_new",
              "phases",
              "phase_name",
              "phase",
            ]),
          )
          .filter(Boolean);

        if (!cancelled) setPhaseCount(new Set(phases).size);
      })
      .catch((error) => {
        console.error("KPI PHASE BOUNDARY ERROR:", error);
        if (!cancelled) setPhaseCount(0);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Precinct boundary + block counts follow the same Project > Phase+Type > Phase > all cascade as the subheader's boundary loader.
  useEffect(() => {
    let cancelled = false;

    const loadCounts = async () => {
      try {
        let boundaryGeojson;
        let blocksData;

        if (filters?.projectId) {
          [boundaryGeojson, blocksData] = await Promise.all([
            getProjectGeoJSON(filters.projectId),
            getBlocks(filters.projectId),
          ]);
        } else if (filters?.phase && filters?.projectType) {
          boundaryGeojson = await getProjectsByPhaseAndType(
            filters.phase,
            filters.projectType,
          );
          blocksData = await getBlocks();
        } else if (filters?.phase) {
          boundaryGeojson = await getProjectsByPhase(filters.phase);
          blocksData = await getBlocks();
        } else {
          [boundaryGeojson, blocksData] = await Promise.all([
            getPrecientBoundaryGeoJSON(),
            getBlocks(),
          ]);
        }

        if (!cancelled) {
          setPrecinctBoundaryCount(boundaryGeojson?.features?.length ?? 0);
          setBlockCount(Array.isArray(blocksData) ? blocksData.length : 0);
        }
      } catch (error) {
        console.error("KPI DATA ERROR:", error);
        if (!cancelled) {
          setPrecinctBoundaryCount(0);
          setBlockCount(0);
        }
      }
    };

    loadCounts();

    return () => {
      cancelled = true;
    };
  }, [filters?.phase, filters?.projectType, filters?.projectId]);

  const selectedProject = projects.find(
    (project) => String(project?.gid ?? project?.id ?? "") === String(filters?.projectId ?? ""),
  );
  const selectedProjectName = selectedProject
    ? getProjectValue(selectedProject, ["brief_name", "name", "project_name"])
    : "No project selected";

  const projectCount = projectsLoading ? "-" : filteredProjects.length;
  const phaseValue = phaseCount === null ? "-" : phaseCount;
  const precinctValue = precinctBoundaryCount === null ? "-" : precinctBoundaryCount;
  const blockValue = blockCount === null ? "-" : blockCount;

  return (
    <section className="pointer-events-none absolute bottom-3 left-3 right-3 z-[100] sm:bottom-4 sm:left-16 sm:right-4">
      <div className="pointer-events-auto mx-auto flex max-w-[1180px] gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-5 sm:overflow-visible">
        <KpiCard icon={MapPinned} label="Total phases" value={phaseValue} detail="From phases boundary" accent="bg-emerald-400/15 text-emerald-300" />
        <KpiCard icon={PanelsTopLeft} label="Total projects" value={projectCount} detail="From backend projects" accent="bg-sky-400/15 text-sky-300" />
        <KpiCard icon={Layers3} label="Precinct boundaries" value={precinctValue} detail="From precinct boundary records" accent="bg-amber-400/15 text-amber-300" />
        <KpiCard icon={SquareStack} label="Total blocks" value={blockValue} detail="From backend block records" accent="bg-violet-400/15 text-violet-300" />
        <KpiCard icon={Ruler} label="Current project" value={filters?.projectId ? selectedProjectName || "Selected" : "-"} detail="Selected backend project" accent="bg-rose-400/15 text-rose-300" />
      </div>
    </section>
  );
}
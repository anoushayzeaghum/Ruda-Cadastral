import { useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { getProjects } from "../../../services/metaverseApi";

export default function FlyTo({
  filters,
  setFilters,
  setLayerVisibility,
  onClose,
}) {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(
    filters?.projectId || ""
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;

    const loadProjects = async () => {
  try {
    setLoading(true);
    const data = await getProjects();

    const sorted = (data || []).sort((a, b) => {
      const nameA = (a.name || a.project_name || "").toLowerCase();
      const nameB = (b.name || b.project_name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });

    if (!ignore) setProjects(sorted);
  } catch (error) {
    console.error("Failed to load projects for Fly To:", error);
  } finally {
    if (!ignore) setLoading(false);
  }
};

    loadProjects();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    setSelectedProjectId(filters?.projectId || "");
  }, [filters?.projectId]);

const handleFlyToProject = () => {
  if (!selectedProjectId) return;

  setFilters?.((prev) => ({
    ...prev,
    projectId: selectedProjectId,
    block: "",
    plotType: "",
    plotNo: "",
    area: "",
    flyTrigger: Date.now(), 
  }));

  // Show only boundary layer
  setLayerVisibility?.((prev) => ({
    ...prev,
    boundary: true,

    // hide everything else
    masterPlan: false,
    roads: false,
    spotLevel: false,
    contours: false,
  }));

  onClose?.();
};

  return (
    <div className="flex items-center gap-2 rounded-md border border-[#0c3d2d] bg-[#06291f] px-2 py-1.5 text-white shadow-lg">
      <div className="flex items-center gap-1 text-[12px] font-bold whitespace-nowrap">
        <Send size={15} />
        Fly to :
      </div>

      <select
        value={selectedProjectId}
        onChange={(e) => setSelectedProjectId(e.target.value)}
        className="h-7 w-[160px] rounded bg-white px-2 text-[12px] text-[#06291f] outline-none"
      >
        <option value="">Select Project</option>

        {projects.map((project) => (
          <option
            key={project.gid || project.id}
            value={project.gid || project.id}
          >
            {project.name ||
              project.project_name ||
              `Project ${project.gid || project.id}`}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={handleFlyToProject}
        disabled={!selectedProjectId || loading}
        className="flex h-7 items-center justify-center gap-1 rounded bg-white px-5 text-[12px] font-bold text-[#06291f] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? <Loader2 size={13} className="animate-spin" /> : null}
        Fly
      </button>
    </div>
  );
}
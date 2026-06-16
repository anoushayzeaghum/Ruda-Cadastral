import { useEffect, useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { getProjects } from "../../../services/metaverseApi";

export default function FlyTo({
  filters,
  setFilters,
  setLayerVisibility,
  onClose,
}) {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(
    filters?.projectId || "",
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;

    const loadProjects = async () => {
      try {
        setLoading(true);
        const data = await getProjects();
        if (!ignore) setProjects(data || []);
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

  const handleFlyToProject = () => {
    if (!selectedProjectId) return;

    setFilters((prev) => ({
      ...prev,
      projectId: selectedProjectId,
      block: "",
      plotType: "",
      plotNo: "",
      area: "",
    }));

    setLayerVisibility((prev) => ({
      ...prev,
      boundary: true,
      masterPlan: true,
      roads: true,
    }));

    onClose?.();
  };

  return (
    <div>
      <div className="flex items-center justify-between border-b border-[#343c4c] px-4 py-3 text-[12px] font-bold">
        <span>Fly To</span>
        <ChevronRight size={15} />
      </div>

      <div className="space-y-3 p-4">
        <label className="text-[11px] font-semibold text-white/70">
          Project
        </label>

        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="w-full rounded-md border border-[#3a4354] bg-[#111827] px-3 py-2 text-[12px] text-white outline-none"
        >
          <option value="">Select Project</option>
          {projects.map((project) => (
            <option key={project.gid || project.id} value={project.gid || project.id}>
              {project.name || project.project_name || `Project ${project.gid || project.id}`}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleFlyToProject}
          disabled={!selectedProjectId || loading}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-[#65c96b] px-3 py-2 text-[12px] font-bold text-[#111827] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          Fly To Project
        </button>
      </div>
    </div>
  );
}
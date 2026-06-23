import { ChevronDown } from "lucide-react";
import { getItemId, getLabel } from "./api";

export default function Society3DSubHeader({
  projects = [],
  selectedProject = "",
  loading = {},
  onProjectChange,
}) {
  const projectName =
    getLabel(
      projects.find((item) => String(getItemId(item)) === String(selectedProject)),
      ["name", "project_name", "project", "society", "title"],
      "Select",
    ) || "Select";

  return (
    <div className="absolute left-1/2 top-4 z-30 w-fit max-w-[calc(100vw-120px)] -translate-x-1/2 overflow-visible rounded-xl border border-white/40 bg-[#0f3d2e] shadow-xl backdrop-blur-md">
      <div className="flex w-fit items-center justify-center gap-2 px-2 py-2">
        <FilterCard label="Project — منصوبہ" value={loading.projects ? "Loading..." : projectName}>
          <select
            value={selectedProject}
            onChange={(event) => onProjectChange?.(event.target.value)}
            disabled={loading.projects}
            className="absolute inset-0 z-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
          >
            <option value="">-- Project --</option>
            {projects.map((project) => {
              const id = getItemId(project);

              return (
                <option key={id} value={id}>
                  {getLabel(project, ["name", "project_name", "project", "society", "title"])}
                </option>
              );
            })}
          </select>
        </FilterCard>
      </div>
    </div>
  );
}

function FilterCard({ label, value, children }) {
  return (
    <div className="relative w-[180px] overflow-visible rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 shadow-sm transition hover:border-green-600">
      <p className="text-[9px] text-gray-500">{label}</p>
      <div className="flex items-center justify-between">
        <p className="max-w-[150px] truncate text-xs font-semibold text-gray-800">
          {value}
        </p>
        <ChevronDown size={13} className="ml-2 shrink-0 text-gray-400" />
      </div>
      {children}
    </div>
  );
}

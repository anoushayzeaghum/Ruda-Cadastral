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
    <div className="absolute left-1/2 top-2 sm:top-4 z-30 w-fit -translate-x-1/2 overflow-visible rounded-lg sm:rounded-xl border border-white/40 bg-[#0f3d2e] shadow-xl backdrop-blur-md"
      style={{ maxWidth: "calc(100vw - 16px)" }}
    >
      <div className="flex w-fit items-center justify-center gap-1 sm:gap-2 px-1 sm:px-2 py-1 sm:py-2">
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
    <div className="relative overflow-visible rounded-md sm:rounded-lg border border-gray-200 bg-white px-2 sm:px-2.5 py-1 sm:py-1.5 shadow-sm transition hover:border-green-600"
      style={{ minWidth: "140px", width: "clamp(140px, 40vw, 180px)" }}
    >
      <p className="text-[8px] sm:text-[9px] text-gray-500 truncate">{label}</p>
      <div className="flex items-center justify-between gap-1">
        <p className="flex-1 min-w-0 truncate text-[10px] sm:text-xs font-semibold text-gray-800">
          {value}
        </p>
        <ChevronDown size={11} className="ml-1 sm:ml-2 shrink-0 text-gray-400 sm:w-[13px] sm:h-[13px]" />
      </div>
      {children}
    </div>
  );
}

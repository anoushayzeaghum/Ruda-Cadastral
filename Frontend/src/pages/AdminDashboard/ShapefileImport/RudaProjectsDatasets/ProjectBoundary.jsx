import ProjectDataset from "./ProjectDataset";
import { projectDatasetConfigs } from "./projectDatasetConfigs";

export default function ProjectBoundary() {
  return <ProjectDataset dataset={projectDatasetConfigs.projectBoundary} />;
}

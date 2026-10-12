import ProjectDataset from "./ProjectDataset";
import { projectDatasetConfigs } from "./projectDatasetConfigs";

export default function BlockBoundary() {
  return <ProjectDataset dataset={projectDatasetConfigs.blockBoundary} />;
}

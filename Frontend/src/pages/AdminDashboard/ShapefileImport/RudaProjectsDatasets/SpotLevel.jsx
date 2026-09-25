import ProjectDataset from "./ProjectDataset";
import { projectDatasetConfigs } from "./projectDatasetConfigs";

export default function SpotLevel() {
  return <ProjectDataset dataset={projectDatasetConfigs.spotLevel} />;
}

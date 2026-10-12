import ProjectDataset from "./ProjectDataset";
import { projectDatasetConfigs } from "./projectDatasetConfigs";

export default function SewerPoints() {
  return <ProjectDataset dataset={projectDatasetConfigs.sewerPoints} />;
}

import ProjectDataset from "./ProjectDataset";
import { projectDatasetConfigs } from "./projectDatasetConfigs";

export default function SewerLines() {
  return <ProjectDataset dataset={projectDatasetConfigs.sewerLines} />;
}

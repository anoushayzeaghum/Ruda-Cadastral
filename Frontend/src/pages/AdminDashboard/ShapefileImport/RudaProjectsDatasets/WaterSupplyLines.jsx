import ProjectDataset from "./ProjectDataset";
import { projectDatasetConfigs } from "./projectDatasetConfigs";

export default function WaterSupplyLines() {
  return <ProjectDataset dataset={projectDatasetConfigs.waterSupplyLines} />;
}

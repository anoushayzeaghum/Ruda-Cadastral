import ProjectDataset from "./ProjectDataset";
import { projectDatasetConfigs } from "./projectDatasetConfigs";

export default function WaterSupplyPoints() {
  return <ProjectDataset dataset={projectDatasetConfigs.waterSupplyPoints} />;
}

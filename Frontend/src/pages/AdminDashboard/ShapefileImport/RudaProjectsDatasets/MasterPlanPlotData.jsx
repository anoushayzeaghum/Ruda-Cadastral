import ProjectDataset from "./ProjectDataset";
import { projectDatasetConfigs } from "./projectDatasetConfigs";

export default function MasterPlanPlotData() {
  return <ProjectDataset dataset={projectDatasetConfigs.masterplanPlotData} />;
}

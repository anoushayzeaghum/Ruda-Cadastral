import AdministrativeBoundaries from "./Layers/AdministrativeBoundaries";
import RUDAMasterPlan from "./Layers/RUDAMasterPlan";
import Cadastral from "./Layers/Cadastral";
import Topographic from "./Layers/Topographic";
import BaseData from "./Layers/BaseData";
import ProjectMasterPlan from "./Layers/ProjectMasterPlan";
import { LAYER_PANEL_SCROLL } from "./Layers/_layerScroll";

export default function LayersPanel({
  map,
  filters,
  layerVisibility,
  setLayerVisibility,
  adminBoundaryVisibility,
  setAdminBoundaryVisibility,
}) {
  const selectedProjectId = filters?.projectId;
  return (
    <div
      className={`max-h-[calc(70vh-2.5rem)] text-[12px] font-semibold sm:max-h-[min(500px,calc(100vh-120px))] ${LAYER_PANEL_SCROLL}`}
    >
      <AdministrativeBoundaries
        map={map}
        adminBoundaryVisibility={adminBoundaryVisibility}
        setAdminBoundaryVisibility={setAdminBoundaryVisibility}
      />
      <RUDAMasterPlan map={map} />
      <Cadastral map={map} selectedProjectId={selectedProjectId} />
      <Topographic map={map} />
      <ProjectMasterPlan
        map={map}
        selectedProjectId={selectedProjectId}
        layerVisibility={layerVisibility}
        setLayerVisibility={setLayerVisibility}
      />
      <BaseData map={map} />
    </div>
  );
}

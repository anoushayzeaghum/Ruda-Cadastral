import MasterPlan from "./Layers/MasterPlan";
import { LAYER_PANEL_SCROLL } from "../GISMetaverse/tools/Layers/_layerScroll";

export default function LayersPanel({
  map,
  filters,
  layerVisibility,
  setLayerVisibility,
  adminBoundaryVisibility,
  setAdminBoundaryVisibility,
}) {
  return (
    <div
      className={`max-h-[calc(70vh-2.5rem)] text-[12px] font-semibold sm:max-h-[min(500px,calc(100vh-120px))] ${LAYER_PANEL_SCROLL}`}
    >
      
      <MasterPlan
        selectedProjectId={filters?.projectId}
        layerVisibility={layerVisibility}
        setLayerVisibility={setLayerVisibility}
      />
      
    </div>
  );
}


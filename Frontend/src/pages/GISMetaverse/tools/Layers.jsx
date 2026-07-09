import MasterPlan from "./Layers/MasterPlan";
import TopographicPlan from "./Layers/TopographicPlan";
import Utilities from "./Layers/Utilities";
import Services from "./Layers/Services";
import LandRevenueRecord from "./Layers/LandRevenueRecord";
// import Miscellaneous from "./Layers/Miscellaneous";
import NotifiedBoundaries from "./Layers/NotifiedBoundaries";
import AdministrativeBoundaries from "./Layers/AdministrativeBoundaries";
import RUDAMasterPlan from "./Layers/RUDAMasterPlan";
import { LAYER_PANEL_SCROLL } from "./Layers/_layerScroll";

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
      <AdministrativeBoundaries
        map={map}
        adminBoundaryVisibility={adminBoundaryVisibility}
        setAdminBoundaryVisibility={setAdminBoundaryVisibility}
      />
      <RUDAMasterPlan />
      <MasterPlan
        map={map}
        selectedProjectId={filters?.projectId}
        layerVisibility={layerVisibility}
        setLayerVisibility={setLayerVisibility}
      />
      <LandRevenueRecord map={map} selectedProjectId={filters?.projectId} />

      <TopographicPlan
        map={map}
        selectedProjectId={filters?.projectId}
        layerVisibility={layerVisibility}
        setLayerVisibility={setLayerVisibility}
      />
      <Utilities
        map={map}
        selectedProjectId={filters?.projectId}
        layerVisibility={layerVisibility}
        setLayerVisibility={setLayerVisibility}
      />
      <Services
        map={map}
        selectedProjectId={filters?.projectId}
        layerVisibility={layerVisibility}
        setLayerVisibility={setLayerVisibility}
      />
      {/* <Miscellaneous map={map} /> */}
      <NotifiedBoundaries
        map={map}
        selectedProjectId={filters?.projectId}
        layerVisibility={layerVisibility}
        setLayerVisibility={setLayerVisibility}
      />
    </div>
  );
}

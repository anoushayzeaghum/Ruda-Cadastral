import MasterPlan from "./Layers/MasterPlan";
import TopographicPlan from "./Layers/TopographicPlan";
import ServiceUtilities from "./Layers/ServiceUtilities";
import LandRevenueRecord from "./Layers/LandRevenueRecord";
import Miscellaneous from "./Layers/Miscellaneous";
import NotifiedBoundaries from "./Layers/NotifiedBoundaries";
import AdministrativeBoundaries from "./Layers/AdministrativeBoundaries";

export default function LayersPanel({
  map,
  filters,
  layerVisibility,
  setLayerVisibility,
  adminBoundaryVisibility,
  setAdminBoundaryVisibility,
}) {
  return (
    <div className="text-[12px] font-semibold">
      <AdministrativeBoundaries
        adminBoundaryVisibility={adminBoundaryVisibility}
        setAdminBoundaryVisibility={setAdminBoundaryVisibility}
      />
      <MasterPlan
        selectedProjectId={filters?.projectId}
        layerVisibility={layerVisibility}
        setLayerVisibility={setLayerVisibility}
      />
      <TopographicPlan map={map} />
      <ServiceUtilities
        selectedProjectId={filters?.projectId}
        layerVisibility={layerVisibility}
        setLayerVisibility={setLayerVisibility}
      />
      <LandRevenueRecord />
      <Miscellaneous />
      <NotifiedBoundaries />
    </div>
  );
}

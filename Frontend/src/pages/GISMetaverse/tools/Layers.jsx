import MasterPlan from "./Layers/MasterPlan";
import TopographicPlan from "./Layers/TopographicPlan";
import ServiceUtilities from "./Layers/ServiceUtilities";
import LandRevenueRecord from "./Layers/LandRevenueRecord";
import Miscellaneous from "./Layers/Miscellaneous";
import NotifiedBoundaries from "./Layers/NotifiedBoundaries";

export default function LayersPanel({
  map,
  filters,
  layerVisibility,
  setLayerVisibility,
}) {
  return (
    <div className="text-[12px] font-semibold">
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

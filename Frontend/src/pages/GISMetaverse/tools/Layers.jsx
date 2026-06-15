import { ChevronRight } from "lucide-react";
import MasterPlan from "./Layers/MasterPlan";
import TopographicPlan from "./Layers/TopographicPlan";
import ServiceUtilities from "./Layers/ServiceUtilities";
import LandRevenueRecord from "./Layers/LandRevenueRecord";
import Miscellaneous from "./Layers/Miscellaneous";
import NotifiedBoundaries from "./Layers/NotifiedBoundaries";

export default function LayersPanel({ map }) {
  return (
    <div className="text-[12px] font-semibold">
      <MasterPlan />
      <TopographicPlan map={map} />
      <ServiceUtilities />
      <LandRevenueRecord />
      <Miscellaneous />
      <NotifiedBoundaries />
    </div>
  );
}

function LayerSection({ title }) {
  return (
    <div className="border-b border-[#343c4c]">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span>{title}</span>
        <ChevronRight size={15} />
      </div>
    </div>
  );
}

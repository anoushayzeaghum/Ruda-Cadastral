import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import Administrative from "./ProjectMasterplan/Administrative";
import TopographicPlan from "./ProjectMasterplan/TopographicPlan";
import LandRevenueRecord from "./ProjectMasterplan/LandRevenueRecord";
import Utilities from "./ProjectMasterplan/Utilities";
import LiveCamera from "./ProjectMasterplan/LiveCamera";
import NotifiedBoundaries from "./ProjectMasterplan/NotifiedBoundaries";

export default function ProjectMasterPlan({
  map,
  selectedProjectId,
  layerVisibility,
  setLayerVisibility,
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#343c4c]">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-white hover:bg-[#0f3d2e]"
        onClick={() => setOpen((v) => !v)}
      >
        <span>PROJECT MASTER PLAN</span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>
      {open && (
        <div className="mx-2 mb-2 rounded-sm border border-[#13593f]/40 bg-[#071f18]">
          <Administrative
            map={map}
            selectedProjectId={selectedProjectId}
            layerVisibility={layerVisibility}
            setLayerVisibility={setLayerVisibility}
            title="ADMINISTRATIVE BOUNDARY"
          />
          <TopographicPlan
            map={map}
            selectedProjectId={selectedProjectId}
            layerVisibility={layerVisibility}
            setLayerVisibility={setLayerVisibility}
            title="TOPOGRAPHIC"
          />
          <LandRevenueRecord
            map={map}
            selectedProjectId={selectedProjectId}
            title="LIS"
          />
          <Utilities
            map={map}
            selectedProjectId={selectedProjectId}
            layerVisibility={layerVisibility}
            setLayerVisibility={setLayerVisibility}
            title="UTILITIES"
          />
          <LiveCamera
            map={map}
            selectedProjectId={selectedProjectId}
            layerVisibility={layerVisibility}
            setLayerVisibility={setLayerVisibility}
            title="LIVE CAMERA"
          />
          <NotifiedBoundaries
            map={map}
            selectedProjectId={selectedProjectId}
            layerVisibility={layerVisibility}
            setLayerVisibility={setLayerVisibility}
            title="NOTIFIED BOUNDARY"
          />
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import FilterPanel from "./FilterPanel";
import MapView from "./MapView";

export default function MapPage() {
  const { filters } = useOutletContext() ?? {};
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  return (
    <div className="flex flex-col w-full h-full relative bg-gradient-to-b from-blue-50 to-white">

      <MapView
        selectedMouza={filters?.selectedMouzaDetails}
        selectedDistrict={filters?.selectedDistrictOption}
        selectedTehsil={filters?.selectedTehsilOption}
        selectedDivision={filters?.selectedDivisionOption}
      />

      <FilterPanel
        filters={filters}
        isCollapsed={panelCollapsed}
        onToggle={() => setPanelCollapsed(!panelCollapsed)}
      />

    </div>
  );
}
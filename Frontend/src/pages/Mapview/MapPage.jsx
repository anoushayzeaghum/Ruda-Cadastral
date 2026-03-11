import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import FilterPanel from "./FilterPanel";
import MapView from "./MapView";

export default function MapPage() {
  const outletContext = useOutletContext() ?? {};
  const filters = outletContext.filters;
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  return (
    <div className="flex flex-col w-full h-full relative bg-gradient-to-b from-blue-50 to-white">
      <MapView
        selectedMouza={filters?.selectedMouzaDetails || null}
        selectedDistrict={filters?.selectedDistrictOption || null}
        selectedTehsil={filters?.selectedTehsilOption || null}
        selectedDivision={filters?.selectedDivisionOption || null}
      />

      {filters && (
        <FilterPanel
          filters={filters}
          isCollapsed={panelCollapsed}
          onToggle={() => setPanelCollapsed(!panelCollapsed)}
        />
      )}
    </div>
  );
}

import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import FilterPanel from "./FilterPanel";
import MapView from "./Mapview";

export default function MapPage() {
  const { filters } = useOutletContext() ?? {};
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  const selectedMouza = filters?.selectedMouzaDetails ?? null;

  return (
    <div className="map-page">
      <div className="map-page__body">
        <MapView selectedMouza={selectedMouza} />
        <FilterPanel
          filters={filters}
          isCollapsed={panelCollapsed}
          onToggle={() => setPanelCollapsed(!panelCollapsed)}
        />
      </div>
    </div>
  );
}

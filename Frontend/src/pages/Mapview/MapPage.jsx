import { useState } from "react";
import FilterPanel from "./FilterPanel";
import MapView from "./Mapview";

export default function MapPage() {
  const [selectedMouza, setSelectedMouza] = useState(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  return (
    <div className="map-page">
      <div className="map-page__content">
        <FilterPanel
          onMouzaSelect={setSelectedMouza}
          isCollapsed={panelCollapsed}
          onToggle={() => setPanelCollapsed(!panelCollapsed)}
        />

        <div className="map-page__body">
          <MapView selectedMouza={selectedMouza} />
        </div>
      </div>
    </div>
  );
}

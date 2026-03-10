import { useState } from "react";
import FilterPanel from "./FilterPanel";
import MapView from "./MapView";

export default function MapPage() {

  const [selectedMouza, setSelectedMouza] = useState(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  return (
    <div className="map-page">

      <FilterPanel
        onMouzaSelect={setSelectedMouza}
        isCollapsed={panelCollapsed}
        onToggle={() => setPanelCollapsed(!panelCollapsed)}
      />

      <div className="map-page__body">
        <MapView mouzaId={selectedMouza} />
      </div>

    </div>
  );
}
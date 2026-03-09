import { useState } from "react";
import Header from "./Header";
import FilterPanel from "./FilterPanel";
import MapView from "./MapView";

export default function MapPage() {

  const [selectedMouza, setSelectedMouza] = useState(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  return (
    <div className="map-page">

      <Header />

      <div className="map-page__content">
        <FilterPanel
          onMouzaSelect={setSelectedMouza}
          isCollapsed={panelCollapsed}
          onToggle={() => setPanelCollapsed((c) => !c)}
        />
        <div className="map-page__body">
          <MapView mouzaId={selectedMouza} />
        </div>
      </div>

    </div>
  );
}
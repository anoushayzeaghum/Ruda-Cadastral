import { useOutletContext } from "react-router-dom";
import { useState } from "react";

import Header from "./Header";
import SubHeader from "./SubHeader";
import LeftPanel from "./LeftPanel";
import ParcelPanel from "./ParcelPanel";

import MapView from "./Mapview";

export default function MapPage() {
  const outletContext = useOutletContext() ?? {};
  const filters = outletContext.filters;

  const [selectedParcel, setSelectedParcel] = useState(null);
  const [parcelPanelOpen, setParcelPanelOpen] = useState(false);

  const [layers, setLayers] = useState({
    rudaBoundary: false,
    controlPoints: false,
    triJunctionPoints: false,
  });

  const [rudaPhases, setRudaPhases] = useState([]);
  const [selectedRudaPhaseIds, setSelectedRudaPhaseIds] = useState([]);
  const [basemap, setBasemap] = useState("Outdoors");

  return (
    <div className="w-full h-screen flex flex-col bg-white">
      <Header />

      {filters && <SubHeader filters={filters} />}

      <div className="flex flex-1 overflow-hidden">
        <div className="w-72 border-r border-slate-200 bg-white z-10">
          <LeftPanel
            layers={layers}
            setLayers={setLayers}
            rudaPhases={rudaPhases}
            setRudaPhases={setRudaPhases}
            selectedRudaPhaseIds={selectedRudaPhaseIds}
            setSelectedRudaPhaseIds={setSelectedRudaPhaseIds}
            basemap={basemap}
            setBasemap={setBasemap}
          />
        </div>

        <div className="flex-1 relative bg-gradient-to-b from-blue-50 to-white">
          <MapView
            selectedMouza={filters?.selectedMouzaDetails}
            selectedDistrict={filters?.selectedDistrictOptions}
            selectedTehsil={filters?.selectedTehsilOptions}
            selectedDivision={filters?.selectedDivisionOptions}
            viewBy={filters?.viewBy}
            layers={layers}
            selectedRudaPhaseIds={selectedRudaPhaseIds}
            basemap={basemap}
            onParcelSelect={(feature) => {
              setSelectedParcel(feature);
              setParcelPanelOpen(true);
            }}
          />

          <ParcelPanel
            parcel={selectedParcel}
            isOpen={parcelPanelOpen}
            onClose={() => setParcelPanelOpen(false)}
          />
        </div>
      </div>
    </div>
  );
}
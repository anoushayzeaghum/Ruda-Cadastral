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
  // Layer controls lifted to parent so LeftPanel and MapView can share
  const [layers, setLayers] = useState({
    rudaBoundary: true,
    divisionBoundaries: true,
    districtBoundaries: true,
    tehsilBoundaries: true,
    mouzaBoundaries: true,
    khasraParcels: true,
    landOwnership: false,
    landAcquisition: false,
    roadNetwork: false,
    canalRiver: false,
    satelliteImagery: true,
  });

  // RUDA phases data & selected phase ids
  const [rudaPhases, setRudaPhases] = useState([]);
  const [selectedRudaPhaseIds, setSelectedRudaPhaseIds] = useState([]);
  const [basemap, setBasemap] = useState("Outdoors");

  return (
    <div className="w-full h-screen flex flex-col bg-white">
      {/* Header */}
      <Header />

      {/* SubHeader */}
      {filters && <SubHeader filters={filters} />}

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
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

        {/* Map Section */}
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

          {/* Right Panel on Map */}
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

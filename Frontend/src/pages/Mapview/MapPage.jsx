import { useOutletContext } from "react-router-dom";

import Header from "./Header";
import SubHeader from "./SubHeader";
import LeftPanel from "./LeftPanel";
import ParcelPanel from "./ParcelPanel";

import MapView from "./Mapview";

export default function MapPage() {
  const outletContext = useOutletContext() ?? {};
  const filters = outletContext.filters;

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
          <LeftPanel />
        </div>

        {/* Map Section */}
        <div className="flex-1 relative bg-gradient-to-b from-blue-50 to-white">

          <MapView
            selectedMouza={filters?.selectedMouzaDetails}
            selectedDistrict={filters?.selectedDistrictOption}
            selectedTehsil={filters?.selectedTehsilOption}
            selectedDivision={filters?.selectedDivisionOption}
            viewBy={filters?.viewBy}
          />

          {/* Right Panel on Map */}
          <ParcelPanel />

        </div>

      </div>
    </div>
  );
}
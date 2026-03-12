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

      {/* SubHeader with Filters and Stats */}
      {filters && <SubHeader filters={filters} />}

      {/* Map Area */}
      <div className="flex-1 relative bg-gradient-to-b from-blue-50 to-white overflow-hidden">
        <MapView
          selectedMouza={filters?.selectedMouzaDetails}
          selectedDistrict={filters?.selectedDistrictOption}
          selectedTehsil={filters?.selectedTehsilOption}
          selectedDivision={filters?.selectedDivisionOption}
          viewBy={filters?.viewBy}
        />

        {/* Left Panel */}
        <LeftPanel />

        {/* Right Panel */}
        <ParcelPanel />
      </div>
    </div>
  );
}

import React from "react";
import MapView from "../Mapview/Mapview";

export default function DemarcationMap({ filters = {}, onFiltersChange = () => {}, onParcelSelect = () => {}, onFeaturesLoaded = () => {} }) {
  return (
    <div className="col-span-12 lg:col-span-6 xl:col-span-6 bg-white border border-[#b8c2cc] relative overflow-hidden">
      <div className="w-full h-full">
        <MapView
          selectedMouza={filters?.selectedMouzaDetails}
          selectedDistrict={filters?.selectedDistrictOptions}
          selectedTehsil={filters?.selectedTehsilOptions}
          selectedDivision={filters?.selectedDivisionOptions}
          viewBy={filters?.viewBy}
          selectedFeatureNumber={filters?.selectedParcelNumber}
          onParcelSelect={onParcelSelect}
          onFeaturesLoaded={onFeaturesLoaded}
        />
      </div>
    </div>
  );
}
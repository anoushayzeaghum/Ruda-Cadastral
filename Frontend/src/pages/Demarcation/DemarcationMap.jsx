import React from "react";
import MapView from "../Mapview/Mapview";

export default function DemarcationMap({
  filters = {},
  onFiltersChange = () => {},
  onParcelSelect = () => {},
  onFeaturesLoaded = () => {},
}) {
  return (
    <div className="col-span-12 lg:col-span-6 xl:col-span-6 bg-white border border-[#b8c2cc] relative overflow-hidden">
      <div className="w-full h-full">
        <MapView
          selectedMauza={filters?.selectedMauzaDetails}
          selectedDistrict={filters?.selectedDistrictOptions}
          selectedTehsil={filters?.selectedTehsilOptions}
          viewBy={filters?.viewBy}
          demarcationMode={true}
          selectedFeatureNumber={filters?.selectedParcelNumber}
          onParcelSelect={onParcelSelect}
          onFeaturesLoaded={onFeaturesLoaded}
        />
      </div>
    </div>
  );
}

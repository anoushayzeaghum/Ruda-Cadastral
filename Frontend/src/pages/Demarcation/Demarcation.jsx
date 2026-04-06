import React, { useState } from "react";
import Header from "./Header";
import DemarcationMap from "./DemarcationMap";
import LandUseBreakdown from "./LandUseBreakdown";
import SpatialQuery from "./SpatialQuery";
import Legend from "./Legend";
import PlotDetails from "./PlotDetails";
import SelectedPlots from "./SelectedPlots";

export default function Demarcation() {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // filters for SpatialQuery/Map
  const [filters, setFilters] = useState({
    selectedDivisionOptions: null,
    selectedDistrictOptions: null,
    selectedTehsilOptions: null,
    selectedMouzaDetails: null,
    viewBy: "khasra",
    selectedParcelNumber: "",
  });

  const [loadedParcelsGeojson, setLoadedParcelsGeojson] = useState(null);
  const [selectedParcel, setSelectedParcel] = useState(null);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div className="h-screen flex flex-col bg-[#f4f4f4] font-sans text-[#4a4a4a] overflow-hidden">
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
      />

      <div className="p-3 flex-1 overflow-hidden">
        <div className="grid grid-cols-12 gap-3 h-full">
          <DemarcationMap
            filters={filters}
            onFiltersChange={setFilters}
            onParcelSelect={(feature) => {
              setSelectedParcel(feature);
              const props = feature?.properties || {};
              const num =
                filters?.viewBy === "khasra"
                  ? (props.k ??
                    props.K ??
                    props.khasra ??
                    props.khasra_no ??
                    props.khasra_id ??
                    null)
                  : (props.m ??
                    props.mn ??
                    props.murabba ??
                    props.murabba_no ??
                    props.murabba_id ??
                    null);

              setFilters((f) => ({
                ...f,
                selectedParcelNumber: num ? String(num) : "",
              }));
            }}
            onFeaturesLoaded={(geojson) => setLoadedParcelsGeojson(geojson)}
          />

          <div className="col-span-12 lg:col-span-3 xl:col-span-3 flex flex-col gap-3">
            <LandUseBreakdown />
            <PlotDetails parcel={selectedParcel} />
            <SelectedPlots />
          </div>

          <div className="col-span-12 lg:col-span-3 xl:col-span-3 flex flex-col gap-3">
            <SpatialQuery
              filters={filters}
              onFiltersChange={(partial) =>
                setFilters((prev) => ({ ...prev, ...partial }))
              }
              parcelOptions={(() => {
                if (!loadedParcelsGeojson?.features) return [];
                const seen = new Set();
                const list = [];
                loadedParcelsGeojson.features.forEach((f) => {
                  const p = f?.properties || {};
                  const val =
                    filters?.viewBy === "khasra"
                      ? (p.k ??
                        p.K ??
                        p.khasra ??
                        p.khasra_no ??
                        p.khasra_id ??
                        f.id)
                      : (p.m ??
                        p.mn ??
                        p.murabba ??
                        p.murabba_no ??
                        p.murabba_id ??
                        f.id);
                  if (val == null) return;
                  const s = String(val);
                  if (!seen.has(s)) {
                    seen.add(s);
                    list.push({ value: s, label: s });
                  }
                });
                list.sort((a, b) => {
                  const na = Number(a.value);
                  const nb = Number(b.value);
                  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
                  return a.value.localeCompare(b.value);
                });
                return list;
              })()}
            />

            <Legend selectedParcelNumber={filters.selectedParcelNumber} />
          </div>
        </div>
      </div>
    </div>
  );
}

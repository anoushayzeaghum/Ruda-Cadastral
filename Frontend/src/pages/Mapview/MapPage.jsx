import { useOutletContext } from "react-router-dom";
import React, { useState, useMemo } from "react";

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
  const [selectedParcelNumber, setSelectedParcelNumber] = useState("");
  const [loadedParcelsGeojson, setLoadedParcelsGeojson] = useState(null);

  // build parcel options from loaded geojson when available
  const parcelOptions = useMemo(() => {
    if (
      !loadedParcelsGeojson?.features ||
      !Array.isArray(loadedParcelsGeojson.features)
    )
      return [];
    const seen = new Set();
    const list = [];
    const viewBy = filters?.viewBy;

    const extract = (feat) => {
      const p = feat?.properties || {};

      if (viewBy === "khasra") {
        return p.k ?? p.khasra ?? p.khasra_no ?? p.khasra_id ?? null;
      }

      if (viewBy === "murabba") {
        return p.murabba ?? p.mn ?? p.murabba_no ?? p.murabba_id ?? p.m ?? null;
      }

      return feat?.id ?? null;
    };

    loadedParcelsGeojson.features.forEach((f) => {
      const v = extract(f);
      if (v == null) return;
      const s = String(v);
      if (!seen.has(s)) {
        seen.add(s);
        list.push({ value: s, label: s });
      }
    });

    // sort numerically when possible
    list.sort((a, b) => {
      const na = Number(a.value);
      const nb = Number(b.value);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
      return a.value.localeCompare(b.value);
    });

    return list;
  }, [loadedParcelsGeojson, filters?.viewBy]);

  return (
    <div className="w-full h-screen flex flex-col bg-white">
      <Header />

      {filters && (
        <SubHeader
          filters={filters}
          parcelOptions={parcelOptions}
          selectedParcelNumber={selectedParcelNumber}
          onParcelNumberChange={(val) => setSelectedParcelNumber(val)}
        />
      )}

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
            selectedFeatureNumber={selectedParcelNumber}
            onFeaturesLoaded={(geojson) => setLoadedParcelsGeojson(geojson)}
            onParcelSelect={(feature) => {
              setSelectedParcel(feature);
              // sync dropdown: try common property names
              const props = feature?.properties || {};
              const num =
                filters?.viewBy === "khasra"
                  ? (props.k ??
                    props.khasra ??
                    props.khasra_no ??
                    props.khasra_id ??
                    "")
                  : (props.murabba ??
                    props.mn ??
                    props.murabba_no ??
                    props.murabba_id ??
                    props.m ??
                    "");
              setSelectedParcelNumber(num ? String(num) : "");
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

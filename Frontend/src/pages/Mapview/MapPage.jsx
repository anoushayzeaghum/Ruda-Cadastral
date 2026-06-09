import { useOutletContext } from "react-router-dom";
import React, { useState, useMemo, useEffect, useCallback } from "react";
import * as turf from "@turf/turf";
import { useGisAnalysis } from "../../hooks/useGisAnalysis";
import { fetchAllAmenities } from "../../services/gisApi";

import Header from "./Header";
import SubHeader from "./SubHeader";
import LeftPanel from "./LeftPanel";
import ParcelPanel from "./ParcelPanel";

import MapView from "./Mapview";

const getKhasraNumber = (props = {}) => {
  return (
    props.k ??
    props.K ??
    props.khasra ??
    props.khasra_no ??
    props.khasra_id ??
    null
  );
};

const getMurabbaNumber = (props = {}) => {
  return (
    props.m ??
    props.M ??
    props.mn ??
    props.murabba ??
    props.murabba_no ??
    props.murabba_id ??
    null
  );
};

const getLandType = (props = {}) => {
  return props.type ?? props.land_type ?? null;
};

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
  const [basemap, setBasemap] = useState("Streets");

  const [selectedParcelNumber, setSelectedParcelNumber] = useState("");
  const [selectedMurabbaNumber, setSelectedMurabbaNumber] = useState("");
  const [loadedParcelsGeojson, setLoadedParcelsGeojson] = useState(null);

  // NEW: single source of truth for selected parcel
  const [activeParcel, setActiveParcel] = useState(null);

  // NEW: analysis mode enum
  const [analysisMode, setAnalysisMode] = useState("idle");

  // NEW: analysis result states
  const [selectedBufferRadius, setSelectedBufferRadius] = useState(1);

  // NEW: amenity data
  const [amenitiesGeojson, setAmenitiesGeojson] = useState({
    hospitals: { type: "FeatureCollection", features: [] },
    schools:   { type: "FeatureCollection", features: [] },
    parks:     { type: "FeatureCollection", features: [] },
    mosques:   { type: "FeatureCollection", features: [] },
    transport: { type: "FeatureCollection", features: [] },
  });
  const [amenityLoadError, setAmenityLoadError] = useState(null);

  // NEW: suitability weight state
  const [suitabilityWeights, setSuitabilityWeights] = useState({
    hospitals: 0.25,
    schools:   0.25,
    parks:     0.25,
    transport: 0.25,
  });

  const resetAnalysis = useCallback(() => {
    setAnalysisMode("idle");
    // note: buffer/proximity/nearest/suitability/route results will be managed by the useGisAnalysis hook
  }, []);

  const loadAmenities = useCallback(async () => {
    try {
      const results = await fetchAllAmenities();
      setAmenitiesGeojson(results);
      setAmenityLoadError(null);
    } catch (err) {
      setAmenityLoadError(err.message);
      console.error("Amenity load error:", err);
    }
  }, []);

  useEffect(() => { loadAmenities(); }, [loadAmenities]);

  // Instantiate the GIS analysis hook
  const {
    bufferResults,
    proximityResults,
    nearestResults,
    suitabilityResult,
    routeData,
    isComputing,
    error: gisError,
    reset: resetGisAnalysis,
    runBuffer,
    runProximity,
    runNearest,
    runSuitability,
    runRouting,
  } = useGisAnalysis({ activeParcel });

  // Reset hook results when parcel is deselected
  useEffect(() => {
    if (activeParcel === null) {
      resetGisAnalysis?.();
    }
  }, [activeParcel, resetGisAnalysis]);

  // GIS action handler callbacks
  const handleAnalysisModeChange = useCallback((mode) => {
    setAnalysisMode(mode);
    if (mode === "proximity") runProximity();
    if (mode === "nearest") runNearest();
    if (mode === "buffer") runBuffer(selectedBufferRadius);
    if (mode === "suitability") runSuitability(suitabilityWeights);
  }, [runProximity, runNearest, runBuffer, selectedBufferRadius, runSuitability, suitabilityWeights]);

  const handleBufferRadiusChange = useCallback((radius) => {
    setSelectedBufferRadius(radius);
    runBuffer(radius);
  }, [runBuffer]);

  const handleSuitabilityWeightChange = useCallback((category, value) => {
    setSuitabilityWeights(prev => ({ ...prev, [category]: value }));
  }, []);

  const handleComputeSuitability = useCallback(() => {
    runSuitability(suitabilityWeights);
  }, [runSuitability, suitabilityWeights]);

  const handleRouteRequest = useCallback((destinationFeature) => {
    const name = destinationFeature?.properties?.name ?? "Destination";
    runRouting(destinationFeature, name);
  }, [runRouting]);

  const isMurabbaBasedKhasra = useMemo(() => {
    if (filters?.viewBy !== "khasra") return false;
    const features = loadedParcelsGeojson?.features;
    if (!Array.isArray(features) || !features.length) return false;

    return features.some(
      (f) => String(getLandType(f?.properties || {})) === "MU",
    );
  }, [loadedParcelsGeojson, filters?.viewBy]);

  useEffect(() => {
    setSelectedParcelNumber("");
    setSelectedMurabbaNumber("");
    setSelectedParcel(null);
    setParcelPanelOpen(false);
  }, [filters?.selectedMouza, filters?.viewBy]);

  const murabbaOptions = useMemo(() => {
    if (!isMurabbaBasedKhasra) return [];
    const features = loadedParcelsGeojson?.features;
    if (!Array.isArray(features)) return [];

    const seen = new Set();
    const list = [];

    features.forEach((f) => {
      const murabba = getMurabbaNumber(f?.properties || {});
      if (murabba == null || murabba === "") return;

      const value = String(murabba);
      if (!seen.has(value)) {
        seen.add(value);
        list.push({ value, label: value });
      }
    });

    list.sort((a, b) => {
      const na = Number(a.value);
      const nb = Number(b.value);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
      return a.value.localeCompare(b.value);
    });

    return list;
  }, [loadedParcelsGeojson, isMurabbaBasedKhasra]);

  const khasraOptions = useMemo(() => {
    const features = loadedParcelsGeojson?.features;
    if (!Array.isArray(features)) return [];

    const seen = new Set();
    const list = [];

    if (filters?.viewBy === "khasra" && isMurabbaBasedKhasra) {
      if (!selectedMurabbaNumber) return [];

      features.forEach((f) => {
        const props = f?.properties || {};
        const murabba = getMurabbaNumber(props);
        if (String(murabba) !== String(selectedMurabbaNumber)) return;

        const khasra = getKhasraNumber(props);
        if (khasra == null || khasra === "") return;

        const value = String(khasra);
        if (!seen.has(value)) {
          seen.add(value);
          list.push({ value, label: value });
        }
      });
    } else {
      features.forEach((f) => {
        const props = f?.properties || {};
        const valueRaw =
          filters?.viewBy === "khasra"
            ? getKhasraNumber(props)
            : filters?.viewBy === "murabba"
              ? getMurabbaNumber(props)
              : f?.id;

        if (valueRaw == null || valueRaw === "") return;

        const value = String(valueRaw);
        if (!seen.has(value)) {
          seen.add(value);
          list.push({ value, label: value });
        }
      });
    }

    list.sort((a, b) => {
      const na = Number(a.value);
      const nb = Number(b.value);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
      return a.value.localeCompare(b.value);
    });

    return list;
  }, [
    loadedParcelsGeojson,
    filters?.viewBy,
    isMurabbaBasedKhasra,
    selectedMurabbaNumber,
  ]);

  const standardParcelOptions = useMemo(() => {
    if (filters?.viewBy === "khasra" && isMurabbaBasedKhasra) return [];
    return khasraOptions;
  }, [filters?.viewBy, isMurabbaBasedKhasra, khasraOptions]);

  const selectedFeatureNumber = useMemo(() => {
    if (filters?.viewBy === "khasra" && isMurabbaBasedKhasra) {
      if (!selectedMurabbaNumber || !selectedParcelNumber) return "";
      return {
        murabbaNo: String(selectedMurabbaNumber),
        khasraNo: String(selectedParcelNumber),
      };
    }
    return selectedParcelNumber;
  }, [
    filters?.viewBy,
    isMurabbaBasedKhasra,
    selectedMurabbaNumber,
    selectedParcelNumber,
  ]);

  const handleParcelSelect = useCallback(
    (feature) => {
      // 1. Reset stale analysis state
      resetAnalysis();

      // 2. Compute centroid via turf
      const centroid = turf.center(feature);

      // 3. Determine parcel type
      const props = feature?.properties || {};
      const khasraNo = getKhasraNumber(props);
      const murabbaNo = getMurabbaNumber(props);
      const parcelType =
        feature.properties?._layerType === "murabba" ? "MURABBA" : "KHASRA";

      // 4. Build activeParcel object
      const newActiveParcel = {
        type: parcelType,
        id: String(feature.id ?? props.gid ?? props.id ?? ""),
        khasraNo:
          khasraNo !== null && khasraNo !== undefined
            ? String(khasraNo)
            : undefined,
        murabbaNo:
          murabbaNo !== null && murabbaNo !== undefined
            ? String(murabbaNo)
            : undefined,
        geometry: feature.geometry,
        centroid: centroid.geometry, // GeoJSON Point
        properties: props,
      };

      // 5. Set activeParcel
      setActiveParcel(newActiveParcel);

      // Existing logic below — unchanged
      setSelectedParcel(feature);

      if (filters?.viewBy === "khasra" && isMurabbaBasedKhasra) {
        setSelectedMurabbaNumber(
          murabbaNo !== null && murabbaNo !== undefined
            ? String(murabbaNo)
            : "",
        );
        setSelectedParcelNumber(
          khasraNo !== null && khasraNo !== undefined ? String(khasraNo) : "",
        );
      } else {
        const num = filters?.viewBy === "khasra" ? khasraNo : murabbaNo;
        setSelectedParcelNumber(
          num !== null && num !== undefined ? String(num) : "",
        );
      }

      setParcelPanelOpen(true);
    },
    [filters?.viewBy, isMurabbaBasedKhasra, resetAnalysis],
  );

  return (
    <div className="w-full h-screen flex flex-col bg-white">
      <Header />

      {filters && (
        <SubHeader
          filters={filters}
          parcelOptions={standardParcelOptions}
          selectedParcelNumber={selectedParcelNumber}
          onParcelNumberChange={(val) => setSelectedParcelNumber(val)}
          isMurabbaBasedKhasra={isMurabbaBasedKhasra}
          murabbaOptions={murabbaOptions}
          selectedMurabbaNumber={selectedMurabbaNumber}
          onMurabbaNumberChange={(val) => {
            setSelectedMurabbaNumber(val);
            setSelectedParcelNumber("");
          }}
          khasraOptions={khasraOptions}
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
            activeParcel={activeParcel}
            analysisMode={analysisMode}
            onAnalysisModeChange={handleAnalysisModeChange}
            amenityLoadError={amenityLoadError}
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
            selectedFeatureNumber={selectedFeatureNumber}
            onFeaturesLoaded={(geojson) => setLoadedParcelsGeojson(geojson)}
            onParcelSelect={handleParcelSelect}
            activeParcel={activeParcel}
            bufferPolygon={analysisMode === "buffer" ? bufferResults?.polygon : null}
            bufferAmenities={analysisMode === "buffer" ? bufferResults?.amenitiesInBuffer : null}
            proximityAmenities={analysisMode === "proximity" ? proximityResults : null}
            nearestLines={analysisMode === "nearest" ? nearestResults : null}
            routePolyline={analysisMode === "routing" ? routeData?.geometry : null}
          />

          <ParcelPanel
            parcel={selectedParcel}
            isOpen={parcelPanelOpen}
            onClose={() => setParcelPanelOpen(false)}
            activeParcel={activeParcel}
            analysisMode={analysisMode}
            selectedBufferRadius={selectedBufferRadius}
            onBufferRadiusChange={handleBufferRadiusChange}
            proximityResults={proximityResults}
            nearestResults={nearestResults}
            suitabilityScore={suitabilityResult}
            suitabilityWeights={suitabilityWeights}
            onSuitabilityWeightChange={handleSuitabilityWeightChange}
            onComputeSuitability={handleComputeSuitability}
            routeData={routeData}
            onRouteRequest={handleRouteRequest}
            onAnalysisModeChange={handleAnalysisModeChange}
            bufferResults={bufferResults}
            amenitiesGeojson={amenitiesGeojson}
            gisError={gisError}
          />
        </div>
      </div>
    </div>
  );
}

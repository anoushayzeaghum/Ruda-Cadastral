import { useOutletContext } from "react-router-dom";
import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";

import Header from "./Header";
import SubHeader from "./SubHeader";
import LeftPanel from "./LeftPanel";
import ParcelPanel from "./ParcelPanel";
import MapControls from "./MapControls";
import Legend from "./Legend";
import MapView from "./MapView";

const getKhasraNumber = (props = {}) => {
  return (
    props.kh ??
    props.KH ??
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

const getSquareNumber = (props = {}, feature = null) => {
  return (
    props.sq ??
    props.SQ ??
    props.square ??
    props.square_no ??
    props.square_id ??
    props.s ??
    props.S ??
    feature?.id ??
    null
  );
};

const getAcreNumber = (props = {}, feature = null) => {
  return (
    props.acre ??
    props.acre_no ??
    props.ac ??
    props.AC ??
    props.name ??
    props.gid ??
    feature?.id ??
    null
  );
};

const getFeatureNumberByView = (props = {}, viewBy = "", feature = null) => {
  if (viewBy === "khasra") return getKhasraNumber(props);
  if (viewBy === "square") return getSquareNumber(props, feature);
  if (viewBy === "acre") return getAcreNumber(props, feature);
  if (viewBy === "murabba") return getMurabbaNumber(props);
  return feature?.id ?? null;
};

const VIEW_BY_LAYER_KEYS = {
  khasra: "khasraLayer",
  square: "squareLayer",
  acre: "acreLayer",
};

const VIEW_BY_BOUNDARY_KEYS = Object.values(VIEW_BY_LAYER_KEYS);

const getLandType = (props = {}) => {
  return props.type ?? props.land_type ?? null;
};

export default function MapPage() {
  const outletContext = useOutletContext() ?? {};

  const filters = outletContext.filters;

  const mapShellRef = useRef(null);
  const [mapboxMap, setMapboxMap] = useState(null);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [parcelPanelOpen, setParcelPanelOpen] = useState(false);

  const [layers, setLayers] = useState({
    rudaBoundary: { visible: false, opacity: 70 },
    proposedRoads: { visible: false, opacity: 100 },
    geodeticNetwork: { visible: false, opacity: 100 },
    districtBoundary: { visible: true, opacity: 0 },
    tehsilBoundary: { visible: true, opacity: 0 },
    mauzaBoundary: { visible: true, opacity: 0 },
    khasraLayer: { visible: false, opacity: 25 },
    squareLayer: { visible: false, opacity: 35 },
    acreLayer: { visible: false, opacity: 35 },
    murabbaLayer: { visible: false, opacity: 25 },
    controlPoints: { visible: false, opacity: 100 },
    triJunctionPoints: { visible: false, opacity: 100 },
    fieldPoints: { visible: false, opacity: 100 },
    mussaviLayer: { visible: false, opacity: 100 },
  });

  const [rudaPhases, setRudaPhases] = useState([]);
  const [selectedRudaPhaseIds, setSelectedRudaPhaseIds] = useState([]);
  const [selectedProposedRoadIds, setSelectedProposedRoadIds] = useState([]);
  const [basemap, setBasemap] = useState("Streets");

  const [selectedParcelNumber, setSelectedParcelNumber] = useState("");
  const [selectedMurabbaNumber, setSelectedMurabbaNumber] = useState("");
  const [loadedParcelsGeojson, setLoadedParcelsGeojson] = useState(null);

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
    setLoadedParcelsGeojson(null);
  }, [filters?.selectedMauza, filters?.viewBy]);

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
        const valueRaw = getFeatureNumberByView(
          props,
          filters?.viewBy,
          f,
        );

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

  const selectedFilterLayers = useMemo(() => {
    if (!filters) return [];

    const items = [];

    if (filters?.selectedDistrictOptions?.length) {
      const label = filters.selectedDistrictOptions
        .map((d) => d?.name)
        .filter(Boolean)
        .join(", ");
      items.push({
        key: "districtBoundary",
        label: `District: ${label || "Selected District"}`,
      });
    }

    if (filters?.selectedTehsilOptions?.length) {
      const label = filters.selectedTehsilOptions
        .map((t) => t?.name)
        .filter(Boolean)
        .join(", ");
      items.push({
        key: "tehsilBoundary",
        label: `Tehsil: ${label || "Selected Tehsil"}`,
      });
    }

    if (filters?.selectedMauzaDetails) {
      const label =
        filters.selectedMauzaDetails?.mauza ||
        filters.selectedMauzaDetails?.name ||
        "Selected Mauza";
      items.push({
        key: "mauzaBoundary",
        label: `Mauza: ${label}`,
      });
    }

    if (filters?.selectedMauzaDetails && filters?.viewBy === "khasra") {
      items.push({
        key: "khasraLayer",
        label: selectedParcelNumber
          ? `Khasra: ${selectedParcelNumber}`
          : "Khasra Layer",
      });
    }

    if (filters?.selectedMauzaDetails && filters?.viewBy === "square") {
      items.push({
        key: "squareLayer",
        label: selectedParcelNumber
          ? `Square: ${selectedParcelNumber}`
          : "Square Layer",
      });
    }

    if (filters?.selectedMauzaDetails && filters?.viewBy === "acre") {
      items.push({
        key: "acreLayer",
        label: selectedParcelNumber
          ? `Acre: ${selectedParcelNumber}`
          : "Acre Layer",
      });
    }

    return items;
  }, [
    filters,
    filters?.selectedDistrictOptions,
    filters?.selectedTehsilOptions,
    filters?.selectedMauzaDetails,
    filters?.viewBy,
    selectedParcelNumber,
  ]);

  const selectedMauzaKey =
    filters?.selectedMauzaDetails?.mauza_id ?? filters?.selectedMauza ?? "";

  useEffect(() => {
    const activeKeys = new Set(selectedFilterLayers.map((item) => item.key));
    const managedKeys = [
      "districtBoundary",
      "tehsilBoundary",
      "mauzaBoundary",
      "khasraLayer",
      "squareLayer",
      "acreLayer",
      "murabbaLayer",
    ];

    setLayers((prev) => {
      const next = { ...prev };
      let changed = false;

      managedKeys.forEach((key) => {
        if (!activeKeys.has(key)) return;

        if (!next[key]) {
          next[key] = { visible: true, opacity: 100 };
          changed = true;
          return;
        }

        if (typeof next[key] !== "object") {
          next[key] = { visible: !!next[key], opacity: 100 };
          changed = true;
        }

        if (VIEW_BY_BOUNDARY_KEYS.includes(key) && next[key]?.visible !== true) {
          next[key] = {
            ...next[key],
            visible: true,
          };
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [selectedFilterLayers]);

  useEffect(() => {
    const activeViewByLayerKey = VIEW_BY_LAYER_KEYS[filters?.viewBy];

    if (!selectedMauzaKey || !activeViewByLayerKey) return;

    setLayers((prev) => {
      const next = { ...prev };
      let changed = false;

      VIEW_BY_BOUNDARY_KEYS.forEach((key) => {
        const current =
          typeof next[key] === "object"
            ? next[key]
            : { visible: !!next[key], opacity: key === "khasraLayer" ? 25 : 35 };

        const shouldBeVisible = key === activeViewByLayerKey;

        if (current.visible !== shouldBeVisible || current.forceLoad) {
          next[key] = {
            ...current,
            visible: shouldBeVisible,
            forceLoad: false,
          };
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [selectedMauzaKey, filters?.viewBy]);

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
      setSelectedParcel(feature);

      const props = feature?.properties || {};
      const khasraNo = getKhasraNumber(props);
      const murabbaNo = getMurabbaNumber(props);

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
        const num = getFeatureNumberByView(props, filters?.viewBy, feature);
        setSelectedParcelNumber(
          num !== null && num !== undefined ? String(num) : "",
        );
      }

      setParcelPanelOpen(true);
    },
    [filters?.viewBy, isMurabbaBasedKhasra],
  );

  const handleParcelPanelClose = useCallback(() => {
    setParcelPanelOpen(false);
    setSelectedParcel(null);
    setSelectedParcelNumber("");

    if (!(filters?.viewBy === "khasra" && isMurabbaBasedKhasra)) {
      setSelectedMurabbaNumber("");
    }
  }, [filters?.viewBy, isMurabbaBasedKhasra]);

  const handleMapReady = useCallback((map) => {
    setMapboxMap(map || null);
  }, []);

  // Reset the printMap flag immediately after it fires so it can be triggered again
  useEffect(() => {
    const isPrint = typeof layers?.printMap === "object"
      ? layers.printMap.visible
      : !!layers?.printMap;

    if (!isPrint) return;

    const timer = setTimeout(() => {
      setLayers((prev) => ({
        ...prev,
        printMap: { visible: false },
      }));
    }, 500);

    return () => clearTimeout(timer);
  }, [layers?.printMap]);

  return (
    <div className="w-full h-screen flex flex-col bg-white">
      <Header />

      <div
        ref={mapShellRef}
        className="relative flex-1 overflow-hidden bg-gradient-to-b from-blue-50 to-white"
      >
        <MapView
          selectedMauza={filters?.selectedMauzaDetails}
          selectedDistrict={filters?.selectedDistrictOptions}
          selectedTehsil={filters?.selectedTehsilOptions}
          viewBy={filters?.viewBy}
          layers={layers}
          selectedFilterLayers={selectedFilterLayers}
          selectedRudaPhaseIds={selectedRudaPhaseIds}
          selectedProposedRoadIds={selectedProposedRoadIds}
          basemap={basemap}
          selectedFeatureNumber={selectedFeatureNumber}
          onFeaturesLoaded={(geojson) => setLoadedParcelsGeojson(geojson)}
          onParcelSelect={handleParcelSelect}
          onMapReady={handleMapReady}
        />

        {/* <MapControls map={mapboxMap} fullscreenTargetRef={mapShellRef} /> */}
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

        <LeftPanel
          map={mapboxMap}
          layers={layers}
          setLayers={setLayers}
          rudaPhases={rudaPhases}
          setRudaPhases={setRudaPhases}
          selectedRudaPhaseIds={selectedRudaPhaseIds}
          setSelectedRudaPhaseIds={setSelectedRudaPhaseIds}
          selectedProposedRoadIds={selectedProposedRoadIds}
          setSelectedProposedRoadIds={setSelectedProposedRoadIds}
          basemap={basemap}
          setBasemap={setBasemap}
          selectedMauza={filters?.selectedMauzaDetails}
          selectedFilterLayers={selectedFilterLayers}
        />

        <Legend
          layers={layers}
          rudaPhases={rudaPhases}
          selectedRudaPhaseIds={selectedRudaPhaseIds}
          selectedProposedRoadIds={selectedProposedRoadIds}
        />

        <ParcelPanel
          parcel={selectedParcel}
          isOpen={parcelPanelOpen}
          onClose={handleParcelPanelClose}
        />
      </div>
    </div>
  );
}

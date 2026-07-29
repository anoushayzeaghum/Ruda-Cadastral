import { useOutletContext } from "react-router-dom";
import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";

import Header from "./Header.jsx";
import SubHeader from "./SubHeader.jsx";
import LeftPanel from "./LeftPanel.jsx";
import ParcelPanel from "./ParcelPanel.jsx";
import MultipleParcelPanel from "./Layers/MultipleParcelPanel.jsx";
import Legend from "./Legend.jsx";
import MapView from "./MapView.jsx";
import MapPrinter from "../Mapview/Printing/MapPrinter.jsx";
import { getRudaMauzas } from "../../services/api";

const getKhasraNumber = (props = {}) => {
  const candidates = [
    props.kh,
    props.KH,
    props.k,
    props.K,
    props.khasra,
    props.khasra_no,
    props.khasra_id,
    props.join_shp,
  ];

  return (
    candidates.find(
      (value) =>
        value !== undefined &&
        value !== null &&
        value !== "" &&
        String(value).trim() !== "0",
    ) ?? null
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

const getMauzaId = (mauza = {}) =>
  mauza?.mauza_id ?? mauza?.id ?? mauza?.gid ?? "";

const getMauzaNameValue = (mauza = {}) =>
  String(
    mauza?.mauza ?? mauza?.name ?? mauza?.moza ?? mauza?.mouza ?? "",
  ).trim();

const getMauzaSelectionKey = (mauza = {}) =>
  getMauzaNameValue(mauza).toLowerCase() || String(getMauzaId(mauza));

const decorateMauzaOptions = (items = []) =>
  (Array.isArray(items) ? items : []).map((mauza) => ({
    ...mauza,
    _selectionKey: getMauzaSelectionKey(mauza),
  }));

const getFeatureSelectionKey = (feature = {}) => {
  const props = feature?.properties || {};
  return String(
    props.gid ??
      props.id ??
      props.khasra_id ??
      `${props.mauza_id ?? ""}:${getKhasraNumber(props) ?? ""}:${feature?.id ?? ""}`,
  );
};

const geoJSONMauzasToOptions = (geojson) => {
  const features = Array.isArray(geojson?.features) ? geojson.features : [];

  return features
    .map((feature) => ({
      ...(feature?.properties || {}),
      id:
        feature?.properties?.id ??
        feature?.properties?.mauza_id ??
        feature?.id ??
        feature?.properties?.gid,
      geometry: feature?.geometry ?? null,
    }))
    .filter((mauza) => getMauzaId(mauza) !== "");
};

export default function MapPage() {
  const outletContext = useOutletContext() ?? {};

  const filters = outletContext.filters;

  const mapShellRef = useRef(null);
  const [mapboxMap, setMapboxMap] = useState(null);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [parcelPanelOpen, setParcelPanelOpen] = useState(false);
  const [multiSelectionMode, setMultiSelectionMode] = useState(false);
  const [selectedParcels, setSelectedParcels] = useState([]);
  const [boundaryStatus, setBoundaryStatus] = useState("verified");
  const [layers, setLayers] = useState({
    rudaBoundary: { visible: false, opacity: 100, color: "#22c55e" },
    proposedRoads: { visible: false, opacity: 100, color: "#ef4444" },
    geodeticNetwork: { visible: false, opacity: 100, color: "#d81d1d" },
    districtBoundary: { visible: true, opacity: 100, color: "#D18B00" },
    tehsilBoundary: { visible: true, opacity: 100, color: "#0B3D91" },
    mauzaBoundary: { visible: true, opacity: 100, color: "#000000" },
    khasraLayer: { visible: false, opacity: 100, color: "#16a34a" },
    possessionLand: { visible: false, opacity: 100, color: "#5F7F00" },
    awardedLand: { visible: false, opacity: 100, color: "#854F0B" },
    stateLand: { visible: false, opacity: 100, color: "#5F5E5A" },
    squareLayer: { visible: false, opacity: 100, color: "#8b5cf6" },
    acreLayer: { visible: false, opacity: 100, color: "#14b8a6" },
    murabbaLayer: { visible: false, opacity: 100, color: "#facc15" },
    controlPoints: { visible: false, opacity: 100, color: "#38bdf8" },
    triJunctionPoints: { visible: false, opacity: 100, color: "#e11d48" },
    fieldPoints: { visible: false, opacity: 100, color: "#2563eb" },
    mussaviLayer: { visible: false, opacity: 100 },
  });

  const [rudaPhases, setRudaPhases] = useState([]);
  const [selectedRudaPhaseIds, setSelectedRudaPhaseIds] = useState([]);
  const [selectedProposedRoadIds, setSelectedProposedRoadIds] = useState([]);
  const [basemap, setBasemap] = useState("Streets");

  const [selectedParcelNumber, setSelectedParcelNumber] = useState("");
  const [selectedMurabbaNumber, setSelectedMurabbaNumber] = useState("");
  const [loadedParcelsGeojson, setLoadedParcelsGeojson] = useState(null);
  const [unverifiedMauzas, setUnverifiedMauzas] = useState([]);
  const [unverifiedMauzasLoading, setUnverifiedMauzasLoading] = useState(false);
  const [selectedMauzaKeys, setSelectedMauzaKeys] = useState([]);
  const [parcelLookupMauzaKey, setParcelLookupMauzaKey] = useState("");

  useEffect(() => {
    if (boundaryStatus === "verified" || unverifiedMauzas.length) return;

    let cancelled = false;

    const loadUnverifiedMauzas = async () => {
      try {
        setUnverifiedMauzasLoading(true);
        const geojson = await getRudaMauzas();
        if (!cancelled) {
          setUnverifiedMauzas(geoJSONMauzasToOptions(geojson));
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load unverified Mauzas:", error);
          setUnverifiedMauzas([]);
        }
      } finally {
        if (!cancelled) setUnverifiedMauzasLoading(false);
      }
    };

    loadUnverifiedMauzas();

    return () => {
      cancelled = true;
    };
  }, [boundaryStatus, unverifiedMauzas.length]);

  const verifiedMauzaOptions = useMemo(
    () => decorateMauzaOptions(filters?.mauzas),
    [filters?.mauzas],
  );
  const unverifiedMauzaOptions = useMemo(
    () => decorateMauzaOptions(unverifiedMauzas),
    [unverifiedMauzas],
  );

  useEffect(() => {
    const existing = Array.isArray(filters?.selectedMauza)
      ? filters.selectedMauza
      : filters?.selectedMauza
        ? [filters.selectedMauza]
        : [];
    if (!existing.length || selectedMauzaKeys.length) return;

    const seeded = verifiedMauzaOptions
      .filter((mauza) =>
        existing.some((value) => String(getMauzaId(mauza)) === String(value)),
      )
      .map((mauza) => mauza._selectionKey);
    if (seeded.length) setSelectedMauzaKeys(seeded);
  }, [filters?.selectedMauza, verifiedMauzaOptions, selectedMauzaKeys.length]);

  useEffect(() => {
    const availableKeys = new Set(
      [...verifiedMauzaOptions, ...unverifiedMauzaOptions].map(
        (m) => m._selectionKey,
      ),
    );
    setSelectedMauzaKeys((previous) =>
      previous.filter((key) => availableKeys.has(key)),
    );
  }, [verifiedMauzaOptions, unverifiedMauzaOptions]);

  const activeMauzaOptions = useMemo(() => {
    if (boundaryStatus === "unverified") return unverifiedMauzaOptions;
    return verifiedMauzaOptions;
  }, [boundaryStatus, verifiedMauzaOptions, unverifiedMauzaOptions]);

  const activeSelectedMauzaDetails = useMemo(() => {
    return selectedMauzaKeys
      .map((selectionKey) => {
        const verified = verifiedMauzaOptions.find(
          (mauza) => mauza._selectionKey === selectionKey,
        );
        const unverified = unverifiedMauzaOptions.find(
          (mauza) => mauza._selectionKey === selectionKey,
        );

        if (boundaryStatus === "verified") return verified || null;
        if (boundaryStatus === "unverified") return unverified || null;
        if (!verified && !unverified) return null;

        return {
          ...(verified || unverified),
          _selectionKey: selectionKey,
          _verifiedMauzaId: getMauzaId(verified),
          _unverifiedMauzaId: getMauzaId(unverified),
        };
      })
      .filter(Boolean);
  }, [
    selectedMauzaKeys,
    verifiedMauzaOptions,
    unverifiedMauzaOptions,
    boundaryStatus,
  ]);

  const handleMauzaToggle = useCallback(
    (selectionKey) => {
      setSelectedMauzaKeys((previous) => {
        const exists = previous.includes(String(selectionKey));
        const next = exists
          ? previous.filter((key) => key !== String(selectionKey))
          : [...previous, String(selectionKey)];

        const firstSelected = activeMauzaOptions.find(
          (mauza) => mauza._selectionKey === next[0],
        );
        const firstSelectedMauzaId = getMauzaId(firstSelected) || "";

        // useCadastralFilters.handleMauzaChange expects a normal select event
        // and reads event.target.value. Pass a compatible event-shaped object
        // instead of sending the Mauza ID as a plain string.
        filters?.handleMauzaChange?.({
          target: { value: firstSelectedMauzaId },
          currentTarget: { value: firstSelectedMauzaId },
        });
        return next;
      });
      setParcelLookupMauzaKey("");
      setSelectedParcelNumber("");
      setSelectedMurabbaNumber("");
    },
    [activeMauzaOptions, filters],
  );

  const activeFilters = useMemo(() => {
    if (!filters) return filters;

    return {
      ...filters,
      mauzas: activeMauzaOptions,
      selectedMauza: selectedMauzaKeys,
      selectedMauzaDetails: activeSelectedMauzaDetails,
      selectedMauzaOptions: activeSelectedMauzaDetails,
      handleMauzaChange: handleMauzaToggle,
      loading: {
        ...(filters.loading || {}),
        mauzas:
          boundaryStatus === "unverified"
            ? unverifiedMauzasLoading
            : filters.loading?.mauzas,
      },
    };
  }, [
    filters,
    activeMauzaOptions,
    selectedMauzaKeys,
    activeSelectedMauzaDetails,
    handleMauzaToggle,
    boundaryStatus,
    unverifiedMauzasLoading,
  ]);

  const parcelLookupMauza = useMemo(
    () =>
      activeSelectedMauzaDetails.find(
        (mauza) => mauza._selectionKey === parcelLookupMauzaKey,
      ) || null,
    [activeSelectedMauzaDetails, parcelLookupMauzaKey],
  );

  const parcelLookupFeatures = useMemo(() => {
    const features = loadedParcelsGeojson?.features;
    if (!Array.isArray(features)) return [];
    if (activeSelectedMauzaDetails.length <= 1) return features;
    if (!parcelLookupMauza) return [];

    const ids = new Set(
      [
        getMauzaId(parcelLookupMauza),
        parcelLookupMauza?._verifiedMauzaId,
        parcelLookupMauza?._unverifiedMauzaId,
      ]
        .filter(
          (value) => value !== undefined && value !== null && value !== "",
        )
        .map(String),
    );
    const name = getMauzaNameValue(parcelLookupMauza).toLowerCase();

    return features.filter((feature) => {
      const props = feature?.properties || {};
      if (props._mauza_selection_key === parcelLookupMauzaKey) return true;
      const featureIds = [
        props.mauza_id,
        props.moza_id,
        props.mouza_id,
        props.mauza_gid,
      ]
        .filter(
          (value) => value !== undefined && value !== null && value !== "",
        )
        .map(String);
      if (featureIds.some((value) => ids.has(value))) return true;
      const featureName = String(
        props.mauza ?? props.mauza_name ?? props.moza ?? props.mouza ?? "",
      )
        .trim()
        .toLowerCase();
      return Boolean(name && featureName === name);
    });
  }, [
    loadedParcelsGeojson,
    activeSelectedMauzaDetails.length,
    parcelLookupMauza,
    parcelLookupMauzaKey,
  ]);

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
    setSelectedParcels([]);
  }, [selectedMauzaKeys.join("|"), filters?.viewBy, boundaryStatus]);

  useEffect(() => {
    const statusColor = boundaryStatus === "unverified" ? "#dc5a5a" : "#16a34a";

    // Only Khasra changes colour with verification status.
    // Mauza remains a black outline for both verified and unverified data.
    setLayers((prev) => ({
      ...prev,
      khasraLayer: {
        ...(typeof prev.khasraLayer === "object"
          ? prev.khasraLayer
          : { visible: !!prev.khasraLayer, opacity: 100 }),
        color: statusColor,
      },
    }));
  }, [boundaryStatus]);

  const murabbaOptions = useMemo(() => {
    if (!isMurabbaBasedKhasra) return [];
    const features = parcelLookupFeatures;
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
  }, [parcelLookupFeatures, isMurabbaBasedKhasra]);

  const khasraOptions = useMemo(() => {
    const features = parcelLookupFeatures;
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
        const valueRaw = getFeatureNumberByView(props, filters?.viewBy, f);

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
    parcelLookupFeatures,
    filters?.viewBy,
    isMurabbaBasedKhasra,
    selectedMurabbaNumber,
  ]);

  const standardParcelOptions = useMemo(() => {
    if (filters?.viewBy === "khasra" && isMurabbaBasedKhasra) return [];
    return khasraOptions;
  }, [filters?.viewBy, isMurabbaBasedKhasra, khasraOptions]);

  const selectedFilterLayers = useMemo(() => {
    if (!activeFilters) return [];

    const items = [];

    if (activeFilters?.selectedDistrictOptions?.length) {
      const label = activeFilters.selectedDistrictOptions
        .map((d) => d?.name)
        .filter(Boolean)
        .join(", ");
      items.push({
        key: "districtBoundary",
        label: `District: ${label || "Selected District"}`,
      });
    }

    if (activeFilters?.selectedTehsilOptions?.length) {
      const label = activeFilters.selectedTehsilOptions
        .map((t) => t?.name)
        .filter(Boolean)
        .join(", ");
      items.push({
        key: "tehsilBoundary",
        label: `Tehsil: ${label || "Selected Tehsil"}`,
      });
    }

    if (activeSelectedMauzaDetails.length) {
      const label = activeSelectedMauzaDetails
        .map((mauza) => getMauzaNameValue(mauza))
        .filter(Boolean)
        .join(", ");
      items.push({
        key: "mauzaBoundary",
        label: `Mauza: ${label || "Selected Mauza"}`,
      });
    }

    if (activeSelectedMauzaDetails.length && filters?.viewBy === "khasra") {
      items.push({
        key: "khasraLayer",
        label: selectedParcelNumber
          ? `Khasra: ${selectedParcelNumber}`
          : "Khasra Layer",
      });
    }

    if (activeSelectedMauzaDetails.length && filters?.viewBy === "square") {
      items.push({
        key: "squareLayer",
        label: selectedParcelNumber
          ? `Square: ${selectedParcelNumber}`
          : "Square Layer",
      });
    }

    if (activeSelectedMauzaDetails.length && filters?.viewBy === "acre") {
      items.push({
        key: "acreLayer",
        label: selectedParcelNumber
          ? `Acre: ${selectedParcelNumber}`
          : "Acre Layer",
      });
    }

    return items;
  }, [
    activeFilters,
    activeFilters?.selectedDistrictOptions,
    activeFilters?.selectedTehsilOptions,
    activeFilters?.selectedMauzaDetails,
    filters?.viewBy,
    selectedParcelNumber,
    activeSelectedMauzaDetails.length,
    parcelLookupMauzaKey,
  ]);

  const selectedMauzaKey = selectedMauzaKeys.join("|");

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

        if (
          VIEW_BY_BOUNDARY_KEYS.includes(key) &&
          next[key]?.visible !== true
        ) {
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
            : {
                visible: !!next[key],
                opacity: 100,
              };

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
        mauzaKey:
          activeSelectedMauzaDetails.length > 1 ? parcelLookupMauzaKey : "",
        murabbaNo: String(selectedMurabbaNumber),
        khasraNo: String(selectedParcelNumber),
      };
    }
    if (activeSelectedMauzaDetails.length > 1 && selectedParcelNumber) {
      return {
        mauzaKey: parcelLookupMauzaKey,
        parcelNo: String(selectedParcelNumber),
      };
    }
    return selectedParcelNumber;
  }, [
    filters?.viewBy,
    isMurabbaBasedKhasra,
    selectedMurabbaNumber,
    selectedParcelNumber,
    activeSelectedMauzaDetails.length,
    parcelLookupMauzaKey,
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

  const handleMultiParcelToggle = useCallback((feature) => {
    const key = getFeatureSelectionKey(feature);
    setSelectedParcels((previous) => {
      const exists = previous.some(
        (item) => getFeatureSelectionKey(item) === key,
      );
      return exists
        ? previous.filter((item) => getFeatureSelectionKey(item) !== key)
        : [...previous, feature];
    });
  }, []);

  const clearMultiSelection = useCallback(() => {
    setSelectedParcels([]);
  }, []);

  const handleMultiSelectionModeChange = useCallback((enabled) => {
    setMultiSelectionMode(enabled);
    setSelectedParcels([]);
    setParcelPanelOpen(false);
    setSelectedParcel(null);
  }, []);

  const handleMapReady = useCallback((map) => {
    setMapboxMap(map || null);
  }, []);

  // Reset the printMap flag immediately after it fires so it can be triggered again
  useEffect(() => {
    const isPrint =
      typeof layers?.printMap === "object"
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

      <MapPrinter
        mode="cadastral"
        map={mapboxMap}
        isMapReady={Boolean(mapboxMap)}
        filters={activeFilters || filters || {}}
        layers={layers}
        basemap={basemap}
        boundaryStatus={boundaryStatus}
      />

      <div
        ref={mapShellRef}
        className="relative flex-1 overflow-hidden bg-gradient-to-b from-blue-50 to-white"
      >
        <MapView
          selectedMauza={activeSelectedMauzaDetails}
          selectedDistrict={filters?.selectedDistrictOptions}
          selectedTehsil={filters?.selectedTehsilOptions}
          viewBy={filters?.viewBy}
          layers={layers}
          selectedFilterLayers={selectedFilterLayers}
          selectedRudaPhaseIds={selectedRudaPhaseIds}
          selectedProposedRoadIds={selectedProposedRoadIds}
          basemap={basemap}
          selectedFeatureNumber={selectedFeatureNumber}
          onFeaturesLoaded={(geojson, featureType) => {
            // Only let the active header view update its dropdown records.
            // This prevents hidden Square/Acre/Murabba loaders from replacing
            // the Khasra list after verified or RUDA Khasras are drawn.
            if (!featureType || featureType === filters?.viewBy) {
              setLoadedParcelsGeojson(geojson);
            }
          }}
          onParcelSelect={handleParcelSelect}
          multiSelectionMode={multiSelectionMode}
          selectedParcels={selectedParcels}
          onMultiParcelToggle={handleMultiParcelToggle}
          onMapReady={handleMapReady}
          boundaryStatus={boundaryStatus}
        />

        {/* <MapControls map={mapboxMap} fullscreenTargetRef={mapShellRef} /> */}
        {filters && (
          <SubHeader
            filters={activeFilters}
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
            parcelLookupMauzaKey={parcelLookupMauzaKey}
            onParcelLookupMauzaChange={(value) => {
              setParcelLookupMauzaKey(value);
              setSelectedParcelNumber("");
              setSelectedMurabbaNumber("");
            }}
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
          selectedMauza={activeSelectedMauzaDetails[0] || null}
          selectedDistrict={filters?.selectedDistrictOptions}
          selectedTehsil={filters?.selectedTehsilOptions}
          selectedFilterLayers={selectedFilterLayers}
          loadedParcelsGeojson={loadedParcelsGeojson}
          boundaryStatus={boundaryStatus}
          setBoundaryStatus={setBoundaryStatus}
          multiSelectionMode={multiSelectionMode}
          onMultiSelectionModeChange={handleMultiSelectionModeChange}
        />

        <Legend
          layers={layers}
          rudaPhases={rudaPhases}
          selectedRudaPhaseIds={selectedRudaPhaseIds}
          selectedProposedRoadIds={selectedProposedRoadIds}
        />

        {!multiSelectionMode && (
          <ParcelPanel
            parcel={selectedParcel}
            isOpen={parcelPanelOpen}
            onClose={handleParcelPanelClose}
            boundaryStatus={boundaryStatus}
          />
        )}

        <MultipleParcelPanel
          parcels={selectedParcels}
          isOpen={multiSelectionMode && selectedParcels.length > 0}
          onClear={clearMultiSelection}
          boundaryStatus={boundaryStatus}
          selectedMauza={activeSelectedMauzaDetails[0] || null}
          selectedDistrict={filters?.selectedDistrictOptions}
          selectedTehsil={filters?.selectedTehsilOptions}
        />
      </div>
    </div>
  );
}

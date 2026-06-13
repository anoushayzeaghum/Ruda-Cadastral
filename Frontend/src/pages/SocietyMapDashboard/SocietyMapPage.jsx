import { useOutletContext } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";

import Header from "./Header";
import SubHeader from "./SubHeader";
import LeftPanel from "./LeftPanel";
import ParcelPanel from "./ParcelPanel";
import MapView from "./Mapview";
import {
  getDistricts,
  getTehsils,
  getMauzas,
  getSocieties,
} from "../../services/api";

const toText = (value) => String(value ?? "");

const getDistrictId = (district) =>
  district?.id ?? district?.gid ?? district?.properties?.id;

const getTehsilId = (tehsil) =>
  tehsil?.id ?? tehsil?.gid ?? tehsil?.properties?.id;

const getMauzaId = (mauza) =>
  mauza?.mauza_id ??
  mauza?.properties?.mauza_id ??
  mauza?.id ??
  mauza?.gid;

const getSocietyPk = (society) =>
  society?.gid ?? society?.id ?? society?.objectid ?? society?.properties?.gid;

const normalizeLayer = (layer, defaultOpacity, defaultVisible = false) => {
  if (typeof layer === "object" && layer !== null) {
    return {
      visible: layer.visible !== false,
      opacity: Number.isFinite(Number(layer.opacity))
        ? Number(layer.opacity)
        : defaultOpacity,
    };
  }

  if (typeof layer === "boolean") {
    return {
      visible: layer,
      opacity: defaultOpacity,
    };
  }

  return {
    visible: defaultVisible,
    opacity: defaultOpacity,
  };
};

const sortByText = (items, key) =>
  [...items].sort((a, b) =>
    String(a?.[key] ?? "").localeCompare(String(b?.[key] ?? "")),
  );

export default function SocietyMapPage() {
  const outletContext = useOutletContext() ?? {};
  const localFilters = useSocietyFilters();

  // Society dashboard should work independently. If a parent layout provides
  // filters, it will still use them; otherwise it uses the local society filters.
  const filters = outletContext.filters ?? localFilters;

  const [selectedSocietyId, setSelectedSocietyId] = useState("");
  const [societyOptions, setSocietyOptions] = useState([]);
  const [societyLoading, setSocietyLoading] = useState(false);
  const [societyError, setSocietyError] = useState("");
  const [selectedSocietyFeature, setSelectedSocietyFeature] = useState(null);
  const [societyPanelOpen, setSocietyPanelOpen] = useState(false);
  const [selectionClearSignal, setSelectionClearSignal] = useState(0);

  const [rudaPhases, setRudaPhases] = useState([]);
  const [selectedRudaPhaseIds, setSelectedRudaPhaseIds] = useState([]);

  const [layers, setLayers] = useState({
    rudaBoundary: { visible: false, opacity: 10 },
    proposedRoads: { visible: false, opacity: 100 },

    districtBoundary: { visible: true, opacity: 0 },
    tehsilBoundary: { visible: true, opacity: 0 },
    mauzaBoundary: { visible: true, opacity: 0 },

    societyBoundary: { visible: false, opacity: 25 },
    masterPlan: { visible: false, opacity: 70 },
    spotLevel: { visible: false, opacity: 100 },
    contours: { visible: false, opacity: 100 },

    dem: { visible: false, opacity: 100 },
    dtm: { visible: false, opacity: 100 },
    orthoImage: { visible: false, opacity: 100 },
    satelliteView: { visible: false, opacity: 100 },
    droneImagery: { visible: false, opacity: 100 },
  });

  const [basemap, setBasemap] = useState("Streets");

  const selectedMauzaId = filters?.selectedMauza ?? "";

  useEffect(() => {
    let mounted = true;

    const loadSocieties = async () => {
      const mauzaId = selectedMauzaId;
      const mauzaName =
        filters?.selectedMauzaDetails?.mauza ||
        filters?.selectedMauzaDetails?.name ||
        filters?.selectedMauzaOption?.mauza ||
        filters?.selectedMauzaOption?.name ||
        "";

      setSelectedSocietyId("");
      setSelectedSocietyFeature(null);
      setSocietyPanelOpen(false);
      setSelectionClearSignal((prev) => prev + 1);
      setSocietyError("");

      setLayers((prev) => ({
        ...prev,
        societyBoundary: {
          ...normalizeLayer(prev.societyBoundary, 25),
          visible: false,
        },
        masterPlan: {
          ...normalizeLayer(prev.masterPlan, 70),
          visible: false,
        },
        spotLevel: {
          ...normalizeLayer(prev.spotLevel, 100),
          visible: false,
        },
        contours: {
          ...normalizeLayer(prev.contours, 100),
          visible: false,
        },
      }));

      if (!mauzaId && !mauzaName) {
        setSocietyOptions([]);
        setSocietyLoading(false);
        return;
      }

      try {
        setSocietyLoading(true);

        // First try by mauza_id. Also send mauza name so the backend can fall
        // back to name matching if an old society record has a different mauza_id.
        let list = await getSocieties({ mauza_id: mauzaId, mauza: mauzaName });

        // Extra frontend fallback for already-running backends that do not yet
        // support combined mauza_id + mauza filtering.
        if ((!Array.isArray(list) || !list.length) && mauzaName) {
          list = await getSocieties({ mauza: mauzaName });
        }

        if (!mounted) return;
        setSocietyOptions(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error("Failed to load societies", e);
        if (mounted) {
          setSocietyOptions([]);
          setSocietyError("Failed to load societies for selected mauza.");
        }
      } finally {
        if (mounted) setSocietyLoading(false);
      }
    };

    loadSocieties();

    return () => {
      mounted = false;
    };
  }, [selectedMauzaId, filters?.selectedMauzaDetails, filters?.selectedMauzaOption]);

  const selectedSociety = useMemo(() => {
    if (!selectedSocietyId) return null;

    return (
      societyOptions.find(
        (society) => toText(getSocietyPk(society)) === toText(selectedSocietyId),
      ) || null
    );
  }, [societyOptions, selectedSocietyId]);

  // When a society is selected, its boundary should become enabled automatically.
  // Other society datasets stay off until the user checks them from Vector Boundaries.
  useEffect(() => {
    setSelectedSocietyFeature(null);
    setSocietyPanelOpen(false);
    setSelectionClearSignal((prev) => prev + 1);

    setLayers((prev) => ({
      ...prev,
      societyBoundary: {
        ...normalizeLayer(prev.societyBoundary, 25),
        visible: !!selectedSociety,
      },
      masterPlan: selectedSociety
        ? normalizeLayer(prev.masterPlan, 70)
        : { ...normalizeLayer(prev.masterPlan, 70), visible: false },
      spotLevel: selectedSociety
        ? normalizeLayer(prev.spotLevel, 100)
        : { ...normalizeLayer(prev.spotLevel, 100), visible: false },
      contours: selectedSociety
        ? normalizeLayer(prev.contours, 100)
        : { ...normalizeLayer(prev.contours, 100), visible: false },
    }));
  }, [selectedSociety]);

  const selectedFilterLayers = useMemo(() => {
    if (!filters) return [];

    const items = [];

    if (filters?.selectedDistrictOptions?.length) {
      const label = filters.selectedDistrictOptions
        .map((district) => district?.name)
        .filter(Boolean)
        .join(", ");

      items.push({
        key: "districtBoundary",
        label: `District: ${label || "Selected District"}`,
      });
    }

    if (filters?.selectedTehsilOptions?.length) {
      const label = filters.selectedTehsilOptions
        .map((tehsil) => tehsil?.name)
        .filter(Boolean)
        .join(", ");

      items.push({
        key: "tehsilBoundary",
        label: `Tehsil: ${label || "Selected Tehsil"}`,
      });
    }

    if (filters?.selectedMauza || filters?.selectedMauzaDetails) {
      const label =
        filters.selectedMauzaDetails?.mauza ||
        filters.selectedMauzaDetails?.name ||
        `Mauza ${filters.selectedMauza}`;

      items.push({
        key: "mauzaBoundary",
        label: `Mauza: ${label}`,
      });
    }

    if (selectedSociety) {
      items.push({
        key: "societyBoundary",
        label: `Society: ${selectedSociety.society || "Selected Society"}`,
      });
    }

    return items;
  }, [filters, selectedSociety]);

  // Keep selected administrative boundary layers initialized as visible so
  // District, Tehsil, and Mauza boundaries draw immediately after dropdown selection.
  useEffect(() => {
    const activeKeys = new Set(selectedFilterLayers.map((item) => item.key));
    const managedKeys = [
      "districtBoundary",
      "tehsilBoundary",
      "mauzaBoundary",
      "societyBoundary",
    ];

    setLayers((prev) => {
      const next = { ...prev };
      let changed = false;

      managedKeys.forEach((key) => {
        if (!activeKeys.has(key)) return;

        const defaultOpacity = key === "societyBoundary" ? 25 : 0;
        const shouldBeVisible = key === "societyBoundary" ? !!selectedSociety : true;
        const current = next[key];

        if (!current || typeof current !== "object") {
          next[key] = {
            visible: shouldBeVisible,
            opacity: defaultOpacity,
          };
          changed = true;
          return;
        }

        if (current.visible !== shouldBeVisible && key !== "societyBoundary") {
          next[key] = {
            ...current,
            visible: shouldBeVisible,
          };
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [selectedFilterLayers, selectedSociety]);

  const handleParcelPanelClose = () => {
    setSocietyPanelOpen(false);
    setSelectedSocietyFeature(null);
    setSelectionClearSignal((prev) => prev + 1);
  };

  return (
    <div className="w-full h-screen flex flex-col bg-white">
      <Header />

      <div className="relative flex-1 overflow-hidden bg-gradient-to-b from-blue-50 to-white">
        <MapView
          selectedMauza={filters?.selectedMauzaDetails}
          selectedMauzaId={filters?.selectedMauza}
          selectedDistrict={filters?.selectedDistrictOptions}
          selectedTehsil={filters?.selectedTehsilOptions}
          selectedSociety={selectedSociety}
          layers={layers}
          selectedFilterLayers={selectedFilterLayers}
          selectedRudaPhaseIds={selectedRudaPhaseIds}
          basemap={basemap}
          clearSelectionSignal={selectionClearSignal}
          onParcelSelect={(feature) => {
            setSelectedSocietyFeature(feature);
            setSocietyPanelOpen(true);
          }}
        />

        {filters && (
          <SubHeader
            filters={filters}
            societyOptions={societyOptions}
            societyLoading={societyLoading}
            societyError={societyError}
            selectedSocietyId={selectedSocietyId}
            onSocietyChange={(value) => {
              setSelectedSocietyId(value);
              setSelectedSocietyFeature(null);
              setSocietyPanelOpen(false);
              setSelectionClearSignal((prev) => prev + 1);
            }}
          />
        )}

        <LeftPanel
          layers={layers}
          setLayers={setLayers}
          rudaPhases={rudaPhases}
          setRudaPhases={setRudaPhases}
          selectedRudaPhaseIds={selectedRudaPhaseIds}
          setSelectedRudaPhaseIds={setSelectedRudaPhaseIds}
          basemap={basemap}
          setBasemap={setBasemap}
          selectedMauza={filters?.selectedMauzaDetails || filters?.selectedMauza}
          selectedSociety={selectedSociety}
          selectedFilterLayers={selectedFilterLayers}
        />

        <ParcelPanel
          parcel={selectedSocietyFeature}
          isOpen={societyPanelOpen}
          onClose={handleParcelPanelClose}
        />
      </div>
    </div>
  );
}

function collectionToItems(collection) {
  if (Array.isArray(collection)) return collection;
  if (!Array.isArray(collection?.features)) return [];

  return collection.features.map((feature) => ({
    id:
      feature.id ??
      feature.properties?.id ??
      feature.properties?.mauza_id ??
      feature.properties?.gid,
    geometry: feature.geometry ?? null,
    ...feature.properties,
  }));
}

function dedupeBy(items, getKey) {
  const map = new Map();

  items.forEach((item) => {
    const key = getKey(item);
    if (key === undefined || key === null || key === "") return;
    if (!map.has(toText(key))) map.set(toText(key), item);
  });

  return Array.from(map.values());
}

function useSocietyFilters() {
  const [districts, setDistricts] = useState([]);
  const [tehsils, setTehsils] = useState([]);
  const [mauzas, setMauzas] = useState([]);

  const [selectedDistrict, setSelectedDistrict] = useState([]);
  const [selectedTehsil, setSelectedTehsil] = useState([]);
  const [selectedMauza, setSelectedMauza] = useState("");

  const [loading, setLoading] = useState({
    districts: false,
    tehsils: false,
    mauzas: false,
  });
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadDistricts = async () => {
      try {
        setLoading((prev) => ({ ...prev, districts: true }));
        setErrorMessage("");

        const data = await getDistricts();
        const items = collectionToItems(data);

        if (mounted) setDistricts(sortByText(items, "name"));
      } catch (error) {
        console.error("Failed to load districts", error);
        if (mounted) {
          setDistricts([]);
          setErrorMessage("Failed to load districts");
        }
      } finally {
        if (mounted) setLoading((prev) => ({ ...prev, districts: false }));
      }
    };

    loadDistricts();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadTehsils = async () => {
      setSelectedTehsil([]);
      setSelectedMauza("");
      setMauzas([]);

      if (!selectedDistrict.length) {
        setTehsils([]);
        return;
      }

      try {
        setLoading((prev) => ({ ...prev, tehsils: true }));
        setErrorMessage("");

        const lists = await Promise.all(
          selectedDistrict.map((districtId) => getTehsils(districtId)),
        );
        const merged = lists.flatMap(collectionToItems);
        const unique = dedupeBy(merged, getTehsilId);

        if (mounted) setTehsils(sortByText(unique, "name"));
      } catch (error) {
        console.error("Failed to load tehsils", error);
        if (mounted) {
          setTehsils([]);
          setErrorMessage("Failed to load tehsils");
        }
      } finally {
        if (mounted) setLoading((prev) => ({ ...prev, tehsils: false }));
      }
    };

    loadTehsils();

    return () => {
      mounted = false;
    };
  }, [selectedDistrict]);

  useEffect(() => {
    let mounted = true;

    const loadMauzas = async () => {
      setSelectedMauza("");

      if (!selectedTehsil.length) {
        setMauzas([]);
        return;
      }

      try {
        setLoading((prev) => ({ ...prev, mauzas: true }));
        setErrorMessage("");

        const lists = await Promise.all(
          selectedTehsil.map((tehsilId) => getMauzas(tehsilId)),
        );
        const merged = lists.flatMap(collectionToItems);
        const unique = dedupeBy(merged, getMauzaId);

        if (mounted) setMauzas(sortByText(unique, "mauza"));
      } catch (error) {
        console.error("Failed to load mauzas", error);
        if (mounted) {
          setMauzas([]);
          setErrorMessage("Failed to load mauzas");
        }
      } finally {
        if (mounted) setLoading((prev) => ({ ...prev, mauzas: false }));
      }
    };

    loadMauzas();

    return () => {
      mounted = false;
    };
  }, [selectedTehsil]);

  const handleDistrictChange = (value) => {
    const id = toText(value?.target ? value.target.value : value);
    if (!id) return;

    setSelectedDistrict((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleTehsilChange = (value) => {
    const id = toText(value?.target ? value.target.value : value);
    if (!id) return;

    setSelectedTehsil((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleMauzaChange = (eventOrValue) => {
    const value = eventOrValue?.target ? eventOrValue.target.value : eventOrValue;
    setSelectedMauza(toText(value));
  };

  const selectedDistrictOptions = districts.filter((district) =>
    selectedDistrict.includes(toText(getDistrictId(district))),
  );

  const selectedTehsilOptions = tehsils.filter((tehsil) =>
    selectedTehsil.includes(toText(getTehsilId(tehsil))),
  );

  const selectedMauzaDetails =
    mauzas.find((mauza) => toText(getMauzaId(mauza)) === toText(selectedMauza)) ||
    (selectedMauza
      ? {
          id: selectedMauza,
          mauza_id: selectedMauza,
          mauza: `Mauza ${selectedMauza}`,
        }
      : null);

  return {
    districts,
    tehsils,
    mauzas,
    selectedDistrict,
    selectedTehsil,
    selectedMauza,
    selectedDistrictOptions,
    selectedTehsilOptions,
    selectedMauzaDetails,
    selectedDistrictOption: selectedDistrictOptions[0] || null,
    selectedTehsilOption: selectedTehsilOptions[0] || null,
    selectedMauzaOption: selectedMauzaDetails,
    loading,
    errorMessage,
    hasSelection:
      !!selectedDistrict.length || !!selectedTehsil.length || !!selectedMauza,
    handleDistrictChange,
    handleTehsilChange,
    handleMauzaChange,
    resetFilters: () => {
      setSelectedDistrict([]);
      setSelectedTehsil([]);
      setSelectedMauza("");
      setTehsils([]);
      setMauzas([]);
      setErrorMessage("");
    },
  };
}

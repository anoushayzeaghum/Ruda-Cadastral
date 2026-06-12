import { useOutletContext } from "react-router-dom";
import React, { useState, useMemo, useEffect } from "react";

import Header from "./Header";
import SubHeader from "./SubHeader";
import LeftPanel from "./LeftPanel";
import ParcelPanel from "./ParcelPanel";
import MapView from "./Mapview";
import { getDistricts, getTehsils, getMauzas, getSocieties } from "../../services/api";

export default function SocietyMapPage() {
  const outletContext = useOutletContext() ?? {};
  const localFilters = useSocietyFilters();
  const filters = outletContext.filters ?? localFilters;

  const [selectedSocietyId, setSelectedSocietyId] = useState("");
  const [societyOptions, setSocietyOptions] = useState([]);
  const [selectedSocietyFeature, setSelectedSocietyFeature] = useState(null);
  const [societyPanelOpen, setSocietyPanelOpen] = useState(false);

  const [layers, setLayers] = useState({
    districtBoundary: { visible: true, opacity: 0 },
    tehsilBoundary: { visible: true, opacity: 0 },
    mauzaBoundary: { visible: true, opacity: 0 },
    societyBoundary: { visible: true, opacity: 25 },
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

  useEffect(() => {
    let mounted = true;

    const loadSocieties = async () => {
      const mauzaId = filters?.selectedMauza;

      setSelectedSocietyId("");
      setSelectedSocietyFeature(null);
      setSocietyPanelOpen(false);

      if (!mauzaId) {
        setSocietyOptions([]);
        return;
      }

      try {
        const list = await getSocieties(mauzaId);
        if (!mounted) return;
        setSocietyOptions(list || []);
      } catch (e) {
        console.error("Failed to load societies", e);
        if (mounted) setSocietyOptions([]);
      }
    };

    loadSocieties();

    return () => {
      mounted = false;
    };
  }, [filters?.selectedMauza]);

  const selectedSociety = useMemo(() => {
    return (
      societyOptions.find((s) => String(s.gid ?? s.id) === String(selectedSocietyId)) ||
      null
    );
  }, [societyOptions, selectedSocietyId]);

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
      items.push({ key: "mauzaBoundary", label: `Mauza: ${label}` });
    }

    if (selectedSociety) {
      items.push({
        key: "societyBoundary",
        label: `Society: ${selectedSociety.society || "Selected Society"}`,
      });
    }

    return items;
  }, [filters, selectedSociety]);

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
        if (!next[key]) {
          next[key] = { visible: true, opacity: key === "societyBoundary" ? 25 : 0 };
          changed = true;
        } else if (typeof next[key] !== "object") {
          next[key] = { visible: !!next[key], opacity: key === "societyBoundary" ? 25 : 0 };
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [selectedFilterLayers]);

  return (
    <div className="w-full h-screen flex flex-col bg-white">
      <Header />

      <div className="relative flex-1 overflow-hidden bg-gradient-to-b from-blue-50 to-white">
        <MapView
          selectedMauza={filters?.selectedMauzaDetails}
          selectedDistrict={filters?.selectedDistrictOptions}
          selectedTehsil={filters?.selectedTehsilOptions}
          selectedSociety={selectedSociety}
          layers={layers}
          selectedFilterLayers={selectedFilterLayers}
          basemap={basemap}
          onParcelSelect={(feature) => {
            setSelectedSocietyFeature(feature);
            setSocietyPanelOpen(true);
          }}
        />

        {filters && (
          <SubHeader
            filters={filters}
            societyOptions={societyOptions}
            selectedSocietyId={selectedSocietyId}
            onSocietyChange={setSelectedSocietyId}
          />
        )}

        <LeftPanel
          layers={layers}
          setLayers={setLayers}
          basemap={basemap}
          setBasemap={setBasemap}
          selectedSociety={selectedSociety}
          selectedFilterLayers={selectedFilterLayers}
        />

        <ParcelPanel
          parcel={selectedSocietyFeature}
          isOpen={societyPanelOpen}
          onClose={() => setSocietyPanelOpen(false)}
        />
      </div>
    </div>
  );
}


function collectionToItems(collection) {
  if (Array.isArray(collection)) return collection;
  if (!Array.isArray(collection?.features)) return [];

  return collection.features.map((feature) => ({
    id: feature.id ?? feature.properties?.id ?? feature.properties?.gid,
    geometry: feature.geometry ?? null,
    ...feature.properties,
  }));
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
        const data = await getDistricts();
        if (mounted) setDistricts(collectionToItems(data));
      } catch (error) {
        console.error("Failed to load districts", error);
        if (mounted) setErrorMessage("Failed to load districts");
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
        const lists = await Promise.all(selectedDistrict.map((id) => getTehsils(id)));
        const merged = lists.flatMap(collectionToItems);
        const unique = Array.from(
          new Map(merged.map((item) => [String(item.id ?? item.gid), item])).values(),
        );
        if (mounted) setTehsils(unique);
      } catch (error) {
        console.error("Failed to load tehsils", error);
        if (mounted) setErrorMessage("Failed to load tehsils");
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
        const lists = await Promise.all(selectedTehsil.map((id) => getMauzas(id)));
        const merged = lists.flatMap(collectionToItems);
        const unique = Array.from(
          new Map(merged.map((item) => [String(item.mauza_id ?? item.gid), item])).values(),
        );
        if (mounted) setMauzas(unique);
      } catch (error) {
        console.error("Failed to load mauzas", error);
        if (mounted) setErrorMessage("Failed to load mauzas");
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
    setSelectedDistrict((prev) =>
      prev.includes(String(value))
        ? prev.filter((item) => item !== String(value))
        : [...prev, String(value)],
    );
  };

  const handleTehsilChange = (value) => {
    setSelectedTehsil((prev) =>
      prev.includes(String(value))
        ? prev.filter((item) => item !== String(value))
        : [...prev, String(value)],
    );
  };

  const handleMauzaChange = (eventOrValue) => {
    const value = eventOrValue?.target ? eventOrValue.target.value : eventOrValue;
    setSelectedMauza(String(value || ""));
  };

  const selectedDistrictOptions = districts.filter((item) =>
    selectedDistrict.includes(String(item.id)),
  );
  const selectedTehsilOptions = tehsils.filter((item) =>
    selectedTehsil.includes(String(item.id)),
  );
  const selectedMauzaDetails =
    mauzas.find((item) => String(item.mauza_id) === String(selectedMauza)) || null;

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
    hasSelection: !!selectedDistrict.length || !!selectedTehsil.length || !!selectedMauza,
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

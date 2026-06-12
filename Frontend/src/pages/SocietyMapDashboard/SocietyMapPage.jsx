import { useOutletContext } from "react-router-dom";
import React, { useState, useMemo, useEffect } from "react";

import Header from "./Header";
import SubHeader from "./SubHeader";
import LeftPanel from "./LeftPanel";
import ParcelPanel from "./ParcelPanel";
import MapView from "./Mapview";
import { getSocieties } from "../../services/api";

export default function SocietyMapPage() {
  const outletContext = useOutletContext() ?? {};
  const filters = outletContext.filters;

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

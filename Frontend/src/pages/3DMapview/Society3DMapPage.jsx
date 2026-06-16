import { useEffect, useMemo, useState } from "react";

import Society3DHeader from "./Society3DHeader";
import Society3DSubHeader from "./Society3DSubHeader";
import Society3DMapview from "./Society3DMapview";
import Society3DLayerPanel from "./Society3DLayerPanel";
import Society3DExtrusionPanel from "./Society3DExtrusionPanel";
import Society3DInfoPanel from "./Society3DInfoPanel";
import { getDistricts, getItemId, getLabel, getMauzaId, getMauzas, getSocieties, getSocietyId, getTehsils } from "./api";
import { getFeatureId } from "./cesiumHelpers";

const initialLayers = {
  societyBoundary: { visible: false, opacity: 35 },
  masterPlan: { visible: false, opacity: 15 },
  plots3d: { visible: false, opacity: 100 },
  buildings3d: { visible: false, opacity: 100 },
  roads: { visible: false, opacity: 100 },
  greenSpaces: { visible: false, opacity: 100 },
  spotLevel: { visible: false, opacity: 100 },
  contours: { visible: false, opacity: 100 },
};

export default function Society3DMapPage() {
  const filters = useSociety3DFilters({
  selectedDistrict: "18",   // Lahore ID
  selectedTehsil: "16",     // Shalimar ID
  selectedMauza: "1",       // Handu Gujran ID
});

  const [societies, setSocieties] = useState([]);
  const [selectedSocietyId, setSelectedSocietyId] = useState("");
  const [societyLoading, setSocietyLoading] = useState(false);
  const [societyError, setSocietyError] = useState("");

  const [layers, setLayers] = useState(initialLayers);
  const [basemap, setBasemap] = useState("Streets");
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);
  const [clearSelectionSignal, setClearSelectionSignal] = useState(0);

  const filtersReady =
  filters.selectedDistrict &&
  filters.selectedTehsil &&
  filters.selectedMauza;

if (!filtersReady) {
  return <div>Loading map filters...</div>;
}

  const [extrusion, setExtrusion] = useState({
    heightFeet: 100,
    color: "#22d3ee",
    extrudeFrom: "base",
  });
  const [appliedExtrusions, setAppliedExtrusions] = useState({});


useEffect(() => {
  let mounted = true;

  const loadSocieties = async () => {
    // ❌ STOP EARLY UNTIL EVERYTHING IS READY
    if (
      !filters.selectedDistrict ||
      !filters.selectedTehsil ||
      !filters.selectedMauza
    ) return;

    setSelectedSocietyId("");
    setSelectedFeature(null);
    setInfoPanelOpen(false);
    setClearSelectionSignal((prev) => prev + 1);
    setSocietyError("");
    setSocieties([]);
    setLayers(initialLayers);
    setAppliedExtrusions({});

    try {
      setSocietyLoading(true);

      const selectedMauzaObject = filters.mauzas.find(
        (mauza) =>
          String(getMauzaId(mauza)) === String(filters.selectedMauza)
      );

      const mauzaName = getLabel(
        selectedMauzaObject,
        ["mauza", "name", "mauza_name"],
        ""
      );

      const data = await getSocieties({
        mauza_id: filters.selectedMauza,
        mauza: mauzaName,
      });

      if (!mounted) return;

      const societyList = Array.isArray(data) ? data : [];
      setSocieties(societyList);

      // =========================
      // AUTO SELECT SOCIETY (FIXED)
      // =========================
      const defaultSociety =
        societyList.find(
          (s) =>
            String(getSocietyId(s)) === "1" ||
            String(s.society_id) === "1" ||
            s.society === "Chaharbagh Phase 1"
        ) || societyList[0]; // fallback FIRST item

      if (defaultSociety) {
        setSelectedSocietyId(String(getSocietyId(defaultSociety)));
      }
    } catch (error) {
      console.error("Failed to load societies", error);
      if (mounted) {
        setSocieties([]);
        setSocietyError("Failed to load societies.");
      }
    } finally {
      if (mounted) setSocietyLoading(false);
    }
  };

  loadSocieties();

  return () => {
    mounted = false;
  };
}, [
  filters.selectedDistrict,
  filters.selectedTehsil,
  filters.selectedMauza,
]);

  const selectedSociety = useMemo(() => {
    if (!selectedSocietyId) return null;
    return societies.find((society) => String(getSocietyId(society)) === String(selectedSocietyId)) || null;
  }, [societies, selectedSocietyId]);

  useEffect(() => {
    setSelectedFeature(null);
    setInfoPanelOpen(false);
    setClearSelectionSignal((prev) => prev + 1);
    setAppliedExtrusions({});

    setLayers((prev) => ({
      ...prev,
      societyBoundary: { ...prev.societyBoundary, visible: Boolean(selectedSociety) },
      // Keep the flat purple master plan off by default so it does not cover the colored 3D visualization.
      masterPlan: { ...prev.masterPlan, visible: false },
      plots3d: { ...prev.plots3d, visible: Boolean(selectedSociety) },
      buildings3d: { ...prev.buildings3d, visible: false },
      roads: { ...prev.roads, visible: false },
      greenSpaces: { ...prev.greenSpaces, visible: false },
      spotLevel: { ...prev.spotLevel, visible: false },
      contours: { ...prev.contours, visible: false },
    }));
  }, [selectedSociety]);

  const handleFeatureSelect = (feature) => {
    setSelectedFeature(feature);
    setInfoPanelOpen(Boolean(feature));
  };

  const applyExtrusionToSelected = () => {
    if (!selectedFeature) return;

    const featureId = getFeatureId(selectedFeature);
    const heightFeet = Number(extrusion.heightFeet || 35);

    setAppliedExtrusions((prev) => ({
      ...prev,
      [featureId]: {
        heightMeters: heightFeet * 0.3048,
        color: extrusion.color,
        extrudeFrom: extrusion.extrudeFrom,
      },
    }));
  };

  const clearExtrusions = () => {
    setAppliedExtrusions({});
  };

  const closeInfoPanel = () => {
    setInfoPanelOpen(false);
    setSelectedFeature(null);
    setClearSelectionSignal((prev) => prev + 1);
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-950">
      <Society3DHeader />

      <main className="relative min-h-0 flex-1 overflow-hidden">
        <Society3DMapview
          selectedDistrict={filters.selectedDistrict}
          selectedTehsil={filters.selectedTehsil}
          selectedMauza={filters.selectedMauza}
          selectedSociety={selectedSociety}
          layers={layers}
          basemap={basemap}
          extrusion={extrusion}
          appliedExtrusions={appliedExtrusions}
          onFeatureSelect={handleFeatureSelect}
          clearSelectionSignal={clearSelectionSignal}
        />

        <Society3DSubHeader
          districts={filters.districts}
          tehsils={filters.tehsils}
          mauzas={filters.mauzas}
          societies={societies}
          selectedDistrict={filters.selectedDistrict}
          selectedTehsil={filters.selectedTehsil}
          selectedMauza={filters.selectedMauza}
          selectedSociety={selectedSocietyId}
          loading={{ ...filters.loading, societies: societyLoading }}
          onDistrictChange={filters.setSelectedDistrict}
          onTehsilChange={filters.setSelectedTehsil}
          onMauzaChange={filters.setSelectedMauza}
          onSocietyChange={setSelectedSocietyId}
        />

        <Society3DExtrusionPanel
          extrusion={extrusion}
          setExtrusion={setExtrusion}
          selectedFeature={selectedFeature}
          onApplyToSelected={applyExtrusionToSelected}
          onClearExtrusions={clearExtrusions}
        />

        <Society3DLayerPanel
          layers={layers}
          setLayers={setLayers}
          basemap={basemap}
          setBasemap={setBasemap}
          selectedSociety={selectedSociety}
        />

        <Society3DInfoPanel feature={selectedFeature} isOpen={infoPanelOpen} onClose={closeInfoPanel} />

        {societyError && (
          <div className="absolute left-1/2 top-[88px] z-40 -translate-x-1/2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 shadow">
            {societyError}
          </div>
        )}
      </main>
    </div>
  );
}

function useSociety3DFilters(initialValues = {}) {
  const [districts, setDistricts] = useState([]);
  const [tehsils, setTehsils] = useState([]);
  const [mauzas, setMauzas] = useState([]);

  const [selectedDistrict, setSelectedDistrictValue] = useState(initialValues.selectedDistrict || "");
  const [selectedTehsil, setSelectedTehsilValue] = useState(initialValues.selectedTehsil || "");
  const [selectedMauza, setSelectedMauzaValue] = useState(initialValues.selectedMauza || "");

  const [loading, setLoading] = useState({
    districts: false,
    tehsils: false,
    mauzas: false,
  });

  // =========================
  // 1. LOAD DISTRICTS FIRST
  // =========================
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading((p) => ({ ...p, districts: true }));

      try {
        const data = await getDistricts();
        if (!mounted) return;

        setDistricts(data || []);

        const lahore = data?.find((d) => String(getItemId(d)) === "18");
        if (lahore) setSelectedDistrictValue("18");
      } finally {
        if (mounted) setLoading((p) => ({ ...p, districts: false }));
      }
    };

    load();
    return () => (mounted = false);
  }, []);

  // =========================
  // 2. LOAD TEHSIL AFTER DISTRICT
  // =========================
  useEffect(() => {
    if (!selectedDistrict) return;

    let mounted = true;

    const load = async () => {
      setLoading((p) => ({ ...p, tehsils: true }));

      try {
        const data = await getTehsils(selectedDistrict);
        if (!mounted) return;

        setTehsils(data || []);

        const shalimar = data?.find((t) => String(getItemId(t)) === "16");
        if (shalimar) setSelectedTehsilValue("16");
      } finally {
        if (mounted) setLoading((p) => ({ ...p, tehsils: false }));
      }
    };

    load();
    return () => (mounted = false);
  }, [selectedDistrict]);

  // =========================
  // 3. LOAD MAUZA AFTER TEHSIL
  // =========================
  useEffect(() => {
    if (!selectedTehsil) return;

    let mounted = true;

    const load = async () => {
      setLoading((p) => ({ ...p, mauzas: true }));

      try {
        const data = await getMauzas(selectedTehsil);
        if (!mounted) return;

        setMauzas(data || []);

        const defaultMauza = data?.find((m) => String(getItemId(m)) === "1");
        if (defaultMauza) setSelectedMauzaValue("1");
      } finally {
        if (mounted) setLoading((p) => ({ ...p, mauzas: false }));
      }
    };

    load();
    return () => (mounted = false);
  }, [selectedTehsil]);

  return {
    districts,
    tehsils,
    mauzas,
    selectedDistrict,
    selectedTehsil,
    selectedMauza,
    loading,
    setSelectedDistrict: setSelectedDistrictValue,
    setSelectedTehsil: setSelectedTehsilValue,
    setSelectedMauza: setSelectedMauzaValue,
  };
}
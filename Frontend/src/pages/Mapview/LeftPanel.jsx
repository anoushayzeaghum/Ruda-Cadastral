import { useEffect, useMemo, useRef, useState } from "react";
import {
  Layers,
  Wrench,
  MapPin,
  Satellite,
  Ruler,
  ChevronRight,
  Map,
  Info,
  Search,
  ChevronDown,
  Crosshair,
  SquareDashedIcon,
  Compass,
  Printer,
  CircleDot,
  Network,
  Route,
  Image as ImageIcon,
  X,
  Table2,
} from "lucide-react";
import Measurement from "../GISMetaverse/tools/Measurement";

import RudaBoundaryAttribute from "../GISMetaverse/tools/Layers/AttributeTable/RudaBoundaryAttribute";
import RudaMozaBoundaryAttribute from "../GISMetaverse/tools/Layers/AttributeTable/RudaMozaBoundaryAttribute";
import ProposedRoadAttribute from "../GISMetaverse/tools/Layers/AttributeTable/ProposedRoadAttribute";
import GeodeticNetworkAttribute from "../GISMetaverse/tools/Layers/AttributeTable/GeodeticNetworkAttribute";
import MauzaBoundaryAttribute from "../GISMetaverse/tools/Layers/AttributeTable/MauzaBoundaryAttribute";

const getMauzaName = (selectedMauza) => {
  if (!selectedMauza) return "";
  return (
    selectedMauza?.mauza ??
    selectedMauza?.name ??
    selectedMauza?.Mauza ??
    selectedMauza?.moza ??
    selectedMauza?.mouza ??
    ""
  ).trim();
};

const ORTHO_TILE_NAME_BY_MAUZA = {
  "handu gujran": "Handu_Gujran_Ortho",
  "lakho dair": "Lakho_Dair_Ortho",
};

const getOrthoTileNameFromMauzaName = (mauzaName = "") => {
  const normalized = String(mauzaName || "").trim().toLowerCase();
  return ORTHO_TILE_NAME_BY_MAUZA[normalized] || "";
};

const getOrthoTileUrlFromMauza = (selectedMauza) => {
  const tileName = getOrthoTileNameFromMauzaName(getMauzaName(selectedMauza));
  return tileName
    ? `https://rudametaverse.nespakprogresscenter.com/tiles/data/${tileName}/{z}/{x}/{y}.png`
    : "";
};

// Hook — true when viewport width is below the sm breakpoint (640 px)
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 640,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isMobile;
}
import KhasraBoundaryAttribute from "../GISMetaverse/tools/Layers/AttributeTable/KhasraBoundaryAttribute";
import SquareBoundaryAttribute from "../GISMetaverse/tools/Layers/AttributeTable/SquareBoundaryAttribute";
import DistrictBoundaryAttribute from "../GISMetaverse/tools/Layers/AttributeTable/DistrictBoundaryAttribute";
import TehsilBoundaryAttribute from "../GISMetaverse/tools/Layers/AttributeTable/TehsilBoundaryAttribute";
import AcreBoundaryAttribute from "../GISMetaverse/tools/Layers/AttributeTable/AcreBoundaryAttribute";
import TriJunctionPointsAttribute from "../GISMetaverse/tools/Layers/AttributeTable/TriJunctionPointsAttribute";
import FieldPointsAttribute from "../GISMetaverse/tools/Layers/AttributeTable/FieldPointsAttribute";

const BASEMAPS = [
  {
    name: "Satellite",
    preview:
      "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/13/4640/3075",
  },
  {
    name: "Streets",
    preview:
      "https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/13/4640/3075",
  },
  {
    name: "Light",
    preview: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6",
  },
  {
    name: "Dark",
    preview: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21",
  },
  {
    name: "Outdoors",
    preview: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  },
];

const VECTOR_BOUNDARY_LAYERS = [
  { key: "khasraLayer", label: "Khasra Boundary" },
  { key: "squareLayer", label: "Square Boundary" },
  { key: "acreLayer", label: "Acre Boundary" },
  { key: "triJunctionPoints", label: "Tri Junction Points" },
  { key: "fieldPoints", label: "Field Points" },
];

const RASTER_DATA_LAYERS = [{ key: "mussaviLayer", label: "Massavi" }];

const RUDA_PHASE_COLORS = [
  "#6bb7e8",
  "#f8d56b",
  "#6bd69a",
  "#f59e72",
  "#b99cf3",
  "#78d6d0",
  "#f3a6c8",
  "#a7d77b",
  "#f4b860",
  "#86a8e7",
  "#d7b377",
  "#8dd3c7",
];

const hashString = (value = "") => {
  const text = String(value || "");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const getRudaPhaseColor = (phaseId) => {
  const index = Math.abs(Number(phaseId) || hashString(phaseId || "ruda"));
  return RUDA_PHASE_COLORS[index % RUDA_PHASE_COLORS.length];
};

export default function LeftPanel({
  map,
  layers,
  setLayers,
  rudaPhases,
  setRudaPhases,
  selectedRudaPhaseIds,
  setSelectedRudaPhaseIds,
  selectedProposedRoadIds,
  setSelectedProposedRoadIds,
  basemap,
  setBasemap,
  selectedMauza,
  selectedDistrict = [],
  selectedTehsil = [],
  selectedFilterLayers = [],
  loadedParcelsGeojson = null,
}) {
  const [activePanel, setActivePanel] = useState("layers");
  const [rudaSectionOpen, setRudaSectionOpen] = useState(true);
  const [rudaDropdownOpen, setRudaDropdownOpen] = useState(false);
  const hasMauza = !!selectedMauza;
  const initializedOpacityKeysRef = useRef(new Set());
  const [openAttributeTable, setOpenAttributeTable] = useState(null);
  const [dropdownOpenByKey, setDropdownOpenByKey] = useState({});
  const [layerRecordCache, setLayerRecordCache] = useState({});
  const isMobile = useIsMobile();

  const toggleDropdownForKey = (key) =>
    setDropdownOpenByKey((prev) => ({ ...prev, [key]: !prev[key] }));

  const [rudaProposedRoads, setRudaProposedRoads] = useState([]);
  const [proposedDropdownOpen, setProposedDropdownOpen] = useState(false);

  const [layerAvailability, setLayerAvailability] = useState({
    khasra: false,
    square: false,
    acre: false,
    murabba: false,
  });

  const getDefaultOpacityForSelectedLayer = (item) => {
    const text = `${item?.key || ""} ${item?.label || ""}`.toLowerCase();

    if (
      text.includes("district") ||
      text.includes("tehsil") ||
      text.includes("mauza")
    ) {
      return 0;
    }

    if (text.includes("khasra") || text.includes("murabba")) {
      return 25;
    }

    return 100;
  };

  const getDefaultColorForLayer = (layerKey) => {
    const defaults = {
      rudaBoundary: "#22c55e",
      proposedRoads: "#ef4444",
      geodeticNetwork: "#d81d1d",
      districtBoundary: "#f59e0b",
      tehsilBoundary: "#06b6d4",
      mauzaBoundary: "#a3e635",
      khasraLayer: "#f97316",
      squareLayer: "#8b5cf6",
      acreLayer: "#14b8a6",
      triJunctionPoints: "#e11d48",
      fieldPoints: "#2563eb",
      murabbaLayer: "#facc15",
      mussaviLayer: "#9be37b",
    };
    return defaults[layerKey] || "#9be37b";
  };

  const getLayerColor = (layerKey) => {
    const value = layers?.[layerKey];
    return typeof value === "object" && value.color
      ? value.color
      : getDefaultColorForLayer(layerKey);
  };

  const setLayerColor = (layerKey, color) => updateLayer(layerKey, { color });

  const selectedMauzaId =
    selectedMauza?.mauza_id ?? selectedMauza?.id ?? selectedMauza?.gid;

  const massaviTileUrl = getOrthoTileUrlFromMauza(selectedMauza);
  const massaviLayerDisabled = !massaviTileUrl;
  const rasterLayerItems = RASTER_DATA_LAYERS.map((item) => ({
    ...item,
    disabled: item.key === "mussaviLayer" ? massaviLayerDisabled : false,
  }));

  const loadLayerRecords = async (key) => {
    if (layerRecordCache[key]?.loaded) return;

    try {
      const api = await import("../../services/api");
      let geojson = null;

      if (key === "districtBoundary") {
        const items = Array.isArray(selectedDistrict)
          ? selectedDistrict
          : selectedDistrict
            ? [selectedDistrict]
            : [];
        const features = [];
        for (const d of items) {
          const id = d?.id ?? d?.gid ?? d;
          if (!id) continue;
          const gj = await api.getDistrictBoundary(id);
          features.push(...(gj?.features || []));
        }
        geojson = { type: "FeatureCollection", features };
      } else if (key === "tehsilBoundary") {
        const items = Array.isArray(selectedTehsil)
          ? selectedTehsil
          : selectedTehsil
            ? [selectedTehsil]
            : [];
        const features = [];
        for (const t of items) {
          const id = t?.id ?? t?.gid ?? t;
          if (!id) continue;
          const gj = await api.getTehsilBoundary(id);
          features.push(...(gj?.features || []));
        }
        geojson = { type: "FeatureCollection", features };
      } else if (key === "mauzaBoundary") {
        geojson = selectedMauzaId
          ? await api.getMauzaBoundary(selectedMauzaId)
          : null;
      } else if (key === "khasraLayer") {
        geojson = selectedMauzaId
          ? await api.getKhasras(selectedMauzaId)
          : loadedParcelsGeojson;
      } else if (key === "squareLayer") {
        geojson = selectedMauzaId
          ? await api.getSquares(selectedMauzaId)
          : loadedParcelsGeojson;
      } else if (key === "acreLayer") {
        geojson = selectedMauzaId
          ? await api.getAcres(selectedMauzaId)
          : loadedParcelsGeojson;
      } else if (key === "triJunctionPoints") {
        geojson = await api.getTrijunctionPoints();
      } else if (key === "fieldPoints") {
        geojson = selectedMauzaId
          ? await api.getFieldPoints(selectedMauzaId)
          : null;
      }

      setLayerRecordCache((prev) => ({
        ...prev,
        [key]: {
          loaded: true,
          geojson: geojson || { type: "FeatureCollection", features: [] },
        },
      }));
    } catch (error) {
      console.error(`Failed to load ${key} records`, error);
      setLayerRecordCache((prev) => ({
        ...prev,
        [key]: {
          loaded: true,
          geojson: { type: "FeatureCollection", features: [] },
        },
      }));
    }
  };

  const selectedLayerItems = useMemo(
    () => selectedFilterLayers.filter((item) => item?.label && item?.key),
    [selectedFilterLayers],
  );
  useEffect(() => {
    setLayers((prev) => {
      let changed = false;
      const next = { ...prev };

      const rudaLayerDefaults = {
        rudaBoundary: 70,
        proposedRoads: 100,
        geodeticNetwork: 100,
      };

      Object.entries(rudaLayerDefaults).forEach(([key, opacity]) => {
        if (initializedOpacityKeysRef.current.has(key)) return;

        const current = next[key];
        next[key] = {
          ...(typeof current === "object" ? current : { visible: !!current }),
          opacity,
          color: getDefaultColorForLayer(key),
        };
        initializedOpacityKeysRef.current.add(key);
        changed = true;
      });

      selectedLayerItems.forEach((item) => {
        if (!item?.key || initializedOpacityKeysRef.current.has(item.key))
          return;

        const current = next[item.key];
        next[item.key] = {
          ...(typeof current === "object"
            ? current
            : { visible: current === undefined ? true : !!current }),
          opacity: getDefaultOpacityForSelectedLayer(item),
          color: getDefaultColorForLayer(item.key),
        };
        initializedOpacityKeysRef.current.add(item.key);
        changed = true;
      });

      return changed ? next : prev;
    });
  }, [selectedLayerItems, setLayers]);

  const updateLayer = (layerKey, patch) => {
    setLayers((prev) => ({
      ...prev,
      [layerKey]: {
        ...(typeof prev?.[layerKey] === "object"
          ? prev[layerKey]
          : {
              visible: !!prev?.[layerKey],
              opacity: 100,
              color: getDefaultColorForLayer(layerKey),
            }),
        color: getLayerColor(layerKey),
        ...patch,
      },
    }));
  };

  const getLayerVisible = (layerKey) => {
    const value = layers?.[layerKey];
    return typeof value === "object" ? !!value.visible : !!value;
  };

  const getLayerOpacity = (layerKey) => {
    const value = layers?.[layerKey];
    return typeof value === "object" && Number.isFinite(Number(value.opacity))
      ? Number(value.opacity)
      : 100;
  };

  const toggleLayer = (layerKey) =>
    updateLayer(layerKey, { visible: !getLayerVisible(layerKey) });

  const toggleVectorBoundaryLayer = (layerKey) => {
    const forceLoadKeys = new Set(["khasraLayer", "murabbaLayer"]);
    const nextVisible = !getLayerVisible(layerKey);

    updateLayer(layerKey, {
      visible: nextVisible,
      ...(forceLoadKeys.has(layerKey) ? { forceLoad: nextVisible } : {}),
    });
  };

  const getRudaPhaseId = (phase) => phase?.gid ?? phase?.id ?? phase?.oid;

  const getAllRudaPhaseIds = () =>
    (rudaPhases || [])
      .map((phase) => getRudaPhaseId(phase))
      .filter((id) => id !== undefined && id !== null);

  const toggleRudaBoundaryLayer = () => {
    const willOpen = !getLayerVisible("rudaBoundary");

    if (
      willOpen &&
      (!selectedRudaPhaseIds || selectedRudaPhaseIds.length === 0)
    ) {
      setSelectedRudaPhaseIds(getAllRudaPhaseIds());
    }

    toggleLayer("rudaBoundary");
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (rudaPhases?.length) return;

      try {
        const { getRudaList } = await import("../../services/api");
        const list = await getRudaList();
        if (!mounted) return;
        const ids = (list || []).map((p) => p.gid ?? p.id ?? p.oid);
        setRudaPhases(list || []);
        setSelectedRudaPhaseIds(ids);
      } catch (e) {
        console.error("Failed to load RUDA phases", e);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [rudaPhases, setRudaPhases, setSelectedRudaPhaseIds]);

  useEffect(() => {
    let mounted = true;

    const loadProposedRoads = async () => {
      if (rudaProposedRoads?.length) return;

      try {
        const { getRudaProposedRoadsList } = await import("../../services/api");
        const list = await getRudaProposedRoadsList();

        if (!mounted) return;

        const ids = (list || []).map((r) => r.gid ?? r.id ?? r.oid);

        setRudaProposedRoads(list || []);
        setSelectedProposedRoadIds(ids); // select all by default
      } catch (e) {
        console.error("Failed to load proposed roads", e);
      }
    };

    loadProposedRoads();

    return () => {
      mounted = false;
    };
  }, []);

  const getAllProposedRoadIds = () =>
    (rudaProposedRoads || [])
      .map((r) => r.gid ?? r.id ?? r.oid)
      .filter(Boolean);

  const toggleProposedRoadLayer = () => {
    const willOpen = !getLayerVisible("proposedRoads");

    if (willOpen && (selectedProposedRoadIds || []).length === 0) {
      setSelectedProposedRoadIds(getAllProposedRoadIds());
    }

    toggleLayer("proposedRoads");
  };
  return (
    <>
      {/* Icon toolbar - positioned left on desktop, bottom on mobile */}
      <div
        className={`pointer-events-none absolute z-30 ${
          isMobile
            ? "bottom-3 left-1/2 -translate-x-1/2 flex-row"
            : "left-1.5 sm:left-3 top-3 sm:top-5 flex-col"
        } flex items-start gap-1.5 sm:gap-2`}
      >
        <div className="pointer-events-auto flex gap-1 sm:flex-col sm:gap-1">
          <PanelIcon
            title="Layer Manager"
            active={activePanel === "layers"}
            onClick={() =>
              setActivePanel(activePanel === "layers" ? "" : "layers")
            }
            icon={<Layers size={15} className="sm:hidden" />}
            iconLg={<Layers size={18} className="hidden sm:block" />}
          />
          <PanelIcon
            title="Vector Boundaries"
            active={activePanel === "vectorBoundaries"}
            onClick={() =>
              setActivePanel(
                activePanel === "vectorBoundaries" ? "" : "vectorBoundaries",
              )
            }
            icon={<Map size={15} className="sm:hidden" />}
            iconLg={<Map size={18} className="hidden sm:block" />}
          />
          <PanelIcon
            title="Toolbox"
            active={activePanel === "toolbox"}
            onClick={() =>
              setActivePanel(activePanel === "toolbox" ? "" : "toolbox")
            }
            icon={<Wrench size={15} className="sm:hidden" />}
            iconLg={<Wrench size={18} className="hidden sm:block" />}
          />
          <PanelIcon
            title="Raster Data"
            active={activePanel === "rasterData"}
            onClick={() =>
              setActivePanel(activePanel === "rasterData" ? "" : "rasterData")
            }
            icon={<ImageIcon size={15} className="sm:hidden" />}
            iconLg={<ImageIcon size={18} className="hidden sm:block" />}
          />
          <PanelIcon
            title="Basemap"
            active={activePanel === "basemap"}
            onClick={() =>
              setActivePanel(activePanel === "basemap" ? "" : "basemap")
            }
            icon={<Satellite size={15} className="sm:hidden" />}
            iconLg={<Satellite size={18} className="hidden sm:block" />}
          />

          {/* Close button for mobile - only shown when a panel is active */}
          {isMobile && activePanel && (
            <PanelIcon
              title="Close Panel"
              active={false}
              onClick={() => setActivePanel("")}
              icon={<X size={15} />}
              iconLg={<X size={18} />}
            />
          )}
        </div>
      </div>

      {openAttributeTable && (
        <div className="pointer-events-auto">
          {openAttributeTable === "rudaBoundary" && (
            <RudaBoundaryAttribute
              map={map}
              onClose={() => setOpenAttributeTable(null)}
            />
          )}
          {openAttributeTable === "proposedRoads" && (
            <ProposedRoadAttribute
              map={map}
              onClose={() => setOpenAttributeTable(null)}
            />
          )}
          {openAttributeTable === "geodeticNetwork" && (
            <GeodeticNetworkAttribute
              map={map}
              onClose={() => setOpenAttributeTable(null)}
            />
          )}
          {openAttributeTable === "mauzaBoundary" && (
            <MauzaBoundaryAttribute
              map={map}
              geojson={
                layerRecordCache.mauzaBoundary?.geojson || loadedParcelsGeojson
              }
              onClose={() => setOpenAttributeTable(null)}
            />
          )}
          {openAttributeTable === "khasraLayer" && (
            <KhasraBoundaryAttribute
              map={map}
              geojson={
                layerRecordCache.khasraLayer?.geojson || loadedParcelsGeojson
              }
              onClose={() => setOpenAttributeTable(null)}
            />
          )}
          {openAttributeTable === "squareLayer" && (
            <SquareBoundaryAttribute
              map={map}
              geojson={
                layerRecordCache.squareLayer?.geojson || loadedParcelsGeojson
              }
              onClose={() => setOpenAttributeTable(null)}
            />
          )}
          {openAttributeTable === "districtBoundary" && (
            <DistrictBoundaryAttribute
              map={map}
              geojson={layerRecordCache.districtBoundary?.geojson}
              onClose={() => setOpenAttributeTable(null)}
            />
          )}
          {openAttributeTable === "tehsilBoundary" && (
            <TehsilBoundaryAttribute
              map={map}
              geojson={layerRecordCache.tehsilBoundary?.geojson}
              onClose={() => setOpenAttributeTable(null)}
            />
          )}
          {openAttributeTable === "acreLayer" && (
            <AcreBoundaryAttribute
              map={map}
              geojson={
                layerRecordCache.acreLayer?.geojson || loadedParcelsGeojson
              }
              onClose={() => setOpenAttributeTable(null)}
            />
          )}
          {openAttributeTable === "triJunctionPoints" && (
            <TriJunctionPointsAttribute
              map={map}
              geojson={layerRecordCache.triJunctionPoints?.geojson}
              onClose={() => setOpenAttributeTable(null)}
            />
          )}
          {openAttributeTable === "fieldPoints" && (
            <FieldPointsAttribute
              map={map}
              geojson={layerRecordCache.fieldPoints?.geojson}
              onClose={() => setOpenAttributeTable(null)}
            />
          )}
        </div>
      )}

      {/* Panel content - bottom sheet on mobile, left-side panel on desktop */}
      {activePanel && (
        <>
          {/* Mobile backdrop overlay */}
          {isMobile && (
            <div
              className="pointer-events-auto fixed inset-0 z-30 bg-black/40"
              onClick={() => setActivePanel("")}
            />
          )}
          <div
            className={`pointer-events-auto z-40 overflow-hidden border border-[#13593f] bg-[#06291f] text-white shadow-2xl ${
              isMobile
                ? "fixed bottom-0 left-0 right-0 rounded-t-xl"
                : "absolute left-1.5 sm:left-3 top-3 sm:top-5 ml-[calc(28px+6px)] sm:ml-[calc(36px+8px)] rounded-md"
            }`}
            style={
              isMobile
                ? { maxHeight: "70vh" }
                : {
                    width: "min(280px, calc(100vw - 60px))",
                    maxHeight: "calc(100vh - 120px)",
                  }
            }
          >
            {/* Mobile drag handle */}
            {isMobile && (
              <div className="flex justify-center py-2">
                <div className="h-1 w-10 rounded-full bg-white/30" />
              </div>
            )}
            {activePanel === "layers" && (
              <Panel title="Layer Manager" onClose={() => setActivePanel("")}>
                <div
                  className="overflow-y-auto px-3 pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                  style={
                    isMobile
                      ? { maxHeight: "calc(70vh - 100px)" }
                      : { maxHeight: "calc(100vh - 185px)" }
                  }
                >
                  <RudaBoundaryLayers
                    rudaPhases={rudaPhases}
                    rudaSectionOpen={rudaSectionOpen}
                    setRudaSectionOpen={setRudaSectionOpen}
                    selectedRudaPhaseIds={selectedRudaPhaseIds}
                    setSelectedRudaPhaseIds={setSelectedRudaPhaseIds}
                    rudaDropdownOpen={rudaDropdownOpen}
                    setRudaDropdownOpen={setRudaDropdownOpen}
                    rudaProposedRoads={rudaProposedRoads}
                    selectedProposedRoadIds={selectedProposedRoadIds}
                    setSelectedProposedRoadIds={setSelectedProposedRoadIds}
                    proposedDropdownOpen={proposedDropdownOpen}
                    setProposedDropdownOpen={setProposedDropdownOpen}
                    getLayerVisible={getLayerVisible}
                    getLayerOpacity={getLayerOpacity}
                    toggleLayer={toggleLayer}
                    toggleRudaBoundaryLayer={toggleRudaBoundaryLayer}
                    toggleProposedRoadLayer={toggleProposedRoadLayer}
                    updateLayer={updateLayer}
                    getLayerColor={getLayerColor}
                    setLayerColor={setLayerColor}
                    openAttributeTable={setOpenAttributeTable}
                    getAllProposedRoadIds={getAllProposedRoadIds}
                  />

                  {selectedLayerItems.length > 0 && (
                    <SelectedAdministrativeLayers
                      items={selectedLayerItems}
                      getLayerVisible={getLayerVisible}
                      getLayerOpacity={getLayerOpacity}
                      toggleLayer={toggleLayer}
                      updateLayer={updateLayer}
                      getLayerColor={getLayerColor}
                      setLayerColor={setLayerColor}
                      dropdownOpenByKey={dropdownOpenByKey}
                      toggleDropdownForKey={toggleDropdownForKey}
                      openAttributeTable={setOpenAttributeTable}
                      layerRecordCache={layerRecordCache}
                      loadLayerRecords={loadLayerRecords}
                      loadedParcelsGeojson={loadedParcelsGeojson}
                    />
                  )}

                  {/* <SectionTitle title="Mauza Based Layers" open />
                <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <LayerRow
                    icon={<Network size={15} />}
                    label="Mauza Vertices"
                    checked={getLayerVisible("controlPoints")}
                    opacity={getLayerOpacity("controlPoints")}
                    disabled={!hasMauza}
                    disabledText="Select mauza first"
                    onToggle={() => toggleLayer("controlPoints")}
                    showOpacity={false}
                  />
                  <LayerRow
                    icon={<Route size={15} />}
                    label="Tri-junction Points"
                    checked={getLayerVisible("triJunctionPoints")}
                    opacity={getLayerOpacity("triJunctionPoints")}
                    disabled={!hasMauza}
                    disabledText="Select mauza first"
                    onToggle={() => toggleLayer("triJunctionPoints")}
                    showOpacity={false}
                  />
                </div> */}
                </div>
              </Panel>
            )}

            {activePanel === "vectorBoundaries" && (
              <Panel
                title="Vector Boundaries"
                onClose={() => setActivePanel("")}
              >
                <div
                  className="overflow-y-auto px-3 pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                  style={
                    isMobile
                      ? { maxHeight: "calc(70vh - 100px)" }
                      : { maxHeight: "calc(100vh - 205px)" }
                  }
                >
                  <VectorBoundaryLayers
                    items={VECTOR_BOUNDARY_LAYERS}
                    getLayerVisible={getLayerVisible}
                    getLayerOpacity={getLayerOpacity}
                    toggleLayer={toggleVectorBoundaryLayer}
                    updateLayer={updateLayer}
                    getLayerColor={getLayerColor}
                    setLayerColor={setLayerColor}
                    dropdownOpenByKey={dropdownOpenByKey}
                    toggleDropdownForKey={toggleDropdownForKey}
                    openAttributeTable={setOpenAttributeTable}
                    layerRecordCache={layerRecordCache}
                    loadLayerRecords={loadLayerRecords}
                    loadedParcelsGeojson={loadedParcelsGeojson}
                  />
                </div>
              </Panel>
            )}

            {activePanel === "toolbox" && (
              <div
                className="overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                style={
                  isMobile
                    ? { maxHeight: "calc(70vh - 60px)" }
                    : { maxHeight: "calc(100vh - 160px)" }
                }
              >
                {/* Close button header */}
                <div className="flex items-center justify-between border-b border-[#0c3d2d] bg-[#06291f] px-3 py-2.5">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
                    Toolbox
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActivePanel("")}
                    title="Close panel"
                    aria-label="Close panel"
                    className="flex h-6 w-6 items-center justify-center rounded text-white/50 transition hover:bg-[#0a3327] hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
                <Measurement map={map} />
              </div>
            )}

            {activePanel === "basemap" && (
              <Panel title="Basemap" onClose={() => setActivePanel("")}>
                <div className="grid grid-cols-2 gap-2 p-3">
                  {BASEMAPS.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setBasemap(item.name)}
                      className={`overflow-hidden rounded-lg border text-left transition ${
                        basemap === item.name
                          ? "border-[#9be37b] bg-[#083526]"
                          : "border-[#104c39] bg-[#031a14] hover:bg-[#0a3327]"
                      }`}
                    >
                      <div className="relative h-16 w-full overflow-hidden">
                        <img
                          src={item.preview}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex items-center justify-between px-2 py-2 text-xs font-semibold text-white">
                        <span className="flex items-center gap-1.5">
                          <Map size={14} />
                          {item.name}
                        </span>
                        {basemap === item.name && (
                          <span className="text-[#9be37b]">✓</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </Panel>
            )}

            {activePanel === "rasterData" && (
              <Panel title="Raster Data" onClose={() => setActivePanel("")}>
                <div
                  className="overflow-y-auto px-3 pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                  style={
                    isMobile
                      ? { maxHeight: "calc(70vh - 100px)" }
                      : { maxHeight: "calc(100vh - 205px)" }
                  }
                >
                  <RasterDataLayers
                    items={rasterLayerItems}
                    getLayerVisible={getLayerVisible}
                    getLayerOpacity={getLayerOpacity}
                    toggleLayer={toggleLayer}
                    updateLayer={updateLayer}
                  />
                </div>
              </Panel>
            )}
          </div>
        </>
      )}
    </>
  );
}

function RasterDataLayers({
  items,
  getLayerVisible,
  getLayerOpacity,
  toggleLayer,
  updateLayer,
}) {
  return (
    <div className="mt-3 overflow-hidden rounded-md border border-[#13593f] bg-[#031a14] shadow-md">
      <div className="flex items-center gap-2 border-b border-[#0c3d2d] bg-[#06291f] px-3 py-2.5">
        <h4 className="text-[12px] font-semibold leading-tight text-white">
          Raster Layers
        </h4>
      </div>

      <div className="overflow-hidden rounded-md border border-[#0c3d2d] bg-[#06291f] shadow-sm">
        {items.map((item, index) => (
          <AdminLayerRow
            key={item.key}
            label={item.label}
            checked={getLayerVisible(item.key)}
            opacity={getLayerOpacity(item.key)}
            isLast={index === items.length - 1}
            onToggle={() => toggleLayer(item.key)}
            onOpacity={(value) => updateLayer(item.key, { opacity: value })}
          />
        ))}
      </div>
    </div>
  );
}

const getFeatureProps = (feature = {}) => feature.properties || feature || {};
const featureLabel = (feature = {}, fallback = "Feature") => {
  const props = getFeatureProps(feature);
  return (
    props.name ||
    props.Name ||
    props.mauza ||
    props.Mauza ||
    props.join_shp ||
    props.kh ||
    props.sq ||
    props.acre ||
    props.type ||
    `${fallback} ${props.gid || feature.id || ""}`
  );
};

function SmallColorPicker({ color, onChange }) {
  return (
    <label
      title="Change layer color"
      className="relative flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-white/30 hover:ring-1 hover:ring-[#9be37b]"
      style={{ backgroundColor: color || "#9be37b" }}
    >
      <input
        type="color"
        value={color || "#9be37b"}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </label>
  );
}

function LayerDropdownPanel({
  geojson,
  loadingText = "Loading records...",
  emptyText = "No records found",
}) {
  const features = geojson?.features || [];
  return (
    <div className="border-b border-[#0c3d2d] bg-[#031a14] px-3 py-2">
      <div className="max-h-44 overflow-y-auto rounded-md border border-[#0c3d2d] bg-[#06291f] px-2 py-1.5 shadow-sm [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {!geojson ? (
          <p className="px-1 py-1 text-[11px] text-white/50">{loadingText}</p>
        ) : features.length === 0 ? (
          <p className="px-1 py-1 text-[11px] text-white/50">{emptyText}</p>
        ) : (
          <>
            <div className="border-b border-[#0c3d2d] pb-1.5 text-[12px] font-semibold text-white">
              Total: {features.length}
            </div>
            {features.slice(0, 100).map((feature, index) => (
              <div
                key={getFeatureProps(feature).gid || feature.id || index}
                className="truncate border-b border-[#0c3d2d]/70 py-1.5 text-[12px] font-medium text-white/85 last:border-b-0"
              >
                {featureLabel(feature, "Record")}
              </div>
            ))}
            {features.length > 100 && (
              <div className="py-1.5 text-[11px] text-white/50">
                Showing first 100 records
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function RudaBoundaryLayers({
  rudaPhases,
  rudaSectionOpen,
  setRudaSectionOpen,
  selectedRudaPhaseIds,
  setSelectedRudaPhaseIds,
  rudaDropdownOpen,
  setRudaDropdownOpen,
  rudaProposedRoads,
  selectedProposedRoadIds,
  setSelectedProposedRoadIds,
  proposedDropdownOpen,
  setProposedDropdownOpen,
  getLayerVisible,
  getLayerOpacity,
  toggleLayer,
  toggleRudaBoundaryLayer,
  toggleProposedRoadLayer,
  updateLayer,
  getLayerColor,
  setLayerColor,
  openAttributeTable,
  getAllProposedRoadIds,
}) {
  const [geodeticDropdownOpen, setGeodeticDropdownOpen] = useState(false);

  return (
    <div className="mt-3 overflow-hidden rounded-md border border-[#13593f] bg-[#031a14] shadow-md">
      <button
        type="button"
        onClick={() => setRudaSectionOpen((open) => !open)}
        className="flex w-full items-center justify-between border-b border-[#0c3d2d] bg-[#06291f] px-3 py-2.5 text-left transition hover:bg-[#0a3327]"
      >
        <h4 className="text-[12px] font-semibold leading-tight text-white">
          RUDA Boundaries
        </h4>
        <ChevronDown
          size={16}
          strokeWidth={2.6}
          className={`text-white/70 transition ${rudaSectionOpen ? "rotate-180" : ""}`}
        />
      </button>

      {rudaSectionOpen && (
        <div className="overflow-hidden rounded-md border border-[#0c3d2d] bg-[#06291f] shadow-sm">
          <AdminLayerRow
            layerKey="rudaBoundary"
            label="RUDA Boundary"
            checked={getLayerVisible("rudaBoundary")}
            opacity={getLayerOpacity("rudaBoundary")}
            color={getLayerColor("rudaBoundary")}
            isOpen={rudaDropdownOpen}
            onToggle={toggleRudaBoundaryLayer}
            onOpacity={(value) =>
              updateLayer("rudaBoundary", { opacity: value })
            }
            onDropdownToggle={() => setRudaDropdownOpen((s) => !s)}
            onTable={() => openAttributeTable("rudaBoundary")}
          />

          {rudaDropdownOpen && (
            <div className="border-b border-[#0c3d2d] bg-[#031a14] px-3 py-2">
              <div className="max-h-44 overflow-y-auto rounded-md border border-[#0c3d2d] bg-[#06291f] px-2 py-1.5 shadow-sm [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {(rudaPhases || []).length === 0 ? (
                  <p className="px-1 py-1 text-[11px] font-medium text-white/50">
                    No phases found
                  </p>
                ) : (
                  <>
                    {(() => {
                      const allIds = (rudaPhases || [])
                        .map((phase) => phase.gid ?? phase.id ?? phase.oid)
                        .filter((id) => id !== undefined && id !== null);
                      const selectedIdSet = new Set(
                        (selectedRudaPhaseIds || []).map((id) => String(id)),
                      );
                      const allChecked =
                        allIds.length > 0 &&
                        allIds.every((id) => selectedIdSet.has(String(id)));
                      return (
                        <div className="mb-1 flex items-center justify-between border-b border-[#0c3d2d] pb-1.5">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={allChecked}
                              onChange={(e) =>
                                setSelectedRudaPhaseIds(
                                  e.target.checked ? allIds : [],
                                )
                              }
                              className="h-3.5 w-3.5 shrink-0 accent-[#9be37b]"
                            />
                            <span className="text-[12px] font-semibold leading-tight text-white">
                              Select All
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setSelectedRudaPhaseIds([])}
                            className="rounded px-1.5 py-0.5 text-[11px] font-semibold text-[#9be37b] hover:bg-[#0a3327]"
                          >
                            Reset
                          </button>
                        </div>
                      );
                    })()}
                    {(rudaPhases || []).map((phase) => {
                      const id = phase.gid ?? phase.id ?? phase.oid;
                      const name =
                        phase.name ?? phase.folderpath ?? `Phase ${id}`;
                      const checked = new Set(
                        (selectedRudaPhaseIds || []).map((value) =>
                          String(value),
                        ),
                      ).has(String(id));
                      return (
                        <label
                          key={id}
                          className="flex items-center gap-2 border-b border-[#0c3d2d]/70 py-1.5 last:border-b-0"
                        >
                          <input
                            type="checkbox"
                            checked={!!checked}
                            onChange={() =>
                              checked
                                ? setSelectedRudaPhaseIds((prev) =>
                                    (prev || []).filter(
                                      (x) => String(x) !== String(id),
                                    ),
                                  )
                                : setSelectedRudaPhaseIds((prev) => [
                                    ...(prev || []),
                                    id,
                                  ])
                            }
                            className="h-3.5 w-3.5 shrink-0 accent-[#9be37b]"
                          />
                          <span
                            className="h-3.5 w-3.5 shrink-0 rounded-sm border border-white/50"
                            style={{ backgroundColor: getRudaPhaseColor(id) }}
                          />
                          <span className="min-w-0 flex-1 truncate text-[12px] font-medium leading-tight text-white/85">
                            {name}
                          </span>
                        </label>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          )}

          <AdminLayerRow
            layerKey="proposedRoads"
            label="Proposed Roads"
            checked={getLayerVisible("proposedRoads")}
            opacity={getLayerOpacity("proposedRoads")}
            color={getLayerColor("proposedRoads")}
            isOpen={proposedDropdownOpen}
            onToggle={toggleProposedRoadLayer}
            onOpacity={(value) =>
              updateLayer("proposedRoads", { opacity: value })
            }
            onDropdownToggle={() => setProposedDropdownOpen((s) => !s)}
            onTable={() => openAttributeTable("proposedRoads")}
          />

          {proposedDropdownOpen && (
            <div className="border-b border-[#0c3d2d] bg-[#031a14] px-3 py-2">
              <div className="max-h-44 overflow-y-auto rounded-md border border-[#0c3d2d] bg-[#06291f] px-2 py-1.5 shadow-sm [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {(rudaProposedRoads || []).length === 0 ? (
                  <p className="px-1 py-1 text-[11px] text-white/50">
                    No proposed roads found
                  </p>
                ) : (
                  <>
                    <div className="mb-1 flex items-center justify-between border-b border-[#0c3d2d] pb-1.5">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={
                            (selectedProposedRoadIds || []).length ===
                            rudaProposedRoads.length
                          }
                          onChange={(e) =>
                            setSelectedProposedRoadIds(
                              e.target.checked ? getAllProposedRoadIds() : [],
                            )
                          }
                          className="h-3.5 w-3.5 accent-[#9be37b]"
                        />
                        <span className="text-[12px] font-semibold leading-tight text-white">
                          Select All
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setSelectedProposedRoadIds([])}
                        className="rounded px-1.5 py-0.5 text-[11px] font-semibold text-[#9be37b] hover:bg-[#0a3327]"
                      >
                        Reset
                      </button>
                    </div>
                    {(rudaProposedRoads || []).map((road) => {
                      const id = road.gid ?? road.id ?? road.oid;
                      const name = road.name ?? road.layer ?? `Road ${id}`;
                      const checked = (selectedProposedRoadIds || []).includes(
                        id,
                      );
                      return (
                        <label
                          key={id}
                          className="flex items-center gap-2 border-b border-[#0c3d2d]/70 py-1.5 last:border-b-0"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              checked
                                ? setSelectedProposedRoadIds((prev) =>
                                    (prev || []).filter((x) => x !== id),
                                  )
                                : setSelectedProposedRoadIds((prev) => [
                                    ...(prev || []),
                                    id,
                                  ])
                            }
                            className="h-3.5 w-3.5 accent-[#9be37b]"
                          />
                          <span className="truncate text-[12px] font-medium leading-tight text-white/85">
                            {name}
                          </span>
                        </label>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          )}

          <AdminLayerRow
            layerKey="geodeticNetwork"
            label="Geodetic Network"
            checked={getLayerVisible("geodeticNetwork")}
            opacity={getLayerOpacity("geodeticNetwork")}
            color={getLayerColor("geodeticNetwork")}
            isOpen={geodeticDropdownOpen}
            onToggle={() => toggleLayer("geodeticNetwork")}
            onOpacity={(value) =>
              updateLayer("geodeticNetwork", { opacity: value })
            }
            onColor={(value) => setLayerColor("geodeticNetwork", value)}
            onDropdownToggle={() => setGeodeticDropdownOpen((s) => !s)}
            onTable={() => openAttributeTable("geodeticNetwork")}
          />
          {geodeticDropdownOpen && (
            <div className="border-b border-[#0c3d2d] bg-[#031a14] px-3 py-2 text-[12px] text-white/80">
              Open the attribute table to view all geodetic points.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function VectorBoundaryLayers({
  items,
  getLayerVisible,
  getLayerOpacity,
  toggleLayer,
  updateLayer,
  getLayerColor,
  setLayerColor,
  dropdownOpenByKey,
  toggleDropdownForKey,
  openAttributeTable,
  layerRecordCache,
  loadLayerRecords,
  loadedParcelsGeojson,
}) {
  const getGeojsonForKey = (key) =>
    layerRecordCache?.[key]?.geojson ||
    (key === "khasraLayer" || key === "squareLayer" || key === "acreLayer"
      ? loadedParcelsGeojson
      : null);

  const tableKeyFor = (key) => key;

  return (
    <div className="mt-3 overflow-hidden rounded-md border border-[#13593f] bg-[#031a14] shadow-md">
      <div className="flex items-center gap-2 border-b border-[#0c3d2d] bg-[#06291f] px-3 py-2.5">
        <h4 className="text-[12px] font-semibold leading-tight text-white">
          Vector Boundaries
        </h4>
      </div>

      <div className="overflow-hidden rounded-md border border-[#0c3d2d] bg-[#06291f] shadow-sm">
        {items.map((item, index) => (
          <div key={item.key}>
            <AdminLayerRow
              layerKey={item.key}
              label={item.label}
              checked={getLayerVisible(item.key)}
              opacity={getLayerOpacity(item.key)}
              color={getLayerColor(item.key)}
              isOpen={!!dropdownOpenByKey?.[item.key]}
              isLast={index === items.length - 1}
              onToggle={() => toggleLayer(item.key)}
              onOpacity={(value) => updateLayer(item.key, { opacity: value })}
              onColor={(value) => setLayerColor(item.key, value)}
              onDropdownToggle={() => {
                toggleDropdownForKey(item.key);
                loadLayerRecords(item.key);
              }}
              onTable={() => {
                loadLayerRecords(item.key);
                openAttributeTable(tableKeyFor(item.key));
              }}
            />
            {dropdownOpenByKey?.[item.key] && (
              <LayerDropdownPanel geojson={getGeojsonForKey(item.key)} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SelectedAdministrativeLayers({
  items,
  getLayerVisible,
  getLayerOpacity,
  toggleLayer,
  updateLayer,
  getLayerColor,
  setLayerColor,
  dropdownOpenByKey,
  toggleDropdownForKey,
  openAttributeTable,
  layerRecordCache,
  loadLayerRecords,
}) {
  return (
    <div className="mt-3 overflow-hidden rounded-md border border-[#13593f] bg-[#031a14] shadow-md">
      <div className="flex items-center gap-2 border-b border-[#0c3d2d] bg-[#06291f] px-3 py-2.5">
        <h4 className="text-[12px] font-semibold leading-tight text-white">
          Selected Administrative Layers
        </h4>
      </div>

      <div className="overflow-hidden rounded-md border border-[#0c3d2d] bg-[#06291f] shadow-sm">
        {items.map((item, index) => (
          <div key={item.key}>
            <AdminLayerRow
              layerKey={item.key}
              label={item.label}
              checked={getLayerVisible(item.key)}
              opacity={getLayerOpacity(item.key)}
              color={getLayerColor(item.key)}
              isOpen={!!dropdownOpenByKey?.[item.key]}
              isLast={index === items.length - 1}
              onToggle={() => toggleLayer(item.key)}
              onOpacity={(value) => updateLayer(item.key, { opacity: value })}
              onColor={(value) => setLayerColor(item.key, value)}
              onDropdownToggle={() => {
                toggleDropdownForKey(item.key);
                loadLayerRecords(item.key);
              }}
              onTable={() => {
                loadLayerRecords(item.key);
                openAttributeTable(item.key);
              }}
            />
            {dropdownOpenByKey?.[item.key] && (
              <LayerDropdownPanel
                geojson={layerRecordCache?.[item.key]?.geojson}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminLayerRow({
  label,
  checked,
  opacity,
  color,
  isOpen,
  isLast,
  disabled,
  onToggle,
  onOpacity,
  onColor,
  onDropdownToggle,
  onTable,
}) {
  const handleToggle = disabled ? undefined : onToggle;
  return (
    <div
      className={`bg-[#06291f] px-2.5 py-2 ${isLast ? "" : "border-b border-[#0c3d2d]"}`}
    >
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={!!checked}
          onChange={handleToggle}
          disabled={disabled}
          className="h-3.5 w-3.5 shrink-0 accent-[#9be37b] disabled:cursor-not-allowed disabled:opacity-40"
        />
        {onColor && <SmallColorPicker color={color} onChange={onColor} />}
        <span className="min-w-0 flex-1 truncate text-[12px] font-medium leading-tight text-white/85">
          {label}
        </span>
        <div className="flex shrink-0 items-center gap-1.5 text-white/75">
          {onTable && (
            <button
              type="button"
              title="Attribute table"
              aria-label="Attribute table"
              onClick={onTable}
              className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-[#0a3327]"
            >
              <Table2 size={14} strokeWidth={2.4} />
            </button>
          )}
          {onDropdownToggle && (
            <button
              type="button"
              title="Layer details"
              aria-label="Layer details"
              onClick={onDropdownToggle}
              className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-[#0a3327]"
            >
              <ChevronDown
                size={16}
                fill="currentColor"
                strokeWidth={2.6}
                className={`transition ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </div>
      </div>

      <div className="mt-1 flex items-center gap-2 pl-6">
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          onChange={(e) => onOpacity(Number(e.target.value))}
          disabled={disabled}
          className="h-1.5 min-w-0 flex-1 accent-[#9be37b] disabled:cursor-not-allowed disabled:opacity-40"
        />
        <span className="w-9 shrink-0 text-right text-[11px] font-medium text-white/60">
          {opacity}%
        </span>
      </div>
      {disabled && (
        <p className="mt-2 px-6 text-[11px] leading-snug text-white/60">
          Select a supported Mauza to enable the Massavi raster layer.
        </p>
      )}
    </div>
  );
}

function PanelIcon({ title, icon, iconLg, active, onClick }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-md border shadow-md transition ${
        active
          ? "border-[#9be37b] bg-[#083526] text-white"
          : "border-[#104c39] bg-[#031a14] text-white hover:bg-[#0a3327]"
      }`}
    >
      {icon}
      {iconLg}
    </button>
  );
}

function Panel({ title, children, onClose }) {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-[#0c3d2d] bg-[#06291f] px-3 py-2.5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
          {title}
        </h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            title="Close panel"
            aria-label="Close panel"
            className="flex h-6 w-6 items-center justify-center rounded text-white/50 transition hover:bg-[#0a3327] hover:text-white"
          >
            <X size={14} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function SectionTitle({ title, open }) {
  return (
    <div className="mt-3 flex items-center justify-between px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-white/70">
      <span>{title}</span>
      <ChevronRight size={15} className={open ? "rotate-90" : ""} />
    </div>
  );
}

function LayerRow({
  icon,
  label,
  checked,
  opacity,
  onToggle,
  onOpacity,
  disabled = false,
  disabledText = "",
  rightAction = null,
  showOpacity = true,
}) {
  return (
    <div
      className={`rounded-md border border-[#0c3d2d] bg-[#06291f] p-2 ${disabled ? "opacity-55" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium text-white/85">
          <input
            type="checkbox"
            checked={!!checked}
            onChange={onToggle}
            disabled={disabled}
            className="h-4 w-4 accent-[#9be37b]"
          />
          <span className="text-[#9be37b]">{icon}</span>
          <span className="truncate">{label}</span>
        </label>
        <div className="flex shrink-0 items-center gap-2">
          {showOpacity && (
            <span className="text-xs font-semibold text-white/60">
              {opacity}%
            </span>
          )}
          {rightAction}
        </div>
      </div>

      {showOpacity && (
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          disabled={disabled}
          onChange={(e) => onOpacity(Number(e.target.value))}
          className="mt-0.5 h-1.5 w-full accent-[#9be37b]"
        />
      )}
      {disabled && disabledText && (
        <p className="mt-1 text-[10px] text-white/50">{disabledText}</p>
      )}
    </div>
  );
}

function ToolboxButton({ icon, label, active, onClick, description }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={description || label}
      aria-label={label}
      className={`flex flex-col items-center justify-center gap-1 rounded-md border p-2 transition ${
        active
          ? "border-[#9be37b] bg-[#083526] text-white shadow-inner"
          : "border-[#104c39] bg-[#031a14] text-white/85 hover:bg-[#0a3327]"
      }`}
    >
      <span className={active ? "text-[#9be37b]" : "text-white/80"}>
        {icon}
      </span>
      <span className="text-center text-[10px] font-medium leading-tight">
        {label}
      </span>
    </button>
  );
}

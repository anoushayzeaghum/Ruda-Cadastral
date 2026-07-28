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
import LayerManager from "./Layers/LayerManager.jsx";
import Toolbox from "./Layers/Toolbox.jsx";
import RasterData from "./Layers/RasterData.jsx";
import BaseMap from "./Layers/BaseMap.jsx";

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
  boundaryStatus,
  setBoundaryStatus,
}) {
  const [activePanel, setActivePanel] = useState("layers");
  const [rudaSectionOpen, setRudaSectionOpen] = useState(false);
  const [rudaDropdownOpen, setRudaDropdownOpen] = useState(false);
  const hasMauza = !!selectedMauza;
  const initializedOpacityKeysRef = useRef(new Set());
  const [openAttributeTable, setOpenAttributeTable] = useState(null);
  const [dropdownOpenByKey, setDropdownOpenByKey] = useState({});
  const [layerRecordCache, setLayerRecordCache] = useState({});
  const isMobile = useIsMobile();

  const changeBoundaryStatus = (status) => {
    // Do not touch layer visibility here. MapView will reload only the
    // status-sensitive Mauza, Khasra, and Square sources.
    setBoundaryStatus(status);
  };
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
      possessionLand: "#5F7F00",
      awardedLand: "#854F0B",
      stateLand: "#5F5E5A",
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
    if (layerKey === "khasraLayer") {
      return boundaryStatus === "verified" ? "#16a34a" : "#dc5a5a";
    }

    const value = layers?.[layerKey];
    return typeof value === "object" && value.color
      ? value.color
      : getDefaultColorForLayer(layerKey);
  };

  const setLayerColor = (layerKey, color) => updateLayer(layerKey, { color });

  const selectedMauzaId =
    selectedMauza?.mauza_id ?? selectedMauza?.id ?? selectedMauza?.gid;

  const loadLayerRecords = async (key, boundaryStatus = "verified") => {
    const statusSensitive = [
      "mauzaBoundary",
      "khasraLayer",
      "squareLayer",
    ].includes(key);
    const cacheKey = statusSensitive ? `${boundaryStatus}_${key}` : key;

    const districtSelectionKey = (
      Array.isArray(selectedDistrict)
        ? selectedDistrict
        : selectedDistrict
          ? [selectedDistrict]
          : []
    )
      .map((item) => item?.id ?? item?.gid ?? item)
      .filter(Boolean)
      .map(String)
      .sort()
      .join(",");

    const tehsilSelectionKey = (
      Array.isArray(selectedTehsil)
        ? selectedTehsil
        : selectedTehsil
          ? [selectedTehsil]
          : []
    )
      .map((item) => item?.id ?? item?.gid ?? item)
      .filter(Boolean)
      .map(String)
      .sort()
      .join(",");

    const selectionKey =
      key === "districtBoundary"
        ? districtSelectionKey
        : key === "tehsilBoundary"
          ? tehsilSelectionKey
          : [
                "mauzaBoundary",
                "khasraLayer",
                "squareLayer",
                "acreLayer",
                "fieldPoints",
              ].includes(key)
            ? String(selectedMauzaId ?? "")
            : "global";

    const cached = layerRecordCache[cacheKey];
    if (cached?.loaded && cached.selectionKey === selectionKey) return;

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
        if (boundaryStatus === "verified") {
          geojson = selectedMauzaId
            ? await api.getMauzaBoundary(selectedMauzaId)
            : null;
        } else {
          geojson = selectedMauzaId
            ? await api.getRudaMauzas(selectedMauzaId)
            : null;
        }
      } else if (key === "khasraLayer") {
        if (boundaryStatus === "verified") {
          geojson = selectedMauzaId
            ? await api.getKhasras(selectedMauzaId)
            : loadedParcelsGeojson;
        } else {
          geojson = selectedMauzaId
            ? await api.getRudaKhasras(selectedMauzaId)
            : null;
        }
      } else if (key === "squareLayer") {
        if (boundaryStatus === "verified") {
          geojson = selectedMauzaId
            ? await api.getSquares(selectedMauzaId)
            : loadedParcelsGeojson;
        } else {
          geojson = selectedMauzaId
            ? await api.getRudaSquares(selectedMauzaId)
            : null;
        }
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
        [cacheKey]: {
          loaded: true,
          selectionKey,
          geojson: geojson || { type: "FeatureCollection", features: [] },
        },
      }));
    } catch (error) {
      console.error(`Failed to load ${key} records`, error);
      setLayerRecordCache((prev) => ({
        ...prev,
        [cacheKey]: {
          loaded: true,
          selectionKey,
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

  useEffect(() => {
    if (!selectedMauza) return;

    // Initial selection behaviour only. A later Verified/Unverified switch
    // must not reopen a layer that the user has manually closed.
    updateLayer("mauzaBoundary", { visible: true });
    updateLayer("khasraLayer", { visible: true, forceLoad: true });
  }, [selectedMauza]);

  useEffect(() => {
    if (!selectedMauza) return;

    // Refresh the status-sensitive records without changing checkbox state.
    loadLayerRecords("mauzaBoundary", boundaryStatus);
    loadLayerRecords("khasraLayer", boundaryStatus);
    loadLayerRecords("squareLayer", boundaryStatus);
  }, [selectedMauza, boundaryStatus]);
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
                layerRecordCache[`${boundaryStatus}_mauzaBoundary`]
                  ?.geojson || { type: "FeatureCollection", features: [] }
              }
              onClose={() => setOpenAttributeTable(null)}
            />
          )}
          {openAttributeTable === "khasraLayer" && (
            <KhasraBoundaryAttribute
              map={map}
              geojson={
                layerRecordCache[`${boundaryStatus}_khasraLayer`]?.geojson || {
                  type: "FeatureCollection",
                  features: [],
                }
              }
              onClose={() => setOpenAttributeTable(null)}
            />
          )}
          {openAttributeTable === "squareLayer" && (
            <SquareBoundaryAttribute
              map={map}
              geojson={
                layerRecordCache[`${boundaryStatus}_squareLayer`]?.geojson ||
                loadedParcelsGeojson
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
                <LayerManager
                  isMobile={isMobile}
                  rudaPhases={rudaPhases}
                  selectedRudaPhaseIds={selectedRudaPhaseIds}
                  setSelectedRudaPhaseIds={setSelectedRudaPhaseIds}
                  rudaProposedRoads={rudaProposedRoads}
                  selectedProposedRoadIds={selectedProposedRoadIds}
                  setSelectedProposedRoadIds={setSelectedProposedRoadIds}
                  getAllProposedRoadIds={getAllProposedRoadIds}
                  getLayerVisible={getLayerVisible}
                  getLayerOpacity={getLayerOpacity}
                  toggleLayer={toggleLayer}
                  toggleVectorBoundaryLayer={toggleVectorBoundaryLayer}
                  toggleRudaBoundaryLayer={toggleRudaBoundaryLayer}
                  toggleProposedRoadLayer={toggleProposedRoadLayer}
                  updateLayer={updateLayer}
                  getLayerColor={getLayerColor}
                  setLayerColor={setLayerColor}
                  dropdownOpenByKey={dropdownOpenByKey}
                  toggleDropdownForKey={toggleDropdownForKey}
                  openAttributeTable={setOpenAttributeTable}
                  layerRecordCache={layerRecordCache}
                  loadLayerRecords={loadLayerRecords}
                  loadedParcelsGeojson={loadedParcelsGeojson}
                  boundaryStatus={boundaryStatus}
                  setBoundaryStatus={changeBoundaryStatus}
                />
              </Panel>
            )}

            {activePanel === "toolbox" && (
              <Toolbox
                map={map}
                isMobile={isMobile}
                onClose={() => setActivePanel("")}
              />
            )}

            {activePanel === "basemap" && (
              <Panel title="Basemap" onClose={() => setActivePanel("")}>
                <BaseMap basemap={basemap} setBasemap={setBasemap} />
              </Panel>
            )}

            {activePanel === "rasterData" && (
              <Panel title="Raster Data" onClose={() => setActivePanel("")}>
                <RasterData
                  isMobile={isMobile}
                  getLayerVisible={getLayerVisible}
                  getLayerOpacity={getLayerOpacity}
                  toggleLayer={toggleLayer}
                  updateLayer={updateLayer}
                />
              </Panel>
            )}
          </div>
        </>
      )}
    </>
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

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Layers,
  Wrench,
  Satellite,
  Image as ImageIcon,
  X,
  ListChecks,
  Upload,
  Pentagon,
} from "lucide-react";
import LayerManager from "./Layers/LayerManager.jsx";
import Toolbox from "./Layers/Toolbox.jsx";
import DrawAOI from "./Layers/DrawAOI.jsx";
import RasterData from "./Layers/RasterData.jsx";
import BaseMap from "./Layers/BaseMap.jsx";
import MapImport from "./Import/MapImport.jsx";
import { normalizePossessionLandTypes } from "./LayerManager/PossessionLandLayer.js";

import RudaBoundaryAttribute from "./AttributeTable/RudaBoundaries/RudaBoundaryAttribute";
import ProposedRoadAttribute from "./AttributeTable/RudaBoundaries/ProposedRoadAttribute";
import GeodeticNetworkAttribute from "./AttributeTable/RudaBoundaries/GeodeticNetworkAttribute";
import MauzaBoundaryAttribute from "./AttributeTable/Administrative/MauzaBoundaryAttribute";
import KhasraBoundaryAttribute from "./AttributeTable/Administrative/KhasraBoundaryAttribute";
import SquareBoundaryAttribute from "./AttributeTable/Administrative/SquareBoundaryAttribute";
import DistrictBoundaryAttribute from "./AttributeTable/Administrative/DistrictBoundaryAttribute";
import TehsilBoundaryAttribute from "./AttributeTable/Administrative/TehsilBoundaryAttribute";
import AcreBoundaryAttribute from "./AttributeTable/Administrative/AcreBoundaryAttribute";
import PossessionLandAttribute from "./AttributeTable/Administrative/PossessionLandAttribute";
import AwardedLandAttribute from "./AttributeTable/Administrative/AwardedLandAttribute";
import StateLandAttribute from "./AttributeTable/Administrative/StateLandAttribute";
import TriJunctionPointsAttribute from "./AttributeTable/BaseData/TriJunctionPointsAttribute";
import FieldPointsAttribute from "./AttributeTable/BaseData/FieldPointsAttribute";

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
  multiSelectionMode = false,
  onMultiSelectionModeChange = () => {},
  drawAOIEnabled = false,
  onDrawAOIToggle = () => {},
  onDrawAOIFinish = () => {},
  onDrawAOIClear = () => {},
  drawAOIStatus = {},
  onImportedAOI = () => {},
}) {
  const [activePanel, setActivePanel] = useState("");
  const initializedOpacityKeysRef = useRef(new Set());
  const [openAttributeTables, setOpenAttributeTables] = useState({});

  const openAttributeTable = (key) =>
    setOpenAttributeTables((previous) => ({ ...previous, [key]: true }));

  const closeAttributeTable = (key) =>
    setOpenAttributeTables((previous) => ({ ...previous, [key]: false }));
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

  const [proposedRoads, setProposedRoads] = useState([]);

  const getDefaultOpacityForSelectedLayer = () => 100;

  const getDefaultColorForLayer = (layerKey) => {
    const defaults = {
      rudaBoundary: "#22c55e",
      proposedRoads: "#ef4444",
      geodeticNetwork: "#d81d1d",
      // Administrative boundary outline colours.
      districtBoundary: "#D18B00", // dark mango yellow
      tehsilBoundary: "#0B3D91", // dark blue
      mauzaBoundary: "#000000", // black outline, no fill in MapView
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
  const verifiedMauzaId = selectedMauza?._verifiedMauzaId ?? selectedMauzaId;
  const unverifiedMauzaId =
    selectedMauza?._unverifiedMauzaId ?? selectedMauzaId;

  const markStatus = (geojson, status) => ({
    type: "FeatureCollection",
    features: (geojson?.features || []).map((feature) => ({
      ...feature,
      properties: {
        ...(feature?.properties || {}),
        _verification_status: status,
      },
    })),
  });

  const loadStatusSensitiveGeoJSON = async (
    verifiedLoader,
    unverifiedLoader,
  ) => {
    if (boundaryStatus === "both") {
      const [verified, unverified] = await Promise.all([
        verifiedLoader(),
        unverifiedLoader(),
      ]);
      return {
        type: "FeatureCollection",
        features: [
          ...markStatus(verified, "verified").features,
          ...markStatus(unverified, "unverified").features,
        ],
      };
    }
    return boundaryStatus === "verified"
      ? markStatus(await verifiedLoader(), "verified")
      : markStatus(await unverifiedLoader(), "unverified");
  };

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
        geojson = selectedMauzaId
          ? await loadStatusSensitiveGeoJSON(
              () => api.getMauzaBoundary(verifiedMauzaId),
              () => api.getRudaMauzas(unverifiedMauzaId),
            )
          : null;
      } else if (key === "khasraLayer") {
        geojson = selectedMauzaId
          ? await loadStatusSensitiveGeoJSON(
              () => api.getKhasras(verifiedMauzaId),
              () => api.getRudaKhasras(unverifiedMauzaId),
            )
          : loadedParcelsGeojson;
      } else if (key === "squareLayer") {
        geojson = selectedMauzaId
          ? await loadStatusSensitiveGeoJSON(
              () => api.getSquares(verifiedMauzaId),
              () => api.getRudaSquares(unverifiedMauzaId),
            )
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
        rudaBoundary: 100,
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

  const getLayerSelectedTypes = (layerKey) => {
    if (layerKey !== "possessionLand") return [];

    const value = layers?.[layerKey];
    return normalizePossessionLandTypes(
      typeof value === "object" ? value.selectedTypes : undefined,
    );
  };

  const setLayerSelectedTypes = (layerKey, selectedTypes) => {
    if (layerKey !== "possessionLand") return;

    updateLayer(layerKey, {
      selectedTypes: normalizePossessionLandTypes(selectedTypes),
    });
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
      if (proposedRoads?.length) return;

      try {
        const { getProposedRoadsList } = await import("../../services/api");
        const list = await getProposedRoadsList();

        if (!mounted) return;

        const ids = (list || [])
          .map((road) => road.gid ?? road.id ?? road.oid)
          .filter((id) => id !== undefined && id !== null);

        setProposedRoads(list || []);
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
    (proposedRoads || [])
      .map((r) => r.gid ?? r.id ?? r.oid)
      .filter((id) => id !== undefined && id !== null);

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

  return (
    <>
      {/* Icon toolbar - positioned left on desktop, bottom on mobile */}
      <div
        className={`pointer-events-none absolute z-50 ${
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
            title="Draw AOI"
            active={activePanel === "drawAOI"}
            onClick={() =>
              setActivePanel(activePanel === "drawAOI" ? "" : "drawAOI")
            }
            icon={<Pentagon size={15} className="sm:hidden" />}
            iconLg={<Pentagon size={18} className="hidden sm:block" />}
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
          <PanelIcon
            title="Import Data"
            active={activePanel === "importData"}
            onClick={() =>
              setActivePanel(activePanel === "importData" ? "" : "importData")
            }
            icon={<Upload size={15} className="sm:hidden" />}
            iconLg={<Upload size={18} className="hidden sm:block" />}
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

      {/* Prominent multiple Khasra selection control */}
      <div
        className={`pointer-events-auto absolute z-50 ${
          isMobile
            ? "bottom-14 left-1/2 -translate-x-1/2"
            : "bottom-4 left-1.5 sm:left-3"
        }`}
      >
        <div className="flex items-center gap-2 rounded-md border border-[#13593f] bg-[#031a14]/95 px-2.5 py-2 text-white shadow-xl backdrop-blur-sm">
          <div className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold sm:text-xs">
            <ListChecks size={16} className="text-[#9be37b]" />
            <span className="whitespace-nowrap">Select Multiple Khasra:</span>
          </div>

          <select
            value={multiSelectionMode ? "enabled" : "disabled"}
            onChange={(event) =>
              onMultiSelectionModeChange(event.target.value === "enabled")
            }
            aria-label="Multiple Khasra selection status"
            className={`h-8 min-w-[104px] cursor-pointer rounded border px-2 text-[11px] font-semibold outline-none transition focus:ring-2 focus:ring-[#9be37b]/60 ${
              multiSelectionMode
                ? "border-[#9be37b] bg-[#0f5132] text-white"
                : "border-white/25 bg-white text-slate-800"
            }`}
          >
            <option value="disabled">Disabled</option>
            <option value="enabled">Enabled</option>
          </select>
        </div>
      </div>

      <div className="pointer-events-auto">
        {openAttributeTables.rudaBoundary && (
          <RudaBoundaryAttribute
            map={map}
            geojson={layerRecordCache.rudaBoundary?.geojson}
            onClose={() => closeAttributeTable("rudaBoundary")}
          />
        )}
        {openAttributeTables.proposedRoads && (
          <ProposedRoadAttribute
            map={map}
            geojson={layerRecordCache.proposedRoads?.geojson}
            onClose={() => closeAttributeTable("proposedRoads")}
          />
        )}
        {openAttributeTables.geodeticNetwork && (
          <GeodeticNetworkAttribute
            map={map}
            geojson={layerRecordCache.geodeticNetwork?.geojson}
            onClose={() => closeAttributeTable("geodeticNetwork")}
          />
        )}
        {openAttributeTables.mauzaBoundary && (
          <MauzaBoundaryAttribute
            map={map}
            geojson={
              layerRecordCache[`${boundaryStatus}_mauzaBoundary`]?.geojson
            }
            onClose={() => closeAttributeTable("mauzaBoundary")}
          />
        )}
        {openAttributeTables.khasraLayer && (
          <KhasraBoundaryAttribute
            map={map}
            geojson={layerRecordCache[`${boundaryStatus}_khasraLayer`]?.geojson}
            onClose={() => closeAttributeTable("khasraLayer")}
          />
        )}
        {openAttributeTables.squareLayer && (
          <SquareBoundaryAttribute
            map={map}
            geojson={
              layerRecordCache[`${boundaryStatus}_squareLayer`]?.geojson ||
              loadedParcelsGeojson
            }
            onClose={() => closeAttributeTable("squareLayer")}
          />
        )}
        {openAttributeTables.districtBoundary && (
          <DistrictBoundaryAttribute
            map={map}
            geojson={layerRecordCache.districtBoundary?.geojson}
            onClose={() => closeAttributeTable("districtBoundary")}
          />
        )}
        {openAttributeTables.tehsilBoundary && (
          <TehsilBoundaryAttribute
            map={map}
            geojson={layerRecordCache.tehsilBoundary?.geojson}
            onClose={() => closeAttributeTable("tehsilBoundary")}
          />
        )}
        {openAttributeTables.acreLayer && (
          <AcreBoundaryAttribute
            map={map}
            geojson={
              layerRecordCache.acreLayer?.geojson || loadedParcelsGeojson
            }
            onClose={() => closeAttributeTable("acreLayer")}
          />
        )}
        {openAttributeTables.possessionLand && (
          <PossessionLandAttribute
            map={map}
            geojson={layerRecordCache.possessionLand?.geojson}
            onClose={() => closeAttributeTable("possessionLand")}
          />
        )}
        {openAttributeTables.awardedLand && (
          <AwardedLandAttribute
            map={map}
            geojson={layerRecordCache.awardedLand?.geojson}
            onClose={() => closeAttributeTable("awardedLand")}
          />
        )}
        {openAttributeTables.stateLand && (
          <StateLandAttribute
            map={map}
            geojson={layerRecordCache.stateLand?.geojson}
            onClose={() => closeAttributeTable("stateLand")}
          />
        )}
        {openAttributeTables.triJunctionPoints && (
          <TriJunctionPointsAttribute
            map={map}
            geojson={layerRecordCache.triJunctionPoints?.geojson}
            onClose={() => closeAttributeTable("triJunctionPoints")}
          />
        )}
        {openAttributeTables.fieldPoints && (
          <FieldPointsAttribute
            map={map}
            geojson={layerRecordCache.fieldPoints?.geojson}
            onClose={() => closeAttributeTable("fieldPoints")}
          />
        )}
      </div>

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
                  proposedRoads={proposedRoads}
                  selectedProposedRoadIds={selectedProposedRoadIds}
                  setSelectedProposedRoadIds={setSelectedProposedRoadIds}
                  getAllProposedRoadIds={getAllProposedRoadIds}
                  getLayerVisible={getLayerVisible}
                  getLayerOpacity={getLayerOpacity}
                  getLayerSelectedTypes={getLayerSelectedTypes}
                  setLayerSelectedTypes={setLayerSelectedTypes}
                  toggleLayer={toggleLayer}
                  toggleVectorBoundaryLayer={toggleVectorBoundaryLayer}
                  toggleRudaBoundaryLayer={toggleRudaBoundaryLayer}
                  toggleProposedRoadLayer={toggleProposedRoadLayer}
                  updateLayer={updateLayer}
                  getLayerColor={getLayerColor}
                  setLayerColor={setLayerColor}
                  dropdownOpenByKey={dropdownOpenByKey}
                  toggleDropdownForKey={toggleDropdownForKey}
                  openAttributeTable={openAttributeTable}
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

            {activePanel === "drawAOI" && (
              <DrawAOI
                isMobile={isMobile}
                onClose={() => setActivePanel("")}
                enabled={drawAOIEnabled}
                onToggle={onDrawAOIToggle}
                onFinish={onDrawAOIFinish}
                onClear={onDrawAOIClear}
                status={drawAOIStatus}
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

            {activePanel === "importData" && (
              <MapImport
                map={map}
                onClose={() => setActivePanel("")}
                onPolygonImported={onImportedAOI}
                onImportComplete={onImportedAOI}
              />
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

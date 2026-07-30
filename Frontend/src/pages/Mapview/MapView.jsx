import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  getDistrictBoundary,
  getTehsilBoundary,
  getMauzaBoundary,
  getKhasras,
  getMurabbas,
  getSquares,
  getAcres,
  getFieldPoints,
  getRudaGeoJSON,
  getProposedRoadsGeoJSON,
  getGeodeticNetworkGeoJSON,
  getTrijunctionPoints,
  getRudaMauzas,
  getRudaKhasras,
  getRudaSquares,
  getPossessionLandGeoJSON,
  getAwardedLandGeoJSON,
  getStateLandGeoJSON,
} from "../../services/api";

import {
  getRudaProposedRoadFillPaint,
  getRudaProposedRoadLinePaint,
} from "./LayerManager/ProposedRoadsLayer.jsx";
import {
  addPossessionLandLayerStyles,
  applyPossessionLandTypeFilter,
  normalizePossessionLandTypes,
} from "./LayerManager/PossessionLandLayer.js";

import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  KHASRA_SOURCE,
  KHASRA_FILL,
  KHASRA_LINE,
  KHASRA_LABEL,
  MURABBA_SOURCE,
  MURABBA_FILL,
  MURABBA_LINE,
  MURABBA_LABEL,
  SQUARE_LEVEL,
  ACRE_LEVEL,
  SELECTED_SOURCE,
  SELECTED_CORNER_LAYER,
  SELECTED_CORNER_BOX_LAYER,
  SELECTED_CORNER_TEXT_LAYER,
  CONTROL_POINTS_SOURCE,
  CONTROL_POINTS_LAYER,
  TRI_JUNCTION_POINTS_SOURCE,
  TRI_JUNCTION_POINTS_LAYER,
  TRI_JUNCTION_POINTS_LABEL,
  TRI_JUNCTION_BURJI_LAYER,
  TRI_JUNCTION_BURJI_LABEL,
  FIELD_POINTS_SOURCE,
  FIELD_POINTS_LAYER,
  FIELD_POINTS_LABEL,
  GEODETIC_NETWORK_SOURCE,
  GEODETIC_NETWORK_LAYER,
  GEODETIC_NETWORK_LABEL,
  VECTOR_LAYER_THEME,
  clampOpacity,
  getPointLabelLayerId,
  VECTOR_LABEL_FIELDS,
  prepareRudaGeojsonForDisplay,
  emptyFeatureCollection,
  mergeFeatureCollections,
  computeArea,
  BASEMAP_STYLES,
  getKhasraNumber,
  getMurabbaNumber,
  getLayerVisible,
  getLayerOpacity,
  getLayerForceLoad,
  boundaryLevelToLayerKey,
  getSelectedMauzaId,
  featureMatchesSelectedMauza,
  explodePointGeoJSON,
  pointBelongsToMauza,
  filterPointGeoJSONByArea,
  keepValidPointFeaturesForMap,
  getBoundaryIds,
  removeBoundaryLevelLayers,
  addBoundaryLevelLayers,
  addKhasraLayerStyles,
  addMurabbaLayerStyles,
  addPointLayerStyles,
  addTriJunctionLayerStyles,
  ensureSelectedLayerStyles,
  HANDU_GUJRAN_BOUNDS,
  restoreOrthoLayer,
} from "./LayerManager/index.js";

import {
  getSquareNumberFromProps,
  getAcreNumberFromProps,
  getMauzaName,
  getOrthoTileUrlFromMauza,
  getOrthoBoundsFromMauzaName,
  THEMATIC_LAND_LAYERS,
  KHASRA_ONLY_LABEL,
  PROPOSED_ROADS_SOURCE,
  PROPOSED_ROADS_FILL,
  PROPOSED_ROADS_LINE,
  buildSelectionKey,
  createGeoJSONRequestCache,
} from "./MapView/mapViewConfig.js";
import {
  getFeatureLatLng,
  buildUnifiedPopupHtml,
  buildPopupRowsForType,
  POPUP_TITLES,
} from "./MapView/popupUtils.js";
import useMapTools from "./MapView/useMapTools.js";
import useDrawAOI from "./MapView/useDrawAOI.js";
import {
  CADASTRAL_BOUNDARY_STYLES,
  getKhasraStatusColorExpression,
} from "./LayerManager/CadastralBoundaryStyles.js";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const markVerificationStatus = (geojson, status) => ({
  type: "FeatureCollection",
  features: (geojson?.features || []).map((feature) => ({
    ...feature,
    properties: {
      ...(feature?.properties || {}),
      _verification_status: status,
    },
  })),
});

const mergeStatusGeoJSON = (verified, unverified) =>
  mergeFeatureCollections([
    markVerificationStatus(verified, "verified"),
    markVerificationStatus(unverified, "unverified"),
  ]);

export default function MapView({
  selectedDistrict,
  selectedTehsil,
  selectedMauza,
  viewBy,
  onParcelSelect,
  multiSelectionMode = false,
  selectedParcels = [],
  onMultiParcelToggle,
  layers = {},
  selectedRudaPhaseIds = [],
  selectedProposedRoadIds = [],
  basemap = "Streets",
  selectedFeatureNumber,
  onFeaturesLoaded,
  onMapReady,
  boundaryStatus = "verified",
  drawAOIEnabled = false,
  onAOIComplete,
  onAOIDraftChange,
  drawAOIClearSignal = 0,
  drawAOIFinishSignal = 0,
}) {
  const mapWrapperRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const currentGeojson = useRef({});
  const apiDataCacheRef = useRef(null);
  if (!apiDataCacheRef.current) {
    apiDataCacheRef.current = createGeoJSONRequestCache();
  }
  const activePopupRef = useRef(null);
  const popupTimeoutRef = useRef(null);
  const lastSyncedSelectionRef = useRef("");
  const prevMussaviLayerVisible = useRef(false);
  const lastAppliedBasemapRef = useRef("Streets");
  const previousBoundaryStatusRef = useRef(boundaryStatus);
  const suppressAutoZoomUntilRef = useRef(0);
  const multiSelectionModeRef = useRef(multiSelectionMode);
  const drawAOIEnabledRef = useRef(drawAOIEnabled);
  const onMultiParcelToggleRef = useRef(onMultiParcelToggle);
  const khasraEventHandlersRef = useRef({
    click: null,
    mouseenter: null,
    mouseleave: null,
  });
  const layerEventHandlersRef = useRef(new Map());
  const possessionLandSelectedTypesRef = useRef([]);

  const [isMapReady, setIsMapReady] = useState(false);
  const [featureCount, setFeatureCount] = useState(0);
  const [dataRevision, setDataRevision] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    multiSelectionModeRef.current = multiSelectionMode;
  }, [multiSelectionMode]);

  useEffect(() => {
    drawAOIEnabledRef.current = drawAOIEnabled;
    if (drawAOIEnabled) closeActivePopup();
  }, [drawAOIEnabled]);

  useEffect(() => {
    onMultiParcelToggleRef.current = onMultiParcelToggle;
  }, [onMultiParcelToggle]);

  const proposedRoadsVisible = getLayerVisible(layers, "proposedRoads", false);
  const proposedRoadsOpacity = getLayerOpacity(layers, "proposedRoads", 100);
  const rudaBoundaryVisible = getLayerVisible(layers, "rudaBoundary", false);
  const rudaBoundaryOpacity = getLayerOpacity(layers, "rudaBoundary", 100);
  const geodeticNetworkVisible = getLayerVisible(
    layers,
    "geodeticNetwork",
    false,
  );
  const geodeticNetworkOpacity = getLayerOpacity(
    layers,
    "geodeticNetwork",
    100,
  );
  const districtBoundaryVisible = getLayerVisible(
    layers,
    "districtBoundary",
    true,
  );
  const districtBoundaryOpacity = getLayerOpacity(
    layers,
    "districtBoundary",
    100,
  );
  const tehsilBoundaryVisible = getLayerVisible(layers, "tehsilBoundary", true);
  const tehsilBoundaryOpacity = getLayerOpacity(layers, "tehsilBoundary", 100);
  const mauzaBoundaryVisible = getLayerVisible(layers, "mauzaBoundary", true);
  const mauzaBoundaryOpacity = getLayerOpacity(layers, "mauzaBoundary", 100);
  const squareLayerVisible = getLayerVisible(layers, "squareLayer", false);
  const squareLayerOpacity = getLayerOpacity(layers, "squareLayer", 100);
  const acreLayerVisible = getLayerVisible(layers, "acreLayer", false);
  const acreLayerOpacity = getLayerOpacity(layers, "acreLayer", 100);
  const khasraLayerVisible = getLayerVisible(layers, "khasraLayer", false);
  const khasraLayerOpacity = getLayerOpacity(layers, "khasraLayer", 100);
  const khasraLayerForceLoad = getLayerForceLoad(layers, "khasraLayer");
  const murabbaLayerVisible = getLayerVisible(layers, "murabbaLayer", false);
  const murabbaLayerOpacity = getLayerOpacity(layers, "murabbaLayer", 100);
  const murabbaLayerForceLoad = getLayerForceLoad(layers, "murabbaLayer");
  const triJunctionPointsVisible = getLayerVisible(
    layers,
    "triJunctionPoints",
    false,
  );
  const triJunctionPointsOpacity = getLayerOpacity(
    layers,
    "triJunctionPoints",
    100,
  );
  const fieldPointsVisible = getLayerVisible(layers, "fieldPoints", false);
  const fieldPointsOpacity = getLayerOpacity(layers, "fieldPoints", 100);
  const possessionLandVisible = getLayerVisible(
    layers,
    "possessionLand",
    false,
  );
  const possessionLandOpacity = getLayerOpacity(layers, "possessionLand", 100);
  const possessionLandSelectedTypes = normalizePossessionLandTypes(
    typeof layers?.possessionLand === "object"
      ? layers.possessionLand.selectedTypes
      : undefined,
  );
  const possessionLandTypeSelectionKey = possessionLandSelectedTypes.join("|");
  possessionLandSelectedTypesRef.current = possessionLandSelectedTypes;

  const awardedLandVisible = getLayerVisible(layers, "awardedLand", false);
  const awardedLandOpacity = getLayerOpacity(layers, "awardedLand", 100);
  const stateLandVisible = getLayerVisible(layers, "stateLand", false);
  const stateLandOpacity = getLayerOpacity(layers, "stateLand", 100);
  const getLayerColorValue = (layerKey, fallback) => {
    const value = layers?.[layerKey];
    return typeof value === "object" && value.color ? value.color : fallback;
  };

  // RUDA boundary and proposed roads keep their own thematic styling.
  // Do not force a single picked color on these two grouped layers.
  const geodeticNetworkColor = getLayerColorValue(
    "geodeticNetwork",
    VECTOR_LAYER_THEME.geodeticNetwork.circle,
  );
  const districtBoundaryColor = getLayerColorValue(
    "districtBoundary",
    CADASTRAL_BOUNDARY_STYLES.district.lineColor,
  );
  const tehsilBoundaryColor = getLayerColorValue(
    "tehsilBoundary",
    CADASTRAL_BOUNDARY_STYLES.tehsil.lineColor,
  );
  const mauzaBoundaryColor = getLayerColorValue(
    "mauzaBoundary",
    CADASTRAL_BOUNDARY_STYLES.mauza.lineColor,
  );
  const squareLayerColor = getLayerColorValue("squareLayer", "#8b5cf6");
  const acreLayerColor = getLayerColorValue("acreLayer", "#14b8a6");
  // A Mapbox expression keeps verified and unverified parcels styled
  // independently when both datasets are displayed together.
  const khasraLayerColor = getKhasraStatusColorExpression();
  const murabbaLayerColor = getLayerColorValue("murabbaLayer", "#facc15");
  const triJunctionPointsColor = getLayerColorValue(
    "triJunctionPoints",
    "#e11d48",
  );
  const fieldPointsColor = getLayerColorValue(
    "fieldPoints",
    VECTOR_LAYER_THEME.fieldPoints.circle,
  );
  const controlPointsVisible = getLayerVisible(layers, "controlPoints", false);
  const massaviLayerState = layers?.mussaviLayer ?? layers?.handuGujranOrtho;
  const massaviLayerVisible =
    typeof massaviLayerState === "object"
      ? !!massaviLayerState.visible
      : !!massaviLayerState;
  const massaviLayerOpacity =
    typeof massaviLayerState === "object" &&
    Number.isFinite(Number(massaviLayerState.opacity))
      ? Number(massaviLayerState.opacity) / 100
      : 1.0;
  const selectedMauzaList = Array.isArray(selectedMauza)
    ? selectedMauza.filter(Boolean)
    : selectedMauza
      ? [selectedMauza]
      : [];
  const primarySelectedMauza = selectedMauzaList[0] || null;
  const selectedMauzaName = getMauzaName(primarySelectedMauza);
  const orthoTileUrl = getOrthoTileUrlFromMauza(primarySelectedMauza);
  const districtSelectionKey = buildSelectionKey(selectedDistrict);
  const tehsilSelectionKey = buildSelectionKey(selectedTehsil);
  const rudaPhaseSelectionKey = buildSelectionKey(selectedRudaPhaseIds);
  const proposedRoadSelectionKey = buildSelectionKey(selectedProposedRoadIds);
  const selectedMauzaId = getSelectedMauzaId(primarySelectedMauza);
  const selectedMauzaEntries = selectedMauzaList.map((mauza) => {
    const fallbackId = getSelectedMauzaId(mauza);
    return {
      mauza,
      selectionKey:
        mauza?._selectionKey ??
        String(mauza?.mauza ?? mauza?.name ?? fallbackId ?? "").toLowerCase(),
      verifiedId: mauza?._verifiedMauzaId ?? fallbackId,
      unverifiedId: mauza?._unverifiedMauzaId ?? fallbackId,
    };
  });
  const verifiedMauzaId =
    selectedMauzaEntries[0]?.verifiedId ?? selectedMauzaId;
  const unverifiedMauzaId =
    selectedMauzaEntries[0]?.unverifiedId ?? selectedMauzaId;
  const mauzaSelectionKey = selectedMauzaEntries.length
    ? `${boundaryStatus}:${selectedMauzaEntries
        .map(
          ({ selectionKey, verifiedId, unverifiedId }) =>
            `${selectionKey}:${String(verifiedId ?? "")}:${String(unverifiedId ?? "")}`,
        )
        .sort()
        .join("|")}`
    : "";

  const getCachedGeoJSON = (cacheKey, loader) =>
    apiDataCacheRef.current.getOrLoad(cacheKey, loader);

  const tagMauzaFeatures = (geojson, entry) => ({
    type: "FeatureCollection",
    features: (geojson?.features || []).map((feature) => ({
      ...feature,
      properties: {
        ...(feature?.properties || {}),
        _mauza_selection_key: entry.selectionKey,
      },
    })),
  });

  const loadSelectedMauzaGeoJSON = async ({
    verifiedLoader,
    unverifiedLoader,
  }) => {
    const results = await Promise.all(
      selectedMauzaEntries.map(async (entry) => {
        if (boundaryStatus === "both") {
          const [verified, unverified] = await Promise.all([
            entry.verifiedId
              ? verifiedLoader(entry.verifiedId)
              : emptyFeatureCollection(),
            entry.unverifiedId
              ? unverifiedLoader(entry.unverifiedId)
              : emptyFeatureCollection(),
          ]);
          return tagMauzaFeatures(
            mergeStatusGeoJSON(verified, unverified),
            entry,
          );
        }

        if (boundaryStatus === "verified") {
          const data = entry.verifiedId
            ? await verifiedLoader(entry.verifiedId)
            : emptyFeatureCollection();
          return tagMauzaFeatures(
            markVerificationStatus(data, "verified"),
            entry,
          );
        }

        const data = entry.unverifiedId
          ? await unverifiedLoader(entry.unverifiedId)
          : emptyFeatureCollection();
        return tagMauzaFeatures(
          markVerificationStatus(data, "unverified"),
          entry,
        );
      }),
    );
    return mergeFeatureCollections(results);
  };

  const loadVerifiedForSelectedMauzas = async (loader) => {
    const results = await Promise.all(
      selectedMauzaEntries.map(async (entry) => {
        const id = entry.verifiedId ?? entry.unverifiedId;
        if (!id) return emptyFeatureCollection();
        return tagMauzaFeatures(await loader(id), entry);
      }),
    );
    return mergeFeatureCollections(results);
  };

  const unbindLayerEvents = (layerId) => {
    const map = mapInstance.current;
    const handlers = layerEventHandlersRef.current.get(layerId);
    if (!map || !handlers) return;

    Object.entries(handlers).forEach(([eventName, handler]) => {
      if (!handler) return;
      try {
        map.off(eventName, layerId, handler);
      } catch {
        // The style or layer may already have been removed.
      }
    });
    layerEventHandlersRef.current.delete(layerId);
  };

  const bindLayerEvents = (layerId, handlers) => {
    const map = mapInstance.current;
    if (!map || !layerId) return;

    unbindLayerEvents(layerId);
    Object.entries(handlers).forEach(([eventName, handler]) => {
      if (handler) map.on(eventName, layerId, handler);
    });
    layerEventHandlersRef.current.set(layerId, handlers);
  };

  const handleProposedRoadMouseEnter = () => {
    const map = mapInstance.current;
    if (map) map.getCanvas().style.cursor = "pointer";
  };

  const handleProposedRoadMouseLeave = () => {
    const map = mapInstance.current;
    if (map) map.getCanvas().style.cursor = "";
  };

  const handleProposedRoadClick = (event) => {
    const feature = event.features?.[0];
    if (!feature) return;

    showPolygonPopup("proposedRoad", feature.properties || {}, event.lngLat);
  };

  const clearProposedRoads = () => {
    const map = mapInstance.current;

    try {
      if (map) {
        unbindLayerEvents(PROPOSED_ROADS_FILL);

        if (map.getLayer(PROPOSED_ROADS_LINE)) {
          map.removeLayer(PROPOSED_ROADS_LINE);
        }
        if (map.getLayer(PROPOSED_ROADS_FILL)) {
          map.removeLayer(PROPOSED_ROADS_FILL);
        }
        if (map.getSource(PROPOSED_ROADS_SOURCE)) {
          map.removeSource(PROPOSED_ROADS_SOURCE);
        }
      }
    } catch (error) {
      console.warn("Error clearing Proposed Roads layer", error);
    }

    delete currentGeojson.current["proposed-roads"];
  };

  const drawProposedRoadsLayer = (
    geojson,
    opacityPercent = proposedRoadsOpacity,
  ) => {
    const map = mapInstance.current;
    if (!map) return;

    clearProposedRoads();

    if (!Array.isArray(geojson?.features) || !geojson.features.length) {
      return;
    }

    const opacity = clampOpacity(opacityPercent);

    try {
      map.addSource(PROPOSED_ROADS_SOURCE, {
        type: "geojson",
        data: geojson,
      });

      map.addLayer({
        id: PROPOSED_ROADS_FILL,
        type: "fill",
        source: PROPOSED_ROADS_SOURCE,
        paint: getRudaProposedRoadFillPaint(undefined, opacity),
      });

      map.addLayer({
        id: PROPOSED_ROADS_LINE,
        type: "line",
        source: PROPOSED_ROADS_SOURCE,
        paint: getRudaProposedRoadLinePaint(undefined, opacity),
      });

      bindLayerEvents(PROPOSED_ROADS_FILL, {
        mouseenter: handleProposedRoadMouseEnter,
        mouseleave: handleProposedRoadMouseLeave,
        click: handleProposedRoadClick,
      });

      currentGeojson.current["proposed-roads"] = geojson;
      movePointLayersToTop();
    } catch (error) {
      console.error("Failed to draw Proposed Roads layer", error);
      clearProposedRoads();
    }
  };

  const movePointLayersToTop = () => {
    const map = mapInstance.current;
    if (!map) return;

    [
      CONTROL_POINTS_LAYER,
      getPointLabelLayerId(CONTROL_POINTS_LAYER),
      TRI_JUNCTION_BURJI_LAYER,
      TRI_JUNCTION_BURJI_LABEL,
      TRI_JUNCTION_POINTS_LAYER,
      TRI_JUNCTION_POINTS_LABEL,
      FIELD_POINTS_LAYER,
      FIELD_POINTS_LABEL,
      GEODETIC_NETWORK_LAYER,
      GEODETIC_NETWORK_LABEL,
      SELECTED_CORNER_LAYER,
      SELECTED_CORNER_BOX_LAYER,
      SELECTED_CORNER_TEXT_LAYER,
    ].forEach((layerId) => {
      try {
        if (map.getLayer(layerId)) {
          map.moveLayer(layerId);
        }
      } catch (e) {}
    });
  };

  const getOpenAreaGeoJSON = () => {
    const selectedArea = currentGeojson.current?.["selected-area"];
    if (selectedArea?.features?.length) return selectedArea;

    const mauzaArea = currentGeojson.current?.mauza;
    if (mauzaArea?.features?.length) return mauzaArea;

    const khasraArea = currentGeojson.current?.khasra;
    if (khasraArea?.features?.length) return khasraArea;

    const murabbaArea = currentGeojson.current?.murabba;
    if (murabbaArea?.features?.length) return murabbaArea;

    return null;
  };

  const resolveOpenAreaGeoJSON = async () => {
    const currentArea = getOpenAreaGeoJSON();
    if (currentArea?.features?.length) return currentArea;

    if (!selectedMauzaList.length) return null;

    try {
      const mauzaGeojson = await getCachedGeoJSON(
        `mauza:${mauzaSelectionKey}`,
        () =>
          loadSelectedMauzaGeoJSON({
            verifiedLoader: getMauzaBoundary,
            unverifiedLoader: getRudaMauzas,
          }),
      );

      if (mauzaGeojson?.features?.length) {
        currentGeojson.current.mauza = mauzaGeojson;
        return mauzaGeojson;
      }
    } catch (e) {
      console.warn("Could not resolve open area for point filtering", e);
    }

    return null;
  };

  const closeActivePopup = () => {
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
      popupTimeoutRef.current = null;
    }

    if (activePopupRef.current) {
      activePopupRef.current.remove();
      activePopupRef.current = null;
    }
  };

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    try {
      const map = new mapboxgl.Map({
        container: mapRef.current,
        style: BASEMAP_STYLES.Streets,
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        preserveDrawingBuffer: true,
      });

      // Add standard GIS controls
      map.addControl(new mapboxgl.NavigationControl(), "top-right");
      map.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserHeading: true,
        }),
        "top-right",
      );
      map.addControl(new mapboxgl.FullscreenControl(), "top-right");
      map.addControl(
        new mapboxgl.ScaleControl({ maxWidth: 200, unit: "metric" }),
        "bottom-right",
      );
      map.on("load", () => {
        setIsMapReady(true);
        if (typeof onMapReady === "function") onMapReady(map);
      });

      // Basemap changes are restored by the dedicated basemap effect below.
      // Keeping one restoration path prevents the same point layers from
      // being created twice during a style reload.

      map.on("error", (e) => {
        console.error("Map error:", e);
        setError("Error initializing map");
      });

      mapInstance.current = map;

      return () => {
        closeActivePopup();

        if (mapInstance.current) {
          mapInstance.current.remove();
          mapInstance.current = null;
        }
      };
    } catch (e) {
      console.error("Map initialization error:", e);
      setError("Failed to initialize map");
    }
  }, []);

  useEffect(() => {
    if (!isMapReady) return undefined;

    let cancelled = false;

    const loadProposedRoads = async () => {
      const map = mapInstance.current;
      if (!map) return;

      if (!proposedRoadsVisible) {
        clearProposedRoads();
        return;
      }

      clearProposedRoads();

      if (!selectedProposedRoadIds?.length) return;

      try {
        setIsLoading(true);

        const allRoadsGeojson = await getCachedGeoJSON(
          "proposed-roads:all",
          getProposedRoadsGeoJSON,
        );
        if (cancelled) return;

        const selectedIds = new Set(
          selectedProposedRoadIds.map((id) => String(id)),
        );

        const filteredGeojson = {
          type: "FeatureCollection",
          features: (allRoadsGeojson.features || [])
            .filter((feature) => {
              const props = feature?.properties || {};
              const featureIds = [
                props.gid,
                feature?.id,
                props.id,
                props.oid,
                props.fid,
              ]
                .filter(
                  (value) =>
                    value !== undefined && value !== null && value !== "",
                )
                .map(String);

              return featureIds.some((id) => selectedIds.has(id));
            })
            .map((feature) => {
              const properties = feature?.properties || {};
              const roadType =
                properties.road_type ??
                properties.type ??
                properties.Type ??
                properties.TYPE ??
                "";

              return {
                ...feature,
                properties: {
                  ...properties,
                  road_type: roadType,
                  type: roadType,
                },
              };
            }),
        };

        if (!filteredGeojson.features.length) return;

        drawProposedRoadsLayer(filteredGeojson, proposedRoadsOpacity);
        zoomToGeoJSON(filteredGeojson, { padding: 70, duration: 500 });
        movePointLayersToTop();
      } catch (e) {
        if (!cancelled) console.error("Proposed roads layer load error", e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadProposedRoads();
    return () => {
      cancelled = true;
    };
  }, [isMapReady, proposedRoadsVisible, proposedRoadSelectionKey]);

  useEffect(() => {
    if (previousBoundaryStatusRef.current !== boundaryStatus) {
      previousBoundaryStatusRef.current = boundaryStatus;
      suppressAutoZoomUntilRef.current = Date.now() + 1600;
    }
  }, [boundaryStatus]);

  const zoomToGeoJSON = (geojson, options = {}) => {
    if (Date.now() < suppressAutoZoomUntilRef.current) return;
    const map = mapInstance.current;
    if (!map || !geojson?.features?.length) return;

    const bounds = new mapboxgl.LngLatBounds();

    geojson.features.forEach((feature) => {
      const coords = feature.geometry?.coordinates;
      if (!coords) return;

      const traverse = (c) => {
        if (typeof c[0] === "number") {
          bounds.extend(c);
        } else {
          c.forEach(traverse);
        }
      };

      traverse(coords);
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: options.padding ?? 40,
        duration: options.duration ?? 350,
        essential: true,
      });
    }
  };

  const reportLoadedFeatures = (geojson, featureType = null) => {
    try {
      if (typeof onFeaturesLoaded === "function") {
        onFeaturesLoaded(geojson, featureType);
      }
    } catch (e) {
      console.warn("onFeaturesLoaded callback failed", e);
    }
  };

  const clearBoundaryLevel = (level) => {
    const map = mapInstance.current;
    if (!map) return;

    const ids = getBoundaryIds(level);
    [ids.fill, ids.line, ids.dashLine, ids.label].forEach(unbindLayerEvents);

    try {
      removeBoundaryLevelLayers(map, ids);
    } catch (e) {
      console.warn(`Error clearing boundary level ${level}`, e);
    }
  };

  const drawBoundaryLevel = (level, geojson, opacityOverride = null) => {
    const map = mapInstance.current;
    if (!map) return;

    const ids = getBoundaryIds(level);
    clearBoundaryLevel(level);

    const isRudaLayer = level.startsWith("ruda");
    const isProposedRoadLayer = level.startsWith("proposed-road");

    const layerOpacity = clampOpacity(
      opacityOverride !== null && opacityOverride !== undefined
        ? opacityOverride
        : isRudaLayer
          ? rudaBoundaryOpacity
          : 100,
    );

    const sourceGeojson = isRudaLayer
      ? prepareRudaGeojsonForDisplay(level, geojson)
      : geojson || emptyFeatureCollection();

    try {
      addBoundaryLevelLayers({
        map,
        ids,
        level,
        sourceGeojson,
        layerOpacity,
      });

      // Apply the slider to the layer's original style values. This keeps
      // light polygon fills light instead of replacing them with a solid fill.
      applyOpacityToBoundaryLevel(
        level,
        opacityOverride !== null && opacityOverride !== undefined
          ? opacityOverride
          : isRudaLayer
            ? rudaBoundaryOpacity
            : 100,
      );

      currentGeojson.current[level] = sourceGeojson;
      const thematicColor = boundaryLevelColor(level);
      if (thematicColor) applyColorToBoundaryLevel(level, thematicColor);

      const centralizedStyle = CADASTRAL_BOUNDARY_STYLES[level];
      if (centralizedStyle && map.getLayer(ids.line)) {
        map.setPaintProperty(
          ids.line,
          "line-width",
          centralizedStyle.lineWidth,
        );
        map.setPaintProperty(
          ids.line,
          "line-opacity",
          centralizedStyle.lineOpacity * layerOpacity,
        );
      }
      movePointLayersToTop();

      // ── Click popup for polygon / line boundary layers ─────────────────
      // Determine which layer ID to listen on and which popup type to show.
      const popupLayerId = isProposedRoadLayer
        ? ids.line // proposed roads are lines only
        : ids.fill; // all other boundaries have a fill layer

      if (map.getLayer(popupLayerId)) {
        // Determine popup type from level name
        const popupType = isRudaLayer
          ? "ruda"
          : level === "district"
            ? "district"
            : level === "tehsil"
              ? "tehsil"
              : level === "mauza"
                ? "mauza"
                : level === SQUARE_LEVEL
                  ? "square"
                  : level === ACRE_LEVEL
                    ? "acre"
                    : level;

        bindLayerEvents(popupLayerId, {
          mouseenter: () => {
            map.getCanvas().style.cursor = "pointer";
          },
          mouseleave: () => {
            map.getCanvas().style.cursor = "";
          },
          click: (event) => {
            const feature = event.features?.[0];
            if (!feature) return;
            showPolygonPopup(popupType, feature.properties || {}, event.lngLat);
          },
        });
      }
    } catch (e) {
      console.error("drawBoundaryLevel error", e);
    }
  };

  const applyOpacityToMapLayer = (layerId, opacityValue, baseOpacity = 1) => {
    const map = mapInstance.current;
    if (!map || !layerId || !map.getLayer(layerId)) return;

    const layer = map.getLayer(layerId);
    const opacity = clampOpacity(opacityValue);
    const finalOpacity = Math.max(
      0,
      Math.min(1, Number(baseOpacity) * opacity),
    );

    try {
      if (layer.type === "fill") {
        map.setPaintProperty(layerId, "fill-opacity", finalOpacity);
      } else if (layer.type === "line") {
        map.setPaintProperty(layerId, "line-opacity", finalOpacity);
      } else if (layer.type === "circle") {
        map.setPaintProperty(layerId, "circle-opacity", finalOpacity);
        map.setPaintProperty(layerId, "circle-stroke-opacity", finalOpacity);
      } else if (layer.type === "symbol") {
        map.setPaintProperty(layerId, "text-opacity", finalOpacity);
        map.setPaintProperty(layerId, "icon-opacity", finalOpacity);
      } else if (layer.type === "raster") {
        map.setPaintProperty(layerId, "raster-opacity", finalOpacity);
      } else if (layer.type === "fill-extrusion") {
        map.setPaintProperty(layerId, "fill-extrusion-opacity", finalOpacity);
      }
    } catch (e) {
      console.warn(`Could not update opacity for ${layerId}`, e);
    }
  };

  const getBoundaryThemeForOpacity = (level) => {
    if (CADASTRAL_BOUNDARY_STYLES[level]) {
      return {
        ...VECTOR_LAYER_THEME.defaultBoundary,
        fillOpacity: CADASTRAL_BOUNDARY_STYLES[level].fillOpacity,
      };
    }
    if (level === SQUARE_LEVEL) return VECTOR_LAYER_THEME.square;
    if (level === ACRE_LEVEL) return VECTOR_LAYER_THEME.acre;
    return VECTOR_LAYER_THEME.defaultBoundary;
  };

  const applyOpacityToBoundaryLevel = (level, opacityValue) => {
    const map = mapInstance.current;
    if (!map) return;

    const ids = getBoundaryIds(level);
    const isRudaLayer = String(level).startsWith("ruda");
    const isProposedRoadLayer = String(level).startsWith("proposed-road");

    if (isProposedRoadLayer) {
      applyOpacityToMapLayer(ids.line, opacityValue);
      return;
    }

    if (isRudaLayer) {
      applyOpacityToMapLayer(ids.fill, opacityValue);
      applyOpacityToMapLayer(ids.line, opacityValue, 0.95);
      applyOpacityToMapLayer(ids.dashLine, opacityValue, 0.9);
      applyOpacityToMapLayer(ids.label, opacityValue);
      return;
    }

    const theme = getBoundaryThemeForOpacity(level);
    applyOpacityToMapLayer(ids.fill, opacityValue, theme?.fillOpacity ?? 0.04);
    applyOpacityToMapLayer(ids.line, opacityValue, 0.95);
    applyOpacityToMapLayer(ids.label, opacityValue);
  };

  const boundaryLevelColor = (level) => {
    if (String(level).startsWith("ruda")) return null;
    if (String(level).startsWith("proposed-road")) return null;
    if (level === "district") return districtBoundaryColor;
    if (level === "tehsil") return tehsilBoundaryColor;
    if (level === "mauza") return mauzaBoundaryColor;
    if (level === SQUARE_LEVEL) return squareLayerColor;
    if (level === ACRE_LEVEL) return acreLayerColor;
    return null;
  };

  const applyColorToMapLayer = (layerId, colorValue) => {
    const map = mapInstance.current;
    if (!map || !layerId || !map.getLayer(layerId) || !colorValue) return;

    const layer = map.getLayer(layerId);

    try {
      if (layer.type === "fill") {
        map.setPaintProperty(layerId, "fill-color", colorValue);
      } else if (layer.type === "line") {
        map.setPaintProperty(layerId, "line-color", colorValue);
      } else if (layer.type === "circle") {
        map.setPaintProperty(layerId, "circle-color", colorValue);
        map.setPaintProperty(layerId, "circle-stroke-color", colorValue);
      } else if (layer.type === "symbol") {
        map.setPaintProperty(layerId, "text-color", colorValue);
      }
    } catch (e) {
      console.warn(`Could not update color for ${layerId}`, e);
    }
  };

  const applyColorToBoundaryLevel = (level, colorValue) => {
    const map = mapInstance.current;
    if (!map || !colorValue) return;

    const ids = getBoundaryIds(level);
    const adminStyle = CADASTRAL_BOUNDARY_STYLES[level];

    try {
      if (map.getLayer(ids.fill)) {
        // District and Tehsil use a separate light fill colour.
        // Mauza keeps the fill layer transparent so it remains clickable.
        if (adminStyle) {
          map.setPaintProperty(ids.fill, "fill-color", adminStyle.fillColor);
        }
        map.setPaintProperty(ids.fill, "fill-outline-color", colorValue);
      }
    } catch (e) {
      console.warn(`Could not update fill style for ${level}`, e);
    }

    [ids.line, ids.dashLine, ids.label].forEach((layerId) =>
      applyColorToMapLayer(layerId, colorValue),
    );
  };

  const clearLayerAndSource = (fillId, lineId, sourceId) => {
    const map = mapInstance.current;
    if (!map) return;

    try {
      if (fillId && map.getLayer(fillId)) map.removeLayer(fillId);
      if (lineId && map.getLayer(lineId)) map.removeLayer(lineId);
      if (sourceId && map.getSource(sourceId)) map.removeSource(sourceId);
    } catch (e) {
      console.warn(`Error clearing ${sourceId}`, e);
    }
  };

  const clearPointLayer = (
    sourceId,
    layerId,
    labelLayerId = getPointLabelLayerId(layerId),
  ) => {
    const map = mapInstance.current;
    if (!map) return;

    try {
      closeActivePopup();

      if (labelLayerId && map.getLayer(labelLayerId)) {
        map.removeLayer(labelLayerId);
      }

      unbindLayerEvents(layerId);
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }

      const attachedLayers = (map.getStyle()?.layers || [])
        .filter((layer) => layer.source === sourceId)
        .map((layer) => layer.id)
        .reverse();

      attachedLayers.forEach((attachedLayerId) => {
        if (map.getLayer(attachedLayerId)) {
          map.removeLayer(attachedLayerId);
        }
      });

      if (map.getSource(sourceId)) map.removeSource(sourceId);
    } catch (e) {
      console.warn(`Error clearing point layer ${layerId}`, e);
    }
  };

  const detachKhasraEventHandlers = (map = mapInstance.current) => {
    if (!map) return;

    const handlers = khasraEventHandlersRef.current;

    try {
      if (handlers.click) {
        map.off("click", KHASRA_FILL, handlers.click);
      }
      if (handlers.mouseenter) {
        map.off("mouseenter", KHASRA_FILL, handlers.mouseenter);
      }
      if (handlers.mouseleave) {
        map.off("mouseleave", KHASRA_FILL, handlers.mouseleave);
      }
    } catch (error) {
      // The layer may already have been removed during a style change.
    } finally {
      khasraEventHandlersRef.current = {
        click: null,
        mouseenter: null,
        mouseleave: null,
      };
    }
  };

  const clearKhasraLayers = () => {
    const map = mapInstance.current;

    // Delegated Mapbox listeners survive source/layer redraws unless the exact
    // callback is removed. Detach them first so one click toggles only once.
    detachKhasraEventHandlers(map);

    try {
      if (map?.getLayer(KHASRA_LABEL)) map.removeLayer(KHASRA_LABEL);
    } catch (e) {}
    clearLayerAndSource(KHASRA_FILL, KHASRA_LINE, KHASRA_SOURCE);
  };

  const clearMurabbaLayers = () => {
    const map = mapInstance.current;
    unbindLayerEvents(MURABBA_FILL);
    try {
      if (map?.getLayer(MURABBA_LABEL)) map.removeLayer(MURABBA_LABEL);
    } catch (e) {}
    clearLayerAndSource(MURABBA_FILL, MURABBA_LINE, MURABBA_SOURCE);
  };

  // Single show-popup helper used by all layers
  const showMapviewPopup = (layerType, props, lngLat, coordinates = null) => {
    const map = mapInstance.current;
    if (!map) return;

    closeActivePopup();

    const title = POPUP_TITLES[layerType] ?? layerType;
    const rows = buildPopupRowsForType(layerType, props, coordinates);
    const html = buildUnifiedPopupHtml(title, rows);

    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 15,
      maxWidth: "none",
      className: "mapview-unified-popup",
    })
      .setLngLat(lngLat)
      .setHTML(html)
      .addTo(map);

    // Match GISMetaverse popup shell styling
    const el = popup.getElement();
    const content = el?.querySelector(".mapboxgl-popup-content");
    if (content) {
      content.style.cssText =
        "padding:0;background:transparent;box-shadow:none;border-radius:10px;";
    }
    const tip = el?.querySelector(".mapboxgl-popup-tip");
    if (tip) tip.style.borderTopColor = "#111827";

    const closeBtn = el?.querySelector("[data-mapview-popup-close]");
    if (closeBtn) {
      closeBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        closeActivePopup();
      });
    }

    activePopupRef.current = popup;

    popupTimeoutRef.current = setTimeout(() => {
      if (activePopupRef.current === popup) {
        popup.remove();
        activePopupRef.current = null;
      }
      popupTimeoutRef.current = null;
    }, 8000);

    popup.on("close", () => {
      if (activePopupRef.current === popup) activePopupRef.current = null;
      if (popupTimeoutRef.current) {
        clearTimeout(popupTimeoutRef.current);
        popupTimeoutRef.current = null;
      }
    });
  };

  // Keep showPolygonPopup as a thin wrapper so existing call-sites don't break
  const showPolygonPopup = (layerType, props, lngLat) => {
    showMapviewPopup(layerType, props, lngLat);
  };

  function handlePointMouseEnter() {
    const map = mapInstance.current;
    if (!map) return;
    map.getCanvas().style.cursor = "pointer";
  }

  function handlePointMouseLeave() {
    const map = mapInstance.current;
    if (!map) return;
    map.getCanvas().style.cursor = "";
  }

  function handlePointClick(e) {
    const map = mapInstance.current;
    if (!map) return;

    const feature = e.features?.[0];
    if (!feature) return;

    const props = feature.properties || {};
    const coordinates = getFeatureLatLng(feature, e.lngLat);

    // Determine which unified popup type to use
    const isGeodetic = props._layerType === "geodeticNetwork";
    const isFieldPoint = props._layerType === "fieldPoints";
    const isTriJunction = String(props.type ?? "").toUpperCase() === "TJ";
    const isControlPoint = String(props.type ?? "").toUpperCase() === "B";

    const layerType = isGeodetic
      ? "geodetic"
      : isFieldPoint
        ? "fieldPoint"
        : isTriJunction
          ? "trijunction"
          : isControlPoint
            ? "controlPoint"
            : "controlPoint";

    const lngLat =
      e.lngLat ||
      (coordinates.lng != null && coordinates.lat != null
        ? [coordinates.lng, coordinates.lat]
        : DEFAULT_CENTER);

    showMapviewPopup(layerType, props, lngLat, coordinates);
  }

  const drawPointLayer = ({
    sourceId,
    layerId,
    geojson,
    color,
    strokeColor,
    radius,
    opacity = 0.95,
    labelLayerId = getPointLabelLayerId(layerId),
    labelExpression = null,
    labelColor = "#1f2937",
    labelMinZoom = 15,
    labelSize = ["interpolate", ["linear"], ["zoom"], 14, 10, 17, 12],
    labelOffset = [0, 1.15],
  }) => {
    const map = mapInstance.current;
    if (!map) return;

    clearPointLayer(sourceId, layerId, labelLayerId);

    if (!geojson?.features || !Array.isArray(geojson.features)) return;

    try {
      addPointLayerStyles({
        map,
        sourceId,
        layerId,
        geojson,
        color,
        strokeColor,
        radius,
        opacity,
        labelLayerId,
        labelExpression,
        labelColor,
        labelMinZoom,
        labelSize,
        labelOffset,
      });

      bindLayerEvents(layerId, {
        mouseenter: handlePointMouseEnter,
        mouseleave: handlePointMouseLeave,
        click: handlePointClick,
      });

      movePointLayersToTop();
    } catch (e) {
      console.error(`Failed to draw ${layerId}`, e);
    }
  };

  const clearTriJunctionLayer = () => {
    const map = mapInstance.current;
    if (!map) return;

    try {
      closeActivePopup();

      [
        TRI_JUNCTION_POINTS_LABEL,
        TRI_JUNCTION_BURJI_LABEL,
        TRI_JUNCTION_POINTS_LAYER,
        TRI_JUNCTION_BURJI_LAYER,
      ].forEach((layerId) => {
        unbindLayerEvents(layerId);
        if (map.getLayer(layerId)) map.removeLayer(layerId);
      });

      if (map.getSource(TRI_JUNCTION_POINTS_SOURCE)) {
        map.removeSource(TRI_JUNCTION_POINTS_SOURCE);
      }
    } catch (e) {
      console.warn("Error clearing tri-junction / burji layer", e);
    }
  };

  const bringTriJunctionToTop = () => {
    const map = mapInstance.current;
    if (!map) return;

    try {
      [
        TRI_JUNCTION_BURJI_LAYER,
        TRI_JUNCTION_BURJI_LABEL,
        TRI_JUNCTION_POINTS_LAYER,
        TRI_JUNCTION_POINTS_LABEL,
      ].forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.moveLayer(layerId);
        }
      });
    } catch (e) {
      console.warn("Could not move tri-junction / burji layers to top", e);
    }
  };

  const drawTriJunctionLayer = ({ sourceId, layerId, geojson }) => {
    const map = mapInstance.current;
    if (!map) return;

    clearTriJunctionLayer();

    if (!geojson?.features || !Array.isArray(geojson.features)) return;

    const pointGeojson = keepValidPointFeaturesForMap(geojson);
    if (!pointGeojson.features.length) {
      console.warn(
        "Tri Junction / Burji points were fetched but have no valid EPSG:4326 point coordinates.",
      );
      return;
    }

    try {
      addTriJunctionLayerStyles({
        map,
        sourceId,
        layerId,
        pointGeojson,
        opacity: triJunctionPointsOpacity / 100,
        color: triJunctionPointsColor,
        strokeColor: VECTOR_LAYER_THEME.trijunction.triangleStroke,
      });

      [TRI_JUNCTION_BURJI_LAYER, layerId].forEach((clickLayerId) => {
        bindLayerEvents(clickLayerId, {
          mouseenter: handlePointMouseEnter,
          mouseleave: handlePointMouseLeave,
          click: handlePointClick,
        });
      });

      currentGeojson.current["tri-junction-points"] = pointGeojson;
      bringTriJunctionToTop();
      movePointLayersToTop();
    } catch (e) {
      console.error(`Failed to draw ${layerId}`, e);
    }
  };

  const ensureSelectedLayers = (map) => {
    ensureSelectedLayerStyles({
      map,
      emptyGeojson: emptyFeatureCollection(),
    });
  };

  const drawKhasras = (geojson) => {
    const map = mapInstance.current;
    if (!map) return;

    try {
      clearKhasraLayers();

      try {
        const sel = map.getSource(SELECTED_SOURCE);
        if (sel) sel.setData(emptyFeatureCollection());
      } catch (err) {}

      if (!geojson?.features || !Array.isArray(geojson.features)) {
        setFeatureCount(0);
        return;
      }

      const khasraOpacity = clampOpacity(khasraLayerOpacity);

      addKhasraLayerStyles({
        map,
        geojson,
        opacity: khasraOpacity,
        color: khasraLayerColor,
      });

      applyOpacityToMapLayer(
        KHASRA_FILL,
        khasraLayerOpacity,
        VECTOR_LAYER_THEME.khasra.fillOpacity,
      );
      applyOpacityToMapLayer(KHASRA_LINE, khasraLayerOpacity, 0.95);
      applyOpacityToMapLayer(KHASRA_LABEL, khasraLayerOpacity);

      // Reapply the current status color after every redraw/style reload.
      [KHASRA_FILL, KHASRA_LINE].forEach((layerId) =>
        applyColorToMapLayer(layerId, khasraLayerColor),
      );

      currentGeojson.current.khasra = geojson;

      ensureSelectedLayers(map);

      // Always register one stable set of handlers for the current Khasra
      // layer. This prevents duplicate callbacks after redraws/style reloads.
      detachKhasraEventHandlers(map);

      const handleKhasraClick = (e) => {
        // AOI drawing owns map clicks while active. Do not select a parcel,
        // open its popup, or update Parcel Information during drawing.
        if (drawAOIEnabledRef.current) return;
        if (!e.features?.length) return;

        const feature = e.features[0];
        const area_m2 = computeArea(feature);
        const area_acres = area_m2 / 4046.8564224;

        const cloned = JSON.parse(JSON.stringify(feature));
        cloned.properties = cloned.properties || {};
        cloned.properties._area_m2 = area_m2;
        cloned.properties._area_acres = area_acres;
        cloned.properties._layerType = "khasra";

        if (multiSelectionModeRef.current) {
          closeActivePopup();
          if (typeof onMultiParcelToggleRef.current === "function") {
            onMultiParcelToggleRef.current(cloned);
          }
          return;
        }

        const selectedGeo = {
          type: "FeatureCollection",
          features: [feature],
        };

        currentGeojson.current["selected-area"] = selectedGeo;

        try {
          const src = map.getSource(SELECTED_SOURCE);
          if (src) src.setData(selectedGeo);
        } catch (err) {
          console.warn("Could not set selected feature", err);
        }

        // Preserve the existing single-selection popup and callback.
        const propsWithArea = {
          ...(feature.properties || {}),
          _area_acres: area_acres,
        };
        showPolygonPopup("khasra", propsWithArea, e.lngLat);

        if (typeof onParcelSelect === "function") {
          onParcelSelect(cloned);
        }
      };

      const handleKhasraMouseEnter = () => {
        if (drawAOIEnabledRef.current) return;
        const canvas = map.getCanvas?.();
        if (canvas) canvas.style.cursor = "pointer";
      };

      const handleKhasraMouseLeave = () => {
        if (drawAOIEnabledRef.current) return;
        const canvas = map.getCanvas?.();
        if (canvas) canvas.style.cursor = "";
      };

      khasraEventHandlersRef.current = {
        click: handleKhasraClick,
        mouseenter: handleKhasraMouseEnter,
        mouseleave: handleKhasraMouseLeave,
      };

      map.on("click", KHASRA_FILL, handleKhasraClick);
      map.on("mouseenter", KHASRA_FILL, handleKhasraMouseEnter);
      map.on("mouseleave", KHASRA_FILL, handleKhasraMouseLeave);

      zoomToGeoJSON(geojson);
      movePointLayersToTop();
      setFeatureCount(geojson.features.length);
      reportLoadedFeatures(geojson, "khasra");
    } catch (e) {
      console.error("Khasra drawing error:", e);
      setError("Failed to display Khasras");
    }
  };

  const drawMurabbas = (geojson) => {
    const map = mapInstance.current;
    if (!map) return;

    try {
      clearMurabbaLayers();

      try {
        const sel = map.getSource(SELECTED_SOURCE);
        if (sel) sel.setData(emptyFeatureCollection());
      } catch (err) {}

      if (!geojson?.features || !Array.isArray(geojson.features)) {
        setFeatureCount(0);
        return;
      }

      const murabbaOpacity = clampOpacity(murabbaLayerOpacity);

      addMurabbaLayerStyles({
        map,
        geojson,
        opacity: murabbaOpacity,
      });

      applyOpacityToMapLayer(
        MURABBA_FILL,
        murabbaLayerOpacity,
        VECTOR_LAYER_THEME.murabba.fillOpacity,
      );
      applyOpacityToMapLayer(MURABBA_LINE, murabbaLayerOpacity, 0.95);
      applyOpacityToMapLayer(MURABBA_LABEL, murabbaLayerOpacity);

      currentGeojson.current.murabba = geojson;

      ensureSelectedLayers(map);

      bindLayerEvents(MURABBA_FILL, {
        click: (event) => {
          const feature = event.features?.[0];
          if (!feature) return;

          const area_m2 = computeArea(feature);
          const area_acres = area_m2 / 4046.8564224;
          const selectedGeo = {
            type: "FeatureCollection",
            features: [feature],
          };

          currentGeojson.current["selected-area"] = selectedGeo;

          try {
            map.getSource(SELECTED_SOURCE)?.setData(selectedGeo);
          } catch (error) {
            console.warn("Could not set selected feature", error);
          }

          showPolygonPopup(
            "murabba",
            {
              ...(feature.properties || {}),
              _area_acres: area_acres,
            },
            event.lngLat,
          );

          if (typeof onParcelSelect === "function") {
            const cloned = JSON.parse(JSON.stringify(feature));
            cloned.properties = cloned.properties || {};
            cloned.properties._area_m2 = area_m2;
            cloned.properties._area_acres = area_acres;
            cloned.properties._layerType = "murabba";
            onParcelSelect(cloned);
          }
        },
        mouseenter: () => {
          map.getCanvas().style.cursor = "pointer";
        },
        mouseleave: () => {
          map.getCanvas().style.cursor = "";
        },
      });

      zoomToGeoJSON(geojson);
      movePointLayersToTop();
      setFeatureCount(geojson.features.length);
      reportLoadedFeatures(geojson, "murabba");
    } catch (e) {
      console.error("Murabba drawing error:", e);
      setError("Failed to display Murabbas");
    }
  };

  const removeThematicLandLayer = (key) => {
    const map = mapInstance.current;
    const ids = THEMATIC_LAND_LAYERS[key];
    if (!map || !ids) return;
    [ids.label, ids.line, ids.fill].forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    if (map.getSource(ids.source)) map.removeSource(ids.source);
    delete currentGeojson.current[key];
  };

  const drawThematicLandLayer = (key, geojson, opacityPercent) => {
    const map = mapInstance.current;
    const ids = THEMATIC_LAND_LAYERS[key];
    if (!map || !ids) return;

    removeThematicLandLayer(key);

    const opacity = clampOpacity(opacityPercent);
    const isPossession = key === "possessionLand";

    if (isPossession) {
      addPossessionLandLayerStyles({
        map,
        layerIds: ids,
        geojson,
        opacity,
        selectedTypes: possessionLandSelectedTypesRef.current,
        labelExpression: KHASRA_ONLY_LABEL,
      });
    } else {
      const fillColor = key === "awardedLand" ? "#FAEEDA" : "#F1EFE8";
      const lineColor = key === "awardedLand" ? "#854F0B" : "#5F5E5A";
      const labelMinZoom = 14;

      map.addSource(ids.source, { type: "geojson", data: geojson });

      map.addLayer({
        id: ids.fill,
        type: "fill",
        source: ids.source,
        paint: {
          "fill-color": fillColor,
          "fill-opacity": 0.65 * opacity,
        },
      });
      map.addLayer({
        id: ids.line,
        type: "line",
        source: ids.source,
        paint: {
          "line-color": lineColor,
          "line-width": 1.3,
          "line-opacity": opacity,
        },
      });
      map.addLayer({
        id: ids.label,
        type: "symbol",
        source: ids.source,
        minzoom: labelMinZoom,
        maxzoom: 24,
        layout: {
          "text-field": KHASRA_ONLY_LABEL,
          "text-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            labelMinZoom,
            10,
            16,
            11,
            18,
            13,
          ],
          "text-allow-overlap": false,
          "text-ignore-placement": false,
        },
        paint: {
          "text-color": lineColor,
          "text-opacity": opacity,
          "text-halo-color": "#ffffff",
          "text-halo-width": 1,
        },
      });
    }

    currentGeojson.current[key] = geojson;
    movePointLayersToTop();
  };

  useEffect(() => {
    if (!isMapReady) return;

    const configs = [
      {
        key: "possessionLand",
        visible: possessionLandVisible,
        opacity: possessionLandOpacity,
        loader: getPossessionLandGeoJSON,
      },
      {
        key: "awardedLand",
        visible: awardedLandVisible,
        opacity: awardedLandOpacity,
        loader: getAwardedLandGeoJSON,
      },
      {
        key: "stateLand",
        visible: stateLandVisible,
        opacity: stateLandOpacity,
        loader: getStateLandGeoJSON,
      },
    ];

    let cancelled = false;

    configs.forEach(async ({ key, visible, opacity, loader }) => {
      if (!visible) {
        removeThematicLandLayer(key);
        return;
      }

      try {
        const cached = currentGeojson.current[key];
        const geojson = cached?.features
          ? cached
          : await getCachedGeoJSON(`thematic-land:${key}`, loader);
        if (!cancelled) drawThematicLandLayer(key, geojson, opacity);
      } catch (error) {
        console.error(`${key} layer load error`, error);
        if (!cancelled) removeThematicLandLayer(key);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    isMapReady,
    possessionLandVisible,
    possessionLandOpacity,
    awardedLandVisible,
    awardedLandOpacity,
    stateLandVisible,
    stateLandOpacity,
  ]);

  useEffect(() => {
    if (!isMapReady || !possessionLandVisible) return;

    applyPossessionLandTypeFilter(
      mapInstance.current,
      THEMATIC_LAND_LAYERS.possessionLand,
      possessionLandSelectedTypesRef.current,
    );
  }, [isMapReady, possessionLandVisible, possessionLandTypeSelectionKey]);

  useEffect(() => {
    if (!isMapReady) return;

    const map = mapInstance.current;
    if (!map) return;

    const opacity = clampOpacity(proposedRoadsOpacity);
    const fillPaint = getRudaProposedRoadFillPaint(undefined, opacity);
    const linePaint = getRudaProposedRoadLinePaint(undefined, opacity);

    try {
      if (map.getLayer(PROPOSED_ROADS_FILL)) {
        map.setPaintProperty(
          PROPOSED_ROADS_FILL,
          "fill-opacity",
          fillPaint["fill-opacity"],
        );
      }
      if (map.getLayer(PROPOSED_ROADS_LINE)) {
        map.setPaintProperty(
          PROPOSED_ROADS_LINE,
          "line-opacity",
          linePaint["line-opacity"],
        );
      }
    } catch (error) {
      console.warn("Could not update Proposed Roads opacity", error);
    }
  }, [isMapReady, proposedRoadsOpacity]);

  useEffect(() => {
    if (!isMapReady) return;
    Object.keys(currentGeojson.current || {})
      .filter((key) => key.startsWith("ruda-"))
      .forEach((level) =>
        applyOpacityToBoundaryLevel(level, rudaBoundaryOpacity),
      );
  }, [isMapReady, rudaBoundaryOpacity]);

  useEffect(() => {
    if (!isMapReady) return;
    applyOpacityToBoundaryLevel("district", districtBoundaryOpacity);
  }, [isMapReady, districtBoundaryOpacity]);

  useEffect(() => {
    if (!isMapReady) return;
    applyOpacityToBoundaryLevel("tehsil", tehsilBoundaryOpacity);
  }, [isMapReady, tehsilBoundaryOpacity]);

  useEffect(() => {
    if (!isMapReady) return;
    applyOpacityToBoundaryLevel("mauza", mauzaBoundaryOpacity);
  }, [isMapReady, mauzaBoundaryOpacity]);

  useEffect(() => {
    if (!isMapReady) return;
    applyOpacityToBoundaryLevel(SQUARE_LEVEL, squareLayerOpacity);
  }, [isMapReady, squareLayerOpacity]);

  useEffect(() => {
    if (!isMapReady) return;
    applyOpacityToBoundaryLevel(ACRE_LEVEL, acreLayerOpacity);
  }, [isMapReady, acreLayerOpacity]);

  useEffect(() => {
    if (!isMapReady) return;

    applyOpacityToMapLayer(
      KHASRA_FILL,
      khasraLayerOpacity,
      VECTOR_LAYER_THEME.khasra.fillOpacity,
    );
    applyOpacityToMapLayer(KHASRA_LINE, khasraLayerOpacity, 0.95);
    applyOpacityToMapLayer(KHASRA_LABEL, khasraLayerOpacity);
  }, [isMapReady, khasraLayerOpacity]);

  useEffect(() => {
    if (!isMapReady) return;

    applyOpacityToMapLayer(
      MURABBA_FILL,
      murabbaLayerOpacity,
      VECTOR_LAYER_THEME.murabba.fillOpacity,
    );
    applyOpacityToMapLayer(MURABBA_LINE, murabbaLayerOpacity, 0.95);
    applyOpacityToMapLayer(MURABBA_LABEL, murabbaLayerOpacity);
  }, [isMapReady, murabbaLayerOpacity]);

  useEffect(() => {
    if (!isMapReady) return;
    [GEODETIC_NETWORK_LAYER, GEODETIC_NETWORK_LABEL].forEach((layerId) =>
      applyOpacityToMapLayer(layerId, geodeticNetworkOpacity),
    );
  }, [isMapReady, geodeticNetworkOpacity]);

  useEffect(() => {
    if (!isMapReady) return;
    [
      TRI_JUNCTION_POINTS_LAYER,
      TRI_JUNCTION_POINTS_LABEL,
      TRI_JUNCTION_BURJI_LAYER,
      TRI_JUNCTION_BURJI_LABEL,
    ].forEach((layerId) =>
      applyOpacityToMapLayer(layerId, triJunctionPointsOpacity),
    );
  }, [isMapReady, triJunctionPointsOpacity]);

  useEffect(() => {
    if (!isMapReady) return;
    [FIELD_POINTS_LAYER, FIELD_POINTS_LABEL].forEach((layerId) =>
      applyOpacityToMapLayer(layerId, fieldPointsOpacity),
    );
  }, [isMapReady, fieldPointsOpacity]);

  useEffect(() => {
    if (!isMapReady) return;
    applyColorToBoundaryLevel("district", districtBoundaryColor);
  }, [isMapReady, districtBoundaryColor]);

  useEffect(() => {
    if (!isMapReady) return;
    applyColorToBoundaryLevel("tehsil", tehsilBoundaryColor);
  }, [isMapReady, tehsilBoundaryColor]);

  useEffect(() => {
    if (!isMapReady) return;
    applyColorToBoundaryLevel("mauza", mauzaBoundaryColor);
  }, [isMapReady, mauzaBoundaryColor]);

  useEffect(() => {
    if (!isMapReady) return;
    applyColorToBoundaryLevel(SQUARE_LEVEL, squareLayerColor);
  }, [isMapReady, squareLayerColor]);

  useEffect(() => {
    if (!isMapReady) return;
    applyColorToBoundaryLevel(ACRE_LEVEL, acreLayerColor);
  }, [isMapReady, acreLayerColor]);

  useEffect(() => {
    if (!isMapReady) return;
    [KHASRA_FILL, KHASRA_LINE].forEach((layerId) =>
      applyColorToMapLayer(layerId, khasraLayerColor),
    );
  }, [isMapReady, khasraLayerColor]);

  useEffect(() => {
    if (!isMapReady) return;
    [MURABBA_FILL, MURABBA_LINE, MURABBA_LABEL].forEach((layerId) =>
      applyColorToMapLayer(layerId, murabbaLayerColor),
    );
  }, [isMapReady, murabbaLayerColor]);

  useEffect(() => {
    if (!isMapReady) return;
    const map = mapInstance.current;
    if (map?.getLayer(GEODETIC_NETWORK_LAYER)) {
      map.setPaintProperty(
        GEODETIC_NETWORK_LAYER,
        "circle-color",
        geodeticNetworkColor,
      );
    }
  }, [isMapReady, geodeticNetworkColor]);

  useEffect(() => {
    if (!isMapReady || !triJunctionPointsVisible) return;
    const geojson = currentGeojson.current["tri-junction-points"];
    if (geojson?.features?.length) {
      drawTriJunctionLayer({
        sourceId: TRI_JUNCTION_POINTS_SOURCE,
        layerId: TRI_JUNCTION_POINTS_LAYER,
        geojson,
      });
    }
  }, [isMapReady, triJunctionPointsColor]);

  useEffect(() => {
    if (!isMapReady) return;
    [FIELD_POINTS_LAYER, FIELD_POINTS_LABEL].forEach((layerId) =>
      applyColorToMapLayer(layerId, fieldPointsColor),
    );
  }, [isMapReady, fieldPointsColor]);

  // Administrative boundary data is fetched only when the selection changes.
  // Visibility, opacity and colour changes operate on the cached GeoJSON.
  useEffect(() => {
    if (!isMapReady) return undefined;

    let cancelled = false;

    const loadDistrictBoundaries = async () => {
      clearBoundaryLevel("district");
      delete currentGeojson.current.district;

      if (!districtSelectionKey) {
        clearBoundaryLevel("district");
        delete currentGeojson.current.district;
        return;
      }

      try {
        setIsLoading(true);
        const items = Array.isArray(selectedDistrict)
          ? selectedDistrict
          : [selectedDistrict];
        const geojsons = await Promise.all(
          items.map((district) => {
            const id = district?.id ?? district?.gid ?? district;
            return getCachedGeoJSON(`district:${String(id)}`, () =>
              getDistrictBoundary(id),
            );
          }),
        );
        if (cancelled) return;

        const merged = mergeFeatureCollections(geojsons);
        currentGeojson.current.district = merged;
        setDataRevision((value) => value + 1);

        if (
          !tehsilSelectionKey &&
          !mauzaSelectionKey &&
          merged?.features?.length
        ) {
          setFeatureCount(merged.features.length);
          zoomToGeoJSON(merged);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("District boundary load error:", error);
          setError("Failed to load District Boundary");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadDistrictBoundaries();
    return () => {
      cancelled = true;
    };
  }, [districtSelectionKey, isMapReady]);

  useEffect(() => {
    if (!isMapReady) return undefined;

    let cancelled = false;

    const loadTehsilBoundaries = async () => {
      clearBoundaryLevel("tehsil");
      delete currentGeojson.current.tehsil;

      if (!tehsilSelectionKey) {
        clearBoundaryLevel("tehsil");
        delete currentGeojson.current.tehsil;
        return;
      }

      try {
        setIsLoading(true);
        const items = Array.isArray(selectedTehsil)
          ? selectedTehsil
          : [selectedTehsil];
        const geojsons = await Promise.all(
          items.map((tehsil) => {
            const id = tehsil?.id ?? tehsil?.gid ?? tehsil;
            return getCachedGeoJSON(`tehsil:${String(id)}`, () =>
              getTehsilBoundary(id),
            );
          }),
        );
        if (cancelled) return;

        const merged = mergeFeatureCollections(geojsons);
        currentGeojson.current.tehsil = merged;
        setDataRevision((value) => value + 1);

        if (!mauzaSelectionKey && merged?.features?.length) {
          setFeatureCount(merged.features.length);
          zoomToGeoJSON(merged);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Tehsil boundary load error:", error);
          setError("Failed to load Tehsil Boundary");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadTehsilBoundaries();
    return () => {
      cancelled = true;
    };
  }, [tehsilSelectionKey, isMapReady]);

  useEffect(() => {
    if (!isMapReady) return undefined;

    let cancelled = false;

    const loadMauzaBoundary = async () => {
      clearBoundaryLevel("mauza");
      delete currentGeojson.current.mauza;

      if (!mauzaSelectionKey) {
        clearBoundaryLevel("mauza");
        delete currentGeojson.current.mauza;
        return;
      }

      try {
        setIsLoading(true);
        const geojson = await getCachedGeoJSON(
          `mauza:${mauzaSelectionKey}`,
          () =>
            loadSelectedMauzaGeoJSON({
              verifiedLoader: getMauzaBoundary,
              unverifiedLoader: getRudaMauzas,
            }),
        );
        if (cancelled) return;

        currentGeojson.current.mauza = geojson;
        setDataRevision((value) => value + 1);

        if (geojson?.features?.length) {
          setFeatureCount(geojson.features.length);
          zoomToGeoJSON(geojson);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Mauza boundary load error:", error);
          setError("Failed to load Mauza Boundary");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadMauzaBoundary();
    return () => {
      cancelled = true;
    };
  }, [
    mauzaSelectionKey,
    isMapReady,
    boundaryStatus,
    verifiedMauzaId,
    unverifiedMauzaId,
  ]);

  useEffect(() => {
    if (!isMapReady) return;
    const geojson = currentGeojson.current.district;
    if (!districtBoundaryVisible) {
      clearBoundaryLevel("district");
    } else if (geojson?.features?.length) {
      drawBoundaryLevel("district", geojson, districtBoundaryOpacity);
    }
  }, [districtBoundaryVisible, isMapReady, dataRevision]);

  useEffect(() => {
    if (!isMapReady) return;
    const geojson = currentGeojson.current.tehsil;
    if (!tehsilBoundaryVisible) {
      clearBoundaryLevel("tehsil");
    } else if (geojson?.features?.length) {
      drawBoundaryLevel("tehsil", geojson, tehsilBoundaryOpacity);
    }
  }, [tehsilBoundaryVisible, isMapReady, dataRevision]);

  useEffect(() => {
    if (!isMapReady) return;
    const geojson = currentGeojson.current.mauza;
    if (!mauzaBoundaryVisible) {
      clearBoundaryLevel("mauza");
    } else if (geojson?.features?.length) {
      drawBoundaryLevel("mauza", geojson, mauzaBoundaryOpacity);
    }
  }, [mauzaBoundaryVisible, isMapReady, dataRevision]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !isMapReady) return;

    const styleUrl = BASEMAP_STYLES[basemap] || basemap;
    if (!styleUrl || lastAppliedBasemapRef.current === basemap) return;

    try {
      lastAppliedBasemapRef.current = basemap;
      map.setStyle(styleUrl);

      map.once("style.load", () => {
        try {
          Object.keys(currentGeojson.current || {}).forEach((key) => {
            const g = currentGeojson.current[key];
            if (!g) return;

            if (key === "khasra") {
              drawKhasras(g);
            } else if (key === "murabba") {
              drawMurabbas(g);
            } else if (key === "proposed-roads") {
              drawProposedRoadsLayer(
                g,
                getLayerOpacity(layers, "proposedRoads", 100),
              );
            } else if (THEMATIC_LAND_LAYERS[key]) {
              if (getLayerVisible(layers, key, false)) {
                drawThematicLandLayer(
                  key,
                  g,
                  getLayerOpacity(layers, key, 100),
                );
              }
            } else if (key === "control-points") {
              drawPointLayer({
                sourceId: CONTROL_POINTS_SOURCE,
                layerId: CONTROL_POINTS_LAYER,
                geojson: g,
                color: VECTOR_LAYER_THEME.controlPoints.circle,
                strokeColor: VECTOR_LAYER_THEME.controlPoints.stroke,
                radius: 5,
              });
            } else if (key === "tri-junction-points") {
              drawTriJunctionLayer({
                sourceId: TRI_JUNCTION_POINTS_SOURCE,
                layerId: TRI_JUNCTION_POINTS_LAYER,
                geojson: g,
              });
            } else if (key === "field-points") {
              drawPointLayer({
                sourceId: FIELD_POINTS_SOURCE,
                layerId: FIELD_POINTS_LAYER,
                geojson: g,
                color: fieldPointsColor,
                strokeColor: fieldPointsColor,
                radius: 4.5,
                opacity: fieldPointsOpacity / 100,
                labelLayerId: FIELD_POINTS_LABEL,
                labelExpression: VECTOR_LABEL_FIELDS.fieldPoints,
                labelColor: VECTOR_LAYER_THEME.fieldPoints.label,
                labelMinZoom: 15,
              });
            } else if (key === "geodetic-network") {
              drawPointLayer({
                sourceId: GEODETIC_NETWORK_SOURCE,
                layerId: GEODETIC_NETWORK_LAYER,
                geojson: g,
                color: geodeticNetworkColor,
                strokeColor:
                  VECTOR_LAYER_THEME.geodeticNetwork.stroke ?? "#111827",
                radius: 6,
                opacity: geodeticNetworkOpacity / 100,
                labelLayerId: GEODETIC_NETWORK_LABEL,
                labelExpression: VECTOR_LABEL_FIELDS.geodeticNetwork,
                labelColor: VECTOR_LAYER_THEME.geodeticNetwork.label,
                labelMinZoom: 13,
              });
            } else {
              const layerKey = boundaryLevelToLayerKey(key);
              if (!layerKey || getLayerVisible(layers, layerKey, true)) {
                drawBoundaryLevel(
                  key,
                  g,
                  layerKey ? getLayerOpacity(layers, layerKey, 100) : null,
                );
              }
            }
          });
        } catch (e) {
          console.warn("Error restoring layers after style change", e);
        }
      });
    } catch (e) {
      console.error("Failed to change basemap style", e);
    }
  }, [basemap, isMapReady]);

  useEffect(() => {
    lastSyncedSelectionRef.current = "";
    delete currentGeojson.current["selected-area"];
  }, [mauzaSelectionKey, viewBy]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !isMapReady || !multiSelectionMode) return;

    try {
      ensureSelectedLayers(map);
      const source = map.getSource(SELECTED_SOURCE);
      if (source) {
        source.setData({
          type: "FeatureCollection",
          features: Array.isArray(selectedParcels) ? selectedParcels : [],
        });
      }

      currentGeojson.current["selected-area"] = {
        type: "FeatureCollection",
        features: Array.isArray(selectedParcels) ? selectedParcels : [],
      };
      movePointLayersToTop();
    } catch (error) {
      console.warn("Could not update multiple parcel highlights", error);
    }
  }, [multiSelectionMode, selectedParcels, isMapReady, featureCount]);

  useEffect(() => {
    if (!multiSelectionMode) return;
    return () => {
      const map = mapInstance.current;
      if (!map) return;
      try {
        const source = map.getSource(SELECTED_SOURCE);
        if (source) source.setData(emptyFeatureCollection());
        delete currentGeojson.current["selected-area"];
      } catch (error) {
        console.warn("Could not clear multiple parcel highlights", error);
      }
    };
  }, [multiSelectionMode]);

  useEffect(() => {
    if (!isMapReady) return;

    const map = mapInstance.current;
    if (!map) return;

    if (multiSelectionMode) return;

    if (!selectedFeatureNumber) {
      lastSyncedSelectionRef.current = "";
      delete currentGeojson.current["selected-area"];

      try {
        ensureSelectedLayers(map);
        const src = map.getSource(SELECTED_SOURCE);
        if (src) src.setData(emptyFeatureCollection());
      } catch (e) {
        console.warn("Could not clear selected parcel", e);
      }

      return;
    }

    const selectionKey =
      typeof selectedFeatureNumber === "object"
        ? JSON.stringify(selectedFeatureNumber)
        : String(selectedFeatureNumber);

    if (lastSyncedSelectionRef.current === selectionKey) return;

    const current =
      viewBy === "khasra"
        ? currentGeojson.current.khasra
        : viewBy === "murabba"
          ? currentGeojson.current.murabba
          : viewBy === "square"
            ? currentGeojson.current[SQUARE_LEVEL]
            : viewBy === "acre"
              ? currentGeojson.current[ACRE_LEVEL]
              : currentGeojson.current.khasra ||
                currentGeojson.current.murabba ||
                currentGeojson.current[SQUARE_LEVEL] ||
                currentGeojson.current[ACRE_LEVEL] ||
                {};

    const features = Array.isArray(current?.features) ? current.features : [];

    const matched = features.find((feat) => {
      const p = feat?.properties || {};

      if (
        typeof selectedFeatureNumber === "object" &&
        selectedFeatureNumber !== null &&
        selectedFeatureNumber.mauzaKey
      ) {
        if (
          String(p._mauza_selection_key ?? "") !==
          String(selectedFeatureNumber.mauzaKey)
        ) {
          return false;
        }
        if (
          viewBy === "khasra" &&
          selectedFeatureNumber.murabbaNo !== undefined
        ) {
          return (
            String(getMurabbaNumber(p)) ===
              String(selectedFeatureNumber.murabbaNo) &&
            String(getKhasraNumber(p)) ===
              String(selectedFeatureNumber.khasraNo)
          );
        }

        const candidate =
          viewBy === "khasra"
            ? getKhasraNumber(p)
            : viewBy === "square"
              ? getSquareNumberFromProps(p, feat)
              : viewBy === "acre"
                ? getAcreNumberFromProps(p, feat)
                : feat?.id;
        return String(candidate) === String(selectedFeatureNumber.parcelNo);
      }

      if (
        viewBy === "khasra" &&
        typeof selectedFeatureNumber === "object" &&
        selectedFeatureNumber !== null
      ) {
        const murabba = getMurabbaNumber(p);
        const khasra = getKhasraNumber(p);

        return (
          String(murabba) === String(selectedFeatureNumber.murabbaNo) &&
          String(khasra) === String(selectedFeatureNumber.khasraNo)
        );
      }

      const cand =
        viewBy === "khasra"
          ? getKhasraNumber(p)
          : viewBy === "murabba"
            ? getMurabbaNumber(p)
            : viewBy === "square"
              ? getSquareNumberFromProps(p, feat)
              : viewBy === "acre"
                ? getAcreNumberFromProps(p, feat)
                : feat?.id;

      return String(cand) === String(selectedFeatureNumber);
    });

    if (matched) {
      const selectedGeo = { type: "FeatureCollection", features: [matched] };

      try {
        currentGeojson.current["selected-area"] = selectedGeo;
        ensureSelectedLayers(map);
        map.getSource(SELECTED_SOURCE).setData(selectedGeo);
        zoomToGeoJSON(selectedGeo, { padding: 80, duration: 450 });
        lastSyncedSelectionRef.current = selectionKey;
      } catch (e) {
        console.warn("Could not highlight selected parcel", e);
      }
    }
  }, [
    selectedFeatureNumber,
    viewBy,
    isMapReady,
    featureCount,
    multiSelectionMode,
  ]);

  useEffect(() => {
    if (!isMapReady) return undefined;

    let cancelled = false;

    const loadRuda = async () => {
      const clearRudaLevels = () => {
        try {
          Object.keys(currentGeojson.current || {})
            .filter((key) => key.startsWith("ruda-"))
            .forEach((level) => {
              clearBoundaryLevel(level);
              delete currentGeojson.current[level];
            });
        } catch (e) {}
      };

      if (!rudaBoundaryVisible) {
        clearRudaLevels();
        return;
      }

      clearRudaLevels();

      if (!selectedRudaPhaseIds?.length) return;

      try {
        setIsLoading(true);

        const results = await Promise.all(
          selectedRudaPhaseIds.map((gid) =>
            getCachedGeoJSON(`ruda-phase:${String(gid)}`, () =>
              getRudaGeoJSON(gid),
            )
              .then((geojson) => ({ gid, geojson }))
              .catch((e) => {
                console.error("RUDA geojson error", e);
                return null;
              }),
          ),
        );

        if (cancelled) return;

        const loadedRudaGeojsons = results
          .filter(Boolean)
          .map((item) => item.geojson)
          .filter((geojson) => geojson?.features?.length);

        results.filter(Boolean).forEach((item) => {
          drawBoundaryLevel(
            `ruda-${item.gid}`,
            item.geojson,
            rudaBoundaryOpacity,
          );
          currentGeojson.current[`ruda-${item.gid}`] = item.geojson;
        });

        if (loadedRudaGeojsons.length) {
          zoomToGeoJSON(mergeFeatureCollections(loadedRudaGeojsons), {
            padding: 70,
            duration: 500,
          });
        }

        movePointLayersToTop();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadRuda();
    return () => {
      cancelled = true;
    };
  }, [isMapReady, rudaBoundaryVisible, rudaPhaseSelectionKey]);

  useEffect(() => {
    if (!isMapReady) return undefined;

    let cancelled = false;

    const loadGeodeticNetwork = async () => {
      if (!geodeticNetworkVisible) {
        clearPointLayer(GEODETIC_NETWORK_SOURCE, GEODETIC_NETWORK_LAYER);
        delete currentGeojson.current["geodetic-network"];
        return;
      }

      try {
        setIsLoading(true);
        const geojson = await getCachedGeoJSON(
          "geodetic-network:all",
          getGeodeticNetworkGeoJSON,
        );
        if (cancelled) return;

        const preparedGeojson = {
          type: "FeatureCollection",
          features: (geojson?.features || []).map((feature) => ({
            ...feature,
            properties: {
              ...(feature?.properties || {}),
              _layerType: "geodeticNetwork",
            },
          })),
        };

        if (preparedGeojson.features.length) {
          drawPointLayer({
            sourceId: GEODETIC_NETWORK_SOURCE,
            layerId: GEODETIC_NETWORK_LAYER,
            geojson: preparedGeojson,
            color: geodeticNetworkColor,
            strokeColor: VECTOR_LAYER_THEME.geodeticNetwork.stroke ?? "#111827",
            radius: 6,
            opacity: geodeticNetworkOpacity / 100,
            labelLayerId: GEODETIC_NETWORK_LABEL,
            labelExpression: VECTOR_LABEL_FIELDS.geodeticNetwork,
            labelColor: VECTOR_LAYER_THEME.geodeticNetwork.label,
            labelMinZoom: 13,
          });
          currentGeojson.current["geodetic-network"] = preparedGeojson;
          zoomToGeoJSON(preparedGeojson, { padding: 70, duration: 500 });
          movePointLayersToTop();
        } else {
          clearPointLayer(GEODETIC_NETWORK_SOURCE, GEODETIC_NETWORK_LAYER);
          delete currentGeojson.current["geodetic-network"];
        }
      } catch (e) {
        if (!cancelled) {
          console.error("Geodetic network load error:", e);
          setError("Failed to load Geodetic Network");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadGeodeticNetwork();
    return () => {
      cancelled = true;
    };
  }, [isMapReady, geodeticNetworkVisible]);

  useEffect(() => {
    if (!selectedMauzaList.length || !isMapReady || !squareLayerVisible) {
      clearBoundaryLevel(SQUARE_LEVEL);
      delete currentGeojson.current[SQUARE_LEVEL];
      return;
    }

    let cancelled = false;

    const loadSquares = async () => {
      try {
        setIsLoading(true);

        // Clear the previous status source before loading the replacement.
        clearBoundaryLevel(SQUARE_LEVEL);
        delete currentGeojson.current[SQUARE_LEVEL];
        reportLoadedFeatures(emptyFeatureCollection(), "square");

        const geojson = await getCachedGeoJSON(
          `squares:${mauzaSelectionKey}`,
          () =>
            loadSelectedMauzaGeoJSON({
              verifiedLoader: getSquares,
              unverifiedLoader: getRudaSquares,
            }),
        );

        if (cancelled) return;

        if (geojson?.features?.length) {
          drawBoundaryLevel(SQUARE_LEVEL, geojson, squareLayerOpacity);
          currentGeojson.current[SQUARE_LEVEL] = geojson;
          setFeatureCount(geojson.features.length);
          reportLoadedFeatures(geojson, "square");
          zoomToGeoJSON(geojson, { padding: 70, duration: 500 });
        } else {
          clearBoundaryLevel(SQUARE_LEVEL);
          delete currentGeojson.current[SQUARE_LEVEL];
          setFeatureCount(0);
          reportLoadedFeatures(emptyFeatureCollection(), "square");
        }
      } catch (e) {
        if (!cancelled) {
          console.error("Square boundary load error:", e);
          setError("Failed to load Square Boundary");
          reportLoadedFeatures(emptyFeatureCollection(), "square");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadSquares();

    return () => {
      cancelled = true;
    };
  }, [
    mauzaSelectionKey,
    isMapReady,
    squareLayerVisible,
    boundaryStatus,
    verifiedMauzaId,
    unverifiedMauzaId,
  ]);

  useEffect(() => {
    if (!selectedMauzaList.length || !isMapReady || !acreLayerVisible) {
      clearBoundaryLevel(ACRE_LEVEL);
      delete currentGeojson.current[ACRE_LEVEL];
      return undefined;
    }

    let cancelled = false;

    const loadAcres = async () => {
      try {
        setIsLoading(true);
        const geojson = await getCachedGeoJSON(
          `acres:${mauzaSelectionKey}`,
          () => loadVerifiedForSelectedMauzas(getAcres),
        );

        if (cancelled) return;

        if (geojson?.features?.length) {
          drawBoundaryLevel(ACRE_LEVEL, geojson, acreLayerOpacity);
          currentGeojson.current[ACRE_LEVEL] = geojson;
          setFeatureCount(geojson.features.length);
          reportLoadedFeatures(geojson, "acre");
          zoomToGeoJSON(geojson, { padding: 70, duration: 500 });
        } else {
          clearBoundaryLevel(ACRE_LEVEL);
          delete currentGeojson.current[ACRE_LEVEL];
          setFeatureCount(0);
          reportLoadedFeatures(emptyFeatureCollection(), "acre");
        }
      } catch (e) {
        if (!cancelled) {
          console.error("Acre boundary load error:", e);
          setError("Failed to load Acre Boundary");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadAcres();
    return () => {
      cancelled = true;
    };
  }, [mauzaSelectionKey, isMapReady, acreLayerVisible]);

  useEffect(() => {
    if (!isMapReady) return;

    let cancelled = false;

    const loadAreaBasedPoints = async () => {
      try {
        const areaGeojson = await resolveOpenAreaGeoJSON();
        if (cancelled) return;
        const hasArea = !!areaGeojson?.features?.length;

        if (triJunctionPointsVisible && hasArea) {
          const trijunctionGeojson = await getCachedGeoJSON(
            `tri-junction:${String(selectedMauzaId || "global")}`,
            () =>
              getTrijunctionPoints(
                selectedMauzaId ? { mauza_id: selectedMauzaId } : {},
              ),
          );
          if (cancelled) return;

          let filteredTriJunctionGeojson = filterPointGeoJSONByArea(
            trijunctionGeojson,
            areaGeojson,
          );

          if (
            !filteredTriJunctionGeojson.features.length &&
            selectedMauzaList.length
          ) {
            filteredTriJunctionGeojson = {
              type: "FeatureCollection",
              features: explodePointGeoJSON(trijunctionGeojson).features.filter(
                (feature) =>
                  selectedMauzaList.some((mauza) =>
                    pointBelongsToMauza(feature, mauza),
                  ),
              ),
            };
          }

          filteredTriJunctionGeojson = {
            type: "FeatureCollection",
            features: filteredTriJunctionGeojson.features.map((feature) => ({
              ...feature,
              properties: {
                ...(feature?.properties || {}),
                _layerType: "triJunctionPoints",
              },
            })),
          };

          if (filteredTriJunctionGeojson.features.length) {
            drawTriJunctionLayer({
              sourceId: TRI_JUNCTION_POINTS_SOURCE,
              layerId: TRI_JUNCTION_POINTS_LAYER,
              geojson: filteredTriJunctionGeojson,
            });
            currentGeojson.current["tri-junction-points"] =
              filteredTriJunctionGeojson;
            movePointLayersToTop();
          } else {
            clearTriJunctionLayer();
            delete currentGeojson.current["tri-junction-points"];
          }
        } else {
          clearTriJunctionLayer();
          delete currentGeojson.current["tri-junction-points"];
        }

        if (fieldPointsVisible && hasArea) {
          const fieldPointsGeojson = await getCachedGeoJSON(
            `field-points:${String(selectedMauzaId)}`,
            () => getFieldPoints(selectedMauzaId),
          );
          if (cancelled) return;

          const validFieldPointsGeojson =
            keepValidPointFeaturesForMap(fieldPointsGeojson);

          if (
            (fieldPointsGeojson?.features || []).length &&
            !validFieldPointsGeojson.features.length
          ) {
            console.warn(
              "Field Points were fetched but their geom coordinates are not valid EPSG:4326 lon/lat. Fix the fieldpoints.geom SRID/coordinates in PostGIS.",
              fieldPointsGeojson,
            );
          }

          let filteredFieldPointsGeojson = filterPointGeoJSONByArea(
            validFieldPointsGeojson,
            areaGeojson,
          );

          if (
            !filteredFieldPointsGeojson.features.length &&
            selectedMauzaList.length
          ) {
            filteredFieldPointsGeojson = {
              type: "FeatureCollection",
              features: validFieldPointsGeojson.features.filter((feature) =>
                selectedMauzaList.some((mauza) =>
                  featureMatchesSelectedMauza(feature, mauza),
                ),
              ),
            };
          }

          const preparedFieldPointsGeojson = {
            type: "FeatureCollection",
            features: filteredFieldPointsGeojson.features.map((feature) => ({
              ...feature,
              properties: {
                ...(feature?.properties || {}),
                _layerType: "fieldPoints",
              },
            })),
          };

          if (preparedFieldPointsGeojson.features.length) {
            drawPointLayer({
              sourceId: FIELD_POINTS_SOURCE,
              layerId: FIELD_POINTS_LAYER,
              geojson: preparedFieldPointsGeojson,
              color: fieldPointsColor,
              strokeColor: fieldPointsColor,
              radius: 4.5,
              opacity: fieldPointsOpacity / 100,
              labelLayerId: FIELD_POINTS_LABEL,
              labelExpression: VECTOR_LABEL_FIELDS.fieldPoints,
              labelColor: VECTOR_LAYER_THEME.fieldPoints.label,
              labelMinZoom: 15,
            });
            currentGeojson.current["field-points"] = preparedFieldPointsGeojson;
            movePointLayersToTop();
          } else {
            clearPointLayer(FIELD_POINTS_SOURCE, FIELD_POINTS_LAYER);
            delete currentGeojson.current["field-points"];
          }
        } else {
          clearPointLayer(FIELD_POINTS_SOURCE, FIELD_POINTS_LAYER);
          delete currentGeojson.current["field-points"];
        }
      } catch (e) {
        if (!cancelled) {
          console.error("Area based points load error:", e);
          setError("Failed to load area based points");
        }
      }
    };

    loadAreaBasedPoints();

    return () => {
      cancelled = true;
    };
  }, [
    isMapReady,
    mauzaSelectionKey,
    selectedFeatureNumber,
    triJunctionPointsVisible,
    fieldPointsVisible,
  ]);

  useEffect(() => {
    const shouldShowKhasra =
      selectedMauzaList.length > 0 &&
      isMapReady &&
      khasraLayerVisible &&
      (viewBy === "khasra" || khasraLayerForceLoad);

    if (!shouldShowKhasra) {
      clearKhasraLayers();
      delete currentGeojson.current.khasra;
      return;
    }

    let cancelled = false;

    const loadKhasras = async () => {
      try {
        setIsLoading(true);
        setError("");

        // Remove the previous source immediately so verified geometry is not
        // shown while the unverified request (or vice versa) is in flight.
        clearKhasraLayers();
        delete currentGeojson.current.khasra;
        reportLoadedFeatures(emptyFeatureCollection(), "khasra");

        const geojson = await getCachedGeoJSON(
          `khasras:${mauzaSelectionKey}`,
          () =>
            loadSelectedMauzaGeoJSON({
              verifiedLoader: getKhasras,
              unverifiedLoader: getRudaKhasras,
            }),
        );

        if (cancelled) return;

        if (geojson?.features?.length) {
          drawKhasras(geojson);
        } else {
          clearKhasraLayers();
          delete currentGeojson.current.khasra;
          setFeatureCount(0);
          reportLoadedFeatures(emptyFeatureCollection(), "khasra");
        }
      } catch (e) {
        if (!cancelled) {
          console.error("Khasra load error:", e);
          setError("Failed to load Khasras");
          reportLoadedFeatures(emptyFeatureCollection(), "khasra");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadKhasras();

    return () => {
      cancelled = true;
    };
  }, [
    mauzaSelectionKey,
    isMapReady,
    viewBy,
    khasraLayerVisible,
    khasraLayerForceLoad,
    boundaryStatus,
    verifiedMauzaId,
    unverifiedMauzaId,
  ]);

  useEffect(() => {
    const shouldShowMurabba =
      selectedMauzaList.length > 0 &&
      isMapReady &&
      murabbaLayerVisible &&
      (viewBy === "murabba" || murabbaLayerForceLoad);

    if (!shouldShowMurabba) {
      clearMurabbaLayers();
      delete currentGeojson.current.murabba;
      return undefined;
    }

    let cancelled = false;

    const loadMurabbas = async () => {
      try {
        setIsLoading(true);
        setError("");

        const geojson = await getCachedGeoJSON(
          `murabbas:${mauzaSelectionKey}`,
          () => loadVerifiedForSelectedMauzas(getMurabbas),
        );

        if (cancelled) return;

        if (geojson?.features?.length) {
          drawMurabbas(geojson);
        } else {
          clearMurabbaLayers();
          delete currentGeojson.current.murabba;
          setFeatureCount(0);
        }
      } catch (e) {
        if (!cancelled) {
          console.error("Murabba load error:", e);
          setError("Failed to load Murabbas");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadMurabbas();
    return () => {
      cancelled = true;
    };
  }, [
    mauzaSelectionKey,
    isMapReady,
    viewBy,
    murabbaLayerVisible,
    murabbaLayerForceLoad,
  ]);

  useEffect(() => {
    if (!isMapReady) return undefined;

    let cancelled = false;

    const mauzaName =
      typeof primarySelectedMauza === "object"
        ? primarySelectedMauza?.mauza?.trim?.() || ""
        : "";

    const loadPoints = async () => {
      try {
        const normalizedMauza = (mauzaName || "").trim().toLowerCase();

        if (controlPointsVisible && normalizedMauza) {
          const controlGeojson = await getCachedGeoJSON(
            `control-points:${normalizedMauza}`,
            () =>
              getTrijunctionPoints({
                mauza: mauzaName,
                type: "B",
              }),
          );

          if (cancelled) return;

          const filteredControlGeojson = {
            type: "FeatureCollection",
            features: (controlGeojson?.features || []).filter((feature) => {
              const m3Value = String(feature?.properties?.m3 || "")
                .trim()
                .toLowerCase();
              return m3Value === normalizedMauza;
            }),
          };

          if (filteredControlGeojson.features.length) {
            drawPointLayer({
              sourceId: CONTROL_POINTS_SOURCE,
              layerId: CONTROL_POINTS_LAYER,
              geojson: filteredControlGeojson,
              color: "#f59e0b",
              strokeColor: "#78350f",
              radius: 5,
            });
            currentGeojson.current["control-points"] = filteredControlGeojson;
          } else {
            clearPointLayer(CONTROL_POINTS_SOURCE, CONTROL_POINTS_LAYER);
            delete currentGeojson.current["control-points"];
          }
        } else {
          clearPointLayer(CONTROL_POINTS_SOURCE, CONTROL_POINTS_LAYER);
          delete currentGeojson.current["control-points"];
        }

        // Tri Junction Points are loaded by the area-based point loader above.
        // Keeping that logic in one place prevents the styled TJ/Burji layer
        // from being overwritten by this older m3-only loader.
      } catch (e) {
        if (!cancelled) {
          console.error("Failed to load trijunction points:", e);
          setError("Failed to load control / tri-junction points");
        }
      }
    };

    loadPoints();
    return () => {
      cancelled = true;
    };
  }, [isMapReady, selectedMauzaName, controlPointsVisible]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !isMapReady) return;

    const restoreOrtho = () => {
      restoreOrthoLayer({
        map,
        visible: massaviLayerVisible && !!orthoTileUrl,
        opacity: massaviLayerOpacity,
        tileUrl: orthoTileUrl,
      });

      if (massaviLayerVisible && !prevMussaviLayerVisible.current) {
        const bounds = getOrthoBoundsFromMauzaName(
          selectedMauzaName,
          HANDU_GUJRAN_BOUNDS,
        );
        if (bounds) {
          map.fitBounds(bounds, {
            padding: 50,
            duration: 1500,
          });
        }
      }

      prevMussaviLayerVisible.current = massaviLayerVisible;
    };

    restoreOrtho();

    map.on("style.load", restoreOrtho);

    return () => {
      map.off("style.load", restoreOrtho);
    };
  }, [
    massaviLayerVisible,
    massaviLayerOpacity,
    orthoTileUrl,
    isMapReady,
    selectedMauzaName,
  ]);

  useMapTools({
    mapRef: mapInstance,
    isMapReady,
    layers,
    buildPopupHtml: buildUnifiedPopupHtml,
  });

  useDrawAOI({
    mapRef: mapInstance,
    isMapReady,
    enabled: drawAOIEnabled,
    currentGeojsonRef: currentGeojson,
    onComplete: onAOIComplete,
    onDraftChange: onAOIDraftChange,
    clearSignal: drawAOIClearSignal,
    finishSignal: drawAOIFinishSignal,
  });

  return (
    <div
      ref={mapWrapperRef}
      className="absolute inset-0 w-full h-full bg-white"
    >
      <div
        ref={mapRef}
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: "auto" }}
      />

      {error && (
        <div className="absolute top-5 left-5 bg-red-500 text-white px-4 py-2 rounded shadow">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="absolute top-5 right-24 z-50 bg-blue-500 text-white px-4 py-2 rounded shadow">
          Loading...
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  getBlocksGeoJSON,
  getContourGeoJSON,
  getPlotOptions,
  getPlotsGeoJSON,
  getProjectGeoJSON,
  getRoadsGeoJSON,
  getSpotLevelGeoJSON,
  getWaterSupplyPointsGeoJSON,
  getWaterSupplyLinesGeoJSON,
  getSewagePointsGeoJSON,
  getCameraLocationsGeoJSON,
  getRudaGeoJSON,
  getRudaProposedRoadsGeoJSON,
  getGeodeticNetworkGeoJSON,
} from "../../services/metaverseApi";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const SOURCES = {
  boundary: "metaverse-project-boundary-source",
  block: "metaverse-block-source",
  masterPlan: "metaverse-masterplan-source",
  spotLevel: "metaverse-spot-level-source",
  contours: "metaverse-contours-source",
  roads: "metaverse-roads-source",
  waterSupplyPoints: "metaverse-water-supply-points-source",
  waterSupplyLines: "metaverse-water-supply-lines-source",
  sewagePoints: "metaverse-sewage-points-source",
  cameraLocations: "metaverse-camera-locations-source",
  rudaBoundary: "metaverse-ruda-boundary-source",
  proposedRoads: "metaverse-proposed-roads-source",
  geodeticNetwork: "metaverse-geodetic-network-source",
  introBoundary: "metaverse-intro-boundary-source",
  introLabel: "metaverse-intro-label-source",
};

const LAYERS = {
  boundaryFill: "metaverse-project-boundary-fill",
  boundaryLine: "metaverse-project-boundary-line",
  blockFill: "metaverse-block-fill",
  blockLine: "metaverse-block-line",
  masterPlanFill: "metaverse-masterplan-fill",
  masterPlanLine: "metaverse-masterplan-line",
  masterPlanLabel: "metaverse-masterplan-label",
  spotLevelCircle: "metaverse-spot-level-circle",
  contoursLine: "metaverse-contours-line",
  roadsFill: "metaverse-roads-fill",
  roadsLine: "metaverse-roads-line",
  waterSupplyPointsCircle: "metaverse-water-supply-points-circle",
  waterSupplyPointsLabel: "metaverse-water-supply-points-label",
  waterSupplyLinesLine: "metaverse-water-supply-lines-line",
  sewagePointsCircle: "metaverse-sewage-points-circle",
  sewagePointsLabel: "metaverse-sewage-points-label",
  cameraLocationsCircle: "metaverse-camera-locations-circle",
  cameraLocationsLabel: "metaverse-camera-locations-label",
  rudaBoundaryLine: "metaverse-ruda-boundary-line",
  proposedRoadsLine: "metaverse-proposed-roads-line",
  geodeticNetworkCircle: "metaverse-geodetic-network-circle",
  introBoundaryFill: "metaverse-intro-boundary-fill",
  introBoundaryLine: "metaverse-intro-boundary-line",
  introLabel: "metaverse-intro-label",
};

const emptyFC = { type: "FeatureCollection", features: [] };

function fitGeoJSON(map, geojson) {
  if (!geojson?.features?.length) return;

  const bounds = new mapboxgl.LngLatBounds();

  geojson.features.forEach((feature) => {
    const geom = feature.geometry;
    if (!geom) return;

    const addCoord = (coord) => {
      if (Array.isArray(coord) && coord.length >= 2) bounds.extend(coord);
    };

    if (geom.type === "Point") addCoord(geom.coordinates);
    if (geom.type === "MultiPoint") geom.coordinates.forEach(addCoord);
    if (geom.type === "LineString") geom.coordinates.forEach(addCoord);
    if (geom.type === "MultiLineString")
      geom.coordinates.flat(1).forEach(addCoord);
    if (geom.type === "Polygon") geom.coordinates.flat(1).forEach(addCoord);
    if (geom.type === "MultiPolygon")
      geom.coordinates.flat(2).forEach(addCoord);
  });

  if (!bounds.isEmpty()) {
    map.fitBounds(bounds, {
      padding: 80,
      duration: 900,
      maxZoom: 17,
    });
  }
}

function normalizeGeometryCollections(data) {
  if (!data?.features?.length) return data || emptyFC;

  return {
    ...data,
    features: data.features.map((feature) => {
      if (feature.geometry?.type !== "GeometryCollection") return feature;

      const geometry = feature.geometry.geometries?.find((geom) =>
        [
          "Point",
          "MultiPoint",
          "LineString",
          "MultiLineString",
          "Polygon",
          "MultiPolygon",
        ].includes(geom.type),
      );

      return geometry ? { ...feature, geometry } : feature;
    }),
  };
}


function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getGeoJSONCenter(geojson) {
  if (!geojson?.features?.length) return [69.3451, 30.3753];

  const bounds = new mapboxgl.LngLatBounds();

  geojson.features.forEach((feature) => {
    const geom = feature.geometry;
    if (!geom) return;

    const addCoord = (coord) => {
      if (Array.isArray(coord) && coord.length >= 2) bounds.extend(coord);
    };

    if (geom.type === "Point") addCoord(geom.coordinates);
    if (geom.type === "MultiPoint") geom.coordinates.forEach(addCoord);
    if (geom.type === "LineString") geom.coordinates.forEach(addCoord);
    if (geom.type === "MultiLineString") geom.coordinates.flat(1).forEach(addCoord);
    if (geom.type === "Polygon") geom.coordinates.flat(1).forEach(addCoord);
    if (geom.type === "MultiPolygon") geom.coordinates.flat(2).forEach(addCoord);
  });

  if (bounds.isEmpty()) return [69.3451, 30.3753];

  const center = bounds.getCenter();
  return [center.lng, center.lat];
}

function makeLabelGeoJSON(label, geojson) {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { label },
        geometry: {
          type: "Point",
          coordinates: getGeoJSONCenter(geojson),
        },
      },
    ],
  };
}

async function loadAssetGeoJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function addIntroBoundaryLayer(map, data, label) {
  ensureSource(map, SOURCES.introBoundary, data);
  ensureSource(map, SOURCES.introLabel, makeLabelGeoJSON(label, data));

  if (!map.getLayer(LAYERS.introBoundaryFill)) {
    map.addLayer({
      id: LAYERS.introBoundaryFill,
      type: "fill",
      source: SOURCES.introBoundary,
      paint: {
        "fill-color": "#16a34a",
        "fill-opacity": 0.12,
      },
    });
  }

  if (!map.getLayer(LAYERS.introBoundaryLine)) {
    map.addLayer({
      id: LAYERS.introBoundaryLine,
      type: "line",
      source: SOURCES.introBoundary,
      paint: {
        "line-color": "#16a34a",
        "line-width": 3,
      },
    });
  }

  if (!map.getLayer(LAYERS.introLabel)) {
    map.addLayer({
      id: LAYERS.introLabel,
      type: "symbol",
      source: SOURCES.introLabel,
      layout: {
        "text-field": ["get", "label"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 4, 18, 10, 30],
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        "text-allow-overlap": true,
        "text-ignore-placement": true,
      },
      paint: {
        "text-color": "#111827",
        "text-halo-color": "#ffffff",
        "text-halo-width": 2,
      },
    });
  }

  setLayerVisibility(
    map,
    [LAYERS.introBoundaryFill, LAYERS.introBoundaryLine, LAYERS.introLabel],
    true,
  );
}

function clearIntroBoundaryLayer(map) {
  if (map.getSource(SOURCES.introBoundary)) {
    map.getSource(SOURCES.introBoundary).setData(emptyFC);
  }
  if (map.getSource(SOURCES.introLabel)) {
    map.getSource(SOURCES.introLabel).setData(emptyFC);
  }
  setLayerVisibility(
    map,
    [LAYERS.introBoundaryFill, LAYERS.introBoundaryLine, LAYERS.introLabel],
    false,
  );
}

function ensureSource(map, sourceId, data = emptyFC) {
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: "geojson",
      data,
    });
  } else {
    map.getSource(sourceId).setData(data);
  }
}

function setLayerVisibility(map, layerIds, visible) {
  layerIds.forEach((id) => {
    if (map.getLayer(id)) {
      map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
    }
  });
}

function addProjectBoundaryLayer(map, data) {
  ensureSource(map, SOURCES.boundary, data);

  if (!map.getLayer(LAYERS.boundaryFill)) {
    map.addLayer({
      id: LAYERS.boundaryFill,
      type: "fill",
      source: SOURCES.boundary,
      paint: {
        "fill-color": "#ff8b24",
        "fill-opacity": 0.12,
      },
    });
  }

  if (!map.getLayer(LAYERS.boundaryLine)) {
    map.addLayer({
      id: LAYERS.boundaryLine,
      type: "line",
      source: SOURCES.boundary,
      paint: {
        "line-color": "#ff8b24",
        "line-width": 3,
      },
    });
  }
}

function addBlockLayer(map, data) {
  ensureSource(map, SOURCES.block, data);

  if (!map.getLayer(LAYERS.blockFill)) {
    map.addLayer({
      id: LAYERS.blockFill,
      type: "fill",
      source: SOURCES.block,
      paint: {
        "fill-color": "#7c3aed",
        "fill-opacity": 0.18,
      },
    });
  }

  if (!map.getLayer(LAYERS.blockLine)) {
    map.addLayer({
      id: LAYERS.blockLine,
      type: "line",
      source: SOURCES.block,
      paint: {
        "line-color": "#7c3aed",
        "line-width": 2.5,
      },
    });
  }
}

function addMasterPlanLayer(map, data) {
  ensureSource(map, SOURCES.masterPlan, data);

  if (!map.getLayer(LAYERS.masterPlanFill)) {
    map.addLayer({
      id: LAYERS.masterPlanFill,
      type: "fill",
      source: SOURCES.masterPlan,
      paint: {
        "fill-color": [
          "match",
          ["get", "type"],
          "Residential",
          "#2563eb",
          "Commercial",
          "#facc15",
          "Park",
          "#15803d",
          "Road",
          "#ef4444",
          "#9ca3af",
        ],
        "fill-opacity": 0.45,
      },
    });
  }

  if (!map.getLayer(LAYERS.masterPlanLine)) {
    map.addLayer({
      id: LAYERS.masterPlanLine,
      type: "line",
      source: SOURCES.masterPlan,
      paint: {
        "line-color": "#111827",
        "line-width": 1,
      },
    });
  }

  if (!map.getLayer(LAYERS.masterPlanLabel)) {
    map.addLayer({
      id: LAYERS.masterPlanLabel,
      type: "symbol",
      source: SOURCES.masterPlan,
      minzoom: 16,
      layout: {
        "text-field": [
          "coalesce",
          ["to-string", ["get", "plot_no"]],
          ["to-string", ["get", "name"]],
          "",
        ],
        "text-size": ["interpolate", ["linear"], ["zoom"], 16, 10, 18, 13],
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-allow-overlap": false,
        "text-ignore-placement": false,
      },
      paint: {
        "text-color": "#111827",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.5,
      },
    });
  }
}

function addSpotLevelLayer(map, data) {
  ensureSource(map, SOURCES.spotLevel, data);

  if (!map.getLayer(LAYERS.spotLevelCircle)) {
    map.addLayer({
      id: LAYERS.spotLevelCircle,
      type: "circle",
      source: SOURCES.spotLevel,
      paint: {
        "circle-radius": 4,
        "circle-color": "#65c96b",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1,
      },
    });
  }
}

function addContourLayer(map, data) {
  ensureSource(map, SOURCES.contours, data);

  if (!map.getLayer(LAYERS.contoursLine)) {
    map.addLayer({
      id: LAYERS.contoursLine,
      type: "line",
      source: SOURCES.contours,
      paint: {
        "line-color": "#615514",
        "line-width": 1.5,
      },
    });
  }
}

function addWaterSupplyPointsLayer(map, data) {
  ensureSource(
    map,
    SOURCES.waterSupplyPoints,
    normalizeGeometryCollections(data),
  );

  if (!map.getLayer(LAYERS.waterSupplyPointsCircle)) {
    map.addLayer({
      id: LAYERS.waterSupplyPointsCircle,
      type: "circle",
      source: SOURCES.waterSupplyPoints,
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 12, 4, 18, 7],
        "circle-color": "#42a5f5",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1.5,
      },
    });
  }

  if (!map.getLayer(LAYERS.waterSupplyPointsLabel)) {
    map.addLayer({
      id: LAYERS.waterSupplyPointsLabel,
      type: "symbol",
      source: SOURCES.waterSupplyPoints,
      minzoom: 16,
      layout: {
        "text-field": [
          "coalesce",
          ["to-string", ["get", "name"]],
          ["to-string", ["get", "type"]],
          "",
        ],
        "text-size": 10,
        "text-offset": [0, 1.2],
        "text-anchor": "top",
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": "#0f172a",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.2,
      },
    });
  }
}

function addWaterSupplyLinesLayer(map, data) {
  ensureSource(
    map,
    SOURCES.waterSupplyLines,
    normalizeGeometryCollections(data),
  );

  if (!map.getLayer(LAYERS.waterSupplyLinesLine)) {
    map.addLayer({
      id: LAYERS.waterSupplyLinesLine,
      type: "line",
      source: SOURCES.waterSupplyLines,
      paint: {
        "line-color": "#00386a",
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 2, 18, 4],
      },
    });
  }
}

function addSewagePointsLayer(map, data) {
  ensureSource(map, SOURCES.sewagePoints, normalizeGeometryCollections(data));

  if (!map.getLayer(LAYERS.sewagePointsCircle)) {
    map.addLayer({
      id: LAYERS.sewagePointsCircle,
      type: "circle",
      source: SOURCES.sewagePoints,
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 12, 4, 18, 7],
        "circle-color": "#8e44ad",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1.5,
      },
    });
  }

  if (!map.getLayer(LAYERS.sewagePointsLabel)) {
    map.addLayer({
      id: LAYERS.sewagePointsLabel,
      type: "symbol",
      source: SOURCES.sewagePoints,
      minzoom: 16,
      layout: {
        "text-field": [
          "coalesce",
          ["to-string", ["get", "name"]],
          ["to-string", ["get", "type"]],
          "",
        ],
        "text-size": 10,
        "text-offset": [0, 1.2],
        "text-anchor": "top",
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": "#0f172a",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.2,
      },
    });
  }
}

function addCameraLocationsLayer(map, data) {
  ensureSource(
    map,
    SOURCES.cameraLocations,
    normalizeGeometryCollections(data),
  );

  if (!map.getLayer(LAYERS.cameraLocationsCircle)) {
    map.addLayer({
      id: LAYERS.cameraLocationsCircle,
      type: "circle",
      source: SOURCES.cameraLocations,
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 12, 5, 18, 8],
        "circle-color": "#f97316",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1.5,
      },
    });
  }

  if (!map.getLayer(LAYERS.cameraLocationsLabel)) {
    map.addLayer({
      id: LAYERS.cameraLocationsLabel,
      type: "symbol",
      source: SOURCES.cameraLocations,
      minzoom: 15,
      layout: {
        "text-field": [
          "coalesce",
          ["to-string", ["get", "camera"]],
          ["to-string", ["get", "name"]],
          "",
        ],
        "text-size": 10,
        "text-offset": [0, 1.2],
        "text-anchor": "top",
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": "#0f172a",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.2,
      },
    });
  }
}

function addRoadLayer(map, data) {
  ensureSource(map, SOURCES.roads, data);

  if (!map.getLayer(LAYERS.roadsFill)) {
    map.addLayer({
      id: LAYERS.roadsFill,
      type: "fill",
      source: SOURCES.roads,
      paint: {
        "fill-color": "#d01f1f",
        "fill-opacity": 0.35,
      },
    });
  }

  if (!map.getLayer(LAYERS.roadsLine)) {
    map.addLayer({
      id: LAYERS.roadsLine,
      type: "line",
      source: SOURCES.roads,
      paint: {
        "line-color": "#991b1b",
        "line-width": 1.5,
      },
    });
  }
}

export default function GISMetaverseMap({
  mapRef,
  setIsMapReady,
  filters,
  layerVisibility,
  adminBoundaryVisibility,
  setLayerVisibility: updateLayerVisibility,
  onIntroComplete,
}) {
  const mapContainerRef = useRef(null);
  const introHasRunRef = useRef(false);

  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [69.3451, 30.3753],
      zoom: 4.4,
    });

    mapRef.current.on("load", () => {
      setIsMapReady(true);
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      setIsMapReady(false);
    };
  }, [mapRef, setIsMapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || introHasRunRef.current) return;

    let cancelled = false;
    introHasRunRef.current = true;

    const runIntro = async () => {
      try {
        const steps = [
          {
            label: "Pakistan",
            path: new URL("../../assets/Pakistan.geojson", import.meta.url),
          },
          {
            label: "Punjab",
            path: new URL("../../assets/Punjab.geojson", import.meta.url),
          },
          {
            label: "RUDA",
            path: new URL("../../assets/Ruda.geojson", import.meta.url),
          },
        ];

        for (const step of steps) {
          if (cancelled) return;

          const data = await loadAssetGeoJSON(step.path);
          if (cancelled) return;

          addIntroBoundaryLayer(map, data, step.label);
          fitGeoJSON(map, data);
          await wait(1600);
        }

        if (cancelled) return;

        clearIntroBoundaryLayer(map);
        onIntroComplete?.();
      } catch (err) {
        console.error("Metaverse intro animation error:", err);
        clearIntroBoundaryLayer(map);
        onIntroComplete?.();
      }
    };

    if (map.isStyleLoaded()) runIntro();
    else map.once("load", runIntro);

    return () => {
      cancelled = true;
    };
  }, [mapRef, onIntroComplete]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const run = async () => {
      if (!filters?.projectId) {
        Object.values(SOURCES).forEach((sourceId) => {
          if (map.getSource(sourceId)) {
            map.getSource(sourceId).setData(emptyFC);
          }
        });
        return;
      }

      const projectGeoJSON = await getProjectGeoJSON(filters.projectId);
      addProjectBoundaryLayer(map, projectGeoJSON);
      setLayerVisibility(map, [LAYERS.boundaryFill, LAYERS.boundaryLine], true);
      fitGeoJSON(map, projectGeoJSON);

      updateLayerVisibility((prev) => ({
        ...prev,
        boundary: true,
      }));
    };

    if (map.isStyleLoaded()) run();
    else map.once("load", run);
  }, [filters.projectId, mapRef, updateLayerVisibility]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !filters?.projectId) return;

    const run = async () => {
      if (!filters.block) {
        if (map.getSource(SOURCES.block)) {
          map.getSource(SOURCES.block).setData(emptyFC);
        }
        return;
      }

      const blockGeoJSON = await getBlocksGeoJSON(
        filters.projectId,
        filters.block,
      );
      addBlockLayer(map, blockGeoJSON);
      setLayerVisibility(map, [LAYERS.blockFill, LAYERS.blockLine], true);
      fitGeoJSON(map, blockGeoJSON);
    };

    if (map.isStyleLoaded()) run();
    else map.once("load", run);
  }, [filters.projectId, filters.block, mapRef]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !filters?.projectId) return;

    const run = async () => {
      const hasPlotFilter =
        !!filters.plotType || !!filters.plotNo || !!filters.area;

      if (!hasPlotFilter && !layerVisibility.masterPlan) {
        if (map.getSource(SOURCES.masterPlan)) {
          map.getSource(SOURCES.masterPlan).setData(emptyFC);
        }
        return;
      }

      const plotGeoJSON = await getPlotsGeoJSON({
        // project_id: filters.projectId,
        // block: filters.block || undefined,
        // type: filters.plotType || undefined,
        // plot_no: filters.plotNo || undefined,
        // plot_area: filters.area || undefined,
        project_id: filters.projectId,
        block: filters.block || undefined,
      });

      addMasterPlanLayer(map, plotGeoJSON);
      setLayerVisibility(
        map,
        [LAYERS.masterPlanFill, LAYERS.masterPlanLine, LAYERS.masterPlanLabel],
        true,
      );

      if (hasPlotFilter) fitGeoJSON(map, plotGeoJSON);
    };

    if (map.isStyleLoaded()) run();
    else map.once("load", run);
  }, [
    filters.projectId,
    filters.block,
    filters.plotType,
    filters.plotNo,
    filters.area,
    layerVisibility.masterPlan,
    mapRef,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const run = async () => {
      if (adminBoundaryVisibility.rudaBoundary) {
        const data = await getRudaGeoJSON();
        ensureSource(map, SOURCES.rudaBoundary, data);

        if (!map.getLayer(LAYERS.rudaBoundaryLine)) {
          map.addLayer({
            id: LAYERS.rudaBoundaryLine,
            type: "line",
            source: SOURCES.rudaBoundary,
            paint: {
              "line-color": "#6B7280",
              "line-width": 2.5,
            },
          });
        }
      }

      if (adminBoundaryVisibility.proposedRoads) {
        const data = await getRudaProposedRoadsGeoJSON();
        ensureSource(map, SOURCES.proposedRoads, data);

        if (!map.getLayer(LAYERS.proposedRoadsLine)) {
          map.addLayer({
            id: LAYERS.proposedRoadsLine,
            type: "line",
            source: SOURCES.proposedRoads,
            paint: {
              "line-color": "#f97316",
              "line-width": 3,
            },
          });
        }
      }

      if (adminBoundaryVisibility.geodeticNetwork) {
        const data = await getGeodeticNetworkGeoJSON();
        ensureSource(map, SOURCES.geodeticNetwork, data);

        if (!map.getLayer(LAYERS.geodeticNetworkCircle)) {
          map.addLayer({
            id: LAYERS.geodeticNetworkCircle,
            type: "circle",
            source: SOURCES.geodeticNetwork,
            paint: {
              "circle-radius": 5,
              "circle-color": "#22c55e",
              "circle-stroke-color": "#ffffff",
              "circle-stroke-width": 1,
            },
          });
        }
      }

      setLayerVisibility(
        map,
        [LAYERS.rudaBoundaryLine],
        adminBoundaryVisibility.rudaBoundary,
      );

      setLayerVisibility(
        map,
        [LAYERS.proposedRoadsLine],
        adminBoundaryVisibility.proposedRoads,
      );

      setLayerVisibility(
        map,
        [LAYERS.geodeticNetworkCircle],
        adminBoundaryVisibility.geodeticNetwork,
      );
    };

    if (map.isStyleLoaded()) run();
    else map.once("load", run);
  }, [adminBoundaryVisibility, mapRef]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    setLayerVisibility(
      map,
      [LAYERS.boundaryFill, LAYERS.boundaryLine],
      layerVisibility.boundary,
    );
    setLayerVisibility(
      map,
      [LAYERS.masterPlanFill, LAYERS.masterPlanLine, LAYERS.masterPlanLabel],
      layerVisibility.masterPlan,
    );
    setLayerVisibility(
      map,
      [LAYERS.spotLevelCircle],
      layerVisibility.spotLevel,
    );
    setLayerVisibility(map, [LAYERS.contoursLine], layerVisibility.contours);
    setLayerVisibility(
      map,
      [LAYERS.roadsFill, LAYERS.roadsLine],
      layerVisibility.roads,
    );
    setLayerVisibility(
      map,
      [LAYERS.waterSupplyPointsCircle, LAYERS.waterSupplyPointsLabel],
      layerVisibility.waterSupplyPoints,
    );
    setLayerVisibility(
      map,
      [LAYERS.waterSupplyLinesLine],
      layerVisibility.waterSupplyLines,
    );
    setLayerVisibility(
      map,
      [LAYERS.sewagePointsCircle, LAYERS.sewagePointsLabel],
      layerVisibility.sewagePoints,
    );
    setLayerVisibility(
      map,
      [LAYERS.cameraLocationsCircle, LAYERS.cameraLocationsLabel],
      layerVisibility.cameraLocations,
    );
  }, [layerVisibility, mapRef]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !filters?.projectId) return;

    const run = async () => {
      if (layerVisibility.spotLevel) {
        const data = await getSpotLevelGeoJSON(filters.projectId);
        addSpotLevelLayer(map, data);
      }

      if (layerVisibility.contours) {
        const data = await getContourGeoJSON(filters.projectId);
        addContourLayer(map, data);
      }

      if (layerVisibility.roads) {
        const data = await getRoadsGeoJSON(filters.projectId);
        addRoadLayer(map, data);
      }

      if (layerVisibility.waterSupplyPoints) {
        const data = await getWaterSupplyPointsGeoJSON(filters.projectId);
        addWaterSupplyPointsLayer(map, data);
      }

      if (layerVisibility.waterSupplyLines) {
        const data = await getWaterSupplyLinesGeoJSON(filters.projectId);
        addWaterSupplyLinesLayer(map, data);
      }

      if (layerVisibility.sewagePoints) {
        const data = await getSewagePointsGeoJSON(filters.projectId);
        addSewagePointsLayer(map, data);
      }

      if (layerVisibility.cameraLocations) {
        const data = await getCameraLocationsGeoJSON(filters.projectId);
        addCameraLocationsLayer(map, data);
      }
    };

    if (map.isStyleLoaded()) run();
    else map.once("load", run);
  }, [
    filters.projectId,
    layerVisibility.spotLevel,
    layerVisibility.contours,
    layerVisibility.roads,
    layerVisibility.waterSupplyPoints,
    layerVisibility.waterSupplyLines,
    layerVisibility.sewagePoints,
    layerVisibility.cameraLocations,
    mapRef,
  ]);

  return <div ref={mapContainerRef} className="h-full w-full" />;
}

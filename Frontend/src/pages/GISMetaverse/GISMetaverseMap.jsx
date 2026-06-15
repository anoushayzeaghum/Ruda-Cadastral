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
} from "../../services/metaverseApi";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const SOURCES = {
  boundary: "metaverse-project-boundary-source",
  block: "metaverse-block-source",
  masterPlan: "metaverse-masterplan-source",
  spotLevel: "metaverse-spot-level-source",
  contours: "metaverse-contours-source",
  roads: "metaverse-roads-source",
};

const LAYERS = {
  boundaryFill: "metaverse-project-boundary-fill",
  boundaryLine: "metaverse-project-boundary-line",
  blockFill: "metaverse-block-fill",
  blockLine: "metaverse-block-line",
  masterPlanFill: "metaverse-masterplan-fill",
  masterPlanLine: "metaverse-masterplan-line",
  spotLevelCircle: "metaverse-spot-level-circle",
  contoursLine: "metaverse-contours-line",
  roadsFill: "metaverse-roads-fill",
  roadsLine: "metaverse-roads-line",
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
    if (geom.type === "MultiLineString") geom.coordinates.flat(1).forEach(addCoord);
    if (geom.type === "Polygon") geom.coordinates.flat(1).forEach(addCoord);
    if (geom.type === "MultiPolygon") geom.coordinates.flat(2).forEach(addCoord);
  });

  if (!bounds.isEmpty()) {
    map.fitBounds(bounds, {
      padding: 80,
      duration: 900,
      maxZoom: 17,
    });
  }
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
        "line-color": "#d7bf32",
        "line-width": 1.5,
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
        "fill-color": "#ef4444",
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
  setLayerVisibility: updateLayerVisibility,
}) {
  const mapContainerRef = useRef(null);

  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [74.3587, 31.5204],
      zoom: 12,
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

      const blockGeoJSON = await getBlocksGeoJSON(filters.projectId, filters.block);
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
      const hasPlotFilter = !!filters.plotType || !!filters.plotNo || !!filters.area;

      if (!hasPlotFilter && !layerVisibility.masterPlan) {
        if (map.getSource(SOURCES.masterPlan)) {
          map.getSource(SOURCES.masterPlan).setData(emptyFC);
        }
        return;
      }

      const plotGeoJSON = await getPlotsGeoJSON({
        project_id: filters.projectId,
        block: filters.block || undefined,
        type: filters.plotType || undefined,
        plot_no: filters.plotNo || undefined,
        plot_area: filters.area || undefined,
      });

      addMasterPlanLayer(map, plotGeoJSON);
      setLayerVisibility(
        map,
        [LAYERS.masterPlanFill, LAYERS.masterPlanLine],
        true
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

    setLayerVisibility(
      map,
      [LAYERS.boundaryFill, LAYERS.boundaryLine],
      layerVisibility.boundary
    );
    setLayerVisibility(
      map,
      [LAYERS.masterPlanFill, LAYERS.masterPlanLine],
      layerVisibility.masterPlan
    );
    setLayerVisibility(
      map,
      [LAYERS.spotLevelCircle],
      layerVisibility.spotLevel
    );
    setLayerVisibility(
      map,
      [LAYERS.contoursLine],
      layerVisibility.contours
    );
    setLayerVisibility(
      map,
      [LAYERS.roadsFill, LAYERS.roadsLine],
      layerVisibility.roads
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
    };

    if (map.isStyleLoaded()) run();
    else map.once("load", run);
  }, [
    filters.projectId,
    layerVisibility.spotLevel,
    layerVisibility.contours,
    layerVisibility.roads,
    mapRef,
  ]);

  return <div ref={mapContainerRef} className="h-full w-full" />;
}
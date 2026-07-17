import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  getBlocksGeoJSON,
  getPlotsGeoJSON,
  getProjectGeoJSON,
  getRoadsGeoJSON,
} from "../../services/metaverseApi";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const emptyFC = { type: "FeatureCollection", features: [] };

const SOURCES = {
  project: "demarcation-project-source",
  block: "demarcation-block-source",
  roads: "demarcation-roads-source",
  plots: "demarcation-plots-source",
  selectedPlot: "demarcation-selected-plot-source",
};

const LAYERS = {
  projectFill: "demarcation-project-fill",
  projectLine: "demarcation-project-line",
  blockFill: "demarcation-block-fill",
  blockLine: "demarcation-block-line",
  roadFill: "demarcation-road-fill",
  roadLine: "demarcation-road-line",
  plotFill: "demarcation-plot-fill",
  plotLine: "demarcation-plot-line",
  plotLabel: "demarcation-plot-label",
  selectedPlotFill: "demarcation-selected-plot-fill",
  selectedPlotLine: "demarcation-selected-plot-line",
};

export const plotColorExpression = [
  "match",
  ["coalesce", ["get", "type"], ["get", "land_use"], ["get", "name"]],
  "Residential",
  "#2563eb",
  "Residential Plot",
  "#2563eb",
  "Commercial",
  "#facc15",
  "Commercial Plot",
  "#facc15",
  "Green Belt",
  "#22c55e",
  "Barren Land",
  "#92400e",
  "Road",
  "#ef4444",
  "Park",
  "#15803d",
  "Public Use",
  "#a855f7",
  "Recreational Facility",
  "#6366f1",
  "Parking",
  "#f97316",
  "Religious Building",
  "#c084fc",
  "#9ca3af",
];

function ensureSource(map, id, data = emptyFC) {
  if (!map.getSource(id)) {
    map.addSource(id, { type: "geojson", data });
  } else {
    map.getSource(id).setData(data);
  }
}

function fitGeoJSON(map, geojson, maxZoom = 18) {
  if (!geojson?.features?.length) return;
  const bounds = new mapboxgl.LngLatBounds();

  const addCoord = (coord) => {
    if (Array.isArray(coord) && coord.length >= 2) bounds.extend(coord);
  };

  geojson.features.forEach((feature) => {
    const geom = feature?.geometry;
    if (!geom) return;
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
    map.fitBounds(bounds, { padding: 70, duration: 800, maxZoom });
  }
}

function addBaseLayers(map) {
  ensureSource(map, SOURCES.project, emptyFC);
  ensureSource(map, SOURCES.block, emptyFC);
  ensureSource(map, SOURCES.roads, emptyFC);
  ensureSource(map, SOURCES.plots, emptyFC);
  ensureSource(map, SOURCES.selectedPlot, emptyFC);

  if (!map.getLayer(LAYERS.projectFill)) {
    map.addLayer({
      id: LAYERS.projectFill,
      type: "fill",
      source: SOURCES.project,
      paint: { "fill-color": "#ff8b24", "fill-opacity": 0.08 },
    });
  }

  if (!map.getLayer(LAYERS.projectLine)) {
    map.addLayer({
      id: LAYERS.projectLine,
      type: "line",
      source: SOURCES.project,
      paint: { "line-color": "#ff8b24", "line-width": 3 },
    });
  }

  if (!map.getLayer(LAYERS.blockFill)) {
    map.addLayer({
      id: LAYERS.blockFill,
      type: "fill",
      source: SOURCES.block,
      paint: { "fill-color": "#7c3aed", "fill-opacity": 0.12 },
    });
  }

  if (!map.getLayer(LAYERS.blockLine)) {
    map.addLayer({
      id: LAYERS.blockLine,
      type: "line",
      source: SOURCES.block,
      paint: { "line-color": "#7c3aed", "line-width": 2.25 },
    });
  }

  if (!map.getLayer(LAYERS.roadFill)) {
    map.addLayer({
      id: LAYERS.roadFill,
      type: "fill",
      source: SOURCES.roads,
      paint: { "fill-color": "#6b7280", "fill-opacity": 0.45 },
    });
  }

  if (!map.getLayer(LAYERS.roadLine)) {
    map.addLayer({
      id: LAYERS.roadLine,
      type: "line",
      source: SOURCES.roads,
      paint: { "line-color": "#374151", "line-width": 1.25 },
    });
  }

  if (!map.getLayer(LAYERS.plotFill)) {
    map.addLayer({
      id: LAYERS.plotFill,
      type: "fill",
      source: SOURCES.plots,
      paint: { "fill-color": plotColorExpression, "fill-opacity": 0.55 },
    });
  }

  if (!map.getLayer(LAYERS.plotLine)) {
    map.addLayer({
      id: LAYERS.plotLine,
      type: "line",
      source: SOURCES.plots,
      paint: { "line-color": "#111827", "line-width": 1 },
    });
  }

  if (!map.getLayer(LAYERS.plotLabel)) {
    map.addLayer({
      id: LAYERS.plotLabel,
      type: "symbol",
      source: SOURCES.plots,
      minzoom: 16,
      layout: {
        "text-field": [
          "coalesce",
          ["to-string", ["get", "plot_no"]],
          ["to-string", ["get", "name"]],
          "",
        ],
        "text-size": ["interpolate", ["linear"], ["zoom"], 16, 10, 19, 14],
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

  if (!map.getLayer(LAYERS.selectedPlotFill)) {
    map.addLayer({
      id: LAYERS.selectedPlotFill,
      type: "fill",
      source: SOURCES.selectedPlot,
      paint: { "fill-color": "#ffffff", "fill-opacity": 0.2 },
    });
  }

  if (!map.getLayer(LAYERS.selectedPlotLine)) {
    map.addLayer({
      id: LAYERS.selectedPlotLine,
      type: "line",
      source: SOURCES.selectedPlot,
      paint: { "line-color": "#000000", "line-width": 4 },
    });
  }
}

function featureCollectionFromFeature(feature) {
  return feature ? { type: "FeatureCollection", features: [feature] } : emptyFC;
}

export default function DemarcationMap({
  filters = {},
  onParcelSelect = () => {},
  onFeaturesLoaded = () => {},
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [74.3587, 31.5204],
      zoom: 12,
      preserveDrawingBuffer: true,
    });

    mapRef.current = map;
    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right",
    );

    map.on("load", () => addBaseLayers(map));

    map.on("click", LAYERS.plotFill, (event) => {
      const feature = event.features?.[0];
      if (!feature) return;
      ensureSource(
        map,
        SOURCES.selectedPlot,
        featureCollectionFromFeature(feature),
      );
      onParcelSelect(feature);
    });

    map.on("mouseenter", LAYERS.plotFill, () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", LAYERS.plotFill, () => {
      map.getCanvas().style.cursor = "";
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [onParcelSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const loadDemarcationLayers = async () => {
      addBaseLayers(map);
      const requestId = Date.now();
      requestIdRef.current = requestId;

      if (!filters?.projectId) {
        ensureSource(map, SOURCES.project, emptyFC);
        ensureSource(map, SOURCES.block, emptyFC);
        ensureSource(map, SOURCES.roads, emptyFC);
        ensureSource(map, SOURCES.plots, emptyFC);
        ensureSource(map, SOURCES.selectedPlot, emptyFC);
        onFeaturesLoaded(emptyFC);
        onParcelSelect(null);
        return;
      }

      const baseFilter = {
        project_id: filters.projectId,
        block_id: filters.blockId || undefined,
        block: filters.block || undefined,
      };

      const plotFilter = {
        ...baseFilter,
        type: filters.plotType || undefined,
        plot_no: filters.plotNo || undefined,
      };

      try {
        const [projectGeoJSON, blockGeoJSON, roadGeoJSON, plotGeoJSON] =
          await Promise.all([
            filters.block
              ? Promise.resolve(emptyFC)
              : getProjectGeoJSON(filters.projectId),
            filters.block
              ? getBlocksGeoJSON(filters.projectId, filters.block)
              : Promise.resolve(emptyFC),
            getRoadsGeoJSON(baseFilter),
            getPlotsGeoJSON(plotFilter),
          ]);

        if (requestIdRef.current !== requestId) return;

        ensureSource(map, SOURCES.project, projectGeoJSON);
        ensureSource(map, SOURCES.block, blockGeoJSON);
        ensureSource(map, SOURCES.roads, roadGeoJSON);
        ensureSource(map, SOURCES.plots, plotGeoJSON);
        onFeaturesLoaded(plotGeoJSON);

        const exactSelected = (plotGeoJSON.features || []).find((feature) => {
          const props = feature.properties || {};
          return (
            filters.plotNo && String(props.plot_no) === String(filters.plotNo)
          );
        });

        ensureSource(
          map,
          SOURCES.selectedPlot,
          featureCollectionFromFeature(exactSelected),
        );
        onParcelSelect(exactSelected || null);

        if (exactSelected) {
          fitGeoJSON(map, featureCollectionFromFeature(exactSelected), 19);
        } else if (filters.block && blockGeoJSON.features?.length) {
          fitGeoJSON(map, blockGeoJSON, 17);
        } else if (!filters.block && projectGeoJSON.features?.length) {
          fitGeoJSON(map, projectGeoJSON, 16);
        } else if (plotGeoJSON.features?.length) {
          fitGeoJSON(map, plotGeoJSON, filters.plotType ? 18 : 16);
        }
      } catch (error) {
        console.error("Failed to load demarcation map layers", error);
        ensureSource(map, SOURCES.project, emptyFC);
        ensureSource(map, SOURCES.block, emptyFC);
        ensureSource(map, SOURCES.roads, emptyFC);
        ensureSource(map, SOURCES.plots, emptyFC);
        ensureSource(map, SOURCES.selectedPlot, emptyFC);
        onFeaturesLoaded(emptyFC);
        onParcelSelect(null);
      }
    };

    if (map.isStyleLoaded()) loadDemarcationLayers();
    else map.once("load", loadDemarcationLayers);
  }, [
    filters?.projectId,
    filters?.blockId,
    filters?.block,
    filters?.plotType,
    filters?.plotNo,
    filters?.searchNonce,
    onFeaturesLoaded,
    onParcelSelect,
  ]);

  return (
    <div className="absolute inset-0 h-full w-full bg-white overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { ChevronDown, ChevronRight } from "lucide-react";
import LayerRow from "../_LayerRow";
import { pointLegend, lineLegend, polygonLegend } from "../_legendUtils";
import ContoursAttribute from "../AttributeTable/ProjectMasterPlan/TopographicPlan/ContoursAttribute";
import { getContourGeoJSON } from "../../../../../services/metaverseApi";

const DSM_SOURCE = "gis-dsm-source";
const DSM_LAYER = "gis-dsm-layer";
const DTM_SOURCE = "gis-dtm-source";
const DTM_LAYER = "gis-dtm-layer";
const TOPO_SOURCE = "gis-topo-cb1-source";
const SPOT_LEVEL_SOURCE = "gis-topo-spotlevel-source";
const EMPTY_GEOJSON = { type: "FeatureCollection", features: [] };
const CONTOUR_SOURCE = "gis-project-contours-source";

// Dedicated map endpoint returns GeoJSON, unlike the regular Spot Level
// ModelSerializer listing. Keep the original X/Y/ZZ attributes in properties.
const SPOT_LEVEL_API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"
).replace(/\/$/, "");

const loadSpotLevelMapGeoJSON = async (projectId) => {
  const response = await axios.get(
    `${SPOT_LEVEL_API_BASE}/spot-level/map-geojson/`,
    { params: { project_id: projectId } },
  );
  const payload = response.data?.data ?? response.data;
  if (payload?.type !== "FeatureCollection" || !Array.isArray(payload.features)) {
    throw new Error("Spot Level API did not return a GeoJSON FeatureCollection.");
  }

  const features = payload.features.filter((feature) => {
    const coords = feature?.geometry?.coordinates;
    return feature?.type === "Feature" &&
      feature?.geometry?.type === "Point" &&
      Array.isArray(coords) && coords.length >= 2 &&
      Number.isFinite(coords[0]) && Number.isFinite(coords[1]) &&
      Math.abs(coords[0]) <= 180 && Math.abs(coords[1]) <= 90;
  });

  if (features.length !== payload.features.length) {
    console.warn("[SpotLevel] Skipped invalid map coordinates", {
      received: payload.features.length,
      valid: features.length,
    });
  }
  if (import.meta.env.DEV) {
    console.info("[SpotLevel] Map features loaded", {
      projectId,
      count: features.length,
      firstCoordinate: features[0]?.geometry?.coordinates,
      firstElevation: features[0]?.properties?.ZZ,
    });
  }
  return { type: "FeatureCollection", features };
};


const TOPOGRAPHIC_COLORS = {
  spotLevel: "#a855f7",
  contours: "#8b4513",
  topography: "#22c55e",
  dsm: "#f97316",
  dtm: "#0ea5e9",
};

const DSM_TILE_URL =
  "https://rudametaverse.nespakprogresscenter.com/tiles/data/Chaharbagh_DSM/{z}/{x}/{y}.png";
const DTM_TILE_URL =
  "https://rudametaverse.nespakprogresscenter.com/tiles/data/Chaharbagh_DTM/{z}/{x}/{y}.png";

const TOPOGRAPHIC_BOUNDARY_LAYERS = [
  {
    id: "gis-topo-builtup-fill",
    type: "fill",
    filter: ["==", ["get", "layer"], "Builtup"],
    baseOpacity: 0.5,
    paint: { "fill-color": "#f97316" },
  },
  {
    id: "gis-topo-builtup-outline",
    type: "line",
    filter: ["==", ["get", "layer"], "Builtup"],
    baseOpacity: 0.8,
    paint: { "line-color": "#ea580c", "line-width": 1.5 },
  },
  {
    id: "gis-topo-park-fill",
    type: "fill",
    filter: ["==", ["get", "layer"], "Park"],
    baseOpacity: 0.6,
    paint: { "fill-color": "#22c55e" },
  },
  {
    id: "gis-topo-greenbelt-fill",
    type: "fill",
    filter: ["==", ["get", "layer"], "Green Belt"],
    baseOpacity: 0.55,
    paint: { "fill-color": "#10b981" },
  },
  {
    id: "gis-topo-road-line",
    type: "line",
    filter: ["==", ["get", "layer"], "Road Track"],
    baseOpacity: 0.8,
    paint: { "line-color": "#64748b", "line-width": 2 },
  },
  {
    id: "gis-topo-manholes-circle",
    type: "circle",
    filter: ["==", ["get", "layer"], "Manholes"],
    baseOpacity: 0.9,
    paint: {
      "circle-color": "#ef4444",
      "circle-radius": 4,
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 1,
    },
  },
  {
    id: "gis-topo-lightpoles-circle",
    type: "circle",
    filter: ["==", ["get", "layer"], "Light Poles"],
    baseOpacity: 0.9,
    paint: {
      "circle-color": "#eab308",
      "circle-radius": 4.5,
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 1,
    },
  },
];

const SPOT_LEVEL_LAYERS = [
  {
    id: "gis-topo-spotlevel-circle",
    type: "circle",
    baseOpacity: 0.85,
    paint: {
      "circle-color": "#a855f7",
      "circle-radius": 3.5,
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 0.8,
    },
  },
];

const CONTOUR_LAYERS = [
  {
    id: "gis-topo-contours-line",
    type: "line",
    baseOpacity: 0.9,
    paint: { "line-color": "#8b4513", "line-width": 1.4 },
  },
  {
    id: "gis-topo-contours-label",
    type: "symbol",
    baseOpacity: 1,
    layout: {
      "symbol-placement": "line",
      "text-field": [
        "coalesce",
        ["to-string", ["get", "elevation"]],
        ["to-string", ["get", "elev"]],
        ["to-string", ["get", "level"]],
        ["to-string", ["get", "value"]],
        "",
      ],
      "text-size": 10,
      "text-allow-overlap": false,
    },
    paint: {
      "text-color": "#8b4513",
      "text-halo-color": "#081c15",
      "text-halo-width": 1,
    },
  },
];

const CB_BOUNDS = [
  [74.42562653088396, 31.60509230706726],
  [74.43545280361002, 31.6112165411359],
];

const setLayerOpacity = (map, layer, opacity) => {
  if (!map?.getLayer?.(layer.id)) return;
  const value = (opacity / 100) * layer.baseOpacity;

  if (layer.type === "fill") {
    map.setPaintProperty(layer.id, "fill-opacity", value);
  } else if (layer.type === "line") {
    map.setPaintProperty(layer.id, "line-opacity", value);
  } else if (layer.type === "circle") {
    map.setPaintProperty(layer.id, "circle-opacity", value);
    if (layer.paint?.["circle-stroke-width"]) {
      map.setPaintProperty(layer.id, "circle-stroke-opacity", value);
    }
  } else if (layer.type === "symbol") {
    map.setPaintProperty(layer.id, "text-opacity", value);
  }
};

const addOrUpdateGeoJsonLayers = (
  map,
  layers,
  visible,
  opacity,
  source = TOPO_SOURCE,
) => {
  layers.forEach((layer) => {
    if (!map.getLayer(layer.id)) {
      const definition = {
        id: layer.id,
        type: layer.type,
        source,
        ...(layer.filter ? { filter: layer.filter } : {}),
        paint: { ...layer.paint },
        layout: {
          visibility: visible ? "visible" : "none",
          ...(layer.layout || {}),
        },
      };
      map.addLayer(definition);
    } else {
      map.setLayoutProperty(
        layer.id,
        "visibility",
        visible ? "visible" : "none",
      );
    }

    setLayerOpacity(map, layer, opacity);
  });
};

export default function TopographicPlan({
  map,
  selectedProjectId,
  layerVisibility = {},
  setLayerVisibility,
}) {
  const [open, setOpen] = useState(false);
  const hasSelectedProject = Boolean(selectedProjectId);
  const [spotLevelVisible, setSpotLevelVisible] = useState(false);
  const [spotLevelOpacity, setSpotLevelOpacity] = useState(100);
  const [spotLevelColor, setSpotLevelColor] = useState(
    TOPOGRAPHIC_COLORS.spotLevel,
  );
  const [contoursVisible, setContoursVisible] = useState(false);
  const [contoursOpacity, setContoursOpacity] = useState(100);
  const [contoursColor, setContoursColor] = useState(
    TOPOGRAPHIC_COLORS.contours,
  );
  const [activeAttributeTable, setActiveAttributeTable] = useState(null);

  const [dsmVisible, setDsmVisible] = useState(false);
  const [dsmOpacity, setDsmOpacity] = useState(85);
  const [dtmVisible, setDtmVisible] = useState(false);
  const [dtmOpacity, setDtmOpacity] = useState(85);

  const topoVisible = !!layerVisibility.topography;
  const topoOpacity = layerVisibility.topographyOpacity ?? 80;
  const [topoLoading, setTopoLoading] = useState(false);
  const topoDataRef = useRef(null);
  const spotDataRef = useRef(null);
  const spotProjectRef = useRef(null);
  const contourDataRef = useRef(null);

  const updateTopographicColor = (layers, color) => {
    layers.forEach((layer) => {
      if (!map?.getLayer?.(layer.id)) return;
      const property =
        layer.type === "symbol"
          ? "text-color"
          : layer.type === "circle"
            ? "circle-color"
            : layer.type === "fill"
              ? "fill-color"
              : "line-color";
      map.setPaintProperty(layer.id, property, color);
    });
  };

  const setTopoVisible = (value) => {
    setLayerVisibility?.((previous) => ({ ...previous, topography: value }));
  };

  const setTopoOpacity = (value) => {
    setLayerVisibility?.((previous) => ({
      ...previous,
      topographyOpacity: value,
    }));
  };

  // const flyToChaharbagh = () => {
  //   map?.fitBounds?.(CB_BOUNDS, { padding: 50, duration: 1500 });
  // };

  useEffect(() => {
    contourDataRef.current = null;
    spotDataRef.current = null;
    spotProjectRef.current = selectedProjectId;
    if (selectedProjectId) return;
    setSpotLevelVisible(false);
    setContoursVisible(false);
    setTopoVisible(false);
    setDsmVisible(false);
    setDtmVisible(false);
  }, [selectedProjectId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!map) return;
    let cancelled = false;
    const anyGeoJsonLayerVisible =
      spotLevelVisible || contoursVisible || topoVisible;

    // The Spot Level shapefile now comes from the backend /spot-level/ API,
    // and not from Topography.geojson (which contained obsolete Z attributes).
    const renderLayers = (geojson, contourGeojson, spotGeojson) => {
      if (cancelled) return;
      const updateSource = (id, data) => {
        if (!map.getSource(id)) {
          map.addSource(id, { type: "geojson", data });
        } else {
          map.getSource(id).setData(data);
        }
      };
      updateSource(TOPO_SOURCE, geojson);
      updateSource(CONTOUR_SOURCE, contourGeojson);
      updateSource(SPOT_LEVEL_SOURCE, spotGeojson);

      addOrUpdateGeoJsonLayers(
        map, SPOT_LEVEL_LAYERS, spotLevelVisible, spotLevelOpacity,
        SPOT_LEVEL_SOURCE,
      );
      addOrUpdateGeoJsonLayers(
        map, CONTOUR_LAYERS, contoursVisible, contoursOpacity, CONTOUR_SOURCE,
      );
      addOrUpdateGeoJsonLayers(
        map, TOPOGRAPHIC_BOUNDARY_LAYERS, topoVisible, topoOpacity,
      );
      updateTopographicColor(SPOT_LEVEL_LAYERS, spotLevelColor);
      updateTopographicColor(CONTOUR_LAYERS, contoursColor);
    };

    if (!anyGeoJsonLayerVisible) {
      // A previously added source/layer must also be hidden when unchecked.
      for (const layer of [
        ...SPOT_LEVEL_LAYERS, ...CONTOUR_LAYERS,
        ...TOPOGRAPHIC_BOUNDARY_LAYERS,
      ]) {
        if (map.getLayer(layer.id)) {
          map.setLayoutProperty(layer.id, "visibility", "none");
        }
      }
      return () => { cancelled = true; };
    }

    if (spotProjectRef.current !== selectedProjectId) {
      spotProjectRef.current = selectedProjectId;
      spotDataRef.current = null;
    }

    // Fetch only the layer datasets actually needed; cached data is reused.
    const loadTopography = topoVisible
      ? topoDataRef.current
        ? Promise.resolve(topoDataRef.current)
        : fetch("/Topogeojson_backup/Topography.geojson").then((res) => {
            if (!res.ok) throw new Error(`Topography HTTP ${res.status}`);
            return res.json();
          })
      : Promise.resolve(topoDataRef.current || EMPTY_GEOJSON);
    const loadContours = contoursVisible
      ? contourDataRef.current
        ? Promise.resolve(contourDataRef.current)
        : getContourGeoJSON(selectedProjectId)
      : Promise.resolve(contourDataRef.current || EMPTY_GEOJSON);
    const loadSpotLevels = spotLevelVisible && selectedProjectId
      ? spotDataRef.current
        ? Promise.resolve(spotDataRef.current)
        : loadSpotLevelMapGeoJSON(selectedProjectId)
      : Promise.resolve(spotDataRef.current || EMPTY_GEOJSON);

    setTopoLoading(true);
    Promise.all([loadTopography, loadContours, loadSpotLevels])
      .then(([topo, contours, spots]) => {
        if (cancelled) return;
        if (topoVisible) topoDataRef.current = topo;
        if (contoursVisible) contourDataRef.current = contours;
        if (spotLevelVisible) spotDataRef.current = spots;
        renderLayers(topo, contours, spots);
      })
      .catch((error) => console.error("Topographic/Spot Level load error:", error, error?.response?.data))
      .finally(() => {
        if (!cancelled) setTopoLoading(false);
      });
    return () => { cancelled = true; };
  }, [
    map,
    selectedProjectId,
    spotLevelVisible,
    contoursVisible,
    topoVisible,
    spotLevelOpacity,
    contoursOpacity,
    spotLevelColor,
    contoursColor,
    topoOpacity,
  ]);

  useEffect(() => {
    if (!map) return;

    const updateRaster = ({ sourceId, layerId, tileUrl, visible, opacity }) => {
      if (visible) {
        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, {
            type: "raster",
            tiles: [tileUrl],
            tileSize: 256,
          });
        }

        if (!map.getLayer(layerId)) {
          map.addLayer({
            id: layerId,
            type: "raster",
            source: sourceId,
            paint: { "raster-opacity": opacity / 100 },
            layout: { visibility: "visible" },
          });
          // flyToChaharbagh();
        } else {
          map.setLayoutProperty(layerId, "visibility", "visible");
          map.setPaintProperty(layerId, "raster-opacity", opacity / 100);
        }
      } else if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, "visibility", "none");
      }
    };

    updateRaster({
      sourceId: DSM_SOURCE,
      layerId: DSM_LAYER,
      tileUrl: DSM_TILE_URL,
      visible: dsmVisible,
      opacity: dsmOpacity,
    });

    updateRaster({
      sourceId: DTM_SOURCE,
      layerId: DTM_LAYER,
      tileUrl: DTM_TILE_URL,
      visible: dtmVisible,
      opacity: dtmOpacity,
    });
  }, [map, dsmVisible, dsmOpacity, dtmVisible, dtmOpacity]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="border-b border-[#343c4c]">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-white hover:bg-[#0f3d2e]"
        onClick={() => setOpen((previous) => !previous)}
      >
        <span>TOPOGRAPHIC PLAN</span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>

      {open && (
        <div className="mx-3 mb-3 rounded-sm border border-[#13593f]/40 bg-[#093024] p-2">
          <LayerRow
            label="Spot Level"
            color={spotLevelColor}
            checked={spotLevelVisible}
            disabled={!hasSelectedProject}
            opacity={spotLevelOpacity}
            loading={topoLoading && spotLevelVisible}
            onCheckedChange={setSpotLevelVisible}
            onOpacityChange={setSpotLevelOpacity}
            colorEditable
            onColorChange={(color) => {
              setSpotLevelColor(color);
              updateTopographicColor(SPOT_LEVEL_LAYERS, color);
            }}
            legendItems={[pointLegend("Spot Level", "#a855f7")]}
          />

          <LayerRow
            label="Contours"
            color={contoursColor}
            checked={contoursVisible}
            disabled={!hasSelectedProject}
            opacity={contoursOpacity}
            loading={topoLoading && contoursVisible}
            onCheckedChange={setContoursVisible}
            onOpacityChange={setContoursOpacity}
            colorEditable
            onColorChange={(color) => {
              setContoursColor(color);
              updateTopographicColor(CONTOUR_LAYERS, color);
            }}
            onTableOpen={() => setActiveAttributeTable("contours")}
          />

          <LayerRow
            label="Topographic Boundary"
            color={TOPOGRAPHIC_COLORS.topography}
            checked={topoVisible}
            disabled={!hasSelectedProject}
            opacity={topoOpacity}
            loading={topoLoading && topoVisible}
            onCheckedChange={setTopoVisible}
            onOpacityChange={setTopoOpacity}
            legendItems={[
              polygonLegend("Builtup Areas", "#f97316"),
              polygonLegend("Parks", "#22c55e"),
              polygonLegend("Green Belts", "#10b981"),
              lineLegend("Road Tracks", "#64748b", { width: 2 }),
              pointLegend("Manholes", "#ef4444"),
              pointLegend("Light Poles", "#eab308"),
            ]}
          />

          <LayerRow
            label="DSM"
            color={TOPOGRAPHIC_COLORS.dsm}
            checked={dsmVisible}
            disabled={!hasSelectedProject}
            opacity={dsmOpacity}
            onCheckedChange={setDsmVisible}
            onOpacityChange={setDsmOpacity}
          />

          <LayerRow
            label="DTM"
            color={TOPOGRAPHIC_COLORS.dtm}
            checked={dtmVisible}
            disabled={!hasSelectedProject}
            opacity={dtmOpacity}
            onCheckedChange={setDtmVisible}
            onOpacityChange={setDtmOpacity}
          />
        </div>
      )}

      {activeAttributeTable === "contours" && (
        <ContoursAttribute
          map={map}
          selectedProjectId={selectedProjectId}
          onClose={() => setActiveAttributeTable(null)}
        />
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { ChevronDown, ChevronRight } from "lucide-react";
import LayerRow from "../_LayerRow";
import { pointLegend, lineLegend, polygonLegend } from "../_legendUtils";
import ContoursAttribute from "../AttributeTable/ProjectMasterPlan/TopographicPlan/ContoursAttribute";
import SpotLevelAttribute from "../AttributeTable/ProjectMasterPlan/TopographicPlan/SpotLevelAttribute";
import VectorGeoJSONAttribute from "../AttributeTable/VectorGeoJSONAttribute";
import { getContourGeoJSON } from "../../../../../services/metaverseApi";

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


const isTopoBoundaryFeature = (p) =>
  ["Builtup", "Park", "Green Belt", "Road Track", "Manholes", "Light Poles"].includes(p.layer);

const TOPOGRAPHIC_COLORS = {
  spotLevel: "#a855f7",
  contours: "#8b4513",
  topography: "#22c55e",
  dsm: "#f97316",
  dtm: "#0ea5e9",
};

const LOCAL_TILE_BASE = "http://localhost:8080/data";
const HOSTED_TILE_BASE = "https://rudametaverse.nespakprogresscenter.com/data";
const rasterTileUrls = (path) => [
  `${LOCAL_TILE_BASE}/${path}`,
  `${HOSTED_TILE_BASE}/${path}`,
];

// Journalist & BOR Export supplies one DSM and one DTM for projects 38 and 28.
const JOURNALIST_BOR_RASTERS = {
  dsm: rasterTileUrls("journalist_dsm/{z}/{x}/{y}.png"),
  dtm: rasterTileUrls("journalist_dtm/{z}/{x}/{y}.png"),
};

const PROJECT_RASTER_TILESETS = {
  "48": {
    dsm: rasterTileUrls("green_berg_dsm/{z}/{x}/{y}.png"),
    dtm: rasterTileUrls("green_berg_dtm/{z}/{x}/{y}.png"),
  },
  // Chahar Bagh Phase 1 (project 45) uses both configured TileServers.
  "45": {
    dsm: rasterTileUrls("Chaharbagh_DSM/{z}/{x}/{y}.png"),
    dtm: rasterTileUrls("Chaharbagh_DTM/{z}/{x}/{y}.png"),
  },
  // Both sub-header projects use the same delivered DSM/DTM MBTiles files.
  "38": JOURNALIST_BOR_RASTERS,
  "28": JOURNALIST_BOR_RASTERS,
};

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
  const rasterProjectId = String(selectedProjectId ?? "");
  const rasterTilesets = PROJECT_RASTER_TILESETS[rasterProjectId];
  const hasProjectRasters = Boolean(rasterTilesets);
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

  // When the sub-header project changes, stop showing the prior project's
  // raster immediately, even if the new project has no MBTiles configured.
  // Layers are project-scoped so the two projects never share a raster source.
  useEffect(() => {
    if (!map) return;
    Object.keys(PROJECT_RASTER_TILESETS).forEach((projectId) => {
      if (projectId === rasterProjectId) return;
      ["dsm", "dtm"].forEach((kind) => {
        const id = `gis-${kind}-layer-${projectId}`;
        if (map.getLayer(id)) {
          map.setLayoutProperty(id, "visibility", "none");
        }
      });
    });
    // Do not carry a checked state from one project's DSM/DTM to another.
    setDsmVisible(false);
    setDtmVisible(false);
  }, [map, rasterProjectId]);

  useEffect(() => {
    if (!map || !rasterTilesets) return;

    const addOrUpdateRaster = (kind, visible, opacity, tileset) => {
      const sourceId = `gis-${kind}-source-${rasterProjectId}`;
      const layerId = `gis-${kind}-layer-${rasterProjectId}`;

      if (!visible) {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, "visibility", "none");
        }
        return;
      }

      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: "raster",
          tiles: tileset,
          tileSize: 256,
          // Preserve the established Green Berg zoom settings. The new
          // Journalist/BOR sources use their TileJSON-compatible defaults
          // until their metadata zoom ranges are verified.
          ...(rasterProjectId === "48" ? { minzoom: 13, maxzoom: 20 } : {}),
        });
      }

      if (!map.getLayer(layerId)) {
        // Project 41 retains its established ordering and URLs.
        const firstVectorLayer = ["48", "38", "28", "45"].includes(rasterProjectId)
          ? null
          : map.getStyle()?.layers?.find((layer) =>
              ["fill", "line", "circle", "symbol", "fill-extrusion"].includes(layer.type)
            );
        map.addLayer({
          id: layerId,
          type: "raster",
          source: sourceId,
          paint: { "raster-opacity": opacity / 100, "raster-fade-duration": 0 },
          layout: { visibility: "visible" },
        }, firstVectorLayer?.id);
      } else {
        map.setLayoutProperty(layerId, "visibility", "visible");
        map.setPaintProperty(layerId, "raster-opacity", opacity / 100);
      }
    };

    const ensureProjectRasters = () => {
      if (!map.isStyleLoaded?.()) return;
      try {
        addOrUpdateRaster("dsm", dsmVisible, dsmOpacity, rasterTilesets.dsm);
        addOrUpdateRaster("dtm", dtmVisible, dtmOpacity, rasterTilesets.dtm);
      } catch (error) {
        console.error(`[TopographicPlan] Raster setup for project ${rasterProjectId} failed`, error);
      }
    };

    // Reuse style-reload-safe raster handling for projects 48, 38, 28, and 45.
    // Project 41 remains untouched.
    if (!["48", "38", "28", "45"].includes(rasterProjectId)) {
      ensureProjectRasters();
      return;
    }

    const onMapError = (event) => {
      const message = String(event?.error?.message || "");
      if (/greenberg|green_berg|Chaharbagh|8080|rudametaverse/i.test(message)) {
        console.error(`[TopographicPlan Project ${rasterProjectId}] Tile loading failed`, event.error);
      }
    };
    let frame = null;
    const bringRasterAboveFills = () => {
      if (!map.isStyleLoaded?.()) return;
      const ids = [
        dsmVisible ? `gis-dsm-layer-${rasterProjectId}` : null,
        dtmVisible ? `gis-dtm-layer-${rasterProjectId}` : null,
      ].filter(Boolean);
      const layers = map.getStyle()?.layers || [];
      const activeIds = ids.filter((id) => map.getLayer(id));
      // Avoid repeatedly moving layers: map.moveLayer itself emits styledata.
      const lastIds = layers.slice(-activeIds.length).map((layer) => layer.id);
      if (activeIds.length && activeIds.join("|") !== lastIds.join("|")) {
        activeIds.forEach((id) => map.moveLayer(id));
      }
    };
    const onStyleData = () => {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        bringRasterAboveFills();
      });
    };
    const onStyleLoad = () => {
      ensureProjectRasters();
      onStyleData();
    };
    map.on("style.load", onStyleLoad);
    map.on("styledata", onStyleData);
    map.on("error", onMapError);
    ensureProjectRasters();
    onStyleData();
    if (dsmVisible || dtmVisible) {
      console.info(`[TopographicPlan Project ${rasterProjectId}] Raster diagnostics`, {
        selectedProjectId,
        dsm: dsmVisible ? rasterTilesets.dsm : "off",
        dtm: dtmVisible ? rasterTilesets.dtm : "off",
        zoom: map.getZoom?.(),
        center: map.getCenter?.(),
        styleLoaded: map.isStyleLoaded?.(),
        dsmSourcePresent: Boolean(map.getSource(`gis-dsm-source-${rasterProjectId}`)),
        dtmSourcePresent: Boolean(map.getSource(`gis-dtm-source-${rasterProjectId}`)),
        dsmLayerPresent: Boolean(map.getLayer(`gis-dsm-layer-${rasterProjectId}`)),
        dtmLayerPresent: Boolean(map.getLayer(`gis-dtm-layer-${rasterProjectId}`)),
      });
    }
    return () => {
      map.off("style.load", onStyleLoad);
      map.off("styledata", onStyleData);
      map.off("error", onMapError);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [map, selectedProjectId, rasterProjectId, rasterTilesets, dsmVisible, dsmOpacity, dtmVisible, dtmOpacity]);

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
            onTableOpen={() => setActiveAttributeTable("spotLevel")}
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
            onTableOpen={() => setActiveAttributeTable("topographicBoundary")}
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
            disabled={!hasProjectRasters}
            opacity={dsmOpacity}
            onCheckedChange={setDsmVisible}
            onOpacityChange={setDsmOpacity}
          />

          <LayerRow
            label="DTM"
            color={TOPOGRAPHIC_COLORS.dtm}
            checked={dtmVisible}
            disabled={!hasProjectRasters}
            opacity={dtmOpacity}
            onCheckedChange={setDtmVisible}
            onOpacityChange={setDtmOpacity}
          />
        </div>
      )}

      {activeAttributeTable === "spotLevel" && (
        <SpotLevelAttribute map={map} selectedProjectId={selectedProjectId}
          onClose={() => setActiveAttributeTable(null)} />
      )}
      {activeAttributeTable === "topographicBoundary" && (
        <VectorGeoJSONAttribute map={map} title="Topographic Boundary"
          sourceIds={[TOPO_SOURCE]} publicUrl="/Topogeojson_backup/Topography.geojson"
          filterProperties={isTopoBoundaryFeature}
          onClose={() => setActiveAttributeTable(null)} />
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

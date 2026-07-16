import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import LayerRow from "../_LayerRow";

const DSM_SOURCE = "gis-dsm-source";
const DSM_LAYER = "gis-dsm-layer";
const DTM_SOURCE = "gis-dtm-source";
const DTM_LAYER = "gis-dtm-layer";
const TOPO_SOURCE = "gis-topo-cb1-source";

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
    filter: [
      "in",
      ["downcase", ["to-string", ["get", "layer"]]],
      ["literal", ["spot level", "spotlevel", "spot levels"]],
    ],
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
    filter: [
      "in",
      ["downcase", ["to-string", ["get", "layer"]]],
      ["literal", ["contour", "contours", "contour line", "contour lines"]],
    ],
    baseOpacity: 0.9,
    paint: { "line-color": "#d7bf32", "line-width": 1.4 },
  },
  {
    id: "gis-topo-contours-label",
    type: "symbol",
    filter: [
      "in",
      ["downcase", ["to-string", ["get", "layer"]]],
      ["literal", ["contour", "contours", "contour line", "contour lines"]],
    ],
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
      "text-color": "#d7bf32",
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

const addOrUpdateGeoJsonLayers = (map, layers, visible, opacity) => {
  layers.forEach((layer) => {
    if (!map.getLayer(layer.id)) {
      const definition = {
        id: layer.id,
        type: layer.type,
        source: TOPO_SOURCE,
        filter: layer.filter,
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

  const [spotLevelVisible, setSpotLevelVisible] = useState(false);
  const [spotLevelOpacity, setSpotLevelOpacity] = useState(100);
  const [contoursVisible, setContoursVisible] = useState(false);
  const [contoursOpacity, setContoursOpacity] = useState(100);

  const [dsmVisible, setDsmVisible] = useState(false);
  const [dsmOpacity, setDsmOpacity] = useState(85);
  const [dtmVisible, setDtmVisible] = useState(false);
  const [dtmOpacity, setDtmOpacity] = useState(85);

  const topoVisible = !!layerVisibility.topography;
  const topoOpacity = layerVisibility.topographyOpacity ?? 80;
  const [topoLoading, setTopoLoading] = useState(false);
  const topoDataRef = useRef(null);

  const setTopoVisible = (value) => {
    setLayerVisibility?.((previous) => ({ ...previous, topography: value }));
  };

  const setTopoOpacity = (value) => {
    setLayerVisibility?.((previous) => ({
      ...previous,
      topographyOpacity: value,
    }));
  };

  const flyToChaharbagh = () => {
    map?.fitBounds?.(CB_BOUNDS, { padding: 50, duration: 1500 });
  };

  useEffect(() => {
    if (selectedProjectId) return;
    setSpotLevelVisible(false);
    setContoursVisible(false);
    setTopoVisible(false);
    setDsmVisible(false);
    setDtmVisible(false);
  }, [selectedProjectId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!map) return;
    const anyGeoJsonLayerVisible =
      spotLevelVisible || contoursVisible || topoVisible;

    const renderLayers = (geojson) => {
      if (!map.getSource(TOPO_SOURCE)) {
        map.addSource(TOPO_SOURCE, { type: "geojson", data: geojson });
      } else {
        map.getSource(TOPO_SOURCE).setData(geojson);
      }

      addOrUpdateGeoJsonLayers(
        map,
        SPOT_LEVEL_LAYERS,
        spotLevelVisible,
        spotLevelOpacity,
      );
      addOrUpdateGeoJsonLayers(
        map,
        CONTOUR_LAYERS,
        contoursVisible,
        contoursOpacity,
      );
      addOrUpdateGeoJsonLayers(
        map,
        TOPOGRAPHIC_BOUNDARY_LAYERS,
        topoVisible,
        topoOpacity,
      );

      if (anyGeoJsonLayerVisible) flyToChaharbagh();
    };

    if (topoDataRef.current) {
      renderLayers(topoDataRef.current);
      return;
    }

    if (!anyGeoJsonLayerVisible) return;

    setTopoLoading(true);
    fetch("/Topogeojson_backup/Topography.geojson")
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((geojson) => {
        topoDataRef.current = geojson;
        renderLayers(geojson);
      })
      .catch((error) => console.error("Topo GeoJSON load error:", error))
      .finally(() => setTopoLoading(false));
  }, [
    map,
    spotLevelVisible,
    contoursVisible,
    topoVisible,
    spotLevelOpacity,
    contoursOpacity,
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
          flyToChaharbagh();
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
            checked={spotLevelVisible}
            disabled={!selectedProjectId}
            opacity={spotLevelOpacity}
            loading={topoLoading && spotLevelVisible}
            onChange={setSpotLevelVisible}
            onOpacityChange={setSpotLevelOpacity}
          />

          <LayerRow
            label="Contours"
            checked={contoursVisible}
            disabled={!selectedProjectId}
            opacity={contoursOpacity}
            loading={topoLoading && contoursVisible}
            onChange={setContoursVisible}
            onOpacityChange={setContoursOpacity}
          />

          <LayerRow
            label="Topographic Boundary"
            checked={topoVisible}
            disabled={!selectedProjectId}
            opacity={topoOpacity}
            loading={topoLoading && topoVisible}
            onChange={setTopoVisible}
            onOpacityChange={setTopoOpacity}
          />

          <LayerRow
            label="DSM"
            checked={dsmVisible}
            disabled={!selectedProjectId}
            opacity={dsmOpacity}
            onChange={setDsmVisible}
            onOpacityChange={setDsmOpacity}
          />

          <LayerRow
            label="DTM"
            checked={dtmVisible}
            disabled={!selectedProjectId}
            opacity={dtmOpacity}
            onChange={setDtmVisible}
            onOpacityChange={setDtmOpacity}
          />
        </div>
      )}
    </div>
  );
}

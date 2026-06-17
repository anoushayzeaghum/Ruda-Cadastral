import { SOURCES, LAYERS, ensureSource } from "./MetaverseLayerConfig";

export function addGeodeticNetworkLayer(map, data) {
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

  if (!map.getLayer(LAYERS.geodeticNetworkLabel)) {
    map.addLayer({
      id: LAYERS.geodeticNetworkLabel,
      type: "symbol",
      source: SOURCES.geodeticNetwork,
      minzoom: 15,
      layout: {
        "text-field": [
          "coalesce",
          ["to-string", ["get", "name"]],
          ["to-string", ["get", "Name"]],
          "",
        ],
        "text-size": 10,
        "text-offset": [0, 1.2],
        "text-anchor": "top",
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": "#064e3b",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.2,
      },
    });
  }
}

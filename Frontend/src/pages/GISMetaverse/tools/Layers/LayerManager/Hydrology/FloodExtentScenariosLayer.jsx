const createScenarioDefinition = (cusic, color) => ({
  key: `floodInundation${cusic}`,
  label: `Flood Inundation ${Number(cusic).toLocaleString("en-US")} cusic`,
  cusic,
  sourceId: `flood-inundation-${cusic}-source`,
  layerId: `flood-inundation-${cusic}-fill`,
  color,
  fillOpacity: 0.45,
});

export const FLOOD_SCENARIO_LAYERS = Object.freeze({
  50000: createScenarioDefinition(50000, "#38bdf8"),
  326000: createScenarioDefinition(326000, "#2563eb"),
  450000: createScenarioDefinition(450000, "#7c3aed"),
  500000: createScenarioDefinition(500000, "#dc2626"),
});

const getScenarioDefinition = (cusic) => FLOOD_SCENARIO_LAYERS[Number(cusic)];

export const addOrUpdateFloodScenarioLayer = (
  map,
  geojson,
  cusic,
  color,
) => {
  if (!map || !geojson) return;

  const scenario = getScenarioDefinition(cusic);
  if (!scenario) return;

  const layerColor = color || scenario.color;
  const existingSource = map.getSource(scenario.sourceId);

  if (existingSource) {
    existingSource.setData(geojson);
  } else {
    map.addSource(scenario.sourceId, {
      type: "geojson",
      data: geojson,
    });
  }

  if (!map.getLayer(scenario.layerId)) {
    map.addLayer({
      id: scenario.layerId,
      type: "fill",
      source: scenario.sourceId,
      layout: {
        visibility: "visible",
      },
      paint: {
        "fill-color": layerColor,
        "fill-opacity": scenario.fillOpacity,
        "fill-outline-color": layerColor,
      },
    });
  } else {
    map.setPaintProperty(scenario.layerId, "fill-color", layerColor);
    map.setPaintProperty(scenario.layerId, "fill-opacity", scenario.fillOpacity);
    map.setPaintProperty(scenario.layerId, "fill-outline-color", layerColor);
    map.setLayoutProperty(scenario.layerId, "visibility", "visible");
  }
};

export const setFloodScenarioLayerVisibility = (map, cusic, visible) => {
  if (!map) return;

  const scenario = getScenarioDefinition(cusic);
  if (!scenario || !map.getLayer(scenario.layerId)) return;

  map.setLayoutProperty(
    scenario.layerId,
    "visibility",
    visible ? "visible" : "none",
  );
};

export const updateFloodScenarioLayerColor = (map, cusic, color) => {
  if (!map || !color) return;

  const scenario = getScenarioDefinition(cusic);
  if (!scenario || !map.getLayer(scenario.layerId)) return;

  map.setPaintProperty(scenario.layerId, "fill-color", color);
  map.setPaintProperty(scenario.layerId, "fill-outline-color", color);
};

export default FLOOD_SCENARIO_LAYERS;

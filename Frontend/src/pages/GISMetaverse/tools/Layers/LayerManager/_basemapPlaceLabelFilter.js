/**
 * Mapbox Streets includes its own locality/settlement names.  If the RUDA
 * Mauza layer is also enabled, those names can coexist with our Mauza labels
 * and look duplicated. Exclude ONLY matching Mauza names from the native
 * basemap place-label layers, leaving road/POI labels and other place names.
 * The original Mapbox filters are restored when Mauza is turned off.
 */
const basemapStates = new WeakMap();
const NATIVE_PLACE_LABEL_ID = /(?:settlement|neighbou?rhood|locality|place|suburb).*label/i;
const APP_LAYER_ID = /^(?:gism-|gis-|metaverse-|ruda-)/i;

function stateFor(map) {
  let state = basemapStates.get(map);
  if (!state) {
    state = { owners: new Map(), originals: new Map(), appliedNamesKey: "" };
    basemapStates.set(map, state);
  }
  return state;
}

function isPlaceNameLayer(layer) {
  return layer.type === "symbol" &&
    !APP_LAYER_ID.test(layer.id) &&
    NATIVE_PLACE_LABEL_ID.test(layer.id) &&
    !!layer.layout?.["text-field"];
}

export function resetBasemapMauzaPlaceFiltersOnStyleLoad(map) {
  const state = stateFor(map);
  // The style is new; saved filters describe the discarded basemap.
  state.originals.clear();
  state.appliedNamesKey = "";
}

/** Keep all active layer groups' name sets: turning one group off must not
 * restore native place names while a second RUDA Mauza layer is still on. */
export function setBasemapMauzaPlaceFilter(map, owner, names) {
  if (!map) return;
  const state = stateFor(map);
  const normalized = [...new Set((names || [])
    .map((name) => String(name || "").trim().replace(/\s+/g, " ").toLowerCase())
    .filter(Boolean))];
  if (normalized.length) state.owners.set(owner, normalized);
  else state.owners.delete(owner);
  updateBasemapMauzaPlaceFilters(map);
}

export function updateBasemapMauzaPlaceFilters(map) {
  if (!map?.getStyle) return;
  const state = stateFor(map);
  const names = [...new Set([...state.owners.values()].flat())].sort();
  const signature = names.join("\u0001");
  if (signature === state.appliedNamesKey) return;

  // Restore previous label filters, for example if the Mauza selection changed.
  for (const [id, original] of state.originals) {
    if (!map.getLayer?.(id)) continue;
    try { map.setFilter(id, original); } catch (_) {}
  }
  state.originals.clear();
  state.appliedNamesKey = signature;
  if (!names.length) return;

  const excludeMatchingNames = [
    "!",
    ["in",
      ["downcase", ["to-string", ["coalesce",
        ["get", "name_en"], ["get", "name:en"], ["get", "name"], "",
      ]]],
      ["literal", names],
    ],
  ];

  for (const layer of map.getStyle()?.layers || []) {
    if (!isPlaceNameLayer(layer)) continue;
    try {
      const original = map.getFilter(layer.id);
      map.setFilter(layer.id, original
        ? ["all", original, excludeMatchingNames]
        : excludeMatchingNames);
      state.originals.set(layer.id, original || null);
    } catch (error) {
      // Some third-party basemaps use legacy filter syntax. Do not break them.
      console.warn(`Could not filter native place names in ${layer.id}:`, error);
    }
  }
}

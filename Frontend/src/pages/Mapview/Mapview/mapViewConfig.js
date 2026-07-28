export const getSquareNumberFromProps = (props = {}, feature = null) =>
  props.sq ??
  props.SQ ??
  props.square ??
  props.square_no ??
  props.square_id ??
  props.s ??
  props.S ??
  feature?.id ??
  null;

export const getAcreNumberFromProps = (props = {}, feature = null) =>
  props.acre ??
  props.acre_no ??
  props.ac ??
  props.AC ??
  props.name ??
  props.gid ??
  feature?.id ??
  null;

export const getMauzaName = (selectedMauza) => {
  if (!selectedMauza) return "";
  return (
    selectedMauza?.mauza ??
    selectedMauza?.name ??
    selectedMauza?.Mauza ??
    selectedMauza?.moza ??
    selectedMauza?.mouza ??
    ""
  ).trim();
};

const ORTHO_TILE_NAME_BY_MAUZA = {
  "handu gujran": "Handu_Gujran_Ortho",
  "lakho dair": "Lakho_Dair_Ortho",
};

export const getOrthoTileUrlFromMauza = (selectedMauza) => {
  const normalizedName = getMauzaName(selectedMauza).toLowerCase();
  const tileName = ORTHO_TILE_NAME_BY_MAUZA[normalizedName] || "";
  return tileName
    ? `https://rudametaverse.nespakprogresscenter.com/tiles/data/${tileName}/{z}/{x}/{y}.png`
    : "";
};

export const getOrthoBoundsFromMauzaName = (
  mauzaName = "",
  handuGujranBounds,
) => {
  const normalized = String(mauzaName || "")
    .trim()
    .toLowerCase();
  return normalized === "handu gujran" ? handuGujranBounds : null;
};

export const THEMATIC_LAND_LAYERS = {
  possessionLand: {
    source: "metaverse-possession-land-source",
    fill: "metaverse-possession-land-fill",
    line: "metaverse-possession-land-line",
    label: "metaverse-possession-land-label",
  },
  awardedLand: {
    source: "metaverse-awarded-land-source",
    fill: "metaverse-awarded-land-fill",
    line: "metaverse-awarded-land-line",
    label: "metaverse-awarded-land-label",
  },
  stateLand: {
    source: "metaverse-state-land-source",
    fill: "metaverse-state-land-fill",
    line: "metaverse-state-land-line",
    label: "metaverse-state-land-label",
  },
};

export const KHASRA_ONLY_LABEL = [
  "case",
  [
    "all",
    ["has", "khasra"],
    ["!=", ["get", "khasra"], null],
    ["!=", ["to-string", ["get", "khasra"]], ""],
  ],
  ["to-string", ["get", "khasra"]],
  "",
];

export const PROPOSED_ROADS_SOURCE = "metaverse-proposed-roads-source";
export const PROPOSED_ROADS_FILL = "metaverse-proposed-roads-fill";
export const PROPOSED_ROADS_LINE = "metaverse-proposed-roads-line";

const getEntityId = (item) => item?.id ?? item?.gid ?? item?.oid ?? item;

export const buildSelectionKey = (items) => {
  const safeItems = Array.isArray(items) ? items : items ? [items] : [];
  return safeItems
    .map(getEntityId)
    .filter((value) => value !== undefined && value !== null && value !== "")
    .map(String)
    .sort()
    .join(",");
};

export const createGeoJSONRequestCache = () => {
  const values = new Map();
  const pending = new Map();

  return {
    get(key) {
      return values.get(key);
    },
    has(key) {
      return values.has(key);
    },
    set(key, value) {
      values.set(key, value);
      return value;
    },
    delete(key) {
      values.delete(key);
      pending.delete(key);
    },
    clear() {
      values.clear();
      pending.clear();
    },
    async getOrLoad(key, loader) {
      if (values.has(key)) return values.get(key);
      if (pending.has(key)) return pending.get(key);

      const request = Promise.resolve()
        .then(loader)
        .then((value) => {
          values.set(key, value);
          return value;
        })
        .finally(() => pending.delete(key));

      pending.set(key, request);
      return request;
    },
  };
};

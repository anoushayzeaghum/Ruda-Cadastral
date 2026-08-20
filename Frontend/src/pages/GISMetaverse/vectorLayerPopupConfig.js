import { LAYERS } from "./tools/Layers/LayerManager/MetaverseLayerConfig";

// ─── Admin boundary layer IDs (defined in AdministrativeLayers/*) ─────────────
export const DISTRICT_BOUNDARY_IDS = {
  fill: "metaverse-admin-district-fill",
  line: "metaverse-admin-district-line",
};

export const TEHSIL_BOUNDARY_IDS = {
  fill: "metaverse-admin-tehsil-fill",
  line: "metaverse-admin-tehsil-line",
};

export const NOTIFIED_PHASES_IDS = {
  fill: "metaverse-admin-notified-phases-fill",
  line: "metaverse-admin-notified-phases-line",
};

export const RUDA_NOTIFIED_IDS = {
  fill: "metaverse-admin-ruda-notified-fill",
  casing: "metaverse-admin-ruda-notified-casing",
  line: "metaverse-admin-ruda-notified-line",
};

export const RUDA_PLANNING_IDS = {
  fill: "metaverse-admin-ruda-phases-fill",
  line: "metaverse-admin-ruda-phases-line",
};

// ─── Existing re-exported constants (unchanged) ──────────────────────────────
const ADMIN_LOCATION_FIELDS = [
  { keys: ["district", "District"], label: "District" },
  { keys: ["tehsil", "Tehsil"], label: "Tehsil" },
  {
    keys: ["mauza", "Mauza", "Mouza", "mouza", "moza", "Moza"],
    label: "Mauza",
  },
];

export const PLOT_POPUP_FIELDS = [
  { key: "plot_no", label: "Plot No" },
  { key: "name", label: "Name" },
  { key: "type", label: "Type" },
  { key: "block", label: "Block" },
  { key: "plot_area", label: "Plot Area" },
  { key: "dimension", label: "Dimension" },
  { key: "parkfront", label: "Park Front" },
  { key: "rd_ft", label: "Road Front" },
  { key: "storey", label: "Storey" },
  { key: "rd_facing", label: "Road Facing" },
  { key: "h", label: "Height (ft)" },
  { key: "demar", label: "Demarcation" },
  { key: "possession", label: "Possession" },
  { key: "poss_st", label: "Possession Status" },
  { key: "canceled", label: "Status" },
  { key: "site_plan", label: "Site Plan" },
  { key: "tr_own", label: "Owner" },
  { key: "tr_cate", label: "Category" },
  { key: "tr_p_no", label: "Transfer Plot No" },
  { key: "remarks", label: "Remarks" },
];

export const TOPO_LAYER_IDS = {
  fill: "gis-topo-cb1-fill",
  line: "gis-topo-cb1-line",
};

export const LAND_REVENUE_LAYER_IDS = {
  moza: { fill: "gism-lrr-moza-fill", line: "gism-lrr-moza-line" },
  square: { fill: "gism-lrr-square-fill", line: "gism-lrr-square-line" },
  khasra: { fill: "gism-lrr-khasra-fill", line: "gism-lrr-khasra-line" },
};

export const MISCELLANEOUS_LAYER_IDS = {
  trijunction: "gism-misc-tri-cir",
  fieldPoints: "gism-misc-fp-cir",
};

export const PRIVATE_HOUSING_SCHEMES_LAYER_IDS = {
  fill: "gism-private-housing-schemes-fill",
  line: "gism-private-housing-schemes-line",
  point: "gism-private-housing-schemes-point",
};

// ─── Enhanced title fallback key order ───────────────────────────────────────
// PlotPopup resolveTitle will use group.titleKeys first, then these as a
// universal fallback so any layer has a meaningful title without extra config.
export const UNIVERSAL_TITLE_FALLBACK_KEYS = [
  "name",
  "Name",
  "plot_no",
  "plot_number",
  "block",
  "phase",
  "brief_name",
  "project",
  "road_name",
  "road",
  "camera",
  "code",
  "mauza",
  "district",
  "tehsil",
  "type",
];

/** Popup field/group definitions consumed by PlotPopup.jsx */
export const VECTOR_POPUP_GROUPS = [
  // ── Master Plan ─────────────────────────────────────────────────────────────
  {
    id: "masterPlan",
    label: "Master Plan",
    layerIds: [LAYERS.masterPlanFill, LAYERS.masterPlanLine],
    titlePrefix: "Plot No",
    titleKeys: ["plot_no", "name"],
    fields: PLOT_POPUP_FIELDS,
    highlightLayerId: LAYERS.masterPlanHover,
    highlightFilterKey: "gid",
  },
  // ── Project Boundary ────────────────────────────────────────────────────────
  {
    id: "projectBoundary",
    label: "Project Boundary",
    layerIds: [LAYERS.boundaryFill, LAYERS.boundaryLine],
    titleKeys: ["brief_name", "name"],
    fields: [
      { keys: ["brief_name"], label: "Brief Name" },
      { keys: ["name"], label: "Project Name" },
      { keys: ["type"], label: "Type" },
    ],
  },
  // ── Block ────────────────────────────────────────────────────────────────────
  {
    id: "block",
    label: "Block",
    layerIds: [LAYERS.blockFill, LAYERS.blockLine],
    titlePrefix: "Block",
    titleKeys: ["block", "name"],
    fields: [
      { keys: ["block"], label: "Block No" },
      { keys: ["name"], label: "Name" },
      { key: "area", label: "Area (Acres)" },
    ],
  },
  // ── Spot Level ───────────────────────────────────────────────────────────────
  {
    id: "spotLevel",
    label: "Spot Level",
    layerIds: [LAYERS.spotLevelCircle],
    titlePrefix: "Spot Level",
    titleKeys: ["name"],
    fields: [
      { keys: ["name"], label: "Name" },
      { keys: ["elevation", "level"], label: "Elevation (m)" },
    ],
  },
  // ── Contours ─────────────────────────────────────────────────────────────────
  {
    id: "contours",
    label: "Contour",
    layerIds: [LAYERS.contoursLine],
    titlePrefix: "Contour",
    titleKeys: ["elevation", "ELEVATION", "Elevation"],
    fields: [
      { keys: ["elevation", "ELEVATION", "Elevation"], label: "Elevation (m)" },
    ],
  },
  // ── Roads ────────────────────────────────────────────────────────────────────
  {
    id: "roads",
    label: "Road",
    layerIds: [LAYERS.roadsFill, LAYERS.roadsLine],
    titleKeys: ["name", "type", "block"],
    fields: [
      { keys: ["name"], label: "Name" },
      { keys: ["type", "Type"], label: "Road Type" },
      { keys: ["block"], label: "Block" },
      { keys: ["dimension"], label: "Dimension" },
      { keys: ["row", "ROW"], label: "ROW" },
    ],
  },
  // ── Water Supply Points ──────────────────────────────────────────────────────
  {
    id: "waterSupplyPoints",
    label: "Water Supply Point",
    layerIds: [LAYERS.waterSupplyPointsCircle],
    titleKeys: ["name", "Name", "type"],
    fields: [
      { keys: ["name", "Name"], label: "Name" },
      { keys: ["type", "Type"], label: "Type" },
    ],
  },
  // ── Water Supply Lines ───────────────────────────────────────────────────────
  {
    id: "waterSupplyLines",
    label: "Water Supply Line",
    layerIds: [LAYERS.waterSupplyLinesLine],
    titleKeys: ["name", "dia", "DIA"],
    fields: [
      { keys: ["name"], label: "Name" },
      { keys: ["dia", "DIA", "Dia"], label: "Diameter (in)" },
      { keys: ["type", "Type"], label: "Type" },
      { keys: ["shape_leng"], label: "Length (ft)" },
    ],
  },
  // ── Sewage Points ────────────────────────────────────────────────────────────
  {
    id: "sewagePoints",
    label: "Sewage Point",
    layerIds: [LAYERS.sewagePointsCircle],
    titleKeys: ["name", "type", "Type"],
    fields: [
      { keys: ["name", "Name"], label: "Name" },
      { keys: ["type", "Type"], label: "Type" },
    ],
  },
  // ── Camera Locations ─────────────────────────────────────────────────────────
  {
    id: "cameraLocations",
    label: "Camera Location",
    layerIds: [LAYERS.cameraLocationsCircle],
    titleKeys: ["camera", "name"],
    fields: [
      { keys: ["camera"], label: "Camera" },
      { keys: ["project"], label: "Project" },
      { keys: ["coordinate"], label: "Coordinate" },
      { key: "x", label: "X" },
      { key: "y", label: "Y" },
      { key: "sr_no", label: "Serial No" },
    ],
  },
  // ── RUDA Boundary (incl. dash-line variant) ──────────────────────────────────
  {
    id: "rudaBoundary",
    label: "RUDA Boundary",
    layerIds: [
      LAYERS.rudaBoundaryFill,
      LAYERS.rudaBoundaryLine,
      LAYERS.rudaBoundaryDashLine,
    ],
    titleKeys: ["_ruda_phase_label", "name", "phase"],
    fields: [
      { keys: ["_ruda_phase_label", "phase", "phase_name"], label: "Phase" },
      { keys: ["name"], label: "Name" },
    ],
  },
  // ── RUDA Mauza Boundary ──────────────────────────────────────────────────────
  {
    id: "rudaMauzaBoundary",
    label: "RUDA Mauza",
    layerIds: [LAYERS.rudaMauzaBoundaryFill, LAYERS.rudaMauzaBoundaryLine],
    titleKeys: ["Mouza", "mouza", "name", "Mauza"],
    fields: [
      ...ADMIN_LOCATION_FIELDS,
      { keys: ["Mouza", "mouza", "Mauza", "mauza"], label: "Mauza Name" },
    ],
  },
  // ── Geodetic Network ─────────────────────────────────────────────────────────
  {
    id: "geodeticNetwork",
    label: "Geodetic Point",
    layerIds: [LAYERS.geodeticNetworkCircle],
    titleKeys: ["name", "code"],
    fields: [
      { keys: ["name"], label: "Name" },
      { keys: ["code"], label: "Code" },
      { key: "easting_m", label: "Easting (m)" },
      { key: "northing_m", label: "Northing (m)" },
      { key: "elevation", label: "Elevation (m)" },
    ],
  },
  // ── Proposed Roads ───────────────────────────────────────────────────────────
  {
    id: "proposedRoads",
    label: "Proposed Road",
    layerIds: [LAYERS.proposedRoadsLine],
    titleKeys: ["name", "layer", "refname"],
    fields: [
      { keys: ["name"], label: "Name" },
      { keys: ["layer"], label: "Layer" },
      { keys: ["refname"], label: "Reference" },
      { keys: ["entity"], label: "Entity" },
      { keys: ["linetype"], label: "Line Type" },
      { keys: ["color"], label: "Color" },
      { key: "elevation", label: "Elevation (m)" },
      { keys: ["kml_desc"], label: "Description", stripHtml: true },
    ],
  },
  // ── Notified Boundary ────────────────────────────────────────────────────────
  {
    id: "notifiedBoundary",
    label: "Notified Boundary",
    layerIds: [LAYERS.notifiedBoundaryLine],
    titleKeys: ["brief_name", "name"],
    fields: [
      { keys: ["brief_name"], label: "Brief Name" },
      { keys: ["name"], label: "Project Name" },
      { keys: ["type"], label: "Type" },
    ],
  },
  // ── Topo Boundary ────────────────────────────────────────────────────────────
  {
    id: "topoBoundary",
    label: "Topo Boundary",
    layerIds: [TOPO_LAYER_IDS.fill, TOPO_LAYER_IDS.line],
    titleKeys: ["name", "Name", "layer", "Layer"],
    fields: [
      { keys: ["name", "Name"], label: "Name" },
      { keys: ["layer", "Layer"], label: "Layer" },
      { keys: ["description", "Description"], label: "Description" },
    ],
  },
  // ── Land Revenue – Mauza ─────────────────────────────────────────────────────
  {
    id: "lrrMauza",
    label: "Mauza Boundary",
    layerIds: [
      LAND_REVENUE_LAYER_IDS.moza.fill,
      LAND_REVENUE_LAYER_IDS.moza.line,
    ],
    titleKeys: ["mauza", "Mauza", "moza", "name"],
    fields: [
      ...ADMIN_LOCATION_FIELDS,
      { keys: ["kc"], label: "Kanungo Circle" },
      { keys: ["pc"], label: "Patwar Circle" },
    ],
  },
  // ── Land Revenue – Square ────────────────────────────────────────────────────
  {
    id: "lrrSquare",
    label: "Square",
    layerIds: [
      LAND_REVENUE_LAYER_IDS.square.fill,
      LAND_REVENUE_LAYER_IDS.square.line,
    ],
    titlePrefix: "Square",
    titleKeys: ["sq", "SQ", "square", "Square"],
    fields: [
      ...ADMIN_LOCATION_FIELDS,
      { keys: ["sq", "SQ", "square", "Square"], label: "Square No" },
      { keys: ["layer", "Layer"], label: "Layer" },
    ],
  },
  // ── Land Revenue – Khasra ────────────────────────────────────────────────────
  {
    id: "lrrKhasra",
    label: "Khasra",
    layerIds: [
      LAND_REVENUE_LAYER_IDS.khasra.fill,
      LAND_REVENUE_LAYER_IDS.khasra.line,
    ],
    titlePrefix: "Khasra",
    titleKeys: ["kh", "KH", "khasra_id", "join_shp"],
    fields: [
      ...ADMIN_LOCATION_FIELDS,
      { keys: ["kh", "KH", "khasra_id"], label: "Khasra No" },
      { keys: ["khatoni_no"], label: "Khatoni No" },
      { keys: ["sq"], label: "Square" },
      { keys: ["type"], label: "Type" },
      { keys: ["dc_rate"], label: "DC Rate" },
      { keys: ["remarks"], label: "Remarks" },
    ],
  },
  // ── Trijunction ──────────────────────────────────────────────────────────────
  {
    id: "trijunction",
    label: "Trijunction Point",
    layerIds: [MISCELLANEOUS_LAYER_IDS.trijunction],
    titleKeys: ["name", "code", "gm_type", "type"],
    fields: [
      { keys: ["name"], label: "Name" },
      { keys: ["gm_type", "type", "TYPE"], label: "Type" },
      { keys: ["code"], label: "Code" },
      { key: "elevation", label: "Elevation (m)" },
      { key: "x", label: "X" },
      { key: "y", label: "Y" },
      { keys: ["layer"], label: "Layer" },
    ],
  },
  // ── Field Points ─────────────────────────────────────────────────────────────
  {
    id: "fieldPoints",
    label: "Field Point",
    layerIds: [MISCELLANEOUS_LAYER_IDS.fieldPoints],
    titleKeys: ["name", "code"],
    fields: [
      { keys: ["name"], label: "Name" },
      { keys: ["gm_type", "type"], label: "Type" },
      { keys: ["code"], label: "Code" },
      { key: "elevation", label: "Elevation (m)" },
      { keys: ["layer"], label: "Layer" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // NEW GROUPS – layers that previously had no popup support
  // ══════════════════════════════════════════════════════════════════════════

  // ── RTW Package ──────────────────────────────────────────────────────────────
  {
    id: "rtwPackage",
    label: "RTW Package",
    layerIds: [LAYERS.rtwPackageFill, LAYERS.rtwPackageLine],
    titleKeys: ["__rtwPackageCategory", "package", "name", "ruda_phase", "phase"],
    fields: [
      { keys: ["__rtwPackageCategory", "package", "package_name"], label: "Package" },
      { keys: ["name"], label: "Name" },
      { keys: ["ruda_phase", "phase"], label: "Phase" },
      { keys: ["type", "Type"], label: "Type" },
      { keys: ["remarks", "description"], label: "Remarks" },
    ],
  },
  // ── RTW Alignment ────────────────────────────────────────────────────────────
  {
    id: "rtwAlignment",
    label: "RTW Alignment",
    layerIds: [LAYERS.rtwAlignmentFill, LAYERS.rtwAlignmentLine],
    titleKeys: ["name", "package", "ruda_phase", "phase", "type"],
    fields: [
      { keys: ["name"], label: "Name" },
      { keys: ["package", "package_name"], label: "Package" },
      { keys: ["ruda_phase", "phase"], label: "Phase" },
      { keys: ["type", "Type"], label: "Type" },
      { keys: ["remarks", "description"], label: "Remarks" },
    ],
  },
  // ── State Land ───────────────────────────────────────────────────────────────
  {
    id: "stateLand",
    label: "State Land",
    layerIds: [LAYERS.stateLandFill, LAYERS.stateLandLine],
    titleKeys: ["name", "Name", "type", "category", "land_type"],
    fields: [
      { keys: ["name", "Name"], label: "Name" },
      { keys: ["type", "Type", "land_type", "category"], label: "Type" },
      { keys: ["area", "area_acres"], label: "Area (Acres)" },
      { keys: ["district", "District"], label: "District" },
      { keys: ["tehsil", "Tehsil"], label: "Tehsil" },
      { keys: ["remarks", "description"], label: "Remarks" },
    ],
  },
  // ── Awarded Land ─────────────────────────────────────────────────────────────
  {
    id: "awardedLand",
    label: "Awarded Land",
    layerIds: [LAYERS.awardedLandFill, LAYERS.awardedLandLine],
    titleKeys: ["name", "Name", "award_no", "type", "category"],
    fields: [
      { keys: ["name", "Name"], label: "Name" },
      { keys: ["award_no", "award_number"], label: "Award No" },
      { keys: ["type", "Type", "category"], label: "Type" },
      { keys: ["area", "area_acres"], label: "Area (Acres)" },
      { keys: ["owner", "owner_name"], label: "Owner" },
      { keys: ["district", "District"], label: "District" },
      { keys: ["tehsil", "Tehsil"], label: "Tehsil" },
      { keys: ["remarks", "description"], label: "Remarks" },
    ],
  },
  // ── Possession Land ──────────────────────────────────────────────────────────
  {
    id: "possessionLand",
    label: "Possession Land",
    layerIds: [LAYERS.possessionLandFill, LAYERS.possessionLandLine],
    titleKeys: ["name", "Name", "possession_no", "type", "category"],
    fields: [
      { keys: ["name", "Name"], label: "Name" },
      { keys: ["possession_no", "poss_no"], label: "Possession No" },
      { keys: ["type", "Type", "category"], label: "Type" },
      { keys: ["area", "area_acres"], label: "Area (Acres)" },
      { keys: ["owner", "owner_name"], label: "Owner" },
      { keys: ["district", "District"], label: "District" },
      { keys: ["tehsil", "Tehsil"], label: "Tehsil" },
      { keys: ["remarks", "description"], label: "Remarks" },
    ],
  },
  // ── District Boundary ────────────────────────────────────────────────────────
  {
    id: "districtBoundary",
    label: "District Boundary",
    layerIds: [DISTRICT_BOUNDARY_IDS.fill, DISTRICT_BOUNDARY_IDS.line],
    titleKeys: ["district_name", "district", "dist_name", "name", "Name"],
    fields: [
      { keys: ["district_name", "district", "dist_name", "name", "Name"], label: "District" },
    ],
  },
  // ── Tehsil Boundary ──────────────────────────────────────────────────────────
  {
    id: "tehsilBoundary",
    label: "Tehsil Boundary",
    layerIds: [TEHSIL_BOUNDARY_IDS.fill, TEHSIL_BOUNDARY_IDS.line],
    titleKeys: ["tehsil_name", "tehsil", "teh_name", "name", "Name"],
    fields: [
      { keys: ["tehsil_name", "tehsil", "teh_name", "name", "Name"], label: "Tehsil" },
      { keys: ["district_name", "district"], label: "District" },
    ],
  },
  // ── Notified Phases Boundary ─────────────────────────────────────────────────
  {
    id: "notifiedPhasesBoundary",
    label: "Notified Phases Boundary",
    layerIds: [NOTIFIED_PHASES_IDS.fill, NOTIFIED_PHASES_IDS.line],
    titleKeys: ["phases_new", "phases", "phase_name", "phase", "name"],
    fields: [
      { keys: ["phases_new", "phases", "phase_name", "phase"], label: "Phase" },
      { keys: ["name"], label: "Name" },
      { keys: ["area", "shape_area"], label: "Area" },
      { keys: ["remarks", "description"], label: "Remarks" },
    ],
  },
  // ── RUDA Notified Boundary ────────────────────────────────────────────────────
  {
    id: "rudaNotifiedBoundary",
    label: "RUDA Notified Boundary",
    layerIds: [
      RUDA_NOTIFIED_IDS.fill,
      RUDA_NOTIFIED_IDS.casing,
      RUDA_NOTIFIED_IDS.line,
    ],
    titleKeys: ["name", "Name", "jurisdiction", "boundary_name", "title"],
    fields: [
      { keys: ["name", "Name", "jurisdiction", "boundary_name", "title"], label: "Name" },
      { keys: ["type", "Type"], label: "Type" },
      { keys: ["area", "shape_area"], label: "Area" },
      { keys: ["remarks", "description"], label: "Remarks" },
    ],
  },
  // ── RUDA Planning / Phases Boundary ──────────────────────────────────────────
  {
    id: "rudaPlanningBoundary",
    label: "RUDA Phases Boundary",
    layerIds: [RUDA_PLANNING_IDS.fill, RUDA_PLANNING_IDS.line],
    titleKeys: [
      "phase_name", "phase", "phase_no", "phase_no_",
      "name", "Name", "project_name", "project",
    ],
    fields: [
      {
        keys: [
          "phase_name", "phase", "phase_no", "phase_no_",
          "name", "Name", "project_name", "project", "title", "label",
        ],
        label: "Phase / Name",
      },
      { keys: ["type", "Type"], label: "Type" },
      { keys: ["area", "shape_area"], label: "Area" },
      { keys: ["remarks"], label: "Remarks" },
    ],
  },
  // ── Private Housing Schemes ──────────────────────────────────────────────────
  {
    id: "privateHousingSchemes",
    label: "Private Housing Scheme",
    layerIds: [
      PRIVATE_HOUSING_SCHEMES_LAYER_IDS.fill,
      PRIVATE_HOUSING_SCHEMES_LAYER_IDS.line,
      PRIVATE_HOUSING_SCHEMES_LAYER_IDS.point,
    ],
    titleKeys: [
      "scheme_nam",
      "scheme_name",
      "name",
      "Name",
      "ruda_scheme",
      "ruda_st",
    ],
    fields: [
      {
        keys: ["scheme_nam", "scheme_name", "Scheme_Name", "name", "Name"],
        label: "Scheme Name",
      },
      {
        keys: ["ruda_st", "ruda_scheme", "RUDA_ST", "RUDA_SCHEME"],
        label: "RUDA Status",
      },
      {
        keys: ["area_225a", "AREA_225A"],
        label: "Area (225 Acres)",
      },
      {
        keys: ["area", "Area", "AREA", "shape_area", "Shape_Area"],
        label: "Area",
      },
    ],
  },
];

// ─── Utilities (unchanged) ───────────────────────────────────────────────────
export function buildLayerPopupLookup(groups = VECTOR_POPUP_GROUPS) {
  const layerIdToGroup = new Map();

  groups.forEach((group) => {
    group.layerIds.forEach((layerId) => {
      layerIdToGroup.set(layerId, group);
    });
  });

  return layerIdToGroup;
}

export function getAllPopupLayerIds(groups = VECTOR_POPUP_GROUPS) {
  return groups.flatMap((group) => group.layerIds);
}
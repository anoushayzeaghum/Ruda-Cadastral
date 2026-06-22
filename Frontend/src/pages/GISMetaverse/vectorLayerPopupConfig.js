import { LAYERS } from "./LayerManager/MetaverseLayerConfig";

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
  { key: "h", label: "Height" },
  { key: "demar", label: "Demarcation" },
  { key: "possession", label: "Possession" },
  { key: "poss_st", label: "Possession Status" },
  { key: "canceled", label: "Status" },
  { key: "site_plan", label: "Site Plan" },
  { key: "tr_own", label: "Owner" },
  { key: "tr_cate", label: "Category" },
  { key: "tr_p_no", label: "Transfer Plot No" },
  { key: "remarks", label: "Remarks" },
  { key: "shape_leng", label: "Shape Length" },
  { key: "shape_area", label: "Shape Area" },
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

/** Popup field/group definitions consumed by PlotPopup.jsx */
export const VECTOR_POPUP_GROUPS = [
  {
    id: "masterPlan",
    label: "Master Plan",
    layerIds: [LAYERS.masterPlanFill, LAYERS.masterPlanLine],
    titlePrefix: "Plot No",
    titleKeys: ["plot_no", "gid", "name"],
    fields: PLOT_POPUP_FIELDS,
    highlightLayerId: LAYERS.masterPlanHover,
    highlightFilterKey: "gid",
  },
  {
    id: "projectBoundary",
    label: "Project Boundary",
    layerIds: [LAYERS.boundaryFill, LAYERS.boundaryLine],
    titleKeys: ["brief_name", "name"],
    fields: [
      { keys: ["brief_name"], label: "Brief Name" },
      { keys: ["name"], label: "Project Name" },
      { keys: ["type"], label: "Type" },
      { key: "gid", label: "ID" },
      { keys: ["shape_area"], label: "Area" },
      { keys: ["shape_leng"], label: "Perimeter" },
    ],
  },
  {
    id: "block",
    label: "Block",
    layerIds: [LAYERS.blockFill, LAYERS.blockLine],
    titlePrefix: "Block",
    titleKeys: ["block", "name", "gid"],
    fields: [
      { keys: ["block"], label: "Block No" },
      { keys: ["name"], label: "Name" },
      { key: "area", label: "Area" },
      { key: "project_id", label: "Project ID" },
      { key: "gid", label: "ID" },
    ],
  },
  {
    id: "spotLevel",
    label: "Spot Level",
    layerIds: [LAYERS.spotLevelCircle],
    titlePrefix: "Spot Level",
    titleKeys: ["gid", "name"],
    fields: [
      { key: "gid", label: "ID" },
      { keys: ["name"], label: "Name" },
      { keys: ["elevation", "level"], label: "Elevation" },
      { key: "project_id", label: "Project ID" },
      { key: "society_id", label: "Society ID" },
    ],
  },
  {
    id: "contours",
    label: "Contour",
    layerIds: [LAYERS.contoursLine],
    titlePrefix: "Contour",
    titleKeys: ["elevation", "ELEVATION", "Elevation", "gid"],
    fields: [
      { keys: ["elevation", "ELEVATION", "Elevation"], label: "Elevation" },
      { key: "gid", label: "ID" },
      { key: "project_id", label: "Project ID" },
    ],
  },
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
      { key: "project_id", label: "Project ID" },
      { key: "gid", label: "ID" },
    ],
  },
  {
    id: "waterSupplyPoints",
    label: "Water Supply Point",
    layerIds: [LAYERS.waterSupplyPointsCircle],
    titleKeys: ["name", "Name", "type"],
    fields: [
      { keys: ["name", "Name"], label: "Name" },
      { keys: ["type", "Type"], label: "Type" },
      { key: "project_id", label: "Project ID" },
      { key: "gid", label: "ID" },
    ],
  },
  {
    id: "waterSupplyLines",
    label: "Water Supply Line",
    layerIds: [LAYERS.waterSupplyLinesLine],
    titleKeys: ["name", "dia", "DIA"],
    fields: [
      { keys: ["name"], label: "Name" },
      { keys: ["dia", "DIA", "Dia"], label: "Diameter" },
      { keys: ["type", "Type"], label: "Type" },
      { keys: ["shape_leng"], label: "Length" },
      { key: "project_id", label: "Project ID" },
      { key: "gid", label: "ID" },
    ],
  },
  {
    id: "sewagePoints",
    label: "Sewage Point",
    layerIds: [LAYERS.sewagePointsCircle],
    titleKeys: ["name", "type", "Type"],
    fields: [
      { keys: ["name", "Name"], label: "Name" },
      { keys: ["type", "Type"], label: "Type" },
      { key: "project_id", label: "Project ID" },
      { key: "gid", label: "ID" },
    ],
  },
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
      { key: "project_id", label: "Project ID" },
      { key: "gid", label: "ID" },
    ],
  },
  {
    id: "rudaBoundary",
    label: "RUDA Boundary",
    layerIds: [LAYERS.rudaBoundaryFill, LAYERS.rudaBoundaryLine],
    titleKeys: ["_ruda_phase_label", "name", "phase"],
    fields: [
      { keys: ["_ruda_phase_label", "phase", "phase_name"], label: "Phase" },
      { keys: ["name"], label: "Name" },
      { keys: ["folderpath"], label: "Folder" },
      { keys: ["popupinfo"], label: "Info", stripHtml: true },
      { keys: ["snippet"], label: "Snippet", stripHtml: true },
      { keys: ["shape_area"], label: "Area" },
      { keys: ["shape_leng"], label: "Perimeter" },
      { key: "gid", label: "ID" },
    ],
  },
  {
    id: "rudaMauzaBoundary",
    label: "RUDA Mauza",
    layerIds: [LAYERS.rudaMauzaBoundaryFill, LAYERS.rudaMauzaBoundaryLine],
    titleKeys: ["Mouza", "mouza", "name", "Mauza"],
    fields: [
      ...ADMIN_LOCATION_FIELDS,
      { keys: ["Mouza", "mouza", "Mauza", "mauza"], label: "Mauza Name" },
      { key: "gid", label: "ID" },
    ],
  },
  {
    id: "geodeticNetwork",
    label: "Geodetic Point",
    layerIds: [LAYERS.geodeticNetworkCircle],
    titleKeys: ["name", "code", "gid"],
    fields: [
      { keys: ["name"], label: "Name" },
      { keys: ["code"], label: "Code" },
      { key: "easting_m", label: "Easting (m)" },
      { key: "northing_m", label: "Northing (m)" },
      { key: "elevation", label: "Elevation" },
      { key: "gid", label: "ID" },
    ],
  },
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
      { key: "elevation", label: "Elevation" },
      { keys: ["kml_desc"], label: "Description", stripHtml: true },
      { key: "gid", label: "ID" },
    ],
  },
  {
    id: "notifiedBoundary",
    label: "Notified Boundary",
    layerIds: [LAYERS.notifiedBoundaryLine],
    titleKeys: ["brief_name", "name"],
    fields: [
      { keys: ["brief_name"], label: "Brief Name" },
      { keys: ["name"], label: "Project Name" },
      { keys: ["type"], label: "Type" },
      { key: "gid", label: "ID" },
    ],
  },
  {
    id: "topoBoundary",
    label: "Topo Boundary",
    layerIds: [TOPO_LAYER_IDS.fill, TOPO_LAYER_IDS.line],
    titleKeys: ["name", "Name", "layer", "Layer"],
    fields: [
      { keys: ["name", "Name"], label: "Name" },
      { keys: ["layer", "Layer"], label: "Layer" },
      { keys: ["description", "Description"], label: "Description" },
      { key: "gid", label: "ID" },
      { key: "fid", label: "Feature ID" },
    ],
  },
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
      { keys: ["mauza_id"], label: "Mauza ID" },
      { keys: ["kc"], label: "Kanungo Circle" },
      { keys: ["pc"], label: "Patwar Circle" },
      { key: "gid", label: "ID" },
    ],
  },
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
      { key: "gid", label: "ID" },
    ],
  },
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
      { keys: ["khewat_id"], label: "Khewat ID" },
      { keys: ["sq"], label: "Square" },
      { keys: ["type"], label: "Type" },
      { keys: ["dc_rate"], label: "DC Rate" },
      { keys: ["remarks"], label: "Remarks" },
      { key: "gid", label: "ID" },
    ],
  },
  {
    id: "trijunction",
    label: "Trijunction Point",
    layerIds: [MISCELLANEOUS_LAYER_IDS.trijunction],
    titleKeys: ["name", "code", "gm_type", "type"],
    fields: [
      { keys: ["name"], label: "Name" },
      { keys: ["gm_type", "type", "TYPE"], label: "Type" },
      { keys: ["code"], label: "Code" },
      { key: "elevation", label: "Elevation" },
      { key: "x", label: "X" },
      { key: "y", label: "Y" },
      { keys: ["layer"], label: "Layer" },
      { key: "gid", label: "ID" },
    ],
  },
  {
    id: "fieldPoints",
    label: "Field Point",
    layerIds: [MISCELLANEOUS_LAYER_IDS.fieldPoints],
    titleKeys: ["name", "code", "gid"],
    fields: [
      { keys: ["name"], label: "Name" },
      { keys: ["gm_type", "type"], label: "Type" },
      { keys: ["code"], label: "Code" },
      { key: "elevation", label: "Elevation" },
      { keys: ["layer"], label: "Layer" },
      { key: "gid", label: "ID" },
    ],
  },
];

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

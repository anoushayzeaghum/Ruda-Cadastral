import AdminAttributeTableShell, {
  formatNumber,
} from "../../AdminAttributeTableShell";
import { readAreaSqft } from "../../areaUtils";

const getProps = (feature = {}) => feature.properties || feature || {};

const cell = (...values) => {
  for (const value of values) {
    if (value !== null && value !== undefined && value !== "") return value;
  }
  return "-";
};

const isNumericId = (value) => {
  if (typeof value === "number") return true;
  if (typeof value !== "string") return false;
  return /^\d+(\.\d+)?$/.test(value.trim());
};

const nameCell = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    if (isNumericId(value)) continue;
    return value;
  }
  return "-";
};

const rowsFromGeojson = (geojson, mapper) =>
  (geojson?.features || []).map((feature, index) => ({
    id: getProps(feature).gid || feature.id || index + 1,
    sr: index + 1,
    geometry: feature.geometry,
    ...mapper(feature, index),
  }));

export default function SquareBoundaryAttribute({ map, geojson, onClose }) {
  const rows = rowsFromGeojson(geojson, (feature) => {
    const props = getProps(feature);
    return {
      square_layer: cell(
        props.layer,
        props.sq,
        props.square_id,
        props.name,
        props.Name,
      ),
      mauza: nameCell(
        props.mauza_name,
        props.mauza,
        props.Mauza,
        props.moza,
        props.Moza,
        props.Mouza,
      ),
      district: nameCell(props.district_name, props.District, props.district),
      tehsil: nameCell(props.tehsil_name, props.Tehsil, props.tehsil),
      area_sqft: formatNumber(readAreaSqft(feature)),
    };
  });

  return (
    <AdminAttributeTableShell
      map={map}
      title="Square Boundary"
      placeholder="Search square boundary..."
      onClose={onClose}
      rows={rows}
      columns={[
        { key: "sr", label: "Sr No." },
        { key: "square_layer", label: "Square Layer" },
        { key: "mauza", label: "Mauza" },
        { key: "tehsil", label: "Tehsil" },
        { key: "area_sqft", label: "Area (sq ft)" },
      ]}
    />
  );
}


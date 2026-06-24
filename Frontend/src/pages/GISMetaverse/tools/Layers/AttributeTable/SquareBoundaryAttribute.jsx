import AdminAttributeTableShell, { formatNumber } from "./AdminAttributeTableShell";
import { readAreaSqft } from "./areaUtils";

const getProps = (feature = {}) => feature.properties || feature || {};

const cell = (...values) => {
  for (const value of values) {
    if (value !== null && value !== undefined && value !== "") return value;
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
      square_layer: cell(props.layer, props.sq, props.square_id, props.name, props.Name),
      mauza: cell(props.mauza, props.Mauza, props.moza, props.Moza),
      district: cell(props.district, props.District),
      tehsil: cell(props.tehsil, props.Tehsil),
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
        { key: "district", label: "District" },
        { key: "tehsil", label: "Tehsil" },
        { key: "area_sqft", label: "Area (sq ft)" },
      ]}
    />
  );
}

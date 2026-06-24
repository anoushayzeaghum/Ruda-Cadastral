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

export default function MauzaBoundaryAttribute({ map, geojson, onClose }) {
  const rows = rowsFromGeojson(geojson, (feature) => {
    const props = getProps(feature);
    return {
      mauza: cell(props.mauza, props.Mauza, props.moza, props.Moza, props.name, props.Name),
      district: cell(props.district, props.District),
      tehsil: cell(props.tehsil, props.Tehsil),
      area_sqft: formatNumber(readAreaSqft(feature)),
    };
  });

  return (
    <AdminAttributeTableShell
      map={map}
      title="Mauza Boundary"
      placeholder="Search mauza boundary..."
      onClose={onClose}
      rows={rows}
      columns={[
        { key: "sr", label: "Sr No." },
        { key: "mauza", label: "Mauza Name" },
        { key: "district", label: "District" },
        { key: "tehsil", label: "Tehsil" },
        { key: "area_sqft", label: "Area (sq ft)" },
      ]}
    />
  );
}

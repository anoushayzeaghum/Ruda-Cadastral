import AdminAttributeTableShell, { formatNumber } from "./AdminAttributeTableShell";
import { readAreaSqft } from "./areaUtils";

const propsOf = (feature = {}) => feature.properties || feature || {};
const value = (...items) => items.find((item) => item !== undefined && item !== null && item !== "") ?? "-";

export default function TehsilBoundaryAttribute({ map, geojson, onClose }) {
  const rows = (geojson?.features || []).map((feature, index) => {
    const props = propsOf(feature);
    return {
      id: props.gid || feature.id || index + 1,
      sr: index + 1,
      name: value(props.name, props.Name),
      district: value(props.district, props.District),
      tehsil_id: value(props.id, props.tehsil_id, props.gid),
      area_sqft: formatNumber(readAreaSqft(feature)),
      geometry: feature.geometry,
    };
  });

  return (
    <AdminAttributeTableShell
      map={map}
      title="Tehsil Boundary"
      placeholder="Search tehsil boundary..."
      rows={rows}
      onClose={onClose}
      columns={[
        { key: "sr", label: "Sr No." },
        { key: "name", label: "Tehsil" },
        { key: "district", label: "District" },
        { key: "tehsil_id", label: "ID" },
        { key: "area_sqft", label: "Area (sq ft)" },
      ]}
    />
  );
}

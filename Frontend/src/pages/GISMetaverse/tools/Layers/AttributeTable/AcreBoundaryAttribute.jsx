import AdminAttributeTableShell, { formatNumber } from "./AdminAttributeTableShell";
import { readAreaSqft } from "./areaUtils";

const propsOf = (feature = {}) => feature.properties || feature || {};
const value = (...items) => items.find((item) => item !== undefined && item !== null && item !== "") ?? "-";

export default function AcreBoundaryAttribute({ map, geojson, onClose }) {
  const rows = (geojson?.features || []).map((feature, index) => {
    const props = propsOf(feature);
    return {
      id: props.gid || feature.id || index + 1,
      sr: index + 1,
      acre: value(props.acre, props.acre_no, props.name, props.gid),
      square: value(props.sq, props.square_id),
      mauza: value(props.mauza, props.Mauza),
      district: value(props.district, props.District),
      tehsil: value(props.tehsil, props.Tehsil),
      area_sqft: formatNumber(readAreaSqft(feature)),
      geometry: feature.geometry,
    };
  });

  return (
    <AdminAttributeTableShell
      map={map}
      title="Acre Boundary"
      placeholder="Search acre boundary..."
      rows={rows}
      onClose={onClose}
      columns={[
        { key: "sr", label: "Sr No." },
        { key: "acre", label: "Acre" },
        { key: "square", label: "Square" },
        { key: "mauza", label: "Mauza" },
        { key: "district", label: "District" },
        { key: "tehsil", label: "Tehsil" },
        { key: "area_sqft", label: "Area (sq ft)" },
      ]}
    />
  );
}

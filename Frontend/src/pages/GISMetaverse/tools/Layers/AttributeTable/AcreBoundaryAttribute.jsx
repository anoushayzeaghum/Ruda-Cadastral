import AdminAttributeTableShell, {
  formatNumber,
} from "./AdminAttributeTableShell";
import { readAreaSqft } from "./areaUtils";

const propsOf = (feature = {}) => feature.properties || feature || {};

const value = (...items) =>
  items.find((item) => item !== undefined && item !== null && item !== "") ??
  "-";

const isNumericId = (item) => {
  if (typeof item === "number") return true;
  if (typeof item !== "string") return false;
  return /^\d+(\.\d+)?$/.test(item.trim());
};

const nameValue = (...items) => {
  for (const item of items) {
    if (item === undefined || item === null || item === "") continue;
    if (isNumericId(item)) continue;
    return item;
  }
  return "-";
};

export default function AcreBoundaryAttribute({ map, geojson, onClose }) {
  const rows = (geojson?.features || []).map((feature, index) => {
    const props = propsOf(feature);
    return {
      id: props.gid || feature.id || index + 1,
      sr: index + 1,
      acre: value(props.acre, props.acre_no, props.name, props.gid),
      square: value(props.sq, props.square_id),
      mauza: nameValue(
        props.mauza_name,
        props.mauza,
        props.Mauza,
        props.moza,
        props.Moza,
        props.Mouza,
      ),
      district: nameValue(props.district_name, props.District, props.district),
      tehsil: nameValue(props.tehsil_name, props.Tehsil, props.tehsil),
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
        { key: "tehsil", label: "Tehsil" },
        { key: "area_sqft", label: "Area (sq ft)" },
      ]}
    />
  );
}

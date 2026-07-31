import AdminAttributeTableShell, { firstValue, formatNumber } from "./AdminAttributeTableShell";

const areaValue = (p = {}) => formatNumber(firstValue(p.area_sqft, p.area_sq_ft, p.area, p.shape_area, p.shape_star));

export default function CadastralAttributeTable({ map, geojson, onClose, title, placeholder, fields }) {
  const rows = (geojson?.features || []).map((feature, index) => {
    const p = feature?.properties || {};
    const row = { id: p.gid ?? p.id ?? feature.id ?? index + 1, sr: index + 1, geometry: feature.geometry };
    fields.forEach((field) => {
      const values = (field.sources || [field.key]).map((key) => p[key]);
      row[field.key] = field.number ? formatNumber(firstValue(...values)) : firstValue(...values);
    });
    if (fields.some((field) => field.key === "area")) row.area = areaValue(p);
    return row;
  });
  return <AdminAttributeTableShell map={map} title={title} placeholder={placeholder} rows={rows} onClose={onClose} columns={[{ key: "sr", label: "Sr No." }, ...fields.map(({ key, label }) => ({ key, label }))]} />;
}

import AdminAttributeTableShell from "./AdminAttributeTableShell";

const propsOf = (feature = {}) => feature.properties || feature || {};
const value = (...items) => items.find((item) => item !== undefined && item !== null && item !== "") ?? "-";

export default function FieldPointsAttribute({ map, geojson, onClose }) {
  const rows = (geojson?.features || []).map((feature, index) => {
    const props = propsOf(feature);
    return {
      id: props.gid || feature.id || index + 1,
      sr: index + 1,
      name: value(props.name),
      easting: value(props.easting),
      northing: value(props.northing),
      elevation: value(props.elevation),
      mauza_id: value(props.mauza_id),
      layer: value(props.layer),
      geometry: feature.geometry,
    };
  });

  return (
    <AdminAttributeTableShell
      map={map}
      title="Field Points"
      placeholder="Search field points..."
      rows={rows}
      onClose={onClose}
      columns={[
        { key: "sr", label: "Sr No." },
        { key: "name", label: "Name" },
        { key: "easting", label: "Easting" },
        { key: "northing", label: "Northing" },
        { key: "elevation", label: "Elevation" },
        { key: "mauza_id", label: "Mauza ID" },
        { key: "layer", label: "Layer" },
      ]}
    />
  );
}

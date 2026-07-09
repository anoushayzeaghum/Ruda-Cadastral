import AdminAttributeTableShell from "./AdminAttributeTableShell";

const propsOf = (feature = {}) => feature.properties || feature || {};
const value = (...items) => items.find((item) => item !== undefined && item !== null && item !== "") ?? "-";

export default function TriJunctionPointsAttribute({ map, geojson, onClose }) {
  const rows = (geojson?.features || []).map((feature, index) => {
    const props = propsOf(feature);
    const coords = feature.geometry?.coordinates || [];
    return {
      id: props.gid || feature.id || index + 1,
      sr: index + 1,
      type: value(props.type),
      m1: value(props.m1),
      m2: value(props.m2),
      m3: value(props.m3),
      layer: value(props.layer),
      coordinates: Array.isArray(coords) ? coords.flat(Infinity).slice(0, 2).join(", ") : "-",
      geometry: feature.geometry,
    };
  });

  return (
    <AdminAttributeTableShell
      map={map}
      title="Tri Junction Points"
      placeholder="Search tri junction points..."
      rows={rows}
      onClose={onClose}
      columns={[
        { key: "sr", label: "Sr No." },
        { key: "type", label: "Type" },
        { key: "m1", label: "M1" },
        { key: "m2", label: "M2" },
        { key: "m3", label: "M3" },
        { key: "layer", label: "Layer" },
        { key: "coordinates", label: "Coordinates" },
      ]}
    />
  );
}

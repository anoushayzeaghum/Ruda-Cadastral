import CadastralAttributeTable from "../CadastralAttributeTable";

export default function TriJunctionPointsAttribute(props) {
  return (
    <CadastralAttributeTable
      {...props}
      title="Tri Junction Points"
      placeholder="Search tri junction points..."
      fields={[
        { key: 'name', label: 'Name', sources: ["name", "point_name"] },
        { key: 'code', label: 'Code', sources: ["code", "point_code"] },
        { key: 'mauza', label: 'Mauza', sources: ["mauza", "mauza_name"] },
        { key: 'easting', label: 'Easting', sources: ["easting", "easting_m"] },
        { key: 'northing', label: 'Northing', sources: ["northing", "northing_m"] }
      ]}
    />
  );
}

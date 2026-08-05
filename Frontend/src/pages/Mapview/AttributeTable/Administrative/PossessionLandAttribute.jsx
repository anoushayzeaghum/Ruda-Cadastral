import CadastralAttributeTable from "../CadastralAttributeTable";

export default function PossessionLandAttribute(props) {
  return (
    <CadastralAttributeTable
      {...props}
      title="Possession Land"
      placeholder="Search possession land..."
      fields={[
        { key: 'name', label: 'Name', sources: ["name", "title"] },
        { key: 'type', label: 'Land Type', sources: ["type", "land_type", "status"] },
        { key: 'mauza', label: 'Mauza', sources: ["mauza", "mauza_name"] },
        { key: 'area', label: 'Area', sources: ["area_sqft", "shape_area", "area"] }
      ]}
    />
  );
}

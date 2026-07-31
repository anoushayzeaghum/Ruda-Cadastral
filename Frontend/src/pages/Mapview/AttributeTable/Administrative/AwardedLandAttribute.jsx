import CadastralAttributeTable from "../CadastralAttributeTable";

export default function AwardedLandAttribute(props) {
  return (
    <CadastralAttributeTable
      {...props}
      title="Awarded Land"
      placeholder="Search awarded land..."
      fields={[
        { key: 'name', label: 'Name', sources: ["name", "title"] },
        { key: 'status', label: 'Status', sources: ["status", "type"] },
        { key: 'mauza', label: 'Mauza', sources: ["mauza", "mauza_name"] },
        { key: 'area', label: 'Area', sources: ["area_sqft", "shape_area", "area"] }
      ]}
    />
  );
}

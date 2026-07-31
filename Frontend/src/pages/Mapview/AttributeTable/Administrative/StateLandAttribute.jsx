import CadastralAttributeTable from "../CadastralAttributeTable";

export default function StateLandAttribute(props) {
  return (
    <CadastralAttributeTable
      {...props}
      title="State Land"
      placeholder="Search state land..."
      fields={[
        { key: 'name', label: 'Name', sources: ["name", "title"] },
        { key: 'type', label: 'Type', sources: ["type", "land_type"] },
        { key: 'mauza', label: 'Mauza', sources: ["mauza", "mauza_name"] },
        { key: 'area', label: 'Area', sources: ["area_sqft", "shape_area", "area"] }
      ]}
    />
  );
}

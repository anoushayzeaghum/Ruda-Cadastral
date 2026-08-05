import CadastralAttributeTable from "../CadastralAttributeTable";

export default function RudaBoundaryAttribute(props) {
  return (
    <CadastralAttributeTable
      {...props}
      title="RUDA Boundary"
      placeholder="Search ruda boundary..."
      fields={[
        { key: 'name', label: 'Name', sources: ["name", "ruda_name", "title"] },
        { key: 'area', label: 'Area', sources: ["area_sqft", "area", "shape_area"] }
      ]}
    />
  );
}

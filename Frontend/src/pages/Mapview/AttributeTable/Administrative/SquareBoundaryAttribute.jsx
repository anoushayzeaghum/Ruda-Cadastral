import CadastralAttributeTable from "../CadastralAttributeTable";

export default function SquareBoundaryAttribute(props) {
  return (
    <CadastralAttributeTable
      {...props}
      title="Square Boundary"
      placeholder="Search square boundary..."
      fields={[
        { key: 'square', label: 'Square', sources: ["sq", "square", "square_no", "square_id", "layer"] },
        { key: 'mauza', label: 'Mauza', sources: ["mauza", "mauza_name"] },
        { key: 'district', label: 'District', sources: ["district", "district_name"] },
        { key: 'tehsil', label: 'Tehsil', sources: ["tehsil", "tehsil_name"] },
        { key: 'area', label: 'Area', sources: ["area_sqft", "shape_area", "area"] }
      ]}
    />
  );
}

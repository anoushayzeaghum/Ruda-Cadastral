import CadastralAttributeTable from "../CadastralAttributeTable";

export default function AcreBoundaryAttribute(props) {
  return (
    <CadastralAttributeTable
      {...props}
      title="Acre Boundary"
      placeholder="Search acre boundary..."
      fields={[
        { key: 'acre', label: 'Acre', sources: ["acre", "acre_no", "name", "gid"] },
        { key: 'square', label: 'Square', sources: ["sq", "square_id"] },
        { key: 'mauza', label: 'Mauza', sources: ["mauza", "mauza_name"] },
        { key: 'district', label: 'District', sources: ["district", "district_name"] },
        { key: 'tehsil', label: 'Tehsil', sources: ["tehsil", "tehsil_name"] },
        { key: 'area', label: 'Area', sources: ["area_sqft", "shape_area", "area"] }
      ]}
    />
  );
}

import CadastralAttributeTable from "../CadastralAttributeTable";

export default function TehsilBoundaryAttribute(props) {
  return (
    <CadastralAttributeTable
      {...props}
      title="Tehsil Boundary"
      placeholder="Search tehsil boundary..."
      fields={[
        { key: 'tehsil', label: 'Tehsil', sources: ["name", "tehsil", "tehsil_name"] },
        { key: 'district', label: 'District', sources: ["district_name", "district"] },
        { key: 'id_value', label: 'Tehsil ID', sources: ["id", "tehsil_id"] },
        { key: 'area', label: 'Area', sources: ["area_sqft", "shape_star", "area"] }
      ]}
    />
  );
}

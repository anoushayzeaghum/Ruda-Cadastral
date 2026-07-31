import CadastralAttributeTable from "../CadastralAttributeTable";

export default function DistrictBoundaryAttribute(props) {
  return (
    <CadastralAttributeTable
      {...props}
      title="District Boundary"
      placeholder="Search district boundary..."
      fields={[
        { key: 'district', label: 'District', sources: ["name", "district", "district_name"] },
        { key: 'id_value', label: 'District ID', sources: ["id", "district_id", "dist_id"] },
        { key: 'area', label: 'Area', sources: ["area_sqft", "shape_star", "area"] }
      ]}
    />
  );
}

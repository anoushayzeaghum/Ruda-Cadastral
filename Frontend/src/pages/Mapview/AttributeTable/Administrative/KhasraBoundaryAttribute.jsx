import CadastralAttributeTable from "../CadastralAttributeTable";

export default function KhasraBoundaryAttribute(props) {
  return (
    <CadastralAttributeTable
      {...props}
      title="Khasra Boundary"
      placeholder="Search khasra boundary..."
      fields={[
        { key: 'khasra', label: 'Khasra', sources: ["kh", "khasra", "khasra_no", "join_shp"] },
        { key: 'mauza', label: 'Mauza', sources: ["mauza", "mauza_name"] },
        { key: 'district', label: 'District', sources: ["district", "district_name"] },
        { key: 'tehsil', label: 'Tehsil', sources: ["tehsil", "tehsil_name"] },
        { key: 'status', label: 'Status', sources: ["_verification_status"] },
        { key: 'area', label: 'Area', sources: ["area_sqft", "shape_area", "area"] }
      ]}
    />
  );
}

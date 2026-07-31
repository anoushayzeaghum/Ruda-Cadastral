import CadastralAttributeTable from "../CadastralAttributeTable";

export default function MauzaBoundaryAttribute(props) {
  return (
    <CadastralAttributeTable
      {...props}
      title="Mauza Boundary"
      placeholder="Search mauza boundary..."
      fields={[
        { key: 'mauza', label: 'Mauza', sources: ["mauza", "moza", "name"] },
        { key: 'district', label: 'District', sources: ["district", "district_name"] },
        { key: 'tehsil', label: 'Tehsil', sources: ["tehsil", "tehsil_name"] },
        { key: 'mauza_id', label: 'Mauza ID', sources: ["mauza_id", "gid"] },
        { key: 'area', label: 'Area', sources: ["area_sqft", "shape_area", "area"] }
      ]}
    />
  );
}

import CadastralAttributeTable from "../CadastralAttributeTable";

export default function ProposedRoadAttribute(props) {
  return (
    <CadastralAttributeTable
      {...props}
      title="Proposed Roads"
      placeholder="Search proposed roads..."
      fields={[
        { key: 'name', label: 'Road Name', sources: ["name", "road_name"] },
        { key: 'type', label: 'Type', sources: ["type", "road_type"] },
        { key: 'length', label: 'Length', sources: ["shape_leng", "length"] }
      ]}
    />
  );
}

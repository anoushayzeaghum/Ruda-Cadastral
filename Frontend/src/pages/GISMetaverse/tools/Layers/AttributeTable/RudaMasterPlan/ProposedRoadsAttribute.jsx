import RudaMasterPlanAttributeTable, { numberValue, textValue } from "./RudaMasterPlanAttributeTable";
const SOURCE_IDS = ["metaverse-ruda-master-plan-rudaProposedRoads-source"];
const COLUMNS = [{ key: "sr", label: "SR" }, { key: "roadType", label: "Road Type" }, { key: "row", label: "ROW / Width" }];
const formatFeature = (p) => ({ roadType: textValue(p.road_type), row: numberValue(p.row) });
export default function ProposedRoadsAttribute({ map, onClose }) {
  return <RudaMasterPlanAttributeTable map={map} onClose={onClose} title="Proposed Roads" placeholder="Search road type or width..." endpoint="/proposed-road/" sourceIds={SOURCE_IDS} columns={COLUMNS} formatFeature={formatFeature} />;
}

import RudaMasterPlanAttributeTable, { numberValue, textValue } from "./RudaMasterPlanAttributeTable";
const SOURCE_IDS = ["metaverse-ruda-master-plan-riverRavi-source"];
const COLUMNS = [{ key: "sr", label: "SR" }, { key: "name", label: "Name" }, { key: "type", label: "Type" }, { key: "area", label: "Area" }];
const formatFeature = (p) => ({ name: textValue(p.name), type: textValue(p.type), area: numberValue(p.area) });
export default function River2025Attribute({ map, onClose }) {
  return <RudaMasterPlanAttributeTable map={map} onClose={onClose} title="River 2025" placeholder="Search name, type or area..." endpoint="/river-ravi/" sourceIds={SOURCE_IDS} columns={COLUMNS} formatFeature={formatFeature} />;
}

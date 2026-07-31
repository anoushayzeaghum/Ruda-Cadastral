import RudaMasterPlanAttributeTable, { numberValue, textValue } from "./RudaMasterPlanAttributeTable";
const SOURCE_IDS = ["metaverse-ruda-master-plan-riverBoundaryLayer-source"];
const COLUMNS = [{ key: "sr", label: "SR" }, { key: "name", label: "Name" }, { key: "layer", label: "Layer / Type" }, { key: "area225", label: "Area (225 Acres)" }];
const formatFeature = (p) => ({ name: textValue(p.name), layer: textValue(p.layer), area225: numberValue(p.area_225ac) });
export default function ProposedRiverAttribute({ map, onClose }) {
  return <RudaMasterPlanAttributeTable map={map} onClose={onClose} title="Proposed River" placeholder="Search river name, type or area..." endpoint="/river/" sourceIds={SOURCE_IDS} columns={COLUMNS} formatFeature={formatFeature} />;
}

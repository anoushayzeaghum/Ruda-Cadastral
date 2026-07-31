import RudaMasterPlanAttributeTable, { numberValue, textValue } from "./RudaMasterPlanAttributeTable";
const SOURCE_IDS = ["metaverse-ruda-master-plan-rtwAlignment-source"];
const COLUMNS = [{ key: "sr", label: "SR" }, { key: "package", label: "Package" }, { key: "length", label: "Length" }, { key: "date", label: "Date" }, { key: "area225", label: "Area (225 Acres)" }];
const formatFeature = (p) => ({ package: textValue(p.package), length: textValue(p.length), date: textValue(p.date), area225: numberValue(p.area_ac225) });
export default function RTWAttribute({ map, onClose }) {
  return <RudaMasterPlanAttributeTable map={map} onClose={onClose} title="River Training Works (RTW)" placeholder="Search package, length or date..." endpoint="/rtwalignment/" sourceIds={SOURCE_IDS} columns={COLUMNS} formatFeature={formatFeature} />;
}

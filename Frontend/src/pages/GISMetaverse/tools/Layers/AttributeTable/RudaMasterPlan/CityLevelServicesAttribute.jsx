import RudaMasterPlanAttributeTable, { numberValue, textValue } from "./RudaMasterPlanAttributeTable";
const SOURCE_IDS = ["metaverse-ruda-master-plan-cityLevelServicesLayer-source"];
const COLUMNS = [
  { key: "sr", label: "SR" }, { key: "name", label: "Service Name" },
  { key: "type", label: "Type" }, { key: "layer", label: "Category" },
  { key: "elevation", label: "Elevation" }, { key: "area225", label: "Area (225 Acres)" },
];
const formatFeature = (p) => ({ name: textValue(p.name), type: textValue(p.type, p.gm_type), layer: textValue(p.layer), elevation: numberValue(p.elevation), area225: numberValue(p.area_225ac) });
export default function CityLevelServicesAttribute({ map, onClose }) {
  return <RudaMasterPlanAttributeTable map={map} onClose={onClose} title="City Level Services" placeholder="Search service name, type or category..." endpoint="/city-level-service/" sourceIds={SOURCE_IDS} columns={COLUMNS} formatFeature={formatFeature} />;
}

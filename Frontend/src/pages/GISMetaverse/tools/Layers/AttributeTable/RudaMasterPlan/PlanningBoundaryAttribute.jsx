import RudaMasterPlanAttributeTable, { numberValue, textValue } from "./RudaMasterPlanAttributeTable";

const SOURCE_IDS = ["metaverse-ruda-master-plan-rudaPlanningBoundary-source"];
const COLUMNS = [
  { key: "sr", label: "SR" },
  { key: "name", label: "Name" },
  { key: "areaAcres", label: "Area (Acres)" },
  { key: "area225", label: "Area (225 Acres)" },
];
const formatFeature = (p) => ({
  name: textValue(p.name),
  areaAcres: numberValue(p.area_usacr),
  area225: numberValue(p.area_225ac),
});
export default function PlanningBoundaryAttribute({ map, onClose }) {
  return <RudaMasterPlanAttributeTable map={map} onClose={onClose} title="Planning Boundary" placeholder="Search name or area..." endpoint="/ruda-planning-boundary/" sourceIds={SOURCE_IDS} columns={COLUMNS} formatFeature={formatFeature} />;
}

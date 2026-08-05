import RudaMasterPlanAttributeTable, { numberValue, textValue } from "./RudaMasterPlanAttributeTable";
const SOURCE_IDS = ["metaverse-ruda-master-plan-precinctBoundaryLayer-source"];
const COLUMNS = [
  { key: "sr", label: "SR" }, { key: "name", label: "Name" },
  { key: "phase", label: "Phase" }, { key: "areaAcres", label: "Area (Acres)" },
  { key: "area225", label: "Area (225 Acres)" },
];
const formatFeature = (p) => ({ name: textValue(p.name), phase: textValue(p.phases_new, p.phases), areaAcres: numberValue(p.area_acre), area225: numberValue(p.area_225ac) });
export default function PrecinctBoundaryAttribute({ map, onClose }) {
  return <RudaMasterPlanAttributeTable map={map} onClose={onClose} title="Precinct Boundary" placeholder="Search precinct, phase or area..." endpoint="/precient-boundary/" sourceIds={SOURCE_IDS} columns={COLUMNS} formatFeature={formatFeature} />;
}

import RudaMasterPlanAttributeTable, { textValue } from "./RudaMasterPlanAttributeTable";
const SOURCE_IDS = ["metaverse-ruda-master-plan-masterPlanPhases-source"];
const COLUMNS = [
  { key: "sr", label: "SR" },
  { key: "name", label: "Name" },
  { key: "folder", label: "Phase / Folder" },
  { key: "description", label: "Description" },
];
const formatFeature = (p) => ({ name: textValue(p.name), folder: textValue(p.folderpath), description: textValue(p.popupinfo, p.snippet) });
export default function MasterPlanPhasesAttribute({ map, onClose }) {
  return <RudaMasterPlanAttributeTable map={map} onClose={onClose} title="Master Plan Phases" placeholder="Search phase name or description..." endpoint="/ruda/" sourceIds={SOURCE_IDS} columns={COLUMNS} formatFeature={formatFeature} />;
}

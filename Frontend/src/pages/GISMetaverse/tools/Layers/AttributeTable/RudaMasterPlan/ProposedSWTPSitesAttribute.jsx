import RudaMasterPlanAttributeTable, { numberValue, textValue } from "./RudaMasterPlanAttributeTable";
const SOURCE_IDS = ["metaverse-ruda-master-plan-swtpSite-source"];
const COLUMNS = [{ key: "sr", label: "SR" }, { key: "name", label: "Site Name" }, { key: "area225", label: "Area (225 Acres)" }, { key: "remarks", label: "Remarks" }];
const formatFeature = (p) => ({ name: textValue(p.name), area225: numberValue(p.area_225ac), remarks: textValue(p.remarks) });
export default function ProposedSWTPSitesAttribute({ map, onClose }) {
  return <RudaMasterPlanAttributeTable map={map} onClose={onClose} title="Proposed SWTP Sites" placeholder="Search site name, area or remarks..." endpoint="/swtp-site/" sourceIds={SOURCE_IDS} columns={COLUMNS} formatFeature={formatFeature} />;
}

import RudaMasterPlanAttributeTable, { numberValue, textValue } from "./RudaMasterPlanAttributeTable";
const SOURCE_IDS = ["metaverse-ruda-master-plan-principleLandUseZoning-source"];
const COLUMNS = [{ key: "sr", label: "SR" }, { key: "zone", label: "Zoning Category" }, { key: "area225", label: "Area (225 Acres)" }, { key: "areaSqFt", label: "Area (Sq. Ft.)" }];
const formatFeature = (p) => ({ zone: textValue(p.zoning_cat), area225: numberValue(p.area225a), areaSqFt: numberValue(p.area_sqft) });
export default function PrincipalZoningAttribute({ map, onClose }) {
  return <RudaMasterPlanAttributeTable map={map} onClose={onClose} title="Principle Land Use Zoning" placeholder="Search zoning category or area..." endpoint="/mp-principle-zoning/" sourceIds={SOURCE_IDS} columns={COLUMNS} formatFeature={formatFeature} />;
}

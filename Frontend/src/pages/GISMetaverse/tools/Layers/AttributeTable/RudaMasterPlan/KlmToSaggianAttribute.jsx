import RudaMasterPlanAttributeTable, { textValue } from "./RudaMasterPlanAttributeTable";

const SOURCE_IDS = ["metaverse-ruda-master-plan-klmToSaggian-source"];
const COLUMNS = [
  { key: "sr", label: "SR" },
  { key: "gid", label: "GID" },
  { key: "descriptio", label: "Road Feature Type" },
];
const formatFeature = (properties, feature) => ({
  gid: properties.gid ?? feature.id ?? "-",
  descriptio: textValue(properties.descriptio),
});

export default function KlmToSaggianAttribute({ map, onClose }) {
  return (
    <RudaMasterPlanAttributeTable
      map={map}
      onClose={onClose}
      title="KLM to Saggian Road"
      placeholder="Search GID or road feature type..."
      endpoint="/klm-to-saggian/"
      sourceIds={SOURCE_IDS}
      columns={COLUMNS}
      formatFeature={formatFeature}
    />
  );
}

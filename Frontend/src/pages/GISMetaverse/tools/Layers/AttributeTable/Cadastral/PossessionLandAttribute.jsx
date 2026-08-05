import CadastralAttributeTable, {
  numberValue,
  textValue,
} from "./CadastralAttributeTable";

const SOURCE_IDS = ["metaverse-possession-land-source"];

const COLUMNS = [
  { key: "sr", label: "SR" },
  { key: "district", label: "District" },
  { key: "tehsil", label: "Tehsil" },
  { key: "mouza", label: "Mauza" },
  { key: "square", label: "Square" },
  { key: "khasra", label: "Khasra" },
  { key: "khasraLabel", label: "Khasra Label" },
  { key: "awardZone", label: "Award Zone" },
  { key: "project", label: "Project" },
  { key: "landType", label: "Land Type" },
  { key: "landOwner", label: "Land Owner" },
  { key: "landProvider", label: "LP Name" },
  { key: "date", label: "Date" },
  { key: "remarks", label: "Remarks" },
];

const formatFeature = (properties) => ({
  district: textValue(properties.district),
  tehsil: textValue(properties.tehsil),
  mouza: textValue(properties.mouza),
  square: numberValue(properties.square),
  khasra: numberValue(properties.khasra),
  khasraLabel: textValue(properties.khasra_lab),
  awardZone: textValue(properties.award_zone),
  project: textValue(properties.projects),
  landType: textValue(properties.l_type),
  landOwner: textValue(properties.land_owner),
  landProvider: textValue(properties.lp_name),
  date: textValue(properties.date),
  remarks: textValue(properties.remarks),
});

export default function PossessionLandAttribute({ map, onClose }) {
  return (
    <CadastralAttributeTable
      map={map}
      onClose={onClose}
      title="Possession Land"
      placeholder="Search khasra, owner, project, or land type..."
      endpoint="/possessionland/"
      sourceIds={SOURCE_IDS}
      columns={COLUMNS}
      formatFeature={formatFeature}
    />
  );
}

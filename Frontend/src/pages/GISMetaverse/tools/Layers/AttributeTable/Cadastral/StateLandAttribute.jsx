import CadastralAttributeTable, {
  areaSqftValue,
  numberValue,
  textValue,
} from "./CadastralAttributeTable";

const SOURCE_IDS = ["metaverse-state-land-source"];

const COLUMNS = [
  { key: "sr", label: "SR" },
  { key: "district", label: "District" },
  { key: "tehsil", label: "Tehsil" },
  { key: "mouza", label: "Mauza" },
  { key: "square", label: "Square" },
  { key: "khasra", label: "Khasra" },
  { key: "subKhasra", label: "Sub Khasra" },
  { key: "khasraLabel", label: "Khasra Label" },
  { key: "stateLand", label: "State Land" },
  { key: "areaSqft", label: "Area (Sq Ft)" },
  { key: "date", label: "Date" },
  { key: "remarks", label: "Remarks" },
];

const formatFeature = (properties) => ({
  district: textValue(properties.district),
  tehsil: textValue(properties.tehsil),
  mouza: textValue(properties.mouza),
  square: numberValue(properties.square),
  khasra: numberValue(properties.khasra),
  subKhasra: numberValue(properties.sub_khasra),
  khasraLabel: textValue(properties.khasra_lab),
  stateLand: textValue(properties.state_land),
  areaSqft: areaSqftValue(properties.area_sqft),
  date: textValue(properties.date),
  remarks: textValue(properties.remarks),
});

export default function StateLandAttribute({ map, onClose }) {
  return (
    <CadastralAttributeTable
      map={map}
      onClose={onClose}
      title="State Land"
      placeholder="Search khasra, mouza, state land, or date..."
      endpoint="/stateland/"
      sourceIds={SOURCE_IDS}
      columns={COLUMNS}
      formatFeature={formatFeature}
    />
  );
}

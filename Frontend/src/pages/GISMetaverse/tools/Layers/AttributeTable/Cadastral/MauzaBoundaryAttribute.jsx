import CadastralAttributeTable, {
  textValue,
} from "./CadastralAttributeTable";

const SOURCE_IDS = ["metaverse-mauza-boundary-source"];

const COLUMNS = [
  { key: "sr", label: "SR" },
  { key: "district", label: "District" },
  { key: "tehsil", label: "Tehsil" },
  { key: "mauza", label: "Mauza" },
  { key: "kanungoCircle", label: "Kanungo Circle" },
  { key: "patwarCircle", label: "Patwar Circle" },
  { key: "notifiedBoundary", label: "Notified Boundary" },
  { key: "proposedBoundary", label: "Proposed Boundary" },
  { key: "newExtension", label: "New Extension" },
  { key: "preparedBy", label: "Prepared By" },
  { key: "remarks", label: "Remarks" },
];

const formatFeature = (properties) => ({
  district: textValue(
    properties.district_name,
    properties.district_text,
    properties.district,
  ),
  tehsil: textValue(
    properties.tehsil_name,
    properties.tehsil_text,
    properties.tehsil,
  ),
  mauza: textValue(properties.mauza, properties.mauza_name),
  kanungoCircle: textValue(properties.kc),
  patwarCircle: textValue(properties.pc),
  notifiedBoundary: textValue(properties.notified_b),
  proposedBoundary: textValue(properties.proposed_b),
  newExtension: textValue(properties.new_ext),
  preparedBy: textValue(properties.prepared_b),
  remarks: textValue(properties.remarks),
});

export default function MauzaBoundaryAttribute({ map, geojson, onClose }) {
  return (
    <CadastralAttributeTable
      map={map}
      geojson={geojson}
      onClose={onClose}
      title="Mauza Boundary"
      placeholder="Search district, tehsil, or mauza..."
      endpoint="/rudamauza/"
      sourceIds={SOURCE_IDS}
      columns={COLUMNS}
      formatFeature={formatFeature}
    />
  );
}

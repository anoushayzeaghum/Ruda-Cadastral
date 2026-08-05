import CadastralAttributeTable, {
  numberValue,
  textValue,
} from "./CadastralAttributeTable";

const SOURCE_IDS = ["metaverse-square-boundary-source"];

const COLUMNS = [
  { key: "sr", label: "SR" },
  { key: "district", label: "District" },
  { key: "tehsil", label: "Tehsil" },
  { key: "mauza", label: "Mauza" },
  { key: "kanungoCircle", label: "Kanungo Circle" },
  { key: "patwarCircle", label: "Patwar Circle" },
  { key: "square", label: "Square" },
  { key: "layer", label: "Layer" },
];

const formatFeature = (properties) => ({
  district: textValue(properties.district_name, properties.district),
  tehsil: textValue(properties.tehsil_name, properties.tehsil),
  mauza: textValue(properties.mauza_name, properties.mauza),
  kanungoCircle: textValue(properties.kc),
  patwarCircle: textValue(properties.pc),
  square: numberValue(properties.sq, properties.square),
  layer: textValue(properties.layer),
});

export default function SquareBoundaryAttribute({ map, geojson, onClose }) {
  return (
    <CadastralAttributeTable
      map={map}
      geojson={geojson}
      onClose={onClose}
      title="Square Boundary"
      placeholder="Search square, mauza, tehsil, or district..."
      endpoint="/square/"
      sourceIds={SOURCE_IDS}
      columns={COLUMNS}
      formatFeature={formatFeature}
    />
  );
}

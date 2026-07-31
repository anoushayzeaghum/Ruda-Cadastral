import CadastralAttributeTable, {
  areaSqftValue,
  numberValue,
  textValue,
} from "./CadastralAttributeTable";

const COLUMNS = [
  { key: "sr", label: "SR" },
  { key: "district", label: "District" },
  { key: "tehsil", label: "Tehsil" },
  { key: "mauza", label: "Mauza" },
  { key: "kanungoCircle", label: "Kanungo Circle" },
  { key: "patwarCircle", label: "Patwar Circle" },
  { key: "hadbast", label: "Hadbast No." },
  { key: "assessmentCircle", label: "Assessment Circle" },
  { key: "type", label: "Type" },
  { key: "square", label: "Square" },
  { key: "khasra", label: "Khasra" },
  { key: "subKhasra", label: "Sub Khasra" },
  { key: "khasraLabel", label: "Khasra Label" },
  { key: "khewat", label: "Khewat No." },
  { key: "khatoni", label: "Khatoni No." },
  { key: "dcRate", label: "DC Rate" },
  { key: "areaSqft", label: "Area (Sq Ft)" },
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
  mauza: textValue(
    properties.mauza_name,
    properties.mauza_text,
    properties.mauza,
  ),
  kanungoCircle: textValue(properties.kc),
  patwarCircle: textValue(properties.pc),
  hadbast: numberValue(properties.hadbust_no),
  assessmentCircle: textValue(properties.asse_cir),
  type: textValue(properties.type),
  square: numberValue(properties.sq),
  khasra: numberValue(properties.kh, properties.khasra),
  subKhasra: textValue(properties.sk, properties.sub_khasra),
  khasraLabel: textValue(properties.join_shp, properties.khasra_lab),
  khewat: numberValue(properties.khewat_id),
  khatoni: numberValue(properties.khatoni_no),
  dcRate: numberValue(properties.dc_rate),
  areaSqft: areaSqftValue(properties.area_sqft),
  remarks: textValue(properties.remarks),
});

export default function KhasraBoundaryAttribute({ map, geojson, onClose }) {
  return (
    <CadastralAttributeTable
      map={map}
      geojson={geojson}
      onClose={onClose}
      title="Khasra Boundary"
      placeholder="Search khasra, mauza, tehsil, or district..."
      endpoint="/rudakhasra/"
      columns={COLUMNS}
      formatFeature={formatFeature}
    />
  );
}

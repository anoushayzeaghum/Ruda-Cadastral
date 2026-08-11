import { getHousingSchemesGeoJSON } from "../../../../../../services/metaverseApi";
import BaseDataAttributeTable, {
  numberValue,
  textValue,
} from "../BaseData/BaseDataAttributeTable";

const COLUMNS = [
  { key: "sr", label: "SR" },
  { key: "schemeName", label: "Scheme Name" },
  { key: "rudaStatus", label: "RUDA Status" },
  { key: "area225", label: "Area (225 Acres)" },
  { key: "area", label: "Area" },
];

const formatFeature = (properties) => ({
  schemeName: textValue(properties.scheme_nam, properties.scheme_name),
  rudaStatus: textValue(properties.ruda_st, properties.ruda_scheme),
  area225: numberValue(properties.area_225a),
  area: numberValue(properties.area),
});

export default function HousingSchemesAttribute({ map, geojson, onClose }) {
  return (
    <BaseDataAttributeTable
      map={map}
      geojson={geojson}
      onClose={onClose}
      title="Housing Schemes"
      placeholder="Search scheme name or RUDA status..."
      sourceIds={["gism-private-housing-schemes-source"]}
      fetchGeoJSON={getHousingSchemesGeoJSON}
      columns={COLUMNS}
      formatFeature={formatFeature}
    />
  );
}

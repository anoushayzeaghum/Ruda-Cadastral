import { getIllegalHousingSchemesGeoJSON } from "../../../../../../services/metaverseApi";
import BaseDataAttributeTable, {
  textValue,
} from "../BaseData/BaseDataAttributeTable";

const COLUMNS = [
  { key: "sr", label: "SR" },
  { key: "name", label: "Name" },
];

const formatFeature = (properties) => ({
  name: textValue(properties.name),
});

export default function IllegalHousingSchemesAttribute({
  map,
  geojson,
  onClose,
}) {
  return (
    <BaseDataAttributeTable
      map={map}
      geojson={geojson}
      onClose={onClose}
      title="Illegal Housing Schemes"
      placeholder="Search illegal housing scheme name..."
      sourceIds={["gism-illegal-housing-schemes-source"]}
      fetchGeoJSON={getIllegalHousingSchemesGeoJSON}
      columns={COLUMNS}
      formatFeature={formatFeature}
    />
  );
}

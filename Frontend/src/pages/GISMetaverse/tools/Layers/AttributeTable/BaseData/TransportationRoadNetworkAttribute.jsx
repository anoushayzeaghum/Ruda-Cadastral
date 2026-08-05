import { getLahoreTransportationRoadsGeoJSON } from "../../../../../../services/metaverseApi";
import BaseDataAttributeTable, {
  numberValue,
  textValue,
} from "./BaseDataAttributeTable";

const COLUMNS = [
  { key: "sr", label: "SR" },
  { key: "name", label: "Road Name" },
  { key: "type", label: "Road Type" },
  { key: "popupInfo", label: "Description" },
  { key: "length", label: "Length" },
];

const formatFeature = (properties) => ({
  name: textValue(properties.name),
  type: textValue(properties.type),
  popupInfo: textValue(properties.popupinfo),
  length: numberValue(properties.shape_leng),
});

export default function TransportationRoadNetworkAttribute({ map, geojson, onClose }) {
  return (
    <BaseDataAttributeTable
      map={map}
      geojson={geojson}
      onClose={onClose}
      title="Transportation Road Network"
      placeholder="Search road name, type, or description..."
      sourceIds={["gism-base-data-transportationRoadNetwork-source"]}
      fetchGeoJSON={getLahoreTransportationRoadsGeoJSON}
      columns={COLUMNS}
      formatFeature={formatFeature}
    />
  );
}

import { getForestBoundaryGeoJSON } from "../../../../../../services/metaverseApi";
import BaseDataAttributeTable, {
  numberValue,
  textValue,
} from "./BaseDataAttributeTable";

const COLUMNS = [
  { key: "sr", label: "SR" },
  { key: "forestName", label: "Forest Name" },
  { key: "zone", label: "Forest Zone" },
  { key: "circle", label: "Forest Circle" },
  { key: "division", label: "Forest Division" },
  { key: "type", label: "Forest Type" },
  { key: "legalStatus", label: "Legal Status" },
  { key: "gpsArea", label: "GPS Area" },
  { key: "grossArea", label: "Gross Area" },
];

const formatFeature = (properties) => ({
  forestName: textValue(properties.f_name),
  zone: textValue(properties.f_zone),
  circle: textValue(properties.f_circle),
  division: textValue(properties.f_div),
  type: textValue(properties.f_type),
  legalStatus: textValue(properties.legal_stat),
  gpsArea: numberValue(properties.gps_area),
  grossArea: numberValue(properties.gross_area),
});

export default function ForestBoundaryAttribute({ map, geojson, onClose }) {
  return (
    <BaseDataAttributeTable
      map={map}
      geojson={geojson}
      onClose={onClose}
      title="Forest Boundary"
      placeholder="Search forest name, zone, division, or status..."
      sourceIds={["gism-base-data-forest-source"]}
      fetchGeoJSON={getForestBoundaryGeoJSON}
      columns={COLUMNS}
      formatFeature={formatFeature}
    />
  );
}

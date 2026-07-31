import { getExistingDrainsGeoJSON } from "../../../../../../services/metaverseApi";
import BaseDataAttributeTable, { textValue } from "./BaseDataAttributeTable";

const COLUMNS = [
  { key: "sr", label: "SR" },
  { key: "name", label: "Drain Name" },
];

const formatFeature = (properties) => ({
  name: textValue(properties.name),
});

export default function ExistingDrainsAttribute({ map, geojson, onClose }) {
  return (
    <BaseDataAttributeTable
      map={map}
      geojson={geojson}
      onClose={onClose}
      title="Existing Drains"
      placeholder="Search drain name..."
      sourceIds={["gism-base-data-existingDrains-source"]}
      fetchGeoJSON={getExistingDrainsGeoJSON}
      columns={COLUMNS}
      formatFeature={formatFeature}
    />
  );
}

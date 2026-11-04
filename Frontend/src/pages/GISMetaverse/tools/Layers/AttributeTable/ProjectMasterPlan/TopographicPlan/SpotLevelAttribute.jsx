import VectorGeoJSONAttribute from "../../VectorGeoJSONAttribute";

const FIELDS = [
  { key: "OBJECTID", label: "OBJECTID" },
  { key: "Id", label: "Id" },
  { key: "X", label: "X" },
  { key: "Y", label: "Y" },
  { key: "ZZ", label: "Elevation (ZZ)" },
];

/** Reads the same project-scoped Mapbox source/API as the purple Spot Level layer. */
export default function SpotLevelAttribute({ map, selectedProjectId, onClose }) {
  return (
    <VectorGeoJSONAttribute
      map={map}
      selectedProjectId={selectedProjectId}
      onClose={onClose}
      title="Spot Level"
      sourceIds={["gis-topo-spotlevel-source", "metaverse-spot-level-source"]}
      endpoint="/spot-level/map-geojson/"
      preferredFields={FIELDS}
      onlyPreferred
    />
  );
}

import { useEffect, useState } from "react";
import AdminAttributeTableShell, { formatNumber, getMapSourceGeoJSON } from "./AdminAttributeTableShell";
import { readAreaSqft } from "./areaUtils";

const SOURCE_ID = "metaverse-ruda-mauza-boundary-source";

export default function RudaMozaBoundaryAttribute({ map, onClose }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const geojson = getMapSourceGeoJSON(map, SOURCE_ID);

    const formatted = (geojson.features || []).map((feature, index) => {
      const props = feature.properties || {};
      const areaSqft = readAreaSqft(feature);

      return {
        id: props.gid || props.mauza_id || feature.id || index,
        sr: index + 1,
        mauza: props.mauza || props.Mauza || props.moza || props.name || props.Name || "-",
        phase: props.phase || props.Phase || props.folderpath || props.project || "-",
        area_sqft: formatNumber(areaSqft),
        geometry: feature.geometry,
      };
    });

    setRows(formatted);
  }, [map]);

  return (
    <AdminAttributeTableShell
      map={map}
      title="Ruda Moza Boundaries"
      placeholder="Search moza name or phase..."
      rows={rows}
      onClose={onClose}
      columns={[
        { key: "sr", label: "SR" },
        { key: "mauza", label: "Moza Name" },
        { key: "phase", label: "Phase" },
        { key: "area_sqft", label: "Area (sq ft)" },
      ]}
    />
  );
}

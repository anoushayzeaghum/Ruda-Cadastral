import { useEffect, useState } from "react";
import AdminAttributeTableShell, {
  formatNumber,
  getMapSourceGeoJSON,
} from "./AdminAttributeTableShell";
import { readAreaSqft } from "./areaUtils";

const SOURCE_ID = "metaverse-ruda-mauza-boundary-source";

const cell = (...values) => {
  for (const value of values) {
    if (value !== null && value !== undefined && value !== "") return value;
  }
  return "-";
};

export default function RudaMozaBoundaryAttribute({ map, onClose }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const geojson = getMapSourceGeoJSON(map, SOURCE_ID);

    const formatted = (geojson?.features || []).map((feature, index) => {
      const props = feature.properties || {};
      const areaSqft = readAreaSqft(feature);

      return {
        id: props.gid || props.mauza_id || feature.id || index + 1,
        sr: index + 1,
        mauza: cell(
          props.mauza_name,
          props.mauza,
          props.Mauza,
          props.moza,
          props.Moza,
          props.Mouza,
          props.name,
          props.Name,
        ),
        phase: cell(
          props.phase,
          props.Phase,
          props.Ruda_Phase,
          props.folderpath,
          props.project,
        ),
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
      placeholder="Search records..."
      rows={rows}
      onClose={onClose}
      columns={[
        { key: "sr", label: "SR" },
        { key: "mauza", label: "Mouza Name" },
        { key: "area_sqft", label: "Area (sq ft)" },
      ]}
    />
  );
}


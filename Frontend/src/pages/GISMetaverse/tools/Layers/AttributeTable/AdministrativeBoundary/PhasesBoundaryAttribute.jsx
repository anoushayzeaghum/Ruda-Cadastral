import { useEffect, useState } from "react";
import axios from "axios";
import AdminAttributeTableShell, {
  API_BASE,
  formatNumber,
  getMapSourceGeoJSON,
  unwrapGeoJSON,
} from "../AdminAttributeTableShell";

const SOURCE_IDS = [
  "ruda-notified-phases-boundary-source",
  "metaverse-ruda-notified-phases-boundary-source",
  "notified-phases-boundary-source",
];

const readMapData = (map) => {
  for (const sourceId of SOURCE_IDS) {
    const data = getMapSourceGeoJSON(map, sourceId);
    if (data.features.length) return data;
  }
  return { type: "FeatureCollection", features: [] };
};

export default function PhasesBoundaryAttribute({ map, onClose }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadRows = async () => {
      setLoading(true);
      try {
        let geojson = readMapData(map);

        if (!geojson.features.length) {
          const response = await axios.get(
            `${API_BASE}/ruda-notified-phases-boundary/`,
          );
          geojson = unwrapGeoJSON(response.data);
        }

        const formatted = (geojson.features || []).map((feature, index) => {
          const properties = feature.properties || {};

          return {
            id: properties.gid || feature.id || index,
            sr: index + 1,
            phase: properties.phases_new || properties.phases || "-",
            areaAcres: formatNumber(
              properties.area_acre ?? properties.area_acres ?? properties.area,
            ),
            shapeArea: formatNumber(
              properties.shape_area ?? properties.shape_star,
            ),
            geometry: feature.geometry,
          };
        });

        if (active) setRows(formatted);
      } catch (error) {
        console.error("Phases boundary attribute load error:", error);
        if (active) setRows([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadRows();
    return () => {
      active = false;
    };
  }, [map]);

  return (
    <AdminAttributeTableShell
      map={map}
      title="Phases Boundary"
      placeholder="Search phase, area..."
      loading={loading}
      rows={rows}
      onClose={onClose}
      columns={[
        { key: "sr", label: "SR" },
        { key: "phase", label: "Phase" },
        { key: "areaAcres", label: "Area (Acres)" },
        { key: "shapeArea", label: "Shape Area" },
      ]}
    />
  );
}

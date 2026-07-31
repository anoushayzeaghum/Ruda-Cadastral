import { useEffect, useState } from "react";
import axios from "axios";
import AdminAttributeTableShell, {
  API_BASE,
  formatNumber,
  getMapSourceGeoJSON,
  unwrapGeoJSON,
} from "../AdminAttributeTableShell";

const SOURCE_IDS = [
  "ruda-notified-boundary-source",
  "metaverse-ruda-notified-boundary-source",
  "ruda-jurisdiction-source",
];

const readMapData = (map) => {
  for (const sourceId of SOURCE_IDS) {
    const data = getMapSourceGeoJSON(map, sourceId);
    if (data.features.length) return data;
  }
  return { type: "FeatureCollection", features: [] };
};

export default function NotifiedBoundaryAttribute({ map, onClose }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadRows = async () => {
      setLoading(true);
      try {
        let geojson = readMapData(map);

        if (!geojson.features.length) {
          const response = await axios.get(`${API_BASE}/ruda-jurisdiction/`);
          geojson = unwrapGeoJSON(response.data);
        }

        const formatted = (geojson.features || []).map((feature, index) => {
          const properties = feature.properties || {};

          return {
            id: properties.gid || feature.id || index,
            sr: index + 1,
            phase: properties.phases || properties.phase || "-",
            district: properties.districts || properties.district || "-",
            area: formatNumber(
              properties.area_usacr ?? properties.area ?? properties.area_acre,
            ),
            shapeArea: formatNumber(
              properties.shape_area ?? properties.shape_star ?? properties.area_usacr,
            ),
            geometry: feature.geometry,
          };
        });

        if (active) setRows(formatted);
      } catch (error) {
        console.error("Notified boundary attribute load error:", error);
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
      title="Notified Boundary"
      placeholder="Search phase, district, area..."
      loading={loading}
      rows={rows}
      onClose={onClose}
      columns={[
        { key: "sr", label: "SR" },
        { key: "phase", label: "Phase" },
        { key: "district", label: "District" },
        { key: "area", label: "Area" },
        { key: "shapeArea", label: "Shape Area" },
      ]}
    />
  );
}

import { useEffect, useState } from "react";
import axios from "axios";
import AdminAttributeTableShell, {
  API_BASE,
  formatNumber,
  getMapSourceGeoJSON,
  unwrapGeoJSON,
} from "../AdminAttributeTableShell";

const SOURCE_IDS = [
  "district-boundary-source",
  "metaverse-district-boundary-source",
  "district-source",
];

const readMapData = (map) => {
  for (const sourceId of SOURCE_IDS) {
    const data = getMapSourceGeoJSON(map, sourceId);
    if (data.features.length) return data;
  }
  return { type: "FeatureCollection", features: [] };
};

export default function DistrictBoundaryAttribute({ map, onClose }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadRows = async () => {
      setLoading(true);
      try {
        let geojson = readMapData(map);

        if (!geojson.features.length) {
          const response = await axios.get(`${API_BASE}/district/`);
          geojson = unwrapGeoJSON(response.data);
        }

        const formatted = (geojson.features || []).map((feature, index) => {
          const properties = feature.properties || {};

          return {
            id: properties.gid || properties.id || feature.id || index,
            sr: index + 1,
            name: properties.name || "-",
            totalArea: formatNumber(
              properties.total_area ??
                properties.area ??
                properties.shape_star ??
                properties.shape_stle,
            ),
            geometry: feature.geometry,
          };
        });

        if (active) setRows(formatted);
      } catch (error) {
        console.error("District boundary attribute load error:", error);
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
      title="District Boundary"
      placeholder="Search district name, total area..."
      loading={loading}
      rows={rows}
      onClose={onClose}
      columns={[
        { key: "sr", label: "SR" },
        { key: "name", label: "Name" },
        { key: "totalArea", label: "Total Area" },
      ]}
    />
  );
}

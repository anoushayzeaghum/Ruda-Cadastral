import { useEffect, useState } from "react";
import axios from "axios";
import AdminAttributeTableShell, {
  API_BASE,
  formatNumber,
  getMapSourceGeoJSON,
  unwrapGeoJSON,
} from "../AdminAttributeTableShell";

const EMPTY_FC = { type: "FeatureCollection", features: [] };

const firstValue = (...values) =>
  values.find(
    (value) =>
      value !== undefined && value !== null && String(value).trim() !== "",
  ) ?? "-";

export const textValue = (...values) => firstValue(...values);

export const numberValue = (...values) => {
  const value = firstValue(...values);
  return value === "-" ? "-" : formatNumber(value);
};

const readMapData = (map, sourceIds = []) => {
  for (const sourceId of sourceIds) {
    const geojson = getMapSourceGeoJSON(map, sourceId);
    if (geojson.features.length) return geojson;
  }
  return EMPTY_FC;
};

export default function RudaMasterPlanAttributeTable({
  map,
  onClose,
  title,
  placeholder,
  endpoint,
  sourceIds,
  columns,
  formatFeature,
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadRows = async () => {
      setLoading(true);
      try {
        let geojson = readMapData(map, sourceIds);

        if (!geojson.features.length) {
          const response = await axios.get(`${API_BASE}${endpoint}`);
          geojson = unwrapGeoJSON(response.data);
        }

        const formatted = (geojson.features || []).map((feature, index) => ({
          id: feature.properties?.gid ?? feature.id ?? index,
          sr: index + 1,
          ...formatFeature(feature.properties || {}, feature, index),
          geometry: feature.geometry,
        }));

        if (active) setRows(formatted);
      } catch (error) {
        console.error(`${title} attribute load error:`, error);
        if (active) setRows([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadRows();
    return () => {
      active = false;
    };
  }, [map, endpoint, sourceIds, title, formatFeature]);

  return (
    <AdminAttributeTableShell
      map={map}
      title={title}
      placeholder={placeholder}
      loading={loading}
      rows={rows}
      onClose={onClose}
      columns={columns}
    />
  );
}

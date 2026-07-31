import { useEffect, useState } from "react";
import axios from "axios";
import AdminAttributeTableShell, {
  API_BASE,
  formatNumber,
  getMapSourceGeoJSON,
  unwrapGeoJSON,
} from "../AdminAttributeTableShell";

const EMPTY_FC = { type: "FeatureCollection", features: [] };

const hasValue = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

export const textValue = (...values) => {
  const value = values.find(hasValue);
  return hasValue(value) ? String(value) : "-";
};

export const numberValue = (...values) => {
  const value = values.find(hasValue);
  return hasValue(value) ? formatNumber(value) : "-";
};

export const areaSqftValue = (...values) => {
  const value = values.find(hasValue);
  return hasValue(value) ? formatNumber(value) : "-";
};

const normalizeGeoJSON = (value) => {
  if (value?.type === "FeatureCollection") return value;
  if (Array.isArray(value?.features)) {
    return { type: "FeatureCollection", features: value.features };
  }
  return EMPTY_FC;
};

const readMapData = (map, sourceIds = []) => {
  for (const sourceId of sourceIds) {
    const geojson = getMapSourceGeoJSON(map, sourceId);
    if (geojson?.features?.length) return geojson;
  }
  return EMPTY_FC;
};

export default function CadastralAttributeTable({
  map,
  geojson,
  onClose,
  title,
  placeholder,
  endpoint,
  sourceIds = [],
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
        let collection = normalizeGeoJSON(geojson);

        if (!collection.features.length) {
          collection = readMapData(map, sourceIds);
        }

        if (!collection.features.length && endpoint) {
          const response = await axios.get(`${API_BASE}${endpoint}`);
          collection = unwrapGeoJSON(response.data);
        }

        const formattedRows = (collection.features || []).map(
          (feature, index) => ({
            id:
              feature?.properties?.gid ??
              feature?.properties?.id ??
              feature?.id ??
              index,
            sr: index + 1,
            ...formatFeature(feature?.properties || {}, feature, index),
            geometry: feature?.geometry || null,
          }),
        );

        if (active) setRows(formattedRows);
      } catch (error) {
        console.error(`${title} attribute table load error:`, error);
        if (active) setRows([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadRows();

    return () => {
      active = false;
    };
  }, [map, geojson, endpoint, sourceIds, title, formatFeature]);

  return (
    <AdminAttributeTableShell
      map={map}
      title={title}
      placeholder={placeholder}
      loading={loading}
      rows={rows}
      columns={columns}
      onClose={onClose}
    />
  );
}

import { useEffect, useState } from "react";
import AdminAttributeTableShell, {
  formatNumber,
  getMapSourceGeoJSON,
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

const normalizeGeoJSON = (value) => {
  const raw = value?.data || value?.results || value;
  if (raw?.type === "FeatureCollection") return raw;
  if (Array.isArray(raw?.features)) {
    return { type: "FeatureCollection", features: raw.features };
  }
  if (Array.isArray(raw)) {
    return { type: "FeatureCollection", features: raw };
  }
  return EMPTY_FC;
};

export default function BaseDataAttributeTable({
  map,
  geojson,
  onClose,
  title,
  placeholder,
  sourceIds = [],
  fetchGeoJSON,
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
          for (const sourceId of sourceIds) {
            const sourceCollection = normalizeGeoJSON(
              getMapSourceGeoJSON(map, sourceId),
            );
            if (sourceCollection.features.length) {
              collection = sourceCollection;
              break;
            }
          }
        }

        if (!collection.features.length && fetchGeoJSON) {
          collection = normalizeGeoJSON(await fetchGeoJSON());
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
  }, [map, geojson, sourceIds, fetchGeoJSON, title, formatFeature]);

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

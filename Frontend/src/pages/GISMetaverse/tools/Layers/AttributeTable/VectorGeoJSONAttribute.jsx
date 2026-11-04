import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import AdminAttributeTableShell, {
  API_BASE,
  getMapSourceGeoJSON,
} from "./AdminAttributeTableShell";

/**
 * Attribute table for GeoJSON map sources and backend list/GeoJSON endpoints.
 * All fields are driven by actual feature properties, not an assumed DB schema.
 * Optional preferredFields chooses order/display names without adding absent fields.
 */
const OMIT_FIELDS = new Set([
  "geom", "geometry", "geography", "bbox", "wkb_geometry", "the_geom",
  "path", "file_path", "filepath", "image_path", "raster_path",
  "source_path", "file_url", "geometry_wkt", "geojson", "created_at",
  "updated_at", "project_id", // project scope is controlled by the project selector
]);

const isEmpty = (v) =>
  v === null || v === undefined ||
  (typeof v === "string" && (v.trim() === "" || v.trim() === "-" || v.trim().toLowerCase() === "null")) ||
  (Array.isArray(v) && !v.length);

const isUsefulField = (key) => {
  const lower = String(key).toLowerCase();
  return !OMIT_FIELDS.has(lower) && !/(^|_)(path|filepath|wkt)$/.test(lower);
};

const extractFeatures = (response) => {
  const value = response?.data?.data ?? response?.data?.results ?? response?.data ?? response;
  const items = Array.isArray(value) ? value : Array.isArray(value?.features) ? value.features : [];
  return items.map((item) => {
    if (item?.type === "Feature" && item.properties) return item;
    const { geom, geometry, ...properties } = item || {};
    return { type: "Feature", properties, geometry: geometry || geom || null };
  });
};

const humanLabel = (key) => String(key)
  .replace(/_/g, " ")
  .replace(/([a-z])([A-Z])/g, "$1 $2")
  .replace(/\b\w/g, (m) => m.toUpperCase());

export default function VectorGeoJSONAttribute({
  map, onClose, title, sourceIds = [], endpoint, publicUrl,
  selectedProjectId, filterProperties, filterField, filterValue, preferredFields = [],
  onlyPreferred = false,
}) {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const sourceKey = sourceIds.join("|");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        let results = [];
        for (const id of sourceKey.split("|").filter(Boolean)) {
          const source = getMapSourceGeoJSON(map, id);
          if (source.features?.length) {
            results = source.features;
            break;
          }
        }
        if (!results.length && endpoint) {
          const response = await axios.get(`${API_BASE.replace(/\/$/, "")}${endpoint}`, {
            params: selectedProjectId ? { project_id: selectedProjectId } : {},
          });
          results = extractFeatures(response);
        }
        if (!results.length && publicUrl) {
          const response = await axios.get(publicUrl);
          results = extractFeatures(response);
        }
        if (selectedProjectId) {
          results = results.filter((feature) => {
            const p = feature?.properties || {};
            const scoped = p.project_id ?? p.projectId;
            return scoped == null || String(scoped) === String(selectedProjectId);
          });
        }
        if (filterField) {
          results = results.filter((feature) =>
            String(feature?.properties?.[filterField]) === String(filterValue));
        }
        if (filterProperties) {
          results = results.filter((feature) => filterProperties(feature?.properties || {}, feature));
        }
        if (active) setFeatures(results);
      } catch (err) {
        console.error(`${title} attribute table fetch failed:`, err);
        if (active) {
          setFeatures([]);
          setError(err?.response?.data?.message || err.message || "Unable to load attributes");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [map, sourceKey, endpoint, publicUrl, selectedProjectId, filterProperties, filterField, filterValue, title]);

  const { columns, rows } = useMemo(() => {
    const keys = [];
    const seen = new Set();
    for (const field of preferredFields) {
      const key = typeof field === "string" ? field : field.key;
      if (!seen.has(key)) { keys.push(key); seen.add(key); }
    }
    if (!onlyPreferred) {
      for (const feature of features) {
        for (const key of Object.keys(feature?.properties || {})) {
          if (!seen.has(key)) { keys.push(key); seen.add(key); }
        }
      }
    }
    const activeKeys = keys.filter((key) => isUsefulField(key) &&
      features.some((feature) => !isEmpty(feature?.properties?.[key]) &&
        typeof feature.properties[key] !== "object"));
    const columns = activeKeys.map((key) => ({
      key,
      label: preferredFields.find((field) => typeof field === "object" && field.key === key)?.label || humanLabel(key),
    }));
    const rows = features.map((feature, index) => ({
      _rowKey: feature.id ?? index,
      geometry: feature.geometry,
      ...Object.fromEntries(activeKeys.map((key) => [key, feature?.properties?.[key]])),
    }));
    return { columns, rows };
  }, [features, preferredFields, onlyPreferred]);

  return (
    <AdminAttributeTableShell
      map={map}
      title={title}
      placeholder={`Search ${title} attributes...`}
      columns={columns}
      rows={rows}
      loading={loading}
      error={error}
      onClose={onClose}
    />
  );
}

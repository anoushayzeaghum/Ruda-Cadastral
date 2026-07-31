import { useEffect, useState } from "react";
import axios from "axios";
import AdminAttributeTableShell, {
  API_BASE,
  formatNumber,
  getMapSourceGeoJSON,
  unwrapGeoJSON,
} from "../AdminAttributeTableShell";

const SOURCE_IDS = [
  "metaverse-geodetic-network-source",
  "metaverse-geodetic-points-source",
];

const COLUMNS = [
  { key: "sr", label: "SR" },
  { key: "name", label: "Point Name" },
  { key: "code", label: "Code" },
  { key: "easting", label: "Easting (m)" },
  { key: "northing", label: "Northing (m)" },
  { key: "elevation", label: "Elevation" },
];

const value = (input) =>
  input !== undefined && input !== null && String(input).trim() !== ""
    ? String(input)
    : "-";

const numericValue = (input) =>
  input !== undefined && input !== null && input !== ""
    ? formatNumber(input)
    : "-";

export default function GeodeticNetworkAttribute({ map, geojson, onClose }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadRows = async () => {
      setLoading(true);
      try {
        let collection = geojson;

        if (!collection?.features?.length) {
          for (const sourceId of SOURCE_IDS) {
            const sourceData = getMapSourceGeoJSON(map, sourceId);
            if (sourceData?.features?.length) {
              collection = sourceData;
              break;
            }
          }
        }

        if (!collection?.features?.length) {
          const response = await axios.get(`${API_BASE}/geodeticnetwork/`);
          collection = unwrapGeoJSON(response.data);
        }

        const formattedRows = (collection?.features || []).map(
          (feature, index) => {
            const properties = feature?.properties || {};
            return {
              id: properties.gid ?? feature?.id ?? index,
              sr: index + 1,
              name: value(properties.name),
              code: value(properties.code),
              easting: numericValue(properties.easting_m),
              northing: numericValue(properties.northing_m),
              elevation: numericValue(properties.elevation),
              geometry: feature?.geometry || null,
            };
          },
        );

        if (active) setRows(formattedRows);
      } catch (error) {
        console.error("Geodetic Network attribute table load error:", error);
        if (active) setRows([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadRows();
    return () => {
      active = false;
    };
  }, [map, geojson]);

  return (
    <AdminAttributeTableShell
      map={map}
      title="Geodetic Network"
      placeholder="Search point name, code, or elevation..."
      loading={loading}
      rows={rows}
      columns={COLUMNS}
      onClose={onClose}
    />
  );
}

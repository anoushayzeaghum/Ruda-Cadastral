import { useEffect, useState } from "react";
import axios from "axios";
import AdminAttributeTableShell, {
  API_BASE,
  formatNumber,
  getMapSourceGeoJSON,
  unwrapGeoJSON,
} from "../AdminAttributeTableShell";

const SQ_METERS_PER_ACRE = 4046.8564224;
const SOURCE_IDS = [
  "tehsil-boundary-source",
  "metaverse-tehsil-boundary-source",
  "tehsil-source",
];

const readMapData = (map) => {
  for (const sourceId of SOURCE_IDS) {
    const data = getMapSourceGeoJSON(map, sourceId);
    if (data.features.length) return data;
  }
  return { type: "FeatureCollection", features: [] };
};

const readAreaAcres = (properties = {}) => {
  const direct = Number(
    properties.area_acre ?? properties.area_acres ?? properties.acres,
  );
  if (Number.isFinite(direct)) return direct;

  const shapeArea = Number(properties.shape_star ?? properties.shape_area);
  return Number.isFinite(shapeArea) ? shapeArea / SQ_METERS_PER_ACRE : null;
};

export default function TehsilBoundaryAttribute({ map, onClose }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadRows = async () => {
      setLoading(true);
      try {
        let geojson = readMapData(map);

        if (!geojson.features.length) {
          const response = await axios.get(`${API_BASE}/tehsil/`);
          geojson = unwrapGeoJSON(response.data);
        }

        const formatted = (geojson.features || []).map((feature, index) => {
          const properties = feature.properties || {};

          return {
            id: properties.gid || properties.id || feature.id || index,
            sr: index + 1,
            tehsil: properties.name || properties.tehsil || "-",
            district:
              properties.district_name ||
              properties.districts ||
              properties.district ||
              "-",
            areaAcres: formatNumber(readAreaAcres(properties)),
            geometry: feature.geometry,
          };
        });

        if (active) setRows(formatted);
      } catch (error) {
        console.error("Tehsil boundary attribute load error:", error);
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
      title="Tehsil Boundary"
      placeholder="Search tehsil, district, area..."
      loading={loading}
      rows={rows}
      onClose={onClose}
      columns={[
        { key: "sr", label: "SR" },
        { key: "tehsil", label: "Tehsil" },
        { key: "district", label: "District" },
        { key: "areaAcres", label: "Area (Acres)" },
      ]}
    />
  );
}

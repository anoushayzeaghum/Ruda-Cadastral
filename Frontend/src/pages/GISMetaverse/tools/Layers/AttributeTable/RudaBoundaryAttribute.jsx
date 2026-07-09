import { useEffect, useState } from "react";
import axios from "axios";
import AdminAttributeTableShell, { API_BASE, formatNumber, getMapSourceGeoJSON, unwrapGeoJSON } from "./AdminAttributeTableShell";
import { readAreaSqft } from "./areaUtils";

const SOURCE_ID = "metaverse-ruda-boundary-source";

export default function RudaBoundaryAttribute({ map, onClose }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadRows = async () => {
      setLoading(true);
      try {
        let geojson = getMapSourceGeoJSON(map, SOURCE_ID);

        if (!geojson.features.length) {
          const res = await axios.get(`${API_BASE}/ruda/`);
          geojson = unwrapGeoJSON(res.data);
        }

        const formatted = (geojson.features || []).map((feature, index) => {
          const props = feature.properties || {};
          const areaSqft = readAreaSqft(feature);

          return {
            id: props.gid || feature.id || index,
            sr: index + 1,
            name: props.name || props.phase || props.folderpath || `RUDA Boundary ${index + 1}`,
            area_sqft: formatNumber(areaSqft),
            geometry: feature.geometry,
          };
        });

        if (active) setRows(formatted);
      } catch (error) {
        console.error("RUDA boundary attribute load error:", error);
        if (active) setRows([]);
      }
      if (active) setLoading(false);
    };

    loadRows();
    return () => {
      active = false;
    };
  }, [map]);

  return (
    <AdminAttributeTableShell
      map={map}
      title="Ruda Boundary"
      placeholder="Search RUDA boundary..."
      loading={loading}
      rows={rows}
      onClose={onClose}
      columns={[
        { key: "sr", label: "SR" },
        { key: "name", label: "Name" },
        { key: "area_sqft", label: "Area (sq ft)" },
      ]}
    />
  );
}

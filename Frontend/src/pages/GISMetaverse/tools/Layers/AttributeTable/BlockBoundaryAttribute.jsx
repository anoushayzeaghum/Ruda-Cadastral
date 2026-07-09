import { useEffect, useState } from "react";
import axios from "axios";
import AdminAttributeTableShell, { API_BASE, formatNumber, getMapSourceGeoJSON, unwrapGeoJSON } from "./AdminAttributeTableShell";

const SOURCE_ID = "metaverse-block-source";

export default function BlockBoundaryAttribute({ map, selectedProjectId, onClose }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadRows = async () => {
      setLoading(true);
      try {
        let geojson = getMapSourceGeoJSON(map, SOURCE_ID);

        if (!geojson.features.length) {
          const res = await axios.get(`${API_BASE}/block/`, {
            params: selectedProjectId ? { project_id: selectedProjectId } : {},
          });
          geojson = unwrapGeoJSON(res.data);
        }

        const formatted = (geojson.features || []).map((feature, index) => {
          const props = feature.properties || {};
          return {
            id: props.gid || feature.id || index,
            sr: index + 1,
            name: props.name || "-",
            area: formatNumber(props.area),
            block: props.block || "-",
            geometry: feature.geometry,
          };
        });

        if (active) setRows(formatted);
      } catch (error) {
        console.error("Block boundary attribute load error:", error);
        if (active) setRows([]);
      }
      if (active) setLoading(false);
    };

    loadRows();
    return () => {
      active = false;
    };
  }, [map, selectedProjectId]);

  return (
    <AdminAttributeTableShell
      map={map}
      title="Block Boundary"
      placeholder="Search block name, area..."
      loading={loading}
      rows={rows}
      onClose={onClose}
      columns={[
        { key: "sr", label: "SR" },
        { key: "name", label: "Name" },
        { key: "area", label: "Area" },
        { key: "block", label: "Block" },
      ]}
    />
  );
}

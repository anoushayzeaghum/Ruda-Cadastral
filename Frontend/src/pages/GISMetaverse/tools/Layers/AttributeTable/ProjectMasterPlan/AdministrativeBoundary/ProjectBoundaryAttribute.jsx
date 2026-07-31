import { useEffect, useState } from "react";
import axios from "axios";
import AdminAttributeTableShell, { API_BASE, getMapSourceGeoJSON, unwrapGeoJSON } from "../../AdminAttributeTableShell";

const SOURCE_ID = "metaverse-project-boundary-source";

export default function ProjectBoundaryAttribute({ map, selectedProjectId, onClose }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadRows = async () => {
      setLoading(true);
      try {
        let geojson = getMapSourceGeoJSON(map, SOURCE_ID);

        if (!geojson.features.length) {
          const res = await axios.get(`${API_BASE}/project/`, {
            params: selectedProjectId ? { gid: selectedProjectId } : {},
          });
          geojson = unwrapGeoJSON(res.data);
        }

        const formatted = (geojson.features || []).map((feature, index) => {
          const props = feature.properties || {};
          return {
            id: props.gid || feature.id || index,
            sr: index + 1,
            name: props.name || "-",
            type: props.type || "-",
            brief_name: props.brief_name || "-",
            geometry: feature.geometry,
          };
        });

        if (active) setRows(formatted);
      } catch (error) {
        console.error("Project boundary attribute load error:", error);
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
      title="Project Boundary"
      placeholder="Search project name, type, brief name..."
      loading={loading}
      rows={rows}
      onClose={onClose}
      columns={[
        { key: "sr", label: "SR" },
        { key: "name", label: "Name" },
        { key: "type", label: "Type" },
        { key: "brief_name", label: "Brief Name" },
      ]}
    />
  );
}

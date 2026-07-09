import { useEffect, useState } from "react";
import axios from "axios";
import AdminAttributeTableShell, { API_BASE, getMapSourceGeoJSON, unwrapGeoJSON } from "./AdminAttributeTableShell";

const SOURCE_ID = "metaverse-contours-source";

export default function ContoursAttribute({ map, selectedProjectId, onClose }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [projectName, setProjectName] = useState("-");

  useEffect(() => {
    let active = true;

    const loadRows = async () => {
      setLoading(true);
      try {
        if (selectedProjectId) {
          try {
            const projectRes = await axios.get(`${API_BASE}/project/`, { params: { gid: selectedProjectId } });
            const project = unwrapGeoJSON(projectRes.data).features?.[0]?.properties;
            if (active) setProjectName(project?.name || String(selectedProjectId));
          } catch (projectError) {
            if (active) setProjectName(String(selectedProjectId));
          }
        }

        let geojson = getMapSourceGeoJSON(map, SOURCE_ID);

        if (!geojson.features.length) {
          const res = await axios.get(`${API_BASE}/contour/`, {
            params: selectedProjectId ? { project_id: selectedProjectId } : {},
          });
          geojson = unwrapGeoJSON(res.data);
        }

        const formatted = (geojson.features || []).map((feature, index) => {
          const props = feature.properties || {};
          return {
            id: props.gid || feature.id || index,
            sr: index + 1,
            name: props.name || `Contour ${props.gid || index + 1}`,
            layer: props.layer || "-",
            elevation: props.elevation || "-",
            closed_connection: props.closed_connection || props.closed || props.connection || "-",
            project: projectName === "-" ? String(selectedProjectId || "-") : projectName,
            geometry: feature.geometry,
          };
        });

        if (active) setRows(formatted);
      } catch (error) {
        console.error("Contours attribute load error:", error);
        if (active) setRows([]);
      }
      if (active) setLoading(false);
    };

    loadRows();
    return () => {
      active = false;
    };
  }, [map, selectedProjectId, projectName]);

  return (
    <AdminAttributeTableShell
      map={map}
      title="Contours"
      placeholder="Search contour, elevation, project..."
      loading={loading}
      rows={rows}
      onClose={onClose}
      columns={[
        { key: "sr", label: "SR" },
        { key: "name", label: "Name" },
        { key: "layer", label: "Layer" },
        { key: "elevation", label: "Elevation" },
        { key: "closed_connection", label: "Closed Connection" },
        { key: "project", label: "Project" },
      ]}
    />
  );
}

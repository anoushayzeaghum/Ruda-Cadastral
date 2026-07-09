import { useEffect, useState } from "react";
import axios from "axios";
import AdminAttributeTableShell, { API_BASE, getMapSourceGeoJSON, unwrapGeoJSON } from "./AdminAttributeTableShell";

const SOURCE_ID = "metaverse-roads-source";

export default function RoadsAttribute({ map, selectedProjectId, onClose }) {
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
          const res = await axios.get(`${API_BASE}/road/`, {
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
            block: props.block || "-",
            dimension: props.dimension || "-",
            type: props.type || "-",
            road: props.row || props.road || "-",
            project: projectName === "-" ? String(selectedProjectId || "-") : projectName,
            geometry: feature.geometry,
          };
        });

        if (active) setRows(formatted);
      } catch (error) {
        console.error("Roads attribute load error:", error);
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
      title="Roads"
      placeholder="Search road name, block, dimension, type..."
      loading={loading}
      rows={rows}
      onClose={onClose}
      columns={[
        { key: "sr", label: "SR" },
        { key: "name", label: "Name" },
        { key: "block", label: "Block" },
        { key: "dimension", label: "Dimension" },
        { key: "type", label: "Type" },
        { key: "road", label: "Road" },
        { key: "project", label: "Project" },
      ]}
    />
  );
}

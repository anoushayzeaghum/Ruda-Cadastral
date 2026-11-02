import { useEffect, useState } from "react";
import axios from "axios";
import AdminAttributeTableShell, { API_BASE, getMapSourceGeoJSON, unwrapGeoJSON } from "../../AdminAttributeTableShell";

const SOURCE_ID = "metaverse-spot-level-source";

const coordinateText = (geometry) => {
  let coords = geometry?.coordinates;
  if (!coords) return "-";
  while (Array.isArray(coords?.[0])) coords = coords[0];
  if (!Array.isArray(coords) || coords.length < 2) return "-";
  return `${Number(coords[1]).toFixed(6)}, ${Number(coords[0]).toFixed(6)}`;
};

export default function SpotLevelAttribute({ map, selectedProjectId, onClose }) {
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
          const res = await axios.get(`${API_BASE}/spot-level/`, {
            params: selectedProjectId ? { project_id: selectedProjectId } : {},
          });
          geojson = unwrapGeoJSON(res.data);
        }

        const formatted = (geojson.features || []).map((feature, index) => {
          const props = feature.properties || {};
          return {
            id: props.gid ?? feature.id ?? index,
            objectid: props.OBJECTID ?? props.objectid ?? "-",
            recordId: props.Id ?? props.id ?? "-",
            x: props.X ?? props.x ?? "-",
            y: props.Y ?? props.y ?? "-",
            zz: props.ZZ ?? props.zz ?? "-",
            coordinate: coordinateText(feature.geometry),
            project: projectName === "-" ? String(selectedProjectId || "-") : projectName,
            geometry: feature.geometry,
          };
        });

        if (active) setRows(formatted);
      } catch (error) {
        console.error("Spot level attribute load error:", error);
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
      title="Spot Level"
      placeholder="Search Spot Level OBJECTID, elevation or coordinates..."
      loading={loading}
      rows={rows}
      onClose={onClose}
      columns={[
        { key: "objectid", label: "OBJECTID" },
        { key: "recordId", label: "Id" },
        { key: "x", label: "X" },
        { key: "y", label: "Y" },
        { key: "zz", label: "Elevation (ZZ)" },
        { key: "project", label: "Project" },
      ]}
    />
  );
}

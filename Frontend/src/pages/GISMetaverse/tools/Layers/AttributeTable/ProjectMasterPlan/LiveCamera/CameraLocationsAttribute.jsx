import { useEffect, useState } from "react";
import axios from "axios";
import AdminAttributeTableShell, { API_BASE, formatNumber, getMapSourceGeoJSON, unwrapGeoJSON } from "../../AdminAttributeTableShell";

const SOURCE_ID = "metaverse-camera-locations-source";


const coordinateText = (geometry) => {
  let coords = geometry?.coordinates;
  if (!coords) return "-";
  while (Array.isArray(coords?.[0])) coords = coords[0];
  if (!Array.isArray(coords) || coords.length < 2) return "-";
  return `${Number(coords[1]).toFixed(6)}, ${Number(coords[0]).toFixed(6)}`;
};

const getProjectName = async (selectedProjectId) => {
  if (!selectedProjectId) return "-";
  try {
    const res = await axios.get(`${API_BASE}/project/`, {
      params: { gid: selectedProjectId },
    });
    const geojson = unwrapGeoJSON(res.data);
    const props = geojson.features?.[0]?.properties || {};
    return props.name || props.brief_name || selectedProjectId;
  } catch {
    return selectedProjectId;
  }
};

const rowsFromGeoJSON = (geojson, projectName, mapper) =>
  (geojson.features || []).map((feature, index) => {
    const props = feature.properties || {};
    return {
      sr: index + 1,
      project: props.project_name || props.project || projectName || props.project_id || "-",
      ...mapper(props, feature, index),
    };
  });


export default function CameraLocationsAttribute({ map, selectedProjectId, onClose }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadRows = async () => {
      if (!selectedProjectId) {
        setRows([]);
        return;
      }

      setLoading(true);
      try {
        const projectName = await getProjectName(selectedProjectId);
        let geojson = getMapSourceGeoJSON(map, SOURCE_ID);

        if (!geojson.features?.length) {
          const res = await axios.get(`${API_BASE}/camera-location/`, {
            params: { project_id: selectedProjectId },
          });
          geojson = unwrapGeoJSON(res.data);
        }

        const formatted = rowsFromGeoJSON(geojson, projectName, (props, feature, index) => ({
          projectName: props.project || projectName || "-",
          camera: props.camera || props.name || "-",
          x: props.x ?? props.longitude ?? coordinateText(feature.geometry).split(", ")[1] ?? "-",
          y: props.y ?? props.latitude ?? coordinateText(feature.geometry).split(", ")[0] ?? "-",
        }));

        if (active) setRows(formatted);
      } catch (error) {
        console.error("Camera Locations attribute load error:", error);
        if (active) setRows([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadRows();

    return () => {
      active = false;
    };
  }, [map, selectedProjectId]);

  return (
    <AdminAttributeTableShell
      map={map}
      title="Camera Locations"
      placeholder="Search camera locations..."
      columns={[
        { key: "sr", label: "Sr No", width: "80px" },
        { key: "projectName", label: "Project Name", width: "180px" },
        { key: "camera", label: "Camera", width: "180px" },
        { key: "x", label: "X", width: "120px" },
        { key: "y", label: "Y", width: "120px" },
      ]}
      rows={rows}
      loading={loading}
      onClose={onClose}
    />
  );
}

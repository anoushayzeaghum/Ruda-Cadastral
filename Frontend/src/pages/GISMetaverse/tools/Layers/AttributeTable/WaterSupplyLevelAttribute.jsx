import { useEffect, useState } from "react";
import axios from "axios";
import AdminAttributeTableShell, { API_BASE, formatNumber, getMapSourceGeoJSON, unwrapGeoJSON } from "./AdminAttributeTableShell";

const SOURCE_ID = "metaverse-water-supply-lines-source";


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


export default function WaterSupplyLevelAttribute({ map, selectedProjectId, onClose }) {
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
          const res = await axios.get(`${API_BASE}/wsl-cb1/`, {
            params: { project_id: selectedProjectId },
          });
          geojson = unwrapGeoJSON(res.data);
        }

        const formatted = rowsFromGeoJSON(geojson, projectName, (props, feature, index) => ({
          dia: props.dia || "-",
          type: props.type || "-",
          name: props.name || props.layer || "-",
          shape_leng: formatNumber(props.shape_leng ?? props.shape_length ?? props.Shape_Leng),
        }));

        if (active) setRows(formatted);
      } catch (error) {
        console.error("Water Supply Levels attribute load error:", error);
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
      title="Water Supply Levels"
      placeholder="Search water supply levels..."
      columns={[
        { key: "sr", label: "Sr No", width: "80px" },
        { key: "dia", label: "Diameter", width: "120px" },
        { key: "type", label: "Type", width: "140px" },
        { key: "name", label: "Layer Name", width: "180px" },
        { key: "shape_leng", label: "Shape Length", width: "140px" },
        { key: "project", label: "Project", width: "180px" },
      ]}
      rows={rows}
      loading={loading}
      onClose={onClose}
    />
  );
}

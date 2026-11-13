import { useEffect, useState } from "react";
import { getProjects } from "../../../../../../services/metaverseApi";
import AdminAttributeTableShell, {
  getMapSourceGeoJSON,
} from "../AdminAttributeTableShell";

const SOURCE_ID = "metaverse-ruda-master-plan-allProjects-source";
const COLUMNS = [
  { key: "sr", label: "SR" },
  { key: "name", label: "Project Name" },
  { key: "brief_name", label: "Brief Name" },
  { key: "phase", label: "Phase" },
  { key: "type", label: "Project Type" },
];

export default function ProjectsAttribute({ map, onClose }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const loadRows = async () => {
      setLoading(true);
      setError("");
      try {
        // When the layer is visible, use its existing geometry so Zoom works.
        const fromMap = getMapSourceGeoJSON(map, SOURCE_ID).features;
        const records = fromMap.length
          ? fromMap.map((feature) => ({
              ...(feature.properties || {}),
              geometry: feature.geometry,
              id: feature.id,
            }))
          : await getProjects();
        const items = Array.isArray(records) ? records : records?.features || [];
        const formatted = items.map((p, index) => {
          const props = p?.properties || p;
          return {
            id: props.gid ?? p.id ?? index,
            sr: index + 1,
            name: props.name || "-",
            brief_name: props.brief_name || "-",
            phase: props.phase || "-",
            type: props.type || "-",
            geometry: p.geometry || p.geom || null,
          };
        });
        if (active) setRows(formatted);
      } catch (err) {
        console.error("Projects attribute table load failed:", err);
        if (active) {
          setRows([]);
          setError("Unable to load the Projects dataset.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadRows();
    return () => { active = false; };
  }, [map]);

  return (
    <AdminAttributeTableShell
      map={map}
      title="Projects"
      placeholder="Search projects by name, phase, or type..."
      rows={rows}
      loading={loading}
      error={error}
      onClose={onClose}
      columns={COLUMNS}
    />
  );
}

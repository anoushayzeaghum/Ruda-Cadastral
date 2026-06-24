import { useEffect, useState } from "react";
import axios from "axios";
import AdminAttributeTableShell, { API_BASE, getMapSourceGeoJSON, unwrapGeoJSON } from "./AdminAttributeTableShell";

const SOURCE_ID = "metaverse-proposed-roads-source";

const getRoadType = (props = {}) =>
  props.type || props.road_type || props.layer || props.name || props.refname || "Other";

export default function ProposedRoadAttribute({ map, onClose }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadRows = async () => {
      setLoading(true);
      try {
        let geojson = getMapSourceGeoJSON(map, SOURCE_ID);

        if (!geojson.features.length) {
          const res = await axios.get(`${API_BASE}/ruda-proposed-roads/`);
          geojson = unwrapGeoJSON(res.data);
        }

        const formatted = (geojson.features || []).map((feature, index) => {
          const props = feature.properties || {};
          return {
            id: props.gid || feature.id || index,
            sr: index + 1,
            road_type: getRoadType(props),
            name: props.name || props.refname || "-",
            entity: props.entity || "-",
            linetype: props.linetype || "-",
            elevation: props.elevation ?? "-",
            linewt: props.linewt ?? "-",
            geometry: feature.geometry,
          };
        });

        if (active) setRows(formatted);
      } catch (error) {
        console.error("Proposed roads attribute load error:", error);
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
      title="Proposed Roads"
      placeholder="Search road type, name, entity..."
      loading={loading}
      rows={rows}
      onClose={onClose}
      columns={[
        { key: "sr", label: "SR" },
        { key: "road_type", label: "Road Type" },
        { key: "name", label: "Name" },
        { key: "entity", label: "Entity" },
        { key: "linetype", label: "Line Type" },
        { key: "elevation", label: "Elevation" },
        { key: "linewt", label: "Line Weight" },
      ]}
    />
  );
}

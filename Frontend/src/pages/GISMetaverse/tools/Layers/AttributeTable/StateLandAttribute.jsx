import { useEffect, useState } from "react";
import axios from "axios";
import AdminAttributeTableShell, {
  API_BASE,
  getMapSourceGeoJSON,
  unwrapGeoJSON,
} from "./AdminAttributeTableShell";

const SOURCE_ID = "metaverse-state-land-source";

export default function StateLandAttribute({ map, onClose }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadRows = async () => {
      setLoading(true);
      try {
        let geojson = getMapSourceGeoJSON(map, SOURCE_ID);

        if (!geojson.features.length) {
          const res = await axios.get(`${API_BASE}/stateland/`);
          geojson = unwrapGeoJSON(res.data);
        }

        const formatted = (geojson.features || []).map((feature, index) => {
          const props = feature.properties || {};
          return {
            id: props.gid || feature.id || index,
            sr: index + 1,
            district: props.district || "-",
            tehsil: props.tehsil || "-",
            mouza: props.mouza || "-",
            square: props.square ?? "-",
            khasra_lab: props.khasra_lab || "-",
            state_land: props.state_land || "-",
            area_sqft: props.area_sqft ?? "-",
            remarks: props.remarks || "-",
            geometry: feature.geometry,
          };
        });

        if (active) setRows(formatted);
      } catch (error) {
        console.error("State Land attribute load error:", error);
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
      title="State Land"
      placeholder="Search district, tehsil, mouza, khasra..."
      loading={loading}
      rows={rows}
      onClose={onClose}
      columns={[
        { key: "sr", label: "SR" },
        { key: "district", label: "District" },
        { key: "tehsil", label: "Tehsil" },
        { key: "mouza", label: "Mouza" },
        { key: "square", label: "Square" },
        { key: "khasra_lab", label: "Khasra" },
        { key: "state_land", label: "State Land" },
        { key: "area_sqft", label: "Area SqFt" },
        { key: "remarks", label: "Remarks" },
      ]}
    />
  );
}

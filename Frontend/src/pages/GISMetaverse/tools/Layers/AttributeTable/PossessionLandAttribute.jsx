import { useEffect, useState } from "react";
import axios from "axios";
import AdminAttributeTableShell, {
  API_BASE,
  getMapSourceGeoJSON,
  unwrapGeoJSON,
} from "./AdminAttributeTableShell";

const SOURCE_ID = "metaverse-possession-land-source";

export default function PossessionLandAttribute({ map, onClose }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadRows = async () => {
      setLoading(true);
      try {
        let geojson = getMapSourceGeoJSON(map, SOURCE_ID);

        if (!geojson.features.length) {
          const res = await axios.get(`${API_BASE}/possessionland/`);
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
            award_zone: props.award_zone || "-",
            projects: props.projects || "-",
            l_type: props.l_type || "-",
            land_owner: props.land_owner || "-",
            lp_name: props.lp_name || "-",
            remarks: props.remarks || "-",
            geometry: feature.geometry,
          };
        });

        if (active) setRows(formatted);
      } catch (error) {
        console.error("Possession Land attribute load error:", error);
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
      title="Possession Land"
      placeholder="Search district, tehsil, mouza, khasra, project..."
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
        { key: "award_zone", label: "Award Zone" },
        { key: "projects", label: "Project" },
        { key: "l_type", label: "Land Type" },
        { key: "land_owner", label: "Land Owner" },
        { key: "lp_name", label: "LP Name" },
        { key: "remarks", label: "Remarks" },
      ]}
    />
  );
}

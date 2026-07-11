import { useEffect, useState } from "react";
import axios from "axios";
import AdminAttributeTableShell, {
  API_BASE,
  getMapSourceGeoJSON,
  unwrapGeoJSON,
} from "./AdminAttributeTableShell";

const SOURCE_ID = "metaverse-awarded-land-source";

export default function AwardedLandAttribute({ map, onClose }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadRows = async () => {
      setLoading(true);
      try {
        let geojson = getMapSourceGeoJSON(map, SOURCE_ID);

        if (!geojson.features.length) {
          const res = await axios.get(`${API_BASE}/awardedland/`);
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
            agri_river: props.agri_river || "-",
            land_type: props.land_type || "-",
            area_sqft: props.area_sqft ?? "-",
            remarks: props.remarks || "-",
            geometry: feature.geometry,
          };
        });

        if (active) setRows(formatted);
      } catch (error) {
        console.error("Awarded Land attribute load error:", error);
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
      title="Awarded Land"
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
        { key: "agri_river", label: "Agri/River" },
        { key: "land_type", label: "Land Type" },
        { key: "area_sqft", label: "Area SqFt" },
        { key: "remarks", label: "Remarks" },
      ]}
    />
  );
}

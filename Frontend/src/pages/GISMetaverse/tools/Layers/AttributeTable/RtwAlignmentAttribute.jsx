import { useEffect, useState } from "react";
import axios from "axios";
import AdminAttributeTableShell, {
  API_BASE,
  getMapSourceGeoJSON,
  unwrapGeoJSON,
} from "./AdminAttributeTableShell";

const SOURCE_ID = "metaverse-rtw-alignment-source";

export default function RtwAlignmentAttribute({ map, onClose }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadRows = async () => {
      setLoading(true);
      try {
        let geojson = getMapSourceGeoJSON(map, SOURCE_ID);

        if (!geojson.features.length) {
          const res = await axios.get(`${API_BASE}/rtwalignment/`);
          geojson = unwrapGeoJSON(res.data);
        }

        const formatted = (geojson.features || []).map((feature, index) => {
          const props = feature.properties || {};
          return {
            id: props.gid || feature.id || index,
            sr: index + 1,
            package: props.package || "-",
            length: props.length || "-",
            area_sqft: props.area_sqft ?? "-",
            area_ac225: props.area_ac225 ?? "-",
            date_: props.date_ || "-",
            geometry: feature.geometry,
          };
        });

        if (active) setRows(formatted);
      } catch (error) {
        console.error("RTW Alignment attribute load error:", error);
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
      title="RTW Alignment"
      placeholder="Search package, length..."
      loading={loading}
      rows={rows}
      onClose={onClose}
      columns={[
        { key: "sr", label: "SR" },
        { key: "package", label: "Package" },
        { key: "length", label: "Length" },
        { key: "area_sqft", label: "Area SqFt" },
        { key: "area_ac225", label: "Area Ac225" },
        { key: "date_", label: "Date" },
      ]}
    />
  );
}

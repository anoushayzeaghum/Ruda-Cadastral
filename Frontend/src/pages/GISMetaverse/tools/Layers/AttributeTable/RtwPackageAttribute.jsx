import { useEffect, useState } from "react";
import axios from "axios";
import AdminAttributeTableShell, {
  API_BASE,
  getMapSourceGeoJSON,
  unwrapGeoJSON,
} from "./AdminAttributeTableShell";

const SOURCE_ID = "metaverse-rtw-package-source";

export default function RtwPackageAttribute({ map, onClose }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadRows = async () => {
      setLoading(true);
      try {
        let geojson = getMapSourceGeoJSON(map, SOURCE_ID);

        if (!geojson.features.length) {
          const res = await axios.get(`${API_BASE}/rtwpackage/`);
          geojson = unwrapGeoJSON(res.data);
        }

        const formatted = (geojson.features || []).map((feature, index) => {
          const props = feature.properties || {};
          return {
            id: props.gid || feature.id || index,
            sr: index + 1,
            package: props.package || "-",
            name: props.name || "-",
            ruda_phase: props.ruda_phase || "-",
            area_acres: props.area_acres ?? "-",
            area_sqkm: props.area_sqkm ?? "-",
            closed: props.closed || "-",
            geometry: feature.geometry,
          };
        });

        if (active) setRows(formatted);
      } catch (error) {
        console.error("RTW Package attribute load error:", error);
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
      title="RTW Packages"
      placeholder="Search package, name, phase..."
      loading={loading}
      rows={rows}
      onClose={onClose}
      columns={[
        { key: "sr", label: "SR" },
        { key: "package", label: "Package" },
        { key: "name", label: "Name" },
        { key: "ruda_phase", label: "RUDA Phase" },
        { key: "area_acres", label: "Area Acres" },
        { key: "area_sqkm", label: "Area SqKm" },
        { key: "closed", label: "Closed" },
      ]}
    />
  );
}

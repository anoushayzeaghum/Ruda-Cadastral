import { useEffect, useState } from "react";
import axios from "axios";
import AdminAttributeTableShell, { API_BASE, getMapSourceGeoJSON, unwrapGeoJSON } from "./AdminAttributeTableShell";

const SOURCE_ID = "metaverse-geodetic-network-source";

export default function GeodeticNetworkAttribute({ map, onClose }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadRows = async () => {
      setLoading(true);
      try {
        let geojson = getMapSourceGeoJSON(map, SOURCE_ID);

        if (!geojson.features.length) {
          const res = await axios.get(`${API_BASE}/geodeticnetwork/`);
          geojson = unwrapGeoJSON(res.data);
        }

        const formatted = (geojson.features || []).map((feature, index) => {
          const props = feature.properties || {};
          return {
            id: props.gid || feature.id || index,
            sr: index + 1,
            name: props.name || "-",
            easting_m: props.easting_m ?? props.easting ?? "-",
            northing_m: props.northing_m ?? props.northing ?? "-",
            elevation: props.elevation ?? "-",
            code: props.code || "-",
            geometry: feature.geometry,
          };
        });

        if (active) setRows(formatted);
      } catch (error) {
        console.error("Geodetic network attribute load error:", error);
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
      title="Geodetic Network"
      placeholder="Search name, code, easting, northing..."
      loading={loading}
      rows={rows}
      onClose={onClose}
      columns={[
        { key: "sr", label: "SR" },
        { key: "name", label: "Name" },
        { key: "easting_m", label: "Easting" },
        { key: "northing_m", label: "Northing" },
        { key: "elevation", label: "Elevation" },
        { key: "code", label: "Code" },
      ]}
    />
  );
}

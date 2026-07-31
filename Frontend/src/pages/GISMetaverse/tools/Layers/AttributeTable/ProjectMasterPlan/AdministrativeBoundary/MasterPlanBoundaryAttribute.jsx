import { useEffect, useState } from "react";
import axios from "axios";
import AdminAttributeTableShell, { API_BASE, formatNumber, getMapSourceGeoJSON, unwrapGeoJSON } from "../../AdminAttributeTableShell";

const SOURCE_ID = "metaverse-masterplan-source";

export default function MasterPlanBoundaryAttribute({ map, selectedProjectId, onClose }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadRows = async () => {
      setLoading(true);
      try {
        let geojson = getMapSourceGeoJSON(map, SOURCE_ID);

        if (!geojson.features.length) {
          const res = await axios.get(`${API_BASE}/plot/`, {
            params: selectedProjectId ? { project_id: selectedProjectId } : {},
          });
          geojson = unwrapGeoJSON(res.data);
        }

        const formatted = (geojson.features || []).map((feature, index) => {
          const props = feature.properties || {};
          const row = {
            id: props.gid || feature.id || index,
            sr: index + 1,
            name: props.name || "-",
            type: props.type || "-",
            plot_no: props.plot_no || "-",
            plot_area: props.plot_area || "-",
            shape_area: formatNumber(props.shape_area),
            possession: props.possession || props.poss_st || "-",
            site_plan: props.site_plan || "-",
            owner: props.tr_own || "-",
            owner_no: props.tr_p_no || props.tr_srno || "-",
            tr_cate: props.tr_cate || "-",
            geometry: feature.geometry,
          };
          console.log('MasterPlanBoundaryAttribute row loaded', row);
          return row;
        });
        console.log('MasterPlanBoundaryAttribute total rows', formatted.length);

        if (active) setRows(formatted);
      } catch (error) {
        console.error("Master plan boundary attribute load error:", error);
        if (active) setRows([]);
      }
      if (active) setLoading(false);
    };

    loadRows();
    return () => {
      active = false;
    };
  }, [map, selectedProjectId]);

  return (
    <AdminAttributeTableShell
      map={map}
      title="Master Plan Boundary"
      placeholder="Search name, type, plot number, owner..."
      loading={loading}
      rows={rows}
      onClose={onClose}
      columns={[
        { key: "sr", label: "SR" },
        { key: "name", label: "Name" },
        { key: "type", label: "Type" },
        { key: "plot_no", label: "Plot No" },
        { key: "plot_area", label: "Plot Area" },
        { key: "shape_area", label: "Shape Area" },
        { key: "possession", label: "Possession" },
        { key: "site_plan", label: "Site Plan" },
        { key: "owner", label: "Ownership" },
        { key: "owner_no", label: "Owner No" },
        { key: "tr_cate", label: "TR Category" },
      ]}
    />
  );
}

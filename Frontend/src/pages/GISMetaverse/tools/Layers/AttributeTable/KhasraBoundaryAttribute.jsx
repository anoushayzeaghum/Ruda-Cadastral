import AdminAttributeTableShell, { formatNumber } from "./AdminAttributeTableShell";
import { readAreaSqft } from "./areaUtils";

const getProps = (feature = {}) => feature.properties || feature || {};

const cell = (...values) => {
  for (const value of values) {
    if (value !== null && value !== undefined && value !== "") return value;
  }
  return "-";
};

const rowsFromGeojson = (geojson, mapper) =>
  (geojson?.features || []).map((feature, index) => ({
    id: getProps(feature).gid || feature.id || index + 1,
    sr: index + 1,
    geometry: feature.geometry,
    ...mapper(feature, index),
  }));

const normalizeType = (value) => {
  const text = String(value || "").trim();
  if (!text) return "-";

  const upper = text.toUpperCase();
  if (upper === "QB" || upper.includes("QILA") || upper.includes("KILA")) {
    return "Kilabandi";
  }

  if (
    upper.includes("MURABBA") ||
    upper.includes("MURABA") ||
    upper.includes("SQUARE")
  ) {
    return "Square";
  }

  return text;
};

export default function KhasraBoundaryAttribute({ map, geojson, onClose }) {
  const rows = rowsFromGeojson(geojson, (feature) => {
    const props = getProps(feature);
    return {
      khasra_name: cell(
        props.join_shp,
        props.kh,
        props.KH,
        props.khasra_no,
        props.khasra_id,
        props.name,
        props.Name,
      ),
      mauza: cell(props.mauza, props.Mauza, props.moza, props.Moza),
      district: cell(props.district, props.District),
      tehsil: cell(props.tehsil, props.Tehsil),
      assessment_circle: cell(props.asse_cir, props.assessment_circle, props.Assessment_Circle),
      type: normalizeType(props.type),
      karam: cell(props.karam),
      khasra_no: cell(props.kh, props.KH, props.khasra_no, props.khasra_id),
      dc_rate: cell(props.dc_rate, props.DC_RATE),
      area_sqft: formatNumber(readAreaSqft(feature)),
    };
  });

  return (
    <AdminAttributeTableShell
      map={map}
      title="Khasra Boundary"
      placeholder="Search khasra boundary..."
      onClose={onClose}
      rows={rows}
      columns={[
        { key: "sr", label: "Sr No." },
        { key: "khasra_name", label: "Khasra Name" },
        { key: "mauza", label: "Mauza" },
        { key: "district", label: "District" },
        { key: "tehsil", label: "Tehsil" },
        { key: "assessment_circle", label: "Assessment Circle" },
        { key: "type", label: "Type" },
        { key: "karam", label: "Karam" },
        { key: "khasra_no", label: "Khasra No." },
        { key: "dc_rate", label: "DC Rate" },
        { key: "area_sqft", label: "Area (sq ft)" },
      ]}
    />
  );
}

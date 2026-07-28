export const getFeatureLatLng = (feature, clickLngLat) => {
  const lngFromClick = clickLngLat?.lng;
  const latFromClick = clickLngLat?.lat;

  if (
    lngFromClick !== undefined &&
    lngFromClick !== null &&
    latFromClick !== undefined &&
    latFromClick !== null &&
    Number.isFinite(Number(lngFromClick)) &&
    Number.isFinite(Number(latFromClick))
  ) {
    return { lat: Number(latFromClick), lng: Number(lngFromClick) };
  }

  const geometry = feature?.geometry;
  const coordinates = geometry?.coordinates;
  if (
    geometry?.type === "Point" &&
    Array.isArray(coordinates) &&
    coordinates.length >= 2 &&
    Number.isFinite(Number(coordinates[0])) &&
    Number.isFinite(Number(coordinates[1]))
  ) {
    return { lat: Number(coordinates[1]), lng: Number(coordinates[0]) };
  }

  return { lat: null, lng: null };
};

const formatCoordinate = (value) => {
  const number = Number(value);
  if (value === null || value === undefined || Number.isNaN(number)) return "-";
  return number.toFixed(6);
};

const escapeHtml = (value) =>
  value == null
    ? ""
    : String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

export const buildUnifiedPopupHtml = (title, rows = []) => {
  const filteredRows = rows.filter(
    ([, value]) =>
      value != null &&
      String(value).trim() !== "" &&
      String(value).trim() !== "-",
  );

  const rowsHtml = filteredRows
    .map(
      ([label, value]) => `
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;border-bottom:1px solid rgba(0,0,0,0.05);padding:7px 0;box-sizing:border-box;">
          <span style="min-width:90px;flex-shrink:0;font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:0.4px;color:#6b7280;">${escapeHtml(label)}:</span>
          <span style="word-break:break-word;text-align:right;font-size:12px;font-weight:500;line-height:1.4;color:#111827;">${escapeHtml(value)}</span>
        </div>`,
    )
    .join("");

  return `
      <div style="width:280px;overflow:hidden;border-radius:10px;background:#fff;color:#111827;box-shadow:0 20px 60px rgba(0,0,0,0.25);outline:1px solid rgba(0,0,0,0.08);">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;border-radius:10px 10px 0 0;background:#111827;padding:12px 16px;">
          <div style="font-size:15px;font-weight:700;letter-spacing:0.3px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${escapeHtml(title)}
          </div>
          <button type="button" data-mapview-popup-close="true" aria-label="Close"
            style="display:flex;flex-shrink:0;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,0.1);font-size:18px;line-height:1;color:#fff;border:none;cursor:pointer;">×</button>
        </div>
        <div style="max-height:272px;overflow-y:auto;padding:10px 14px;scrollbar-width:none;">
          ${
            rowsHtml ||
            '<div style="padding:16px 0;text-align:center;font-size:11px;font-weight:500;color:#9ca3af;">No additional details available.</div>'
          }
        </div>
      </div>`;
};

export const buildPopupRowsForType = (
  layerType,
  properties = {},
  coordinates = null,
) => {
  const props = properties || {};
  const coordinateRows =
    coordinates?.lat != null
      ? [
          ["Latitude", formatCoordinate(coordinates.lat)],
          ["Longitude", formatCoordinate(coordinates.lng)],
        ]
      : [];

  switch (layerType) {
    case "khasra":
      return [
        [
          "Khasra No",
          props.kh ??
            props.KH ??
            props.k ??
            props.K ??
            props.khasra_no ??
            props.khasra_id,
        ],
        ["Mauza", props.mauza ?? props.Mauza ?? props.moza],
        ["Murabba No", props.m ?? props.M ?? props.mn ?? props.murabba_no],
        ["Land Type", props.type ?? props.land_type],
        [
          "Area",
          props._area_acres != null
            ? `${Number(props._area_acres).toFixed(3)} Acres`
            : null,
        ],
        ["DC Rate", props.dc_rate],
        ["Remarks", props.remarks],
      ];
    case "murabba":
      return [
        [
          "Murabba No",
          props.m ??
            props.M ??
            props.mn ??
            props.murabba_no ??
            props.murabba_id,
        ],
        ["Mauza", props.mauza ?? props.Mauza ?? props.moza],
        ["Land Type", props.type ?? props.land_type],
        [
          "Area",
          props._area_acres != null
            ? `${Number(props._area_acres).toFixed(3)} Acres`
            : null,
        ],
        ["Remarks", props.remarks],
      ];
    case "mauza":
      return [
        ["Mauza", props.mauza ?? props.Mauza ?? props.moza ?? props.name],
        ["Tehsil", props.tehsil ?? props.Tehsil],
        ["District", props.district ?? props.District],
      ];
    case "tehsil":
      return [
        ["Tehsil", props.tehsil ?? props.name ?? props.tehsil_name],
        ["District", props.district ?? props.District],
      ];
    case "district":
      return [
        ["District", props.district ?? props.name ?? props.district_name],
        ["Division", props.division ?? props.Division],
      ];
    case "square":
      return [
        ["Square No", props.sq ?? props.SQ ?? props.square ?? props.square_no],
        ["Mauza", props.mauza ?? props.Mauza ?? props.moza],
        ["Tehsil", props.tehsil ?? props.Tehsil],
        ["District", props.district ?? props.District],
      ];
    case "acre":
      return [
        ["Acre No", props.acre ?? props.acre_no ?? props.ac ?? props.name],
        ["Mauza", props.mauza ?? props.Mauza ?? props.moza],
      ];
    case "ruda":
      return [
        ["Phase", props._ruda_phase_label ?? props.phase ?? props.name],
        ["Name", props.name],
      ];
    case "proposedRoad":
      return [
        ["Road Type", props.road_type ?? props.type ?? props.Type ?? props.TYPE],
        ["ROW", props.row ?? props.ROW ?? props.right_of_way],
        ["Road ID", props.gid ?? props.id ?? props.oid ?? props.fid],
      ];
    case "geodetic":
      return [
        ["Name", props.name],
        ["Code", props.code],
        ["Elevation (m)", props.elevation],
        ...coordinateRows,
      ];
    case "fieldPoint":
      return [
        ["Name", props.name],
        ["Code", props.code],
        ["Type", props.gm_type],
        ["Elevation (m)", props.elevation],
        ...coordinateRows,
      ];
    case "trijunction":
      return [
        ["Mauza 1", props.m1],
        ["Mauza 2", props.m2],
        ["Mauza 3", props.m3],
        ...coordinateRows,
      ];
    case "controlPoint":
      return [["Type", "Burji"], ...coordinateRows];
    default:
      return [...coordinateRows];
  }
};

export const POPUP_TITLES = {
  khasra: "Khasra",
  murabba: "Murabba",
  mauza: "Mauza",
  tehsil: "Tehsil",
  district: "District",
  square: "Square",
  acre: "Acre",
  ruda: "RUDA Phase",
  proposedRoad: "Proposed Road",
  geodetic: "Geodetic Point",
  fieldPoint: "Field Point",
  trijunction: "Tri-junction Point",
  controlPoint: "Control Point",
};

import { useEffect, useRef, useState, useCallback } from "react";
import * as turf from "@turf/turf";
import {
  Ruler, Pentagon, Compass, MapPin,
  ChevronRight, Trash2, Info, Check, X,
} from "lucide-react";

// ── Mapbox layer / source IDs ─────────────────────────────────────────────────
const M_DISTANCE_SOURCE = "gism-dist-src";
const M_DISTANCE_LINE   = "gism-dist-line";
const M_DISTANCE_POINTS = "gism-dist-pts";
const M_DISTANCE_LABELS = "gism-dist-lbl";

const M_AREA_SOURCE = "gism-area-src";
const M_AREA_FILL   = "gism-area-fill";
const M_AREA_LINE   = "gism-area-line";
const M_AREA_POINTS = "gism-area-pts";
const M_AREA_LABEL  = "gism-area-lbl";

const M_BEARING_SOURCE = "gism-brg-src";
const M_BEARING_LINE   = "gism-brg-line";
const M_BEARING_POINTS = "gism-brg-pts";
const M_BEARING_LABEL  = "gism-brg-lbl";

const M_COORD_SOURCE = "gism-coord-src";
const M_COORD_POINT  = "gism-coord-pt";
const M_COORD_LABEL  = "gism-coord-lbl";

// ── Unit definitions ──────────────────────────────────────────────────────────
const DISTANCE_UNITS = [
  { id: "m",  label: "m",  convert: (km) => km * 1000,     fmt: (v) => v.toFixed(1)  },
  { id: "km", label: "km", convert: (km) => km,            fmt: (v) => v.toFixed(4)  },
  { id: "ft", label: "ft", convert: (km) => km * 3280.84,  fmt: (v) => v.toFixed(1)  },
  { id: "mi", label: "mi", convert: (km) => km * 0.621371, fmt: (v) => v.toFixed(4)  },
];

const AREA_UNITS = [
  { id: "m2",      label: "m²",    convert: (m2) => m2,                fmt: (v) => Number(v.toFixed(2)).toLocaleString() },
  { id: "km2",     label: "km²",   convert: (m2) => m2 / 1_000_000,    fmt: (v) => v.toFixed(6) },
  { id: "acres",   label: "Acres", convert: (m2) => m2 / 4046.8564224, fmt: (v) => v.toFixed(4) },
  { id: "hectare", label: "ha",    convert: (m2) => m2 / 10_000,       fmt: (v) => v.toFixed(4) },
  { id: "kanal",   label: "Kanal", convert: (m2) => m2 / 505.857,      fmt: (v) => v.toFixed(3) },
  { id: "marla",   label: "Marla", convert: (m2) => m2 / 25.2929,      fmt: (v) => v.toFixed(2) },
];

const BEARING_DIST_UNITS = [
  { id: "m",  label: "m",  convert: (m) => m,           fmt: (v) => v.toFixed(1) },
  { id: "km", label: "km", convert: (m) => m / 1000,    fmt: (v) => v.toFixed(4) },
  { id: "ft", label: "ft", convert: (m) => m * 3.28084, fmt: (v) => v.toFixed(1) },
];

const COORD_FORMATS = [
  { id: "dd",  label: "DD"  },
  { id: "dms", label: "DMS" },
];

const TOOLS = [
  { id: "distance",   label: "Distance",   icon: Ruler,    color: "#ef4444", hint: "Click to add points. Apply to save, Close to discard." },
  { id: "area",       label: "Area",       icon: Pentagon, color: "#3b82f6", hint: "Click to place vertices, right-click to close polygon." },
  { id: "bearing",    label: "Bearing",    icon: Compass,  color: "#f97316", hint: "Click two points to measure bearing & distance." },
  { id: "coordinate", label: "Coordinate", icon: MapPin,   color: "#8b5cf6", hint: "Click anywhere to pick coordinates." },
];

// ── Pure helpers ──────────────────────────────────────────────────────────────
function cleanupLayers(map, layerIds, sourceIds) {
  if (!map) return;
  layerIds.forEach((id)  => { try { if (map.getLayer(id))  map.removeLayer(id);  } catch (_) {} });
  sourceIds.forEach((id) => { try { if (map.getSource(id)) map.removeSource(id); } catch (_) {} });
}

function setSourceData(map, sourceId, data) {
  const src = map.getSource(sourceId);
  if (src) src.setData(data);
}

function toDMS(decimal, isLat) {
  const abs = Math.abs(decimal);
  const deg = Math.floor(abs);
  const minFull = (abs - deg) * 60;
  const min = Math.floor(minFull);
  const sec = ((minFull - min) * 60).toFixed(2);
  const dir = isLat ? (decimal >= 0 ? "N" : "S") : (decimal >= 0 ? "E" : "W");
  return `${deg}°${min}'${sec}"${dir}`;
}

function formatDist(km, unitDef) {
  return `${unitDef.fmt(unitDef.convert(km))} ${unitDef.label}`;
}

function formatArea(m2, unitDef) {
  return `${unitDef.fmt(unitDef.convert(m2))} ${unitDef.label}`;
}

// ── Unit selector pills ───────────────────────────────────────────────────────
function UnitSelector({ options, value, onChange, color }) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className="px-2 py-0.5 rounded text-[10px] font-semibold transition"
          style={
            value === opt.id
              ? { backgroundColor: color + "33", color, border: `1px solid ${color}` }
              : { backgroundColor: "#1a2233", color: "rgba(255,255,255,0.4)", border: "1px solid #344055" }
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Result row ────────────────────────────────────────────────────────────────
function ResultRow({ label, value, color }) {
  return (
    <div className="flex items-center justify-between">
      {label
        ? <span className="text-[10px] text-white/50">{label}</span>
        : <span />
      }
      <span className="font-bold text-[12px]" style={{ color }}>{value}</span>
    </div>
  );
}

function EmptyHint({ children }) {
  return <p className="text-center text-[10px] text-white/40 py-1">{children}</p>;
}

// ── Applied result card (shown after Apply is clicked) ───────────────────────
function AppliedResultCard({ result, onDismiss }) {
  const toolDef = TOOLS.find((t) => t.id === result.tool);
  const Icon = toolDef?.icon;
  return (
    <div
      className="rounded-md border overflow-hidden"
      style={{ borderColor: toolDef?.color + "55", backgroundColor: "#1a2233" }}
    >
      {/* Card header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: toolDef?.color + "33", backgroundColor: toolDef?.color + "11" }}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={12} style={{ color: toolDef.color }} />}
          <span className="text-[11px] font-semibold" style={{ color: toolDef?.color }}>
            {toolDef?.label} Result
          </span>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-white/30 hover:text-red-400 transition"
          title="Remove from map"
        >
          <X size={12} />
        </button>
      </div>

      {/* Card body */}
      <div className="px-3 py-2 space-y-1.5">
        {result.tool === "distance" && (
          <ResultRow label="Total Distance" value={result.display} color={toolDef.color} />
        )}
        {result.tool === "area" && (
          <ResultRow label="Total Area" value={result.display} color={toolDef.color} />
        )}
        {result.tool === "bearing" && (
          <>
            <ResultRow label="Bearing"  value={`${Number(result.bearing).toFixed(2)}°`} color={toolDef.color} />
            <ResultRow label="Distance" value={result.display}                          color={toolDef.color} />
          </>
        )}
        {result.tool === "coordinate" && (
          <>
            <ResultRow label="Latitude"  value={result.lat} color={toolDef.color} />
            <ResultRow label="Longitude" value={result.lng} color={toolDef.color} />
          </>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Measurement({ map }) {
  const [activeTool, setActiveTool] = useState(null);

  // Per-tool unit state
  const [distUnit,    setDistUnit]    = useState("m");
  const [areaUnit,    setAreaUnit]    = useState("m2");
  const [bearingUnit, setBearingUnit] = useState("m");
  const [coordFormat, setCoordFormat] = useState("dd");

  // Raw SI values stored after each measurement
  const [distKm,       setDistKm]       = useState(null);
  const [areaM2,       setAreaM2]       = useState(null);
  const [bearingDeg,   setBearingDeg]   = useState(null);
  const [bearingDistM, setBearingDistM] = useState(null);
  const [coordRaw,     setCoordRaw]     = useState(null);
  const [coordCopied,  setCoordCopied]  = useState(false);

  // Applied results that persist on the map after "Apply"
  // Each entry: { id, tool, display, ...extra }
  const [appliedResults, setAppliedResults] = useState([]);

  // Click-coordinate refs
  const distCoordsRef    = useRef([]);
  const areaCoordsRef    = useRef([]);
  const bearingCoordsRef = useRef([]);

  // ── Derived display values ─────────────────────────────────────────────────
  const distUnitDef    = DISTANCE_UNITS.find((u) => u.id === distUnit);
  const areaUnitDef    = AREA_UNITS.find((u) => u.id === areaUnit);
  const bearingUnitDef = BEARING_DIST_UNITS.find((u) => u.id === bearingUnit);

  const distDisplay        = distKm    != null ? formatDist(distKm,  distUnitDef) : null;
  const areaDisplay        = areaM2    != null ? formatArea(areaM2,  areaUnitDef) : null;
  const bearingDistDisplay = bearingDistM != null
    ? `${bearingUnitDef.fmt(bearingUnitDef.convert(bearingDistM))} ${bearingUnitDef.label}`
    : null;
  const coordDisplay = coordRaw
    ? coordFormat === "dms"
      ? { lat: toDMS(coordRaw.lat, true), lng: toDMS(coordRaw.lng, false) }
      : { lat: coordRaw.lat.toFixed(6),   lng: coordRaw.lng.toFixed(6)   }
    : null;

  // ── Can the current tool be Applied? ──────────────────────────────────────
  const canApply =
    (activeTool === "distance"   && distKm != null) ||
    (activeTool === "area"       && areaM2 != null) ||
    (activeTool === "bearing"    && bearingDeg != null) ||
    (activeTool === "coordinate" && coordRaw != null);

  // ── Refresh map labels when unit changes ───────────────────────────────────
  useEffect(() => {
    if (!map || distKm == null || activeTool !== "distance") return;
    const coords = distCoordsRef.current;
    if (coords.length < 2) return;
    const features = coords.map((c) => turf.point(c));
    features.push(turf.lineString(coords));
    features.push(turf.point(coords[coords.length - 1], { distLabel: formatDist(distKm, distUnitDef) }));
    setSourceData(map, M_DISTANCE_SOURCE, turf.featureCollection(features));
  }, [distUnit]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!map || areaM2 == null || activeTool !== "area") return;
    const coords = areaCoordsRef.current;
    if (coords.length < 3) return;
    const poly = turf.polygon([[...coords, coords[0]]]);
    const features = [
      ...coords.map((c) => turf.point(c)),
      turf.lineString([...coords, coords[0]]),
      poly,
    ];
    const centroid = turf.centroid(poly);
    centroid.properties = { areaLabel: formatArea(areaM2, areaUnitDef) };
    features.push(centroid);
    setSourceData(map, M_AREA_SOURCE, turf.featureCollection(features));
  }, [areaUnit]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!map || bearingDistM == null || activeTool !== "bearing") return;
    const coords = bearingCoordsRef.current;
    if (coords.length !== 2) return;
    const features = coords.map((c) => turf.point(c));
    features.push(turf.lineString(coords));
    const mid = turf.midpoint(turf.point(coords[0]), turf.point(coords[1]));
    mid.properties = {
      bearingLabel: `${Number(bearingDeg).toFixed(2)}°  ·  ${bearingUnitDef.fmt(bearingUnitDef.convert(bearingDistM))} ${bearingUnitDef.label}`,
    };
    features.push(mid);
    setSourceData(map, M_BEARING_SOURCE, turf.featureCollection(features));
  }, [bearingUnit]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── clearAll helper ────────────────────────────────────────────────────────
  const clearAll = useCallback(() => {
    if (!map) return;
    cleanupLayers(
      map,
      [M_DISTANCE_LINE, M_DISTANCE_POINTS, M_DISTANCE_LABELS,
       M_AREA_FILL, M_AREA_LINE, M_AREA_POINTS, M_AREA_LABEL,
       M_BEARING_LINE, M_BEARING_POINTS, M_BEARING_LABEL,
       M_COORD_POINT, M_COORD_LABEL],
      [M_DISTANCE_SOURCE, M_AREA_SOURCE, M_BEARING_SOURCE, M_COORD_SOURCE],
    );
    distCoordsRef.current    = [];
    areaCoordsRef.current    = [];
    bearingCoordsRef.current = [];
    setDistKm(null); setAreaM2(null);
    setBearingDeg(null); setBearingDistM(null);
    setCoordRaw(null); setCoordCopied(false);
    if (map.getCanvas()) map.getCanvas().style.cursor = "";
  }, [map]);

  useEffect(() => () => clearAll(), [clearAll]);

  // ── DISTANCE TOOL ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!map || activeTool !== "distance") return;
    map.getCanvas().style.cursor = "crosshair";

    if (!map.getSource(M_DISTANCE_SOURCE))
      map.addSource(M_DISTANCE_SOURCE, { type: "geojson", data: turf.featureCollection([]) });
    if (!map.getLayer(M_DISTANCE_LINE))
      map.addLayer({ id: M_DISTANCE_LINE, type: "line", source: M_DISTANCE_SOURCE,
        filter: ["==", "$type", "LineString"],
        paint: { "line-color": "#ef4444", "line-width": 2.5, "line-dasharray": [2, 2] } });
    if (!map.getLayer(M_DISTANCE_POINTS))
      map.addLayer({ id: M_DISTANCE_POINTS, type: "circle", source: M_DISTANCE_SOURCE,
        filter: ["==", "$type", "Point"],
        paint: { "circle-radius": 5, "circle-color": "#fff",
                 "circle-stroke-width": 2, "circle-stroke-color": "#ef4444" } });
    if (!map.getLayer(M_DISTANCE_LABELS))
      map.addLayer({ id: M_DISTANCE_LABELS, type: "symbol", source: M_DISTANCE_SOURCE,
        filter: ["has", "distLabel"],
        layout: { "text-field": ["get", "distLabel"],
                  "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
                  "text-size": 13, "text-anchor": "bottom", "text-offset": [0, -1] },
        paint: { "text-color": "#ef4444", "text-halo-color": "#fff", "text-halo-width": 2 } });

    const updateSource = (unitDef) => {
      const coords = distCoordsRef.current;
      const features = coords.map((c) => turf.point(c));
      if (coords.length > 1) {
        const line = turf.lineString(coords);
        features.push(line);
        const km = turf.length(line, { units: "kilometers" });
        setDistKm(km);
        features.push(turf.point(coords[coords.length - 1], { distLabel: formatDist(km, unitDef) }));
      } else {
        setDistKm(null);
      }
      setSourceData(map, M_DISTANCE_SOURCE, turf.featureCollection(features));
    };

    const unitRef = { current: distUnitDef };
    const onClick = (e) => {
      distCoordsRef.current.push([e.lngLat.lng, e.lngLat.lat]);
      updateSource(unitRef.current);
    };
    const onRightClick = (e) => {
      e.preventDefault();
      distCoordsRef.current = [];
      setDistKm(null);
      setSourceData(map, M_DISTANCE_SOURCE, turf.featureCollection([]));
    };

    map.on("click", onClick);
    map.on("contextmenu", onRightClick);

    return () => {
      map.off("click", onClick);
      map.off("contextmenu", onRightClick);
      if (map.getCanvas()) map.getCanvas().style.cursor = "";
      // NOTE: we do NOT remove layers/source here so Applied results stay visible
    };
  }, [map, activeTool]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── AREA TOOL ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!map || activeTool !== "area") return;
    map.getCanvas().style.cursor = "crosshair";

    if (!map.getSource(M_AREA_SOURCE))
      map.addSource(M_AREA_SOURCE, { type: "geojson", data: turf.featureCollection([]) });
    if (!map.getLayer(M_AREA_FILL))
      map.addLayer({ id: M_AREA_FILL, type: "fill", source: M_AREA_SOURCE,
        filter: ["==", "$type", "Polygon"],
        paint: { "fill-color": "#3b82f6", "fill-opacity": 0.15 } });
    if (!map.getLayer(M_AREA_LINE))
      map.addLayer({ id: M_AREA_LINE, type: "line", source: M_AREA_SOURCE,
        filter: ["any", ["==", "$type", "LineString"], ["==", "$type", "Polygon"]],
        paint: { "line-color": "#3b82f6", "line-width": 2, "line-dasharray": [2, 2] } });
    if (!map.getLayer(M_AREA_POINTS))
      map.addLayer({ id: M_AREA_POINTS, type: "circle", source: M_AREA_SOURCE,
        filter: ["==", "$type", "Point"],
        paint: { "circle-radius": 5, "circle-color": "#fff",
                 "circle-stroke-width": 2, "circle-stroke-color": "#3b82f6" } });
    if (!map.getLayer(M_AREA_LABEL))
      map.addLayer({ id: M_AREA_LABEL, type: "symbol", source: M_AREA_SOURCE,
        filter: ["has", "areaLabel"],
        layout: { "text-field": ["get", "areaLabel"],
                  "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
                  "text-size": 12, "text-anchor": "center" },
        paint: { "text-color": "#1d4ed8", "text-halo-color": "#fff", "text-halo-width": 2 } });

    const unitRef = { current: areaUnitDef };

    const updateSource = (closed, unitDef) => {
      const coords = areaCoordsRef.current;
      const features = coords.map((c) => turf.point(c));
      if (coords.length >= 2)
        features.push(turf.lineString(closed ? [...coords, coords[0]] : coords));
      if (closed && coords.length >= 3) {
        const poly = turf.polygon([[...coords, coords[0]]]);
        features.push(poly);
        const m2 = turf.area(poly);
        setAreaM2(m2);
        const centroid = turf.centroid(poly);
        centroid.properties = { areaLabel: formatArea(m2, unitDef) };
        features.push(centroid);
      } else if (!closed) {
        setAreaM2(null);
      }
      setSourceData(map, M_AREA_SOURCE, turf.featureCollection(features));
    };

    const onClick = (e) => {
      areaCoordsRef.current.push([e.lngLat.lng, e.lngLat.lat]);
      updateSource(false, unitRef.current);
    };
    const onRightClick = (e) => {
      e.preventDefault();
      if (areaCoordsRef.current.length >= 3) {
        updateSource(true, unitRef.current);
      } else {
        areaCoordsRef.current = [];
        setAreaM2(null);
        setSourceData(map, M_AREA_SOURCE, turf.featureCollection([]));
      }
    };

    map.on("click", onClick);
    map.on("contextmenu", onRightClick);

    return () => {
      map.off("click", onClick);
      map.off("contextmenu", onRightClick);
      if (map.getCanvas()) map.getCanvas().style.cursor = "";
    };
  }, [map, activeTool]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── BEARING TOOL ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!map || activeTool !== "bearing") return;
    map.getCanvas().style.cursor = "crosshair";

    if (!map.getSource(M_BEARING_SOURCE))
      map.addSource(M_BEARING_SOURCE, { type: "geojson", data: turf.featureCollection([]) });
    if (!map.getLayer(M_BEARING_LINE))
      map.addLayer({ id: M_BEARING_LINE, type: "line", source: M_BEARING_SOURCE,
        filter: ["==", "$type", "LineString"],
        paint: { "line-color": "#f97316", "line-width": 2 } });
    if (!map.getLayer(M_BEARING_POINTS))
      map.addLayer({ id: M_BEARING_POINTS, type: "circle", source: M_BEARING_SOURCE,
        filter: ["==", "$type", "Point"],
        paint: { "circle-radius": 6, "circle-color": "#fff",
                 "circle-stroke-width": 2, "circle-stroke-color": "#f97316" } });
    if (!map.getLayer(M_BEARING_LABEL))
      map.addLayer({ id: M_BEARING_LABEL, type: "symbol", source: M_BEARING_SOURCE,
        filter: ["has", "bearingLabel"],
        layout: { "text-field": ["get", "bearingLabel"],
                  "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
                  "text-size": 13, "text-anchor": "bottom", "text-offset": [0, -1] },
        paint: { "text-color": "#c2410c", "text-halo-color": "#fff", "text-halo-width": 2 } });

    const unitRef = { current: bearingUnitDef };

    const updateSource = (unitDef) => {
      const coords = bearingCoordsRef.current;
      const features = coords.map((c) => turf.point(c));
      if (coords.length === 2) {
        features.push(turf.lineString(coords));
        const deg   = turf.bearing(turf.point(coords[0]), turf.point(coords[1]));
        const distM = turf.distance(turf.point(coords[0]), turf.point(coords[1]), { units: "meters" });
        setBearingDeg(deg);
        setBearingDistM(distM);
        const mid = turf.midpoint(turf.point(coords[0]), turf.point(coords[1]));
        mid.properties = {
          bearingLabel: `${deg.toFixed(2)}°  ·  ${unitDef.fmt(unitDef.convert(distM))} ${unitDef.label}`,
        };
        features.push(mid);
      } else {
        setBearingDeg(null);
        setBearingDistM(null);
      }
      setSourceData(map, M_BEARING_SOURCE, turf.featureCollection(features));
    };

    const onClick = (e) => {
      if (bearingCoordsRef.current.length >= 2)
        bearingCoordsRef.current = [[e.lngLat.lng, e.lngLat.lat]];
      else
        bearingCoordsRef.current.push([e.lngLat.lng, e.lngLat.lat]);
      updateSource(unitRef.current);
    };
    const onRightClick = (e) => {
      e.preventDefault();
      bearingCoordsRef.current = [];
      setBearingDeg(null); setBearingDistM(null);
      setSourceData(map, M_BEARING_SOURCE, turf.featureCollection([]));
    };

    map.on("click", onClick);
    map.on("contextmenu", onRightClick);

    return () => {
      map.off("click", onClick);
      map.off("contextmenu", onRightClick);
      if (map.getCanvas()) map.getCanvas().style.cursor = "";
    };
  }, [map, activeTool]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── COORDINATE PICKER TOOL ─────────────────────────────────────────────────
  useEffect(() => {
    if (!map || activeTool !== "coordinate") return;
    map.getCanvas().style.cursor = "crosshair";

    if (!map.getSource(M_COORD_SOURCE))
      map.addSource(M_COORD_SOURCE, { type: "geojson", data: turf.featureCollection([]) });
    if (!map.getLayer(M_COORD_POINT))
      map.addLayer({
        id: M_COORD_POINT, type: "circle", source: M_COORD_SOURCE,
        filter: ["==", "$type", "Point"],
        paint: { "circle-radius": 7, "circle-color": "#8b5cf6",
                 "circle-stroke-width": 2.5, "circle-stroke-color": "#fff" },
      });
    if (!map.getLayer(M_COORD_LABEL))
      map.addLayer({
        id: M_COORD_LABEL, type: "symbol", source: M_COORD_SOURCE,
        filter: ["has", "coordLabel"],
        layout: { "text-field": ["get", "coordLabel"],
                  "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
                  "text-size": 11, "text-anchor": "bottom", "text-offset": [0, -1.2] },
        paint: { "text-color": "#6d28d9", "text-halo-color": "#fff", "text-halo-width": 2 },
      });

    const onClick = (e) => {
      const { lng, lat } = e.lngLat;
      setCoordRaw({ lat, lng });
      setCoordCopied(false);
      const pt = turf.point([lng, lat], { coordLabel: `${lat.toFixed(6)}\n${lng.toFixed(6)}` });
      setSourceData(map, M_COORD_SOURCE, turf.featureCollection([pt]));
      navigator.clipboard?.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
        .then(() => setCoordCopied(true))
        .catch(() => {});
    };
    const onRightClick = (e) => {
      e.preventDefault();
      setSourceData(map, M_COORD_SOURCE, turf.featureCollection([]));
      setCoordRaw(null);
      setCoordCopied(false);
    };

    map.on("click", onClick);
    map.on("contextmenu", onRightClick);

    return () => {
      map.off("click", onClick);
      map.off("contextmenu", onRightClick);
      if (map.getCanvas()) map.getCanvas().style.cursor = "";
    };
  }, [map, activeTool]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Apply: freeze result, deactivate tool (geometry stays on map) ──────────
  const handleApply = () => {
    if (!canApply) return;

    let entry = null;

    if (activeTool === "distance") {
      entry = {
        id: `dist-${Date.now()}`,
        tool: "distance",
        display: distDisplay,
      };
    } else if (activeTool === "area") {
      entry = {
        id: `area-${Date.now()}`,
        tool: "area",
        display: areaDisplay,
      };
    } else if (activeTool === "bearing") {
      entry = {
        id: `brg-${Date.now()}`,
        tool: "bearing",
        bearing: bearingDeg,
        display: bearingDistDisplay,
      };
    } else if (activeTool === "coordinate") {
      entry = {
        id: `coord-${Date.now()}`,
        tool: "coordinate",
        lat: coordDisplay?.lat,
        lng: coordDisplay?.lng,
        display: null,
      };
    }

    if (entry) setAppliedResults((prev) => [...prev, entry]);

    // Stop the active tool — geometry layers stay because cleanup doesn't remove them
    setActiveTool(null);
    distCoordsRef.current    = [];
    areaCoordsRef.current    = [];
    bearingCoordsRef.current = [];
    setDistKm(null); setAreaM2(null);
    setBearingDeg(null); setBearingDistM(null);
    setCoordRaw(null); setCoordCopied(false);
    if (map?.getCanvas()) map.getCanvas().style.cursor = "";
  };

  // ── Close: discard drawing, remove geometry from map ──────────────────────
  const handleClose = () => {
    // Remove the active tool's layers from the map
    if (activeTool === "distance")
      cleanupLayers(map, [M_DISTANCE_LINE, M_DISTANCE_POINTS, M_DISTANCE_LABELS], [M_DISTANCE_SOURCE]);
    else if (activeTool === "area")
      cleanupLayers(map, [M_AREA_FILL, M_AREA_LINE, M_AREA_POINTS, M_AREA_LABEL], [M_AREA_SOURCE]);
    else if (activeTool === "bearing")
      cleanupLayers(map, [M_BEARING_LINE, M_BEARING_POINTS, M_BEARING_LABEL], [M_BEARING_SOURCE]);
    else if (activeTool === "coordinate")
      cleanupLayers(map, [M_COORD_POINT, M_COORD_LABEL], [M_COORD_SOURCE]);

    distCoordsRef.current    = [];
    areaCoordsRef.current    = [];
    bearingCoordsRef.current = [];
    setDistKm(null); setAreaM2(null);
    setBearingDeg(null); setBearingDistM(null);
    setCoordRaw(null); setCoordCopied(false);
    if (map?.getCanvas()) map.getCanvas().style.cursor = "";
    setActiveTool(null);
  };

  // ── Dismiss an applied result card + remove its map geometry ──────────────
  const handleDismissResult = (result) => {
    if (result.tool === "distance")
      cleanupLayers(map, [M_DISTANCE_LINE, M_DISTANCE_POINTS, M_DISTANCE_LABELS], [M_DISTANCE_SOURCE]);
    else if (result.tool === "area")
      cleanupLayers(map, [M_AREA_FILL, M_AREA_LINE, M_AREA_POINTS, M_AREA_LABEL], [M_AREA_SOURCE]);
    else if (result.tool === "bearing")
      cleanupLayers(map, [M_BEARING_LINE, M_BEARING_POINTS, M_BEARING_LABEL], [M_BEARING_SOURCE]);
    else if (result.tool === "coordinate")
      cleanupLayers(map, [M_COORD_POINT, M_COORD_LABEL], [M_COORD_SOURCE]);

    setAppliedResults((prev) => prev.filter((r) => r.id !== result.id));
  };

  const activeToolDef = TOOLS.find((t) => t.id === activeTool);

  // ── JSX ────────────────────────────────────────────────────────────────────
  return (
    <div className="text-[12px]">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-[#343c4c] px-4 py-3 font-bold">
        <div className="flex items-center gap-2">
          <Ruler size={14} />
          <span>MEASUREMENT</span>
        </div>
        <ChevronRight size={15} />
      </div>

      <div className="p-3 space-y-2">
        {/* Tool buttons */}
        {TOOLS.map((tool) => {
          const Icon     = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => {
                // If another tool is active, close it cleanly first
                if (activeTool && activeTool !== tool.id) handleClose();
                setActiveTool((prev) => (prev === tool.id ? null : tool.id));
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md border transition text-left ${
                isActive
                  ? "border-[#8bd66f] bg-[#243041] text-white"
                  : "border-[#344055] bg-[#1a2233] text-white/80 hover:bg-[#1d2a3a] hover:text-white"
              }`}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                style={{
                  backgroundColor: isActive ? tool.color + "33" : "#2a3548",
                  color: isActive ? tool.color : "#9ca3af",
                }}
              >
                <Icon size={15} strokeWidth={2.2} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-[12px]">{tool.label}</div>
                <div className="text-[10px] text-white/50 truncate">{tool.hint}</div>
              </div>
              {isActive && (
                <span className="shrink-0 h-2 w-2 rounded-full" style={{ backgroundColor: tool.color }} />
              )}
            </button>
          );
        })}

        {/* Active tool results + Apply / Close */}
        {activeTool && (
          <div className="mt-1 rounded-md border border-[#3a4354] bg-[#1a2233] overflow-hidden">

            {/* Hint bar */}
            <div className="flex items-center gap-2 border-b border-[#343c4c] px-3 py-2 text-[10px] text-white/50">
              <Info size={11} className="shrink-0" />
              <span>{activeToolDef?.hint}</span>
            </div>

            {/* ── DISTANCE ─────────────────────────────────────────────── */}
            {activeTool === "distance" && (
              <div className="p-3 space-y-3">
                <div>
                  <p className="text-[10px] text-white/40 mb-1.5 font-semibold uppercase tracking-wide">Unit</p>
                  <UnitSelector options={DISTANCE_UNITS} value={distUnit} onChange={setDistUnit} color="#ef4444" />
                </div>
                {distDisplay
                  ? <ResultRow label="Total Distance" value={distDisplay} color="#ef4444" />
                  : <EmptyHint>Click on the map to start measuring.</EmptyHint>
                }
              </div>
            )}

            {/* ── AREA ─────────────────────────────────────────────────── */}
            {activeTool === "area" && (
              <div className="p-3 space-y-3">
                <div>
                  <p className="text-[10px] text-white/40 mb-1.5 font-semibold uppercase tracking-wide">Unit</p>
                  <UnitSelector options={AREA_UNITS} value={areaUnit} onChange={setAreaUnit} color="#3b82f6" />
                </div>
                {areaDisplay
                  ? <ResultRow label="Total Area" value={areaDisplay} color="#3b82f6" />
                  : <EmptyHint>Click to place vertices. Right-click to close polygon.</EmptyHint>
                }
              </div>
            )}

            {/* ── BEARING ──────────────────────────────────────────────── */}
            {activeTool === "bearing" && (
              <div className="p-3 space-y-3">
                <div>
                  <p className="text-[10px] text-white/40 mb-1.5 font-semibold uppercase tracking-wide">Distance Unit</p>
                  <UnitSelector options={BEARING_DIST_UNITS} value={bearingUnit} onChange={setBearingUnit} color="#f97316" />
                </div>
                {bearingDeg != null ? (
                  <div className="space-y-1.5">
                    <ResultRow label="Bearing"  value={`${Number(bearingDeg).toFixed(2)}°`} color="#f97316" />
                    <ResultRow label="Distance" value={bearingDistDisplay}                   color="#f97316" />
                  </div>
                ) : (
                  <EmptyHint>Click two points to calculate bearing.</EmptyHint>
                )}
              </div>
            )}

            {/* ── COORDINATE ───────────────────────────────────────────── */}
            {activeTool === "coordinate" && (
              <div className="p-3 space-y-3">
                <div>
                  <p className="text-[10px] text-white/40 mb-1.5 font-semibold uppercase tracking-wide">Format</p>
                  <UnitSelector options={COORD_FORMATS} value={coordFormat} onChange={setCoordFormat} color="#8b5cf6" />
                </div>
                {coordDisplay ? (
                  <div className="space-y-1.5">
                    <ResultRow label="Latitude"  value={coordDisplay.lat} color="#8b5cf6" />
                    <ResultRow label="Longitude" value={coordDisplay.lng} color="#8b5cf6" />
                    {coordCopied && (
                      <div className="mt-1 rounded bg-[#8b5cf6]/15 px-2 py-1 text-center text-[10px] text-[#a78bfa]">
                        ✓ Copied to clipboard
                      </div>
                    )}
                  </div>
                ) : (
                  <EmptyHint>Click on the map to pick coordinates.</EmptyHint>
                )}
              </div>
            )}

            {/* ── Apply / Close action bar ──────────────────────────────── */}
            <div className="flex border-t border-[#343c4c]">
              {/* Apply */}
              <button
                type="button"
                onClick={handleApply}
                disabled={!canApply}
                className={`flex flex-1 items-center justify-center gap-1.5 py-2 text-[11px] font-semibold transition border-r border-[#343c4c]
                  ${canApply
                    ? "text-[#8bd66f] hover:bg-[#1f2d3d] cursor-pointer"
                    : "text-white/20 cursor-not-allowed"
                  }`}
              >
                <Check size={12} />
                Apply
              </button>

              {/* Close */}
              <button
                type="button"
                onClick={handleClose}
                className="flex flex-1 items-center justify-center gap-1.5 py-2 text-[11px] text-white/40 transition hover:bg-[#1f2d3d] hover:text-red-400"
              >
                <X size={12} />
                Close
              </button>
            </div>
          </div>
        )}

        {/* Applied result cards */}
        {appliedResults.length > 0 && (
          <div className="mt-2 space-y-2">
            <p className="text-[10px] text-white/30 font-semibold uppercase tracking-wide px-1">Saved Results</p>
            {appliedResults.map((result) => (
              <AppliedResultCard
                key={result.id}
                result={result}
                onDismiss={() => handleDismissResult(result)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

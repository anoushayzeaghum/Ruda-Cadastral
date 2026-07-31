import { useEffect, useRef, useState, useCallback } from "react";
import * as turf from "@turf/turf";
import {
  Ruler,
  Pentagon,
  Compass,
  MapPin,
  ChevronRight,
  Trash2,
  Info,
  X,
} from "lucide-react";
import MeasurementFinishDialog from "./MeasurementFinishDialog";

// ── Mapbox layer / source IDs ─────────────────────────────────────────────────
const M_DISTANCE_SOURCE = "gism-dist-src";
const M_DISTANCE_LINE = "gism-dist-line";
const M_DISTANCE_POINTS = "gism-dist-pts";
const M_DISTANCE_LABELS = "gism-dist-lbl";

const M_AREA_SOURCE = "gism-area-src";
const M_AREA_FILL = "gism-area-fill";
const M_AREA_LINE = "gism-area-line";
const M_AREA_POINTS = "gism-area-pts";
const M_AREA_LABEL = "gism-area-lbl";

const M_BEARING_SOURCE = "gism-brg-src";
const M_BEARING_LINE = "gism-brg-line";
const M_BEARING_POINTS = "gism-brg-pts";
const M_BEARING_LABEL = "gism-brg-lbl";

const M_COORD_SOURCE = "gism-coord-src";
const M_COORD_POINT = "gism-coord-pt";
const M_COORD_LABEL = "gism-coord-lbl";

// ── Unit definitions ──────────────────────────────────────────────────────────
const DISTANCE_UNITS = [
  { id: "m", label: "m", convert: (km) => km * 1000, fmt: (v) => v.toFixed(1) },
  { id: "km", label: "km", convert: (km) => km, fmt: (v) => v.toFixed(4) },
  {
    id: "ft",
    label: "ft",
    convert: (km) => km * 3280.84,
    fmt: (v) => v.toFixed(1),
  },
  {
    id: "mi",
    label: "mi",
    convert: (km) => km * 0.621371,
    fmt: (v) => v.toFixed(4),
  },
];

const AREA_UNITS = [
  {
    id: "m2",
    label: "m²",
    convert: (m2) => m2,
    fmt: (v) => Number(v.toFixed(2)).toLocaleString(),
  },
  {
    id: "km2",
    label: "km²",
    convert: (m2) => m2 / 1_000_000,
    fmt: (v) => v.toFixed(6),
  },
  {
    id: "acres",
    label: "Acres",
    convert: (m2) => m2 / 4046.8564224,
    fmt: (v) => v.toFixed(4),
  },
  {
    id: "hectare",
    label: "ha",
    convert: (m2) => m2 / 10_000,
    fmt: (v) => v.toFixed(4),
  },
  {
    id: "kanal",
    label: "Kanal",
    convert: (m2) => m2 / 505.857,
    fmt: (v) => v.toFixed(3),
  },
  {
    id: "marla",
    label: "Marla",
    convert: (m2) => m2 / 25.2929,
    fmt: (v) => v.toFixed(2),
  },
];

const BEARING_DIST_UNITS = [
  { id: "m", label: "m", convert: (m) => m, fmt: (v) => v.toFixed(1) },
  { id: "km", label: "km", convert: (m) => m / 1000, fmt: (v) => v.toFixed(4) },
  {
    id: "ft",
    label: "ft",
    convert: (m) => m * 3.28084,
    fmt: (v) => v.toFixed(1),
  },
];

const COORD_FORMATS = [
  { id: "dd", label: "DD" },
  { id: "dms", label: "DMS" },
];

const TOOLS = [
  {
    id: "distance",
    label: "Distance",
    icon: Ruler,
    color: "#ef4444",
    hint: "Click to start drawing. Double click to finish segment selection.",
  },
  {
    id: "area",
    label: "Area",
    icon: Pentagon,
    color: "#3b82f6",
    hint: "Click to start drawing. Double click to finish polygon selection.",
  },
  {
    id: "bearing",
    label: "Bearing",
    icon: Compass,
    color: "#f97316",
    hint: "Click two points to calculate bearing.",
  },
  {
    id: "coordinate",
    label: "Coordinate",
    icon: MapPin,
    color: "#8b5cf6",
    hint: "Click anywhere to copy coordinates.",
  },
];

// ── Pure helpers ──────────────────────────────────────────────────────────────
function cleanupLayers(map, layerIds, sourceIds) {
  if (!map) return;
  layerIds.forEach((id) => {
    try {
      if (map.getLayer(id)) map.removeLayer(id);
    } catch (_) {}
  });
  sourceIds.forEach((id) => {
    try {
      if (map.getSource(id)) map.removeSource(id);
    } catch (_) {}
  });
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
  const dir = isLat ? (decimal >= 0 ? "N" : "S") : decimal >= 0 ? "E" : "W";
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
              ? {
                  backgroundColor: color + "33",
                  color,
                  border: `1px solid ${color}`,
                }
              : {
                  backgroundColor: "#1a2233",
                  color: "rgba(255,255,255,0.4)",
                  border: "1px solid #0c3d2d",
                }
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
      {label ? (
        <span className="text-[10px] text-white/50">{label}</span>
      ) : (
        <span />
      )}
      <span className="font-bold text-[12px]" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function EmptyHint({ children }) {
  return (
    <p className="text-center text-[10px] text-white/40 py-1">{children}</p>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Measurement({ map, onClose }) {
  // activeTool: set immediately when user clicks a tool icon → starts map drawing
  const [activeTool, setActiveTool] = useState(null);
  
  // drawingState: 'drawing' | 'paused' | 'completed'
  const [drawingState, setDrawingState] = useState("completed");
  const [showDialog, setShowDialog] = useState(false);
  const [resultReady, setResultReady] = useState(false);

  // Per-tool unit state
  const [distUnit, setDistUnit] = useState("m");
  const [areaUnit, setAreaUnit] = useState("m2");
  const [bearingUnit, setBearingUnit] = useState("m");
  const [coordFormat, setCoordFormat] = useState("dd");

  // Raw SI values stored after each measurement
  const [distKm, setDistKm] = useState(null); // km
  const [areaM2, setAreaM2] = useState(null); // m²
  const [bearingDeg, setBearingDeg] = useState(null); // degrees
  const [bearingDistM, setBearingDistM] = useState(null); // metres
  const [coordRaw, setCoordRaw] = useState(null); // { lat, lng } (numbers)
  const [coordCopied, setCoordCopied] = useState(false);

  // Live mouse position for live preview
  const [mousePos, setMousePos] = useState(null);

  // Click-coordinate refs (avoid re-renders on every click)
  const distCoordsRef = useRef([]);
  const areaCoordsRef = useRef([]);
  const bearingCoordsRef = useRef([]);

  // ── Derived display values ─────────────────────────────────────────────────
  const distUnitDef = DISTANCE_UNITS.find((u) => u.id === distUnit);
  const areaUnitDef = AREA_UNITS.find((u) => u.id === areaUnit);
  const bearingUnitDef = BEARING_DIST_UNITS.find((u) => u.id === bearingUnit);

  const distDisplay = distKm != null ? formatDist(distKm, distUnitDef) : null;
  const areaDisplay = areaM2 != null ? formatArea(areaM2, areaUnitDef) : null;
  const bearingDistDisplay =
    bearingDistM != null
      ? `${bearingUnitDef.fmt(bearingUnitDef.convert(bearingDistM))} ${bearingUnitDef.label}`
      : null;
  const coordDisplay = coordRaw
    ? coordFormat === "dms"
      ? { lat: toDMS(coordRaw.lat, true), lng: toDMS(coordRaw.lng, false) }
      : { lat: coordRaw.lat.toFixed(6), lng: coordRaw.lng.toFixed(6) }
    : null;

  // Disable / Enable double-click zoom in MapLibre during drawing
  useEffect(() => {
    if (!map) return;
    if (activeTool && activeTool !== "coordinate" && drawingState === "drawing") {
      map.doubleClickZoom.disable();
    } else {
      map.doubleClickZoom.enable();
    }
  }, [map, activeTool, drawingState]);

  // ── clearAll helper ────────────────────────────────────────────────────────
  const clearAll = useCallback(() => {
    if (!map) return;
    cleanupLayers(
      map,
      [
        M_DISTANCE_LINE,
        M_DISTANCE_POINTS,
        M_DISTANCE_LABELS,
        M_AREA_FILL,
        M_AREA_LINE,
        M_AREA_POINTS,
        M_AREA_LABEL,
        M_BEARING_LINE,
        M_BEARING_POINTS,
        M_BEARING_LABEL,
        M_COORD_POINT,
        M_COORD_LABEL,
      ],
      [M_DISTANCE_SOURCE, M_AREA_SOURCE, M_BEARING_SOURCE, M_COORD_SOURCE],
    );
    distCoordsRef.current = [];
    areaCoordsRef.current = [];
    bearingCoordsRef.current = [];
    setDistKm(null);
    setAreaM2(null);
    setBearingDeg(null);
    setBearingDistM(null);
    setCoordRaw(null);
    setCoordCopied(false);
    setMousePos(null);
    setDrawingState("completed");
    setShowDialog(false);
    setResultReady(false);
    if (map.getCanvas()) map.getCanvas().style.cursor = "";
  }, [map]);

  useEffect(() => () => clearAll(), [clearAll]);

  // Helper to trigger calculations
  const calculateFinalMeasurement = useCallback(() => {
    if (activeTool === "distance") {
      const coords = distCoordsRef.current;
      if (coords.length > 1) {
        const line = turf.lineString(coords);
        const km = turf.length(line, { units: "kilometers" });
        setDistKm(km);
      }
    } else if (activeTool === "area") {
      const coords = areaCoordsRef.current;
      if (coords.length >= 3) {
        const poly = turf.polygon([[...coords, coords[0]]]);
        const m2 = turf.area(poly);
        setAreaM2(m2);
      }
    } else if (activeTool === "bearing") {
      const coords = bearingCoordsRef.current;
      if (coords.length === 2) {
        const deg = turf.bearing(turf.point(coords[0]), turf.point(coords[1]));
        const distM = turf.distance(
          turf.point(coords[0]),
          turf.point(coords[1]),
          { units: "meters" },
        );
        setBearingDeg(deg);
        setBearingDistM(distM);
      }
    }
  }, [activeTool]);

  // ── DISTANCE TOOL ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!map || activeTool !== "distance") return;
    map.getCanvas().style.cursor = "crosshair";

    if (!map.getSource(M_DISTANCE_SOURCE))
      map.addSource(M_DISTANCE_SOURCE, {
        type: "geojson",
        data: turf.featureCollection([]),
      });
    if (!map.getLayer(M_DISTANCE_LINE))
      map.addLayer({
        id: M_DISTANCE_LINE,
        type: "line",
        source: M_DISTANCE_SOURCE,
        filter: ["==", "$type", "LineString"],
        paint: {
          "line-color": "#ef4444",
          "line-width": 2.5,
          "line-dasharray": [2, 2],
        },
      });
    if (!map.getLayer(M_DISTANCE_POINTS))
      map.addLayer({
        id: M_DISTANCE_POINTS,
        type: "circle",
        source: M_DISTANCE_SOURCE,
        filter: ["==", "$type", "Point"],
        paint: {
          "circle-radius": 5,
          "circle-color": "#fff",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ef4444",
        },
      });
    if (!map.getLayer(M_DISTANCE_LABELS))
      map.addLayer({
        id: M_DISTANCE_LABELS,
        type: "symbol",
        source: M_DISTANCE_SOURCE,
        filter: ["has", "distLabel"],
        layout: {
          "text-field": ["get", "distLabel"],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-size": 11,
          "text-anchor": "bottom",
          "text-offset": [0, -1],
        },
        paint: {
          "text-color": "#ef4444",
          "text-halo-color": "#fff",
          "text-halo-width": 2,
        },
      });

    const updateSource = () => {
      const baseCoords = distCoordsRef.current;
      if (baseCoords.length === 0) {
        setSourceData(map, M_DISTANCE_SOURCE, turf.featureCollection([]));
        return;
      }

      // If currently drawing and we have a mouse position, append it for live preview
      const coords =
        drawingState === "drawing" && mousePos
          ? [...baseCoords, mousePos]
          : baseCoords;

      const features = coords.map((c) => turf.point(c));
      
      if (coords.length > 1) {
        const line = turf.lineString(coords);
        features.push(line);
        const km = turf.length(line, { units: "kilometers" });
        
        // Update live preview distKm
        setDistKm(km);

        // Segment lengths labels at midpoints
        for (let i = 0; i < coords.length - 1; i++) {
          const p1 = turf.point(coords[i]);
          const p2 = turf.point(coords[i + 1]);
          const segLen = turf.distance(p1, p2, { units: "kilometers" });
          const mid = turf.midpoint(p1, p2);
          mid.properties = {
            distLabel: formatDist(segLen, distUnitDef),
          };
          features.push(mid);
        }

        // Total length label at last point
        features.push(
          turf.point(coords[coords.length - 1], {
            distLabel: `Total: ${formatDist(km, distUnitDef)}`,
          }),
        );
      } else {
        setDistKm(null);
      }
      setSourceData(map, M_DISTANCE_SOURCE, turf.featureCollection(features));
    };

    const onClick = (e) => {
      if (drawingState !== "drawing") return;
      distCoordsRef.current.push([e.lngLat.lng, e.lngLat.lat]);
      updateSource();
    };

    const onMouseMove = (e) => {
      if (drawingState !== "drawing") return;
      setMousePos([e.lngLat.lng, e.lngLat.lat]);
    };

    const onDblClick = (e) => {
      e.preventDefault();
      if (drawingState !== "drawing") return;
      e.originalEvent?.stopPropagation();

      // Clean up final point added by double-click zoom or click triggers
      if (distCoordsRef.current.length > 1) {
        const last = distCoordsRef.current[distCoordsRef.current.length - 1];
        const prev = distCoordsRef.current[distCoordsRef.current.length - 2];
        if (
          Math.abs(last[0] - prev[0]) < 0.0001 &&
          Math.abs(last[1] - prev[1]) < 0.0001
        ) {
          distCoordsRef.current.pop();
        }
      }

      setDrawingState("paused");
      setShowDialog(true);
      setMousePos(null);
    };

    map.on("click", onClick);
    map.on("mousemove", onMouseMove);
    map.on("dblclick", onDblClick);

    updateSource();

    return () => {
      map.off("click", onClick);
      map.off("mousemove", onMouseMove);
      map.off("dblclick", onDblClick);
    };
  }, [map, activeTool, drawingState, mousePos, distUnit]);

  // ── AREA TOOL ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!map || activeTool !== "area") return;
    map.getCanvas().style.cursor = "crosshair";

    if (!map.getSource(M_AREA_SOURCE))
      map.addSource(M_AREA_SOURCE, {
        type: "geojson",
        data: turf.featureCollection([]),
      });
    if (!map.getLayer(M_AREA_FILL))
      map.addLayer({
        id: M_AREA_FILL,
        type: "fill",
        source: M_AREA_SOURCE,
        filter: ["==", "$type", "Polygon"],
        paint: { "fill-color": "#3b82f6", "fill-opacity": 0.15 },
      });
    if (!map.getLayer(M_AREA_LINE))
      map.addLayer({
        id: M_AREA_LINE,
        type: "line",
        source: M_AREA_SOURCE,
        filter: [
          "any",
          ["==", "$type", "LineString"],
          ["==", "$type", "Polygon"],
        ],
        paint: {
          "line-color": "#3b82f6",
          "line-width": 2,
          "line-dasharray": [2, 2],
        },
      });
    if (!map.getLayer(M_AREA_POINTS))
      map.addLayer({
        id: M_AREA_POINTS,
        type: "circle",
        source: M_AREA_SOURCE,
        filter: ["==", "$type", "Point"],
        paint: {
          "circle-radius": 5,
          "circle-color": "#fff",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#3b82f6",
        },
      });
    if (!map.getLayer(M_AREA_LABEL))
      map.addLayer({
        id: M_AREA_LABEL,
        type: "symbol",
        source: M_AREA_SOURCE,
        filter: ["has", "areaLabel"],
        layout: {
          "text-field": ["get", "areaLabel"],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-size": 11,
          "text-anchor": "center",
        },
        paint: {
          "text-color": "#1d4ed8",
          "text-halo-color": "#fff",
          "text-halo-width": 2,
        },
      });

    const updateSource = () => {
      const baseCoords = areaCoordsRef.current;
      if (baseCoords.length === 0) {
        setSourceData(map, M_AREA_SOURCE, turf.featureCollection([]));
        return;
      }

      // If active drawing, append mouse position. If completed or paused, close polygon.
      const isClosed = drawingState !== "drawing";
      const coords =
        drawingState === "drawing" && mousePos
          ? [...baseCoords, mousePos]
          : baseCoords;

      const features = coords.map((c) => turf.point(c));
      
      if (coords.length >= 2) {
        features.push(
          turf.lineString(isClosed ? [...coords, coords[0]] : coords)
        );
      }

      if (coords.length >= 3) {
        const poly = turf.polygon([[...coords, coords[0]]]);
        features.push(poly);
        const m2 = turf.area(poly);
        
        // Update live area
        setAreaM2(m2);

        const boundary = turf.polygonToLine(poly);
        const perimeterKm = turf.length(boundary, { units: "kilometers" });

        const centroid = turf.centroid(poly);
        centroid.properties = {
          areaLabel: `Area: ${formatArea(m2, areaUnitDef)}\nPerimeter: ${formatDist(perimeterKm, distUnitDef)}`,
        };
        features.push(centroid);
      } else {
        setAreaM2(null);
      }
      setSourceData(map, M_AREA_SOURCE, turf.featureCollection(features));
    };

    const onClick = (e) => {
      if (drawingState !== "drawing") return;
      areaCoordsRef.current.push([e.lngLat.lng, e.lngLat.lat]);
      updateSource();
    };

    const onMouseMove = (e) => {
      if (drawingState !== "drawing") return;
      setMousePos([e.lngLat.lng, e.lngLat.lat]);
    };

    const onDblClick = (e) => {
      e.preventDefault();
      if (drawingState !== "drawing") return;
      e.originalEvent?.stopPropagation();

      // Clean up double-click duplicate points
      if (areaCoordsRef.current.length > 2) {
        const last = areaCoordsRef.current[areaCoordsRef.current.length - 1];
        const prev = areaCoordsRef.current[areaCoordsRef.current.length - 2];
        if (
          Math.abs(last[0] - prev[0]) < 0.0001 &&
          Math.abs(last[1] - prev[1]) < 0.0001
        ) {
          areaCoordsRef.current.pop();
        }
      }

      setDrawingState("paused");
      setShowDialog(true);
      setMousePos(null);
    };

    map.on("click", onClick);
    map.on("mousemove", onMouseMove);
    map.on("dblclick", onDblClick);

    updateSource();

    return () => {
      map.off("click", onClick);
      map.off("mousemove", onMouseMove);
      map.off("dblclick", onDblClick);
    };
  }, [map, activeTool, drawingState, mousePos, areaUnit, distUnit]);

  // ── BEARING TOOL ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!map || activeTool !== "bearing") return;
    map.getCanvas().style.cursor = "crosshair";

    if (!map.getSource(M_BEARING_SOURCE))
      map.addSource(M_BEARING_SOURCE, {
        type: "geojson",
        data: turf.featureCollection([]),
      });
    if (!map.getLayer(M_BEARING_LINE))
      map.addLayer({
        id: M_BEARING_LINE,
        type: "line",
        source: M_BEARING_SOURCE,
        filter: ["==", "$type", "LineString"],
        paint: { "line-color": "#f97316", "line-width": 2 },
      });
    if (!map.getLayer(M_BEARING_POINTS))
      map.addLayer({
        id: M_BEARING_POINTS,
        type: "circle",
        source: M_BEARING_SOURCE,
        filter: ["==", "$type", "Point"],
        paint: {
          "circle-radius": 6,
          "circle-color": "#fff",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#f97316",
        },
      });
    if (!map.getLayer(M_BEARING_LABEL))
      map.addLayer({
        id: M_BEARING_LABEL,
        type: "symbol",
        source: M_BEARING_SOURCE,
        filter: ["has", "bearingLabel"],
        layout: {
          "text-field": ["get", "bearingLabel"],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-size": 11,
          "text-anchor": "bottom",
          "text-offset": [0, -1],
        },
        paint: {
          "text-color": "#c2410c",
          "text-halo-color": "#fff",
          "text-halo-width": 2,
        },
      });

    const updateSource = () => {
      const baseCoords = bearingCoordsRef.current;
      if (baseCoords.length === 0) {
        setSourceData(map, M_BEARING_SOURCE, turf.featureCollection([]));
        return;
      }

      const coords =
        drawingState === "drawing" && baseCoords.length === 1 && mousePos
          ? [...baseCoords, mousePos]
          : baseCoords;

      const features = coords.map((c) => turf.point(c));
      
      if (coords.length === 2) {
        features.push(turf.lineString(coords));
        const deg = turf.bearing(turf.point(coords[0]), turf.point(coords[1]));
        const distM = turf.distance(
          turf.point(coords[0]),
          turf.point(coords[1]),
          { units: "meters" },
        );
        
        // Update live preview bearing values
        setBearingDeg(deg);
        setBearingDistM(distM);

        const mid = turf.midpoint(turf.point(coords[0]), turf.point(coords[1]));
        mid.properties = {
          bearingLabel: `${deg.toFixed(2)}°  ·  ${bearingUnitDef.fmt(bearingUnitDef.convert(distM))} ${bearingUnitDef.label}`,
        };
        features.push(mid);
      } else {
        setBearingDeg(null);
        setBearingDistM(null);
      }
      setSourceData(map, M_BEARING_SOURCE, turf.featureCollection(features));
    };

    const onClick = (e) => {
      if (drawingState !== "drawing") return;
      
      if (bearingCoordsRef.current.length >= 2) {
        bearingCoordsRef.current = [[e.lngLat.lng, e.lngLat.lat]];
      } else {
        bearingCoordsRef.current.push([e.lngLat.lng, e.lngLat.lat]);
      }

      updateSource();

      // After second click, show Finish Dialog
      if (bearingCoordsRef.current.length === 2) {
        setDrawingState("paused");
        setShowDialog(true);
        setMousePos(null);
      }
    };

    const onMouseMove = (e) => {
      if (drawingState !== "drawing") return;
      if (bearingCoordsRef.current.length === 1) {
        setMousePos([e.lngLat.lng, e.lngLat.lat]);
      }
    };

    map.on("click", onClick);
    map.on("mousemove", onMouseMove);

    updateSource();

    return () => {
      map.off("click", onClick);
      map.off("mousemove", onMouseMove);
    };
  }, [map, activeTool, drawingState, mousePos, bearingUnit]);

  // ── COORDINATE PICKER TOOL ─────────────────────────────────────────────────
  useEffect(() => {
    if (!map || activeTool !== "coordinate") return;
    map.getCanvas().style.cursor = "crosshair";

    if (!map.getSource(M_COORD_SOURCE))
      map.addSource(M_COORD_SOURCE, {
        type: "geojson",
        data: turf.featureCollection([]),
      });
    if (!map.getLayer(M_COORD_POINT))
      map.addLayer({
        id: M_COORD_POINT,
        type: "circle",
        source: M_COORD_SOURCE,
        filter: ["==", "$type", "Point"],
        paint: {
          "circle-radius": 7,
          "circle-color": "#8b5cf6",
          "circle-stroke-width": 2.5,
          "circle-stroke-color": "#fff",
        },
      });
    if (!map.getLayer(M_COORD_LABEL))
      map.addLayer({
        id: M_COORD_LABEL,
        type: "symbol",
        source: M_COORD_SOURCE,
        filter: ["has", "coordLabel"],
        layout: {
          "text-field": ["get", "coordLabel"],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-size": 11,
          "text-anchor": "bottom",
          "text-offset": [0, -1.2],
        },
        paint: {
          "text-color": "#6d28d9",
          "text-halo-color": "#fff",
          "text-halo-width": 2,
        },
      });

    const onClick = (e) => {
      const { lng, lat } = e.lngLat;
      setCoordRaw({ lat, lng });
      setCoordCopied(false);
      
      const pt = turf.point([lng, lat], {
        coordLabel: `${lat.toFixed(6)}\n${lng.toFixed(6)}`,
      });
      setSourceData(map, M_COORD_SOURCE, turf.featureCollection([pt]));
      
      // Auto copy to clipboard
      navigator.clipboard
        ?.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
        .then(() => setCoordCopied(true))
        .catch(() => {});
        
      setResultReady(true);
    };

    map.on("click", onClick);

    return () => {
      map.off("click", onClick);
    };
  }, [map, activeTool]);

  // ── Apply / Calculate from Dialog ──────────────────────────────────────────
  const handleCalculate = () => {
    calculateFinalMeasurement();
    setDrawingState("completed");
    setShowDialog(false);
    setResultReady(true);
  };

  // ── Continue drawing from Dialog ───────────────────────────────────────────
  const handleContinue = () => {
    if (activeTool === "bearing") {
      // Continue for bearing restarts the bearing selection
      bearingCoordsRef.current = [];
      setBearingDeg(null);
      setBearingDistM(null);
      setSourceData(map, M_BEARING_SOURCE, turf.featureCollection([]));
    }
    setDrawingState("drawing");
    setShowDialog(false);
  };

  // ── Cancel: stop the tool, clear map, hide everything ─────────────────────
  const handleCancel = () => {
    clearAll();
    setActiveTool(null);
  };

  // ── Clear measurement (reset drawn data, keep tool active) ────────────────
  const handleClear = () => {
    clearAll();
    // Re-trigger drawing state for the currently active tool
    const current = activeTool;
    setActiveTool(null);
    setTimeout(() => {
      setActiveTool(current);
      setDrawingState("drawing");
    }, 0);
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
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded text-white/50 transition hover:bg-[#2a3548] hover:text-white"
            title="Close"
          >
            <X size={14} />
          </button>
        ) : (
          <ChevronRight size={15} />
        )}
      </div>

      <div className="p-3 space-y-3">
        {/* Tool buttons */}
        <div className="grid grid-cols-4 gap-2">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => {
                  if (activeTool === tool.id) return;
                  clearAll();
                  setActiveTool(tool.id);
                  setDrawingState("drawing");
                }}
                className={`relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-md border px-2 py-2 transition ${
                  isActive
                    ? "border-[#9be37b] bg-[#0a3327] text-white"
                    : "border-[#0f3d2e] bg-[#1f2937] text-white/80 hover:bg-[#0f3d2e] hover:text-white"
                }`}
                title={tool.label}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                  style={{
                    backgroundColor: isActive ? tool.color + "33" : "#2a3548",
                    color: isActive ? tool.color : "#9ca3af",
                  }}
                >
                  <Icon size={17} strokeWidth={2.2} />
                </span>
                <span className="w-full truncate text-center text-[10px] font-semibold leading-none">
                  {tool.label}
                </span>
                {isActive && (
                  <span
                    className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: tool.color }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Cancel — shown as soon as a tool is active */}
        {activeTool && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="w-full rounded-md border border-[#0f3d2e] bg-[#1f2937] py-1.5 text-[11px] font-semibold text-white/50 transition hover:border-red-500/40 hover:text-red-400"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Result panel — only shown after Calculate or Coordinate clicked */}
        {activeTool && resultReady && (
          <div className="mt-1 rounded-md border border-[#13593f] bg-[#06291f] overflow-hidden">
            {/* Hint bar */}
            <div className="flex items-center gap-2 border-b border-[#343c4c] px-3 py-2 text-[10px] text-white/50">
              <Info size={11} className="shrink-0" />
              <span>{activeToolDef?.hint}</span>
            </div>

            {/* ── DISTANCE ─────────────────────────────────────────────── */}
            {activeTool === "distance" && (
              <div className="p-3 space-y-3">
                {/* Unit selector */}
                <div>
                  <p className="text-[10px] text-white/40 mb-1.5 font-semibold uppercase tracking-wide">
                    Unit
                  </p>
                  <UnitSelector
                    options={DISTANCE_UNITS}
                    value={distUnit}
                    onChange={setDistUnit}
                    color="#ef4444"
                  />
                </div>
                {/* Result */}
                {distDisplay ? (
                  <ResultRow
                    label="Total Distance"
                    value={distDisplay}
                    color="#ef4444"
                  />
                ) : (
                  <EmptyHint>Click on the map to start measuring.</EmptyHint>
                )}
              </div>
            )}

            {/* ── AREA ─────────────────────────────────────────────────── */}
            {activeTool === "area" && (
              <div className="p-3 space-y-3">
                {/* Unit selector */}
                <div>
                  <p className="text-[10px] text-white/40 mb-1.5 font-semibold uppercase tracking-wide">
                    Unit
                  </p>
                  <UnitSelector
                    options={AREA_UNITS}
                    value={areaUnit}
                    onChange={setAreaUnit}
                    color="#3b82f6"
                  />
                </div>
                {/* Result */}
                {areaDisplay ? (
                  <ResultRow
                    label="Total Area"
                    value={areaDisplay}
                    color="#3b82f6"
                  />
                ) : (
                  <EmptyHint>
                    Click to place vertices. Double-click to close polygon.
                  </EmptyHint>
                )}
              </div>
            )}

            {/* ── BEARING ──────────────────────────────────────────────── */}
            {activeTool === "bearing" && (
              <div className="p-3 space-y-3">
                {/* Distance unit selector */}
                <div>
                  <p className="text-[10px] text-white/40 mb-1.5 font-semibold uppercase tracking-wide">
                    Distance Unit
                  </p>
                  <UnitSelector
                    options={BEARING_DIST_UNITS}
                    value={bearingUnit}
                    onChange={setBearingUnit}
                    color="#f97316"
                  />
                </div>
                {/* Results */}
                {bearingDeg != null ? (
                  <div className="space-y-1.5">
                    <ResultRow
                      label="Bearing"
                      value={`${Number(bearingDeg).toFixed(2)}°`}
                      color="#f97316"
                    />
                    <ResultRow
                      label="Distance"
                      value={bearingDistDisplay}
                      color="#f97316"
                    />
                  </div>
                ) : (
                  <EmptyHint>Click two points to calculate bearing.</EmptyHint>
                )}
              </div>
            )}

            {/* ── COORDINATE ───────────────────────────────────────────── */}
            {activeTool === "coordinate" && (
              <div className="p-3 space-y-3">
                {/* Format selector */}
                <div>
                  <p className="text-[10px] text-white/40 mb-1.5 font-semibold uppercase tracking-wide">
                    Format
                  </p>
                  <UnitSelector
                    options={COORD_FORMATS}
                    value={coordFormat}
                    onChange={setCoordFormat}
                    color="#8b5cf6"
                  />
                </div>
                {/* Results */}
                {coordDisplay ? (
                  <div className="space-y-1.5">
                    <ResultRow
                      label="Latitude"
                      value={coordDisplay.lat}
                      color="#8b5cf6"
                    />
                    <ResultRow
                      label="Longitude"
                      value={coordDisplay.lng}
                      color="#8b5cf6"
                    />
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

            {/* Clear button */}
            <button
              type="button"
              onClick={handleClear}
              className="flex w-full items-center justify-center gap-1.5 border-t border-[#343c4c] py-2 text-[11px] text-white/40 transition hover:bg-[#1f2d3d] hover:text-red-400"
            >
              <Trash2 size={12} />
              Clear measurement
            </button>
          </div>
        )}
      </div>

      {/* Finish Dialog */}
      <MeasurementFinishDialog
        isOpen={showDialog}
        onContinue={handleContinue}
        onCalculate={handleCalculate}
      />
    </div>
  );
}

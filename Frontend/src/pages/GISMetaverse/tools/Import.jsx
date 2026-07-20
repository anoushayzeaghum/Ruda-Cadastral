import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  Trash2,
  FileCheck,
  AlertTriangle,
  Loader2,
  Printer,
} from "lucide-react";
import bbox from "@turf/bbox";
import shp from "shpjs";
import JSZip from "jszip";
import { kml as kmlToGeoJSON } from "@tmcw/togeojson";
import RudaLogo from "../../../assets/Ruda.png";

// ── constants ──────────────────────────────────────────────────────────────────
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_EXTENSIONS = [".geojson", ".json", ".kml", ".kmz", ".zip"];
const SOURCE_ID = "user-imported-data";
const LAYER_IDS = {
  fill: "user-imported-fill",
  outline: "user-imported-outline",
  label: "user-imported-label",
  line: "user-imported-line",
  point: "user-imported-point",
};

// ── helpers ────────────────────────────────────────────────────────────────────

/** Detect file type from extension */
const detectFileType = (fileName) => {
  const name = fileName.toLowerCase();
  if (name.endsWith(".geojson") || name.endsWith(".json")) return "geojson";
  if (name.endsWith(".kml")) return "kml";
  if (name.endsWith(".kmz")) return "kmz";
  if (name.endsWith(".zip")) return "shapefile";
  return null;
};

/** Safely remove all imported layers + source from the map */
const removeImportedLayers = (map) => {
  if (!map) return;
  Object.values(LAYER_IDS).forEach((id) => {
    if (map.getLayer(id)) map.removeLayer(id);
  });
  if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
};

/** Normalise shpjs output — if multiple shapefiles, merge into one FeatureCollection */
const normaliseGeoJSON = (data) => {
  if (Array.isArray(data)) {
    const features = data.flatMap((fc) => fc.features || []);
    return { type: "FeatureCollection", features };
  }
  if (data.type === "FeatureCollection") return data;
  if (data.type === "Feature")
    return { type: "FeatureCollection", features: [data] };
  // bare Geometry
  return {
    type: "FeatureCollection",
    features: [{ type: "Feature", geometry: data, properties: {} }],
  };
};

/** Build a summary object from a FeatureCollection */
const summarise = (fc) => {
  const count = fc.features.length;
  const types = [
    ...new Set(fc.features.map((f) => f.geometry?.type).filter(Boolean)),
  ];
  return { count, types };
};

/** Validate that a parsed object is valid GeoJSON */
const validateGeoJSON = (obj) => {
  if (!obj || typeof obj !== "object")
    return "File does not contain valid JSON.";
  const validTypes = [
    "FeatureCollection",
    "Feature",
    "Point",
    "MultiPoint",
    "LineString",
    "MultiLineString",
    "Polygon",
    "MultiPolygon",
    "GeometryCollection",
  ];
  if (!validTypes.includes(obj.type))
    return `Invalid GeoJSON type "${obj.type}".`;
  const fc = normaliseGeoJSON(obj);
  if (!fc.features || fc.features.length === 0)
    return "GeoJSON contains no features.";
  return null; // valid
};

/**
 * Parse a KML string (text) into a normalised GeoJSON FeatureCollection.
 * Uses @tmcw/togeojson which works with a DOM Document, so we parse
 * the KML text with DOMParser first.
 */
const parseKMLText = (kmlText) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(kmlText, "text/xml");

  // Detect XML parse errors
  const parserError = doc.querySelector("parsererror");
  if (parserError) {
    throw new Error("KML file contains invalid XML.");
  }

  const geojson = kmlToGeoJSON(doc);
  return normaliseGeoJSON(geojson);
};

const waitForMapRender = (map, timeoutMs = 5000) =>
  new Promise((resolve) => {
    if (!map) {
      resolve();
      return;
    }

    let finished = false;
    let timeoutId;

    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timeoutId);
      map.off("idle", finish);
      map.off("render", onRender);
      resolve();
    };

    const onRender = () => {
      // Wait one extra animation frame so the WebGL buffer contains the
      // newly-fitted camera and all visible vector/raster layers.
      requestAnimationFrame(() => requestAnimationFrame(finish));
    };

    timeoutId = setTimeout(finish, timeoutMs);

    if (!map.isStyleLoaded?.()) {
      map.once("load", () => {
        map.once("idle", finish);
        map.once("render", onRender);
        map.triggerRepaint?.();
      });
      return;
    }

    map.once("idle", finish);
    map.once("render", onRender);
    map.triggerRepaint?.();
  });

const getImportedTitle = (fileName = "Imported Boundary") =>
  fileName
    .replace(/\.(geojson|json|kml|kmz|zip)$/i, "")
    .replace(/[_-]+/g, " ")
    .trim();

const prepareImportedFeatures = (geojson, fallbackLabel) => ({
  ...geojson,
  features: (geojson.features || []).map((feature, index) => {
    const properties = feature.properties || {};
    const label =
      properties.name ||
      properties.Name ||
      properties.NAME ||
      properties.title ||
      properties.Title ||
      properties.label ||
      properties.Label ||
      fallbackLabel ||
      `Imported Feature ${index + 1}`;

    return {
      ...feature,
      properties: {
        ...properties,
        _import_label: String(label),
      },
    };
  }),
});

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const buildLegendRows = (uploadedTitle) => [
  {
    id: "ruda-jurisdiction",
    label: "Lahore RUDA Jurisdiction",
    kind: "jurisdiction",
  },
  {
    id: "uploaded-boundary",
    label: uploadedTitle || "Imported Boundary",
    kind: "imported",
  },
];

const makePrintableHtml = ({
  title,
  mapImage,
  insetImage,
  legendRows,
  logoUrl,
  scaleText,
}) => {
  const legendHtml = legendRows
    .map(
      (item) => `
        <div class="legend-row">
          <span class="legend-swatch ${escapeHtml(item.kind)}"></span>
          <span>${escapeHtml(item.label)}</span>
        </div>`,
    )
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A3 landscape; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; width: 100%; height: 100%; font-family: Arial, Helvetica, sans-serif; }
    body { background: #fff; }
    .sheet {
      position: relative;
      width: 420mm;
      height: 297mm;
      overflow: hidden;
      border: 3px solid #1f2937;
      background: #f8fafc;
    }
    .map {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      display: block;
    }
    .title {
      position: absolute;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      min-width: 38%;
      padding: 10px 20px;
      background: rgba(255,255,255,.94);
      border: 1px solid #334155;
      text-align: center;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: .02em;
      box-shadow: 0 8px 22px rgba(0,0,0,.18);
    }
    .logo-box {
      position: absolute;
      left: 16px;
      top: 16px;
      width: 108px;
      height: 108px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,.96);
      border: 1px solid #334155;
      padding: 8px;
    }
    .logo-box img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .north {
      position: absolute;
      right: 18px;
      top: 16px;
      width: 108px;
      height: 108px;
      border: 1px solid #334155;
      background: rgba(255,255,255,.96);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 5px;
    }
    .north svg { width: 96px; height: 96px; display: block; }
    .inset {
      position: absolute;
      left: 18px;
      bottom: 18px;
      width: 300px;
      background: rgba(255,255,255,.96);
      border: 2px solid #334155;
      padding: 8px;
    }
    .inset-title { font-size: 12px; font-weight: 800; margin-bottom: 6px; }
    .inset img { width: 100%; height: 165px; object-fit: contain; background: #eef2f7; border: 1px solid #64748b; }
    .legend {
      position: absolute;
      right: 18px;
      bottom: 18px;
      width: 270px;
      max-height: 290px;
      overflow: hidden;
      background: rgba(255,255,255,.96);
      border: 2px solid #334155;
      padding: 12px;
    }
    .legend h3 { margin: 0 0 8px; font-size: 18px; }
    .legend-row { display: flex; align-items: center; gap: 8px; margin: 6px 0; font-size: 11px; }
    .legend-swatch {
      width: 34px;
      height: 17px;
      flex: 0 0 auto;
      background: transparent;
    }
    .legend-swatch.imported {
      border: 3px solid #ffff00;
      background: rgba(209,213,219,.5);
    }
    .legend-swatch.jurisdiction {
      border: 3px solid #d100b8;
      box-shadow: inset 0 0 0 1px #ffffff;
    }
    .scale {
      position: absolute;
      left: 50%;
      bottom: 18px;
      transform: translateX(-50%);
      background: rgba(255,255,255,.94);
      border: 1px solid #334155;
      padding: 7px 12px;
      font-size: 12px;
      font-weight: 700;
    }
    .scale-bar {
      width: 210px;
      height: 10px;
      margin-top: 5px;
      border: 1px solid #111827;
      background: linear-gradient(90deg,#111827 0 25%,#fff 25% 50%,#111827 50% 75%,#fff 75% 100%);
    }
    .credit {
      position: absolute;
      left: 18px;
      bottom: 203px;
      padding: 5px 8px;
      background: rgba(255,255,255,.92);
      border: 1px solid #334155;
      font-size: 10px;
      font-weight: 700;
    }
    @media print {
      html, body { width: 420mm; height: 297mm; }
      .sheet { width: 420mm; height: 297mm; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <img class="map" src="${mapImage}" alt="Printed map" />
    <div class="logo-box"><img src="${logoUrl}" alt="RUDA Logo" /></div>
    <div class="title">${escapeHtml(title)}</div>
    <div class="north" aria-label="North arrow">
      <svg viewBox="0 0 100 100" role="img">
        <text x="50" y="10" text-anchor="middle" font-size="12" font-family="Arial" font-weight="700">N</text>
        <text x="50" y="98" text-anchor="middle" font-size="12" font-family="Arial" font-weight="700">S</text>
        <text x="7" y="55" text-anchor="middle" font-size="12" font-family="Arial" font-weight="700">W</text>
        <text x="93" y="55" text-anchor="middle" font-size="12" font-family="Arial" font-weight="700">E</text>
        <circle cx="50" cy="52" r="34" fill="#fff" stroke="#111" stroke-width="1.5"/>
        <circle cx="50" cy="52" r="27" fill="none" stroke="#111" stroke-width="1"/>
        <path d="M50 15 L57 46 L50 41 L43 46 Z" fill="#111"/>
        <path d="M50 89 L43 58 L50 63 L57 58 Z" fill="#fff" stroke="#111" stroke-width="1"/>
        <path d="M13 52 L44 45 L39 52 L44 59 Z" fill="#fff" stroke="#111" stroke-width="1"/>
        <path d="M87 52 L56 59 L61 52 L56 45 Z" fill="#111"/>
        <path d="M27 29 L46 46 L39 43 L36 50 Z" fill="#111"/>
        <path d="M73 75 L54 58 L61 61 L64 54 Z" fill="#fff" stroke="#111" stroke-width="1"/>
        <path d="M73 29 L54 46 L61 43 L64 50 Z" fill="#fff" stroke="#111" stroke-width="1"/>
        <path d="M27 75 L46 58 L39 61 L36 54 Z" fill="#111"/>
        <circle cx="50" cy="52" r="3" fill="#111"/>
      </svg>
    </div>

    <div class="inset">
      <div class="inset-title">RUDA / LP Principle Boundary Overview</div>
      <img src="${insetImage || mapImage}" alt="Overview map" />
    </div>

    <div class="credit">Prepared by: GIS Section, LA&amp;EM Department — RUDA</div>

    <div class="legend">
      <h3>Legend</h3>
      ${legendHtml || '<div class="legend-row">Visible map layers</div>'}
    </div>

    <div class="scale">
      ${escapeHtml(scaleText)}
      <div class="scale-bar"></div>
    </div>
  </div>
  <script>
    const waitForImages = () => {
      const images = Array.from(document.images);
      return Promise.all(
        images.map((image) => {
          if (image.complete) return Promise.resolve();
          return new Promise((resolve) => {
            image.addEventListener("load", resolve, { once: true });
            image.addEventListener("error", resolve, { once: true });
          });
        }),
      );
    };

    window.addEventListener("load", async () => {
      await waitForImages();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.focus();
          window.print();
        });
      });
    });
  </script>
</body>
</html>`;
};

// ── component ──────────────────────────────────────────────────────────────────
export default function Import({ map, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [summary, setSummary] = useState(null); // { fileName, count, types }
  const [importedGeoJSON, setImportedGeoJSON] = useState(null);
  const [printLoading, setPrintLoading] = useState(false);
  const [hasLayer, setHasLayer] = useState(() => {
    return !!(map && map.getSource(SOURCE_ID));
  });
  const fileInputRef = useRef(null);

  // ── clear imported data ──────────────────────────────────────────────────────
  const clearImportedData = () => {
    removeImportedLayers(map);
    setHasLayer(false);
    setSummary(null);
    setImportedGeoJSON(null);
    setError(null);
    setWarning(null);
  };

  // ── add layers to map ────────────────────────────────────────────────────────
  const addLayers = (geojson) => {
    removeImportedLayers(map);

    map.addSource(SOURCE_ID, {
      type: "geojson",
      data: geojson,
      generateId: true,
    });

    // Polygon fill
    map.addLayer({
      id: LAYER_IDS.fill,
      type: "fill",
      source: SOURCE_ID,
      paint: {
        "fill-color": "#d1d5db",
        "fill-opacity": 0.34,
      },
      filter: ["any", ["==", "$type", "Polygon"]],
    });

    // Polygon outline
    map.addLayer({
      id: LAYER_IDS.outline,
      type: "line",
      source: SOURCE_ID,
      paint: {
        "line-color": "#facc15",
        "line-width": 3,
      },
      filter: ["any", ["==", "$type", "Polygon"]],
    });

    // Polygon label layer — places the imported KMZ / vector name inside polygons
    map.addLayer({
      id: LAYER_IDS.label,
      type: "symbol",
      source: SOURCE_ID,
      layout: {
        "text-field": [
          "coalesce",
          ["get", "_import_label"],
          "Imported Boundary",
        ],
        "text-size": 15,
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        "text-anchor": "center",
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": "#111827",
        "text-halo-color": "#ffffff",
        "text-halo-width": 2,
        "text-halo-blur": 0.5,
      },
      filter: ["==", "$type", "Polygon"],
    });

    // Line layer
    map.addLayer({
      id: LAYER_IDS.line,
      type: "line",
      source: SOURCE_ID,
      paint: {
        "line-color": "#60a5fa",
        "line-width": 2.5,
      },
      filter: ["==", "$type", "LineString"],
    });

    // Point layer
    map.addLayer({
      id: LAYER_IDS.point,
      type: "circle",
      source: SOURCE_ID,
      paint: {
        "circle-radius": 6,
        "circle-color": "#f87171",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1.5,
      },
      filter: ["==", "$type", "Point"],
    });

    // Fit map bounds
    try {
      const bounds = bbox(geojson);
      if (bounds.every((v) => isFinite(v))) {
        map.fitBounds(
          [
            [bounds[0], bounds[1]],
            [bounds[2], bounds[3]],
          ],
          { padding: 60, maxZoom: 18 },
        );
      }
    } catch {
      // bbox may fail on empty / degenerate geometry — ignore
    }

    setHasLayer(true);
  };

  // ── main handler ─────────────────────────────────────────────────────────────
  const handleFile = async (file) => {
    setError(null);
    setWarning(null);
    setSummary(null);

    // 1. extension check
    const type = detectFileType(file.name);
    if (!type) {
      setError(
        `Unsupported file type. Accepted: ${ACCEPTED_EXTENSIONS.join(", ")}.`,
      );
      return;
    }

    // 2. size check
    if (file.size > MAX_FILE_SIZE) {
      setError(
        `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 10 MB.`,
      );
      return;
    }

    setLoading(true);
    let objectUrl = null;

    try {
      let geojson;

      // ── GeoJSON / JSON ───────────────────────────────────────────────────────
      if (type === "geojson") {
        objectUrl = URL.createObjectURL(file);
        const response = await fetch(objectUrl);
        let parsed;
        try {
          parsed = await response.json();
        } catch {
          setError("File does not contain valid JSON.");
          return;
        }

        const validationError = validateGeoJSON(parsed);
        if (validationError) {
          setError(validationError);
          return;
        }

        geojson = normaliseGeoJSON(parsed);
      }

      // ── KML ──────────────────────────────────────────────────────────────────
      else if (type === "kml") {
        const kmlText = await file.text();
        try {
          geojson = parseKMLText(kmlText);
        } catch (e) {
          setError(e.message || "Failed to parse KML file.");
          return;
        }

        if (!geojson.features || geojson.features.length === 0) {
          setError("KML file contains no features.");
          return;
        }
      }

      // ── KMZ ──────────────────────────────────────────────────────────────────
      else if (type === "kmz") {
        // KMZ is a ZIP archive containing at least one .kml file
        const arrayBuffer = await file.arrayBuffer();

        let zip;
        try {
          zip = await JSZip.loadAsync(arrayBuffer);
        } catch {
          setError(
            "Failed to open KMZ file. Make sure it is a valid KMZ archive.",
          );
          return;
        }

        // Find the primary KML file — prefer doc.kml, then any .kml at root,
        // then any .kml anywhere in the archive
        const allFileNames = Object.keys(zip.files);
        const kmlFiles = allFileNames.filter(
          (n) => n.toLowerCase().endsWith(".kml") && !zip.files[n].dir,
        );

        if (kmlFiles.length === 0) {
          setError("KMZ archive does not contain a KML file.");
          return;
        }

        // Priority: doc.kml (Google Earth default) → first root-level kml → first any kml
        const primaryKml =
          kmlFiles.find((n) => n.toLowerCase() === "doc.kml") ||
          kmlFiles.find((n) => !n.includes("/")) ||
          kmlFiles[0];

        if (kmlFiles.length > 1) {
          setWarning(
            `KMZ contains ${kmlFiles.length} KML files. Using "${primaryKml}".`,
          );
        }

        const kmlText = await zip.files[primaryKml].async("string");
        try {
          geojson = parseKMLText(kmlText);
        } catch (e) {
          setError(e.message || "Failed to parse KML inside KMZ.");
          return;
        }

        if (!geojson.features || geojson.features.length === 0) {
          setError("KMZ file contains no features.");
          return;
        }
      }

      // ── Zipped Shapefile ─────────────────────────────────────────────────────
      else {
        const arrayBuffer = await file.arrayBuffer();

        // Inspect ZIP contents for required files
        try {
          const zip = await JSZip.loadAsync(arrayBuffer);
          const fileNames = Object.keys(zip.files);
          const hasPrj = fileNames.some((n) =>
            n.toLowerCase().endsWith(".prj"),
          );
          const hasShp = fileNames.some((n) =>
            n.toLowerCase().endsWith(".shp"),
          );
          const hasDbf = fileNames.some((n) =>
            n.toLowerCase().endsWith(".dbf"),
          );

          if (!hasShp) {
            setError(
              "ZIP does not contain a .shp file. Please upload a valid zipped Shapefile.",
            );
            return;
          }
          if (!hasDbf) {
            setWarning(
              "⚠ No .dbf file found — attribute data will be missing.",
            );
          }
          if (!hasPrj) {
            setWarning((prev) =>
              prev
                ? prev + " Also, no .prj file found — assuming WGS 84."
                : "⚠ No .prj file found in the ZIP. The data will be assumed to be in WGS 84 (EPSG:4326).",
            );
          }
        } catch {
          // If we can't inspect the ZIP we still try parsing
        }

        // shpjs needs a fresh ArrayBuffer since JSZip consumed the first one
        const freshBuffer = await file.arrayBuffer();
        let parsed;
        try {
          parsed = await shp(freshBuffer);
        } catch (e) {
          console.error("shpjs parse error:", e);
          setError(
            "Failed to parse shapefile. Ensure the ZIP contains valid .shp and .dbf files.",
          );
          return;
        }

        geojson = normaliseGeoJSON(parsed);

        if (!geojson.features || geojson.features.length === 0) {
          setError("Shapefile contains no features.");
          return;
        }
      }

      // ── add to map ───────────────────────────────────────────────────────────
      const importTitle = getImportedTitle(file.name);
      const preparedGeoJSON = prepareImportedFeatures(geojson, importTitle);

      addLayers(preparedGeoJSON);
      setImportedGeoJSON(preparedGeoJSON);

      const { count, types } = summarise(preparedGeoJSON);
      setSummary({ fileName: file.name, title: importTitle, count, types });
    } catch (e) {
      console.error("Import error:", e);
      setError("An unexpected error occurred while importing the file.");
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    if (!map || !importedGeoJSON?.features?.length) {
      setError(
        "Import a KMZ, KML, GeoJSON or zipped Shapefile before printing.",
      );
      return;
    }

    // Open the window immediately inside the click event. Opening it after
    // fitBounds/idle awaits causes browsers to treat it as an unsolicited
    // pop-up and silently block the print page.
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      setError(
        "The browser blocked the print window. Allow pop-ups for this site and try again.",
      );
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`<!doctype html>
      <html>
        <head><title>Preparing map…</title></head>
        <body style="font-family:Arial,sans-serif;padding:24px">
          Preparing printable map…
        </body>
      </html>`);
    printWindow.document.close();

    setPrintLoading(true);
    setError(null);

    const previousCamera = {
      center: map.getCenter(),
      zoom: map.getZoom(),
      bearing: map.getBearing(),
      pitch: map.getPitch(),
    };

    try {
      // Capture the user's current map view first. This becomes the lower-left
      // overview and therefore includes every layer currently open on the map.
      await waitForMapRender(map);
      const overviewImage = map.getCanvas().toDataURL("image/png", 1);

      // Force the imported polygon to use the official print symbology,
      // regardless of the styling contained in the uploaded file.
      if (map.getLayer(LAYER_IDS.fill)) {
        map.setPaintProperty(LAYER_IDS.fill, "fill-color", "#d1d5db");
        map.setPaintProperty(LAYER_IDS.fill, "fill-opacity", 0.34);
      }
      if (map.getLayer(LAYER_IDS.outline)) {
        map.setPaintProperty(LAYER_IDS.outline, "line-color", "#ffff00");
        map.setPaintProperty(LAYER_IDS.outline, "line-width", 3);
      }

      const bounds = bbox(importedGeoJSON);

      if (bounds.every((value) => Number.isFinite(value))) {
        map.fitBounds(
          [
            [bounds[0], bounds[1]],
            [bounds[2], bounds[3]],
          ],
          {
            padding: { top: 90, right: 90, bottom: 90, left: 90 },
            maxZoom: 17,
            duration: 700,
            essential: true,
          },
        );
      }

      await waitForMapRender(map);

      const canvas = map.getCanvas();
      const mapImage = canvas.toDataURL("image/png", 1);

      if (!mapImage || mapImage === "data:," || mapImage.length < 1000) {
        throw new Error(
          "The map canvas could not be captured. Make sure preserveDrawingBuffer is enabled on the Mapbox map.",
        );
      }

      const title = summary?.title || "Imported Boundary Map";
      const legendRows = buildLegendRows(title);
      const center = map.getCenter();
      const scaleText = `Map center: ${center.lat.toFixed(5)}, ${center.lng.toFixed(5)} · Zoom ${map.getZoom().toFixed(1)}`;

      printWindow.document.open();
      printWindow.document.write(
        makePrintableHtml({
          title,
          mapImage,
          insetImage: overviewImage || mapImage,
          legendRows,
          logoUrl: RudaLogo,
          scaleText,
        }),
      );
      printWindow.document.close();
    } catch (printError) {
      console.error("Print error:", printError);
      printWindow.close();
      setError(
        printError?.message || "The map could not be prepared for printing.",
      );
    } finally {
      map.easeTo({
        ...previousCamera,
        duration: 500,
      });
      setPrintLoading(false);
    }
  };

  // ── event handlers ───────────────────────────────────────────────────────────
  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // reset so same file can be re-selected
    e.target.value = "";
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 text-white w-full">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="font-bold text-sm tracking-wide">Import Data</span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            disabled={!hasLayer || printLoading}
            className="inline-flex items-center gap-1.5 rounded-md border border-amber-300/30 bg-amber-400/10 px-2.5 py-1.5 text-[11px] font-semibold text-amber-300 transition-colors hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-40"
            title="Print imported map"
          >
            {printLoading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Printer size={13} />
            )}
            Print
          </button>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-gray-500/60 rounded-lg p-5 text-center cursor-pointer
                   hover:border-emerald-400/60 hover:bg-[#283447]/60 transition-all duration-200
                   flex flex-col items-center justify-center gap-2"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload size={24} className="text-gray-400" />
        <p className="text-xs text-gray-300">
          Drag &amp; drop a file or{" "}
          <span className="text-emerald-400 underline">browse</span>
        </p>
        <p className="text-[10px] text-gray-500">
          GeoJSON · KML · KMZ · Shapefile (ZIP) — max 10 MB
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".geojson,.json,.kml,.kmz,.zip"
          onChange={onFileChange}
          className="hidden"
          id="import-file-input"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-3 flex items-center gap-2 text-yellow-400 text-xs animate-pulse">
          <Loader2 size={14} className="animate-spin" />
          <span>Parsing file…</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-3 flex items-start gap-2 text-red-400 text-xs bg-red-400/10 rounded-md p-2.5">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Warning */}
      {warning && !error && (
        <div className="mt-3 flex items-start gap-2 text-amber-400 text-xs bg-amber-400/10 rounded-md p-2.5">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{warning}</span>
        </div>
      )}

      {/* Summary */}
      {summary && !error && (
        <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md p-3">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1.5">
            <FileCheck size={14} />
            <span>Import Successful</span>
          </div>
          <div className="text-[11px] text-gray-300 space-y-0.5">
            <p>
              <span className="text-gray-500">File:</span>{" "}
              <span className="break-all">{summary.fileName}</span>
            </p>
            <p>
              <span className="text-gray-500">Features:</span> {summary.count}
            </p>
            <p>
              <span className="text-gray-500">Geometry:</span>{" "}
              {summary.types.join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* Clear button */}
      {hasLayer && (
        <button
          onClick={clearImportedData}
          className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md
                     bg-red-500/15 text-red-400 text-xs font-medium
                     hover:bg-red-500/25 transition-colors duration-200 border border-red-500/20"
        >
          <Trash2 size={13} />
          Clear Imported Data
        </button>
      )}
    </div>
  );
}

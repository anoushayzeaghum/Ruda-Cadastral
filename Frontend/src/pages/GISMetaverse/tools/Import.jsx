import React, { useState, useRef } from "react";
import { X, Upload, Trash2, FileCheck, AlertTriangle, Loader2 } from "lucide-react";
import bbox from "@turf/bbox";
import shp from "shpjs";
import JSZip from "jszip";
import { kml as kmlToGeoJSON } from "@tmcw/togeojson";

// ── constants ──────────────────────────────────────────────────────────────────
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_EXTENSIONS = [".geojson", ".json", ".kml", ".kmz", ".zip"];
const SOURCE_ID = "user-imported-data";
const LAYER_IDS = {
  fill: "user-imported-fill",
  outline: "user-imported-outline",
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
  if (data.type === "Feature") return { type: "FeatureCollection", features: [data] };
  // bare Geometry
  return {
    type: "FeatureCollection",
    features: [{ type: "Feature", geometry: data, properties: {} }],
  };
};

/** Build a summary object from a FeatureCollection */
const summarise = (fc) => {
  const count = fc.features.length;
  const types = [...new Set(fc.features.map((f) => f.geometry?.type).filter(Boolean))];
  return { count, types };
};

/** Validate that a parsed object is valid GeoJSON */
const validateGeoJSON = (obj) => {
  if (!obj || typeof obj !== "object") return "File does not contain valid JSON.";
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
  if (!validTypes.includes(obj.type)) return `Invalid GeoJSON type "${obj.type}".`;
  const fc = normaliseGeoJSON(obj);
  if (!fc.features || fc.features.length === 0) return "GeoJSON contains no features.";
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

// ── component ──────────────────────────────────────────────────────────────────
export default function Import({ map, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [summary, setSummary] = useState(null); // { fileName, count, types }
  const [hasLayer, setHasLayer] = useState(() => {
    return !!(map && map.getSource(SOURCE_ID));
  });
  const fileInputRef = useRef(null);

  // ── clear imported data ──────────────────────────────────────────────────────
  const clearImportedData = () => {
    removeImportedLayers(map);
    setHasLayer(false);
    setSummary(null);
    setError(null);
    setWarning(null);
  };

  // ── add layers to map ────────────────────────────────────────────────────────
  const addLayers = (geojson) => {
    removeImportedLayers(map);

    map.addSource(SOURCE_ID, { type: "geojson", data: geojson });

    // Polygon fill
    map.addLayer({
      id: LAYER_IDS.fill,
      type: "fill",
      source: SOURCE_ID,
      paint: {
        "fill-color": "#6ee7b7",
        "fill-opacity": 0.35,
      },
      filter: ["any", ["==", "$type", "Polygon"]],
    });

    // Polygon outline
    map.addLayer({
      id: LAYER_IDS.outline,
      type: "line",
      source: SOURCE_ID,
      paint: {
        "line-color": "#34d399",
        "line-width": 1.8,
      },
      filter: ["any", ["==", "$type", "Polygon"]],
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
          { padding: 60, maxZoom: 18 }
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
        `Unsupported file type. Accepted: ${ACCEPTED_EXTENSIONS.join(", ")}.`
      );
      return;
    }

    // 2. size check
    if (file.size > MAX_FILE_SIZE) {
      setError(
        `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 10 MB.`
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
          setError("Failed to open KMZ file. Make sure it is a valid KMZ archive.");
          return;
        }

        // Find the primary KML file — prefer doc.kml, then any .kml at root,
        // then any .kml anywhere in the archive
        const allFileNames = Object.keys(zip.files);
        const kmlFiles = allFileNames.filter(
          (n) => n.toLowerCase().endsWith(".kml") && !zip.files[n].dir
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
            `KMZ contains ${kmlFiles.length} KML files. Using "${primaryKml}".`
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
          const hasPrj = fileNames.some((n) => n.toLowerCase().endsWith(".prj"));
          const hasShp = fileNames.some((n) => n.toLowerCase().endsWith(".shp"));
          const hasDbf = fileNames.some((n) => n.toLowerCase().endsWith(".dbf"));

          if (!hasShp) {
            setError(
              "ZIP does not contain a .shp file. Please upload a valid zipped Shapefile."
            );
            return;
          }
          if (!hasDbf) {
            setWarning("⚠ No .dbf file found — attribute data will be missing.");
          }
          if (!hasPrj) {
            setWarning((prev) =>
              prev
                ? prev + " Also, no .prj file found — assuming WGS 84."
                : "⚠ No .prj file found in the ZIP. The data will be assumed to be in WGS 84 (EPSG:4326)."
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
            "Failed to parse shapefile. Ensure the ZIP contains valid .shp and .dbf files."
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
      addLayers(geojson);

      const { count, types } = summarise(geojson);
      setSummary({ fileName: file.name, count, types });
    } catch (e) {
      console.error("Import error:", e);
      setError("An unexpected error occurred while importing the file.");
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setLoading(false);
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
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-sm tracking-wide">Import Data</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
          title="Close"
        >
          <X size={16} />
        </button>
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

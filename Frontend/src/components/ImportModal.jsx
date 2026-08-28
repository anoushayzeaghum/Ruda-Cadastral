import React, { useState } from "react";
import {
  importDistrict,
  importTehsil,
  importMauzaShapefile,
  importKhasra,
  importMurabba,
  importSquare,
  importAcre,
  importTrijunction,
  importFieldPoints,
} from "../services/api";

const importHandlers = {
  district: importDistrict,
  tehsil: importTehsil,
  mauza: importMauzaShapefile,
  khasra: importKhasra,
  // Kept for backward compatibility even though Murabba is removed from the admin menu.
  murabba: importMurabba,
  square: importSquare,
  acre: importAcre,
  trijunction: importTrijunction,
  fieldpoints: importFieldPoints,
};

export default function ImportModal({
  title = "Import",
  open,
  onClose,
  type = "mauza",
  onSuccess,
}) {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  if (!open) return null;

  const handleFile = (e) => {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setFileName(selected?.name ?? null);
    setMessage(null);
  };

  const handleImport = async () => {
    if (!file) {
      setMessage({ type: "error", text: "Please select a ZIP file." });
      return;
    }

    const handler = importHandlers[type];
    if (!handler) {
      setMessage({ type: "error", text: `Unsupported import type: ${type}` });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await handler({ file });
      setMessage({ type: "success", text: res?.message || "Imported." });
      await onSuccess?.();
      onClose?.();
    } catch (e) {
      setMessage({
        type: "error",
        text:
          e?.response?.data?.message ||
          e?.response?.data?.detail ||
          e?.message ||
          String(e),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-lg bg-white dark:bg-[#07111a] p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-500">
            Close
          </button>
        </div>

        <p className="text-sm text-gray-500 mt-2">
          Select one ZIP file containing a shapefile. The ZIP should contain
          .shp, .shx and .dbf files; .prj is strongly recommended.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3">
          <input type="file" accept=".zip,application/zip" onChange={handleFile} />
        </div>

        <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
          <div>Selected file: {fileName ?? "None"}</div>
          <div className="mt-2 text-xs text-gray-500">
            <ul className="list-disc ml-5 space-y-1">
              <li>ZIP must contain exactly one shapefile.</li>
              <li>Geometry is stored as EPSG:4326.</li>
              <li>
                Attribute names are matched case-insensitively to the target model
                fields (for example GID/gid, Mauza_ID/mauza_id).
              </li>
            </ul>
          </div>
        </div>

        {message && (
          <div
            className={`mt-4 p-3 rounded ${
              message.type === "error"
                ? "bg-red-50 text-red-700"
                : "bg-green-50 text-green-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="border px-4 py-2 rounded">
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-60"
          >
            {loading ? "Importing..." : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}

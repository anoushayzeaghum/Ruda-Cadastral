import React, { useState } from "react";
import { importMouza } from "../services/api";

export default function ImportModal({ title = "Import", open, onClose }) {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [tehsil, setTehsil] = useState("");
  const [mouza, setMouza] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  if (!open) return null;

  const handleFile = (e) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setFileName(f?.name ?? null);
  };

  const handleImport = async () => {
    if (!file) {
      setMessage({ type: "error", text: "Please select a ZIP file." });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await importMouza({ file, tehsil, mouza });
      setMessage({ type: "success", text: res.message || "Imported." });
    } catch (e) {
      setMessage({
        type: "error",
        text: e?.response?.data?.message || String(e),
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
          Select a ZIP file containing shapefile components (.shp, .prj, .dbf).
          The shapefile must use WGS84 (EPSG:4326).
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3">
          <label className="text-sm">Tehsil (optional override)</label>
          <input
            value={tehsil}
            onChange={(e) => setTehsil(e.target.value)}
            className="border rounded px-3 py-2"
          />

          <label className="text-sm">Mouza (optional override)</label>
          <input
            value={mouza}
            onChange={(e) => setMouza(e.target.value)}
            className="border rounded px-3 py-2"
          />

          <input type="file" accept=".zip" onChange={handleFile} />
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <div>Selected file: {fileName ?? "None"}</div>
          <div className="mt-2 text-xs text-gray-500">
            Requirements:
            <ul className="list-disc ml-5">
              <li>
                ZIP must contain a valid shapefile (.shp, .shx, .dbf) and
                ideally .prj
              </li>
              <li>
                Required attribute field: <strong>mouza_id</strong>
              </li>
              <li>Projection must be WGS84 (EPSG:4326)</li>
            </ul>
          </div>
        </div>

        {message && (
          <div
            className={`mt-4 p-3 rounded ${message.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}
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
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            {loading ? "Importing..." : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}

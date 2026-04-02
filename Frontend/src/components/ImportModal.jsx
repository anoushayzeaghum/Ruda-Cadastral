import React, { useState } from "react";

export default function ImportModal({ title = "Import", open, onClose }) {
  const [fileName, setFileName] = useState(null);

  if (!open) return null;

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
        </p>

        <div className="mt-4">
          <input
            type="file"
            accept=".zip"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <div>Selected file: {fileName ?? "None"}</div>
          <div className="mt-2 text-xs text-gray-500">
            Note: This is a UI-only import preview. No file will be uploaded.
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="border px-4 py-2 rounded">
            Cancel
          </button>
          <button
            onClick={() => alert("Import simulated (UI only)")}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
}

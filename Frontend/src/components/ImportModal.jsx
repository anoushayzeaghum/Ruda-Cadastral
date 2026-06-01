import React, { useState } from "react";
import { importMouza } from "../services/api";
import {
  X,
  UploadCloud,
  FileArchive,
  Trash2,
  Info,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function ImportModal({ title = "Import", open, onClose }) {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [tehsil, setTehsil] = useState("");
  const [mouza, setMouza] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  if (!open) return null;

  const handleFile = (e) => {
    const f = e.target.files?.[0] ?? null;
    if (f) {
      setFile(f);
      setFileName(f.name);
      setMessage(null);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      if (f.name.toLowerCase().endsWith(".zip")) {
        setFile(f);
        setFileName(f.name);
        setMessage(null);
      } else {
        setMessage({ type: "error", text: "Please select a valid ZIP file." });
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    setFileName(null);
    setMessage(null);
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-xl bg-white dark:bg-[#07111a] border border-gray-100 dark:border-gray-800 shadow-2xl flex flex-col max-h-[85vh] transition-all duration-300 transform animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header (Sticky) */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800/80 px-5 py-4 shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FileArchive className="text-green-600 dark:text-green-500 w-5 h-5" />
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Info/Description (Sticky below Header, outside scrollable area) */}
        <div className="px-5 pt-4 pb-2 shrink-0 text-left">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Select a ZIP file containing shapefile components (
            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-red-600 dark:text-red-400 font-mono">
              .shp
            </code>
            ,{" "}
            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-red-600 dark:text-red-400 font-mono">
              .prj
            </code>
            ,{" "}
            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-red-600 dark:text-red-400 font-mono">
              .dbf
            </code>
            ). The shapefile must use WGS84 (EPSG:4326).
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-5 pb-5 pt-2 flex-1 space-y-4 text-left">

          {/* Optional Overrides (Side-by-Side Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tehsil (optional override)
              </label>
              <input
                type="text"
                value={tehsil}
                onChange={(e) => setTehsil(e.target.value)}
                placeholder="e.g. Lahore Cantt"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0c1419] px-3 py-1.5 text-xs sm:text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 dark:focus:border-green-500 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Mouza (optional override)
              </label>
              <input
                type="text"
                value={mouza}
                onChange={(e) => setMouza(e.target.value)}
                placeholder="e.g. Jia Bagga"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0c1419] px-3 py-1.5 text-xs sm:text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 dark:focus:border-green-500 transition-all"
              />
            </div>
          </div>

          {/* Upload File Zone */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Upload ZIP File
            </label>

            {!file ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-input").click()}
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 ${
                  dragActive
                    ? "border-green-500 bg-green-50/10 dark:bg-green-950/10 scale-[0.99]"
                    : "border-gray-200 hover:border-green-500 dark:border-gray-800 dark:hover:border-green-600 bg-gray-50/50 hover:bg-green-50/5 dark:bg-[#08111a]/40 dark:hover:bg-green-950/5"
                }`}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".zip"
                  onChange={handleFile}
                  className="hidden"
                />
                <div className="p-2 bg-white dark:bg-gray-800/80 rounded-full shadow-sm text-green-600 dark:text-green-500 mb-2">
                  <UploadCloud
                    size={22}
                    className="animate-pulse"
                    style={{ animationDuration: "3s" }}
                  />
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  Drag & drop your file here, or{" "}
                  <span className="text-green-600 dark:text-green-500 font-semibold hover:underline">
                    browse
                  </span>
                </p>
                <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Supports ZIP archives containing shapefiles
                </p>
              </div>
            ) : (
              /* Selected File Card */
              <div className="flex items-center justify-between border border-green-200 dark:border-green-900/40 bg-green-50/20 dark:bg-green-950/10 rounded-xl p-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-700 dark:text-green-400 shrink-0">
                    <FileArchive size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 truncate pr-2">
                      {fileName}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {file.size ? formatBytes(file.size) : "Unknown size"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                  title="Remove file"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Styled Requirements Alert */}
          <div className="bg-gray-50 dark:bg-[#0c1419] border border-gray-100 dark:border-gray-800/80 rounded-xl p-3.5 flex gap-2.5 text-xs text-gray-600 dark:text-gray-400">
            <Info
              size={16}
              className="text-green-600 dark:text-green-500 shrink-0 mt-0.5"
            />
            <div className="space-y-1">
              <h4 className="font-semibold text-gray-950 dark:text-gray-200 text-[10px] uppercase tracking-wider">
                Import Requirements
              </h4>
              <ul className="text-xs list-disc pl-3.5 space-y-0.5 mt-0.5 text-gray-500 dark:text-gray-400 leading-relaxed">
                <li>
                  ZIP must contain shapefile components (
                  <span className="font-mono text-[10px]">.shp, .shx, .dbf, .prj</span>)
                </li>
                <li>
                  Required attribute field:{" "}
                  <strong className="text-gray-700 dark:text-gray-300 font-semibold font-mono text-[10px]">
                    mouza_id
                  </strong>
                </li>
                <li>
                  Projection must be WGS84 (
                  <span className="font-mono text-[10px]">EPSG:4326</span>)
                </li>
              </ul>
            </div>
          </div>

          {/* Response Messages */}
          {message && (
            <div
              className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs animate-in fade-in duration-200 ${
                message.type === "error"
                  ? "bg-red-50 dark:bg-red-950/10 border-red-100 dark:border-red-950/20 text-red-700 dark:text-red-400"
                  : "bg-emerald-50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-950/20 text-emerald-700 dark:text-emerald-400"
              }`}
            >
              {message.type === "error" ? (
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0 leading-normal">
                {message.text}
              </div>
            </div>
          )}

        </div>

        {/* Footer (Sticky) */}
        <div className="flex justify-end gap-3 px-5 py-3.5 border-t border-gray-100 dark:border-gray-800/80 shrink-0">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-1.5 text-xs sm:text-sm font-medium border border-gray-200 dark:border-gray-800 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#121f2b] active:scale-95 disabled:opacity-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={loading}
            className="px-6 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-green-700 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-500 text-white shadow-md shadow-green-700/10 dark:shadow-none hover:shadow-green-600/20 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shrink-0"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Importing...</span>
              </>
            ) : (
              <span>Import</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

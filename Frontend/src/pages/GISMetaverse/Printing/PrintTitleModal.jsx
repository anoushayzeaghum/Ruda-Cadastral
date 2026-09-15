import { useEffect, useRef, useState } from "react";
import { FileText, PencilLine, X } from "lucide-react";

/**
 * Modal used before printing to choose the map title.
 *
 * Normal map printing keeps the existing custom-title flow.
 * Imported KMZ printing can additionally use the imported KMZ name directly.
 */
export default function PrintTitleModal({
  isOpen,
  defaultTitle = "",
  allowImportedKmzName = false,
  importedKmzName = "",
  onConfirm,
  onCancel,
}) {
  const [value, setValue] = useState(defaultTitle);
  const [titleMode, setTitleMode] = useState("custom");
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    setValue(defaultTitle);
    setTitleMode("custom");

    setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen, defaultTitle, allowImportedKmzName, importedKmzName]);

  useEffect(() => {
    if (isOpen && titleMode === "custom") {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen, titleMode]);

  if (!isOpen) return null;

  const resolvedKmzName = importedKmzName?.trim() || "Imported KMZ";

  const handleSubmit = (event) => {
    event.preventDefault();

    if (allowImportedKmzName && titleMode === "kmz") {
      onConfirm({
        title: resolvedKmzName,
        titleMode: "kmz",
      });
      return;
    }

    onConfirm({
      title: value.trim() || defaultTitle,
      titleMode: "custom",
    });
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") onCancel();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        onKeyDown={handleKeyDown}
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <h2 className="mb-1 text-base font-bold text-slate-800">
          Set Map Title
        </h2>
        <p className="mb-4 text-xs leading-5 text-slate-500">
          {allowImportedKmzName
            ? "Choose a custom title or use the imported KMZ name on the printed map."
            : "This title will appear on the printed map. Leave blank to use the default."}
        </p>

        <form onSubmit={handleSubmit}>
          {allowImportedKmzName && (
            <div className="mb-4 grid gap-2">
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                  titleMode === "custom"
                    ? "border-[#0f3d2e] bg-emerald-50/70 ring-1 ring-[#0f3d2e]/15"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="map-title-mode"
                  value="custom"
                  checked={titleMode === "custom"}
                  onChange={() => setTitleMode("custom")}
                  className="mt-1 accent-[#0f3d2e]"
                />
                <PencilLine
                  size={17}
                  className="mt-0.5 shrink-0 text-[#0f3d2e]"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-800">
                    Enter Custom Title
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">
                    Type the title you want to appear on the exported map.
                  </span>
                </span>
              </label>

              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                  titleMode === "kmz"
                    ? "border-[#0f3d2e] bg-emerald-50/70 ring-1 ring-[#0f3d2e]/15"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="map-title-mode"
                  value="kmz"
                  checked={titleMode === "kmz"}
                  onChange={() => setTitleMode("kmz")}
                  className="mt-1 accent-[#0f3d2e]"
                />
                <FileText
                  size={17}
                  className="mt-0.5 shrink-0 text-[#0f3d2e]"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-800">
                    Use Imported KMZ Name
                  </span>
                  <span
                    className="mt-0.5 block truncate text-[11px] font-medium text-[#0f3d2e]"
                    title={resolvedKmzName}
                  >
                    {resolvedKmzName}
                  </span>
                </span>
              </label>
            </div>
          )}

          <div
            className={
              allowImportedKmzName && titleMode === "kmz" ? "opacity-50" : ""
            }
          >
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              Custom Map Title
            </label>
            <input
              ref={inputRef}
              type="text"
              value={value}
              disabled={allowImportedKmzName && titleMode === "kmz"}
              onChange={(event) => setValue(event.target.value)}
              placeholder={defaultTitle || "Enter map title…"}
              maxLength={120}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#0f3d2e] focus:ring-2 focus:ring-[#0f3d2e]/20 disabled:cursor-not-allowed"
            />
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#0f3d2e] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#0d3326]"
            >
              Print
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

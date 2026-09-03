import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

/**
 * Modal that asks the user for a custom map title before printing.
 *
 * Props:
 *   isOpen        – boolean
 *   defaultTitle  – string  pre-filled value
 *   onConfirm(title) – called with the entered title
 *   onCancel()    – called when dismissed without printing
 */
export default function PrintTitleModal({
  isOpen,
  defaultTitle = "",
  onConfirm,
  onCancel,
}) {
  const [value, setValue] = useState(defaultTitle);
  const inputRef = useRef(null);

  // Sync value when modal opens with a new default
  useEffect(() => {
    if (isOpen) {
      setValue(defaultTitle);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, defaultTitle]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(value.trim() || defaultTitle);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") onCancel();
  };

  return (
    /* backdrop */
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        onKeyDown={handleKeyDown}
      >
        {/* close */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <h2 className="mb-1 text-base font-bold text-slate-800">
          Set Map Title
        </h2>
        <p className="mb-4 text-xs text-slate-500">
          This title will appear on the printed map. Leave blank to use the default.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={defaultTitle || "Enter map title…"}
            maxLength={120}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#0f3d2e] focus:ring-2 focus:ring-[#0f3d2e]/20"
          />

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

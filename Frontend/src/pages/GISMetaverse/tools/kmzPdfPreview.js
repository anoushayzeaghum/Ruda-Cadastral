/**
 * Open the *already generated* canonical KMZ PDF in Chrome's PDF viewer.
 *
 * Calling childWindow.print() from Import.jsx suspends the initiating React
 * workflow in Chrome until the OS print dialog is dismissed. Navigating the
 * pre-opened tab to a PDF instead gives users a print/download preview while
 * allowing them to keep working in /gis-metaverse.
 *
 * The preview tab is created synchronously during the user's click; only its
 * navigation happens after the asynchronous map/PDF capture. That avoids
 * popup blockers without creating a second window.
 */
export function openKmzPdfPreview(previewWindow, pdfFile) {
  if (!previewWindow || previewWindow.closed) return false;
  if (!pdfFile || pdfFile.type !== "application/pdf") {
    throw new Error("The completed KMZ print must be a PDF file.");
  }

  const pdfUrl = URL.createObjectURL(pdfFile);
  try {
    // Sever the opener relationship. The PDF viewer does not need to script or
    // access the GIS app, and a detached tab avoids opener-based coupling.
    try {
      previewWindow.opener = null;
    } catch {
      // Some browsers expose opener as read-only; PDF navigation still works.
    }
    previewWindow.location.replace(pdfUrl);
    // Do not revoke the Blob URL while the PDF viewer is in use: Chrome may
    // need it again when the user clicks Print or Download. It is released
    // when the originating GIS Metaverse document is unloaded.
    return true;
  } catch (error) {
    URL.revokeObjectURL(pdfUrl);
    throw error;
  }
}

/**
 * If PDF generation/viewer navigation fails, keep the existing HTML map
 * preview available without automatically invoking Chrome's modal printer.
 * A deliberate click in the preview tab enables native print as a fallback.
 */
export function addManualPrintControls(previewWindow) {
  if (!previewWindow || previewWindow.closed) return false;
  const doc = previewWindow.document;
  if (!doc?.body) return false;
  if (doc.getElementById("ruda-kmz-print-preview-toolbar")) return true;

  const toolbar = doc.createElement("div");
  toolbar.id = "ruda-kmz-print-preview-toolbar";
  toolbar.style.cssText = [
    "position:fixed", "top:12px", "right:12px", "z-index:2147483647",
    "display:flex", "align-items:center", "gap:12px", "padding:10px 14px",
    "background:#fff", "box-shadow:0 2px 12px #0004", "border-radius:8px",
    "font:14px Arial,sans-serif", "color:#111827",
  ].join(";");

  const status = doc.createElement("span");
  status.textContent = "Map preview ready";
  const printButton = doc.createElement("button");
  printButton.type = "button";
  printButton.textContent = "Print / Save as PDF";
  printButton.style.cssText = "padding:9px 12px;background:#165bc0;color:#fff;border:0;border-radius:5px;cursor:pointer";
  printButton.addEventListener("click", () => previewWindow.print());
  toolbar.append(status, printButton);

  const style = doc.createElement("style");
  style.textContent = "@media print { #ruda-kmz-print-preview-toolbar { display: none !important; } }";
  doc.head.appendChild(style);
  doc.body.prepend(toolbar);
  return true;
}

import { jsPDF } from "jspdf";
import {
  buildPlotDetails,
  createPdfPreviewWindow,
  getCircularLogoDataUrl,
  loadPrintAssets,
  openPdfPreview,
  valueOrDash,
} from "./printUtils";

const THEME = [30, 58, 95];
const TEXT = [28, 28, 28];
const MUTED = [92, 103, 116];

const normalizeText = (value, fallback = "") => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return fallback;
  }
  return String(value).trim();
};

const escapeHtml = (value) =>
  normalizeText(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const todayDisplay = () => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${d.getFullYear()}`;
};

const relationText = (relationType, relationName) => {
  const type = normalizeText(relationType);
  const name = normalizeText(relationName);
  if (!type && !name) return "";
  if (!name) return type;
  return `${type} ${name}`;
};

const drawCircularLogo = (doc, image, cx, cy, size) => {
  if (!image) return;
  const dataUrl = getCircularLogoDataUrl(image, 300);
  if (!dataUrl) return;
  doc.addImage(
    dataUrl,
    "PNG",
    cx - size / 2,
    cy - size / 2,
    size,
    size,
    undefined,
    "FAST",
  );
};

const drawFittedText = (
  doc,
  text,
  x,
  y,
  maxWidth,
  {
    fontSize = 8,
    minFontSize = 6,
    align = "left",
    fontStyle = "normal",
    color = TEXT,
  } = {},
) => {
  const safeText = normalizeText(text, "-");
  let size = fontSize;
  doc.setFont("helvetica", fontStyle);
  doc.setTextColor(...color);

  while (size > minFontSize) {
    doc.setFontSize(size);
    if (doc.getTextWidth(safeText) <= maxWidth) break;
    size -= 0.2;
  }

  doc.setFontSize(size);
  doc.text(safeText, x, y, { align });
};

const drawWrapped = (
  doc,
  text,
  x,
  y,
  maxWidth,
  {
    fontSize = 7.7,
    lineHeight = 3.45,
    fontStyle = "normal",
    color = TEXT,
  } = {},
) => {
  doc.setFont("helvetica", fontStyle);
  doc.setFontSize(fontSize);
  doc.setTextColor(...color);
  const lines = doc.splitTextToSize(normalizeText(text), maxWidth);
  doc.text(lines, x, y, { lineHeightFactor: lineHeight / (fontSize * 0.3528) });
  return y + Math.max(0, lines.length - 1) * lineHeight;
};

const drawKeyValue = (
  doc,
  label,
  value,
  x,
  y,
  width,
  { labelWidth = 27, fontSize = 7.4 } = {},
) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(fontSize);
  doc.setTextColor(...MUTED);
  doc.text(label, x, y);

  const valueX = x + labelWidth;
  const maxValueWidth = Math.max(8, width - labelWidth);
  drawFittedText(doc, value, valueX, y, maxValueWidth, {
    fontSize,
    minFontSize: 5.8,
    fontStyle: "bold",
    color: TEXT,
  });
};

const drawTableKeyValue = (
  doc,
  label,
  value,
  x,
  y,
  width,
  { labelWidth = 29, fontSize = 6.9 } = {},
) => {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(fontSize);
  doc.setTextColor(...THEME);
  doc.text(label, x, y);

  const valueX = x + labelWidth;
  const maxValueWidth = Math.max(8, width - labelWidth);
  drawFittedText(doc, value, valueX, y, maxValueWidth, {
    fontSize,
    minFontSize: 5.8,
    fontStyle: "normal",
    color: TEXT,
  });
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const loadBrowserImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const cropImageForPdf = async (
  file,
  crop = {},
  outputWidth = 1400,
  outputHeight = 760,
) => {
  if (!file) return null;

  const src = await fileToDataUrl(file);
  const img = await loadBrowserImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const zoom = Math.max(1, Number(crop.zoom) || 1);
  const panX = Math.max(-100, Math.min(100, Number(crop.x) || 0));
  const panY = Math.max(-100, Math.min(100, Number(crop.y) || 0));

  const baseScale = Math.max(
    outputWidth / img.width,
    outputHeight / img.height,
  );
  const scale = baseScale * zoom;
  const drawWidth = img.width * scale;
  const drawHeight = img.height * scale;

  const overflowX = Math.max(0, drawWidth - outputWidth);
  const overflowY = Math.max(0, drawHeight - outputHeight);

  const drawX = -overflowX / 2 + (panX / 100) * (overflowX / 2);
  const drawY = -overflowY / 2 + (panY / 100) * (overflowY / 2);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, outputWidth, outputHeight);
  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

  return canvas.toDataURL("image/jpeg", 0.93);
};

const getCropSettings = (root, key) => ({
  zoom: root.querySelector(`[data-${key}-zoom]`)?.value || 1,
  x: root.querySelector(`[data-${key}-x]`)?.value || 0,
  y: root.querySelector(`[data-${key}-y]`)?.value || 0,
});

const wireImageEditor = (root, key) => {
  const input = root.querySelector(`[data-${key}-file]`);
  const preview = root.querySelector(`[data-${key}-preview]`);
  const frame = root.querySelector(`[data-${key}-frame]`);
  const zoom = root.querySelector(`[data-${key}-zoom]`);
  const x = root.querySelector(`[data-${key}-x]`);
  const y = root.querySelector(`[data-${key}-y]`);
  const reset = root.querySelector(`[data-${key}-reset]`);
  if (!input || !preview || !frame || !zoom || !x || !y) return;

  let dragging = false;
  let startClientX = 0;
  let startClientY = 0;
  let startPanX = 0;
  let startPanY = 0;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  // Render the editor with the same "cover + zoom + pan" math used by the
  // generated PDF, so the position seen here closely matches the report.
  const apply = () => {
    if (!preview.src || !preview.naturalWidth || !preview.naturalHeight) return;

    const frameWidth = frame.clientWidth;
    const frameHeight = frame.clientHeight;
    if (!frameWidth || !frameHeight) return;

    const zoomValue = Math.max(1, Number(zoom.value) || 1);
    const panX = clamp(Number(x.value) || 0, -100, 100);
    const panY = clamp(Number(y.value) || 0, -100, 100);

    const baseScale = Math.max(
      frameWidth / preview.naturalWidth,
      frameHeight / preview.naturalHeight,
    );
    const scale = baseScale * zoomValue;
    const drawWidth = preview.naturalWidth * scale;
    const drawHeight = preview.naturalHeight * scale;
    const overflowX = Math.max(0, drawWidth - frameWidth);
    const overflowY = Math.max(0, drawHeight - frameHeight);

    const left = -overflowX / 2 + (panX / 100) * (overflowX / 2);
    const top = -overflowY / 2 + (panY / 100) * (overflowY / 2);

    preview.style.width = `${drawWidth}px`;
    preview.style.height = `${drawHeight}px`;
    preview.style.left = `${left}px`;
    preview.style.top = `${top}px`;
    preview.style.transform = "none";
    preview.style.cursor = overflowX > 0 || overflowY > 0 ? "grab" : "default";
  };

  const resetPosition = () => {
    zoom.value = "1";
    x.value = "0";
    y.value = "0";
    apply();
  };

  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) {
      preview.removeAttribute("src");
      return;
    }
    const url = URL.createObjectURL(file);
    preview.onload = () => {
      URL.revokeObjectURL(url);
      resetPosition();
    };
    preview.src = url;
  });

  zoom.addEventListener("input", apply);
  reset?.addEventListener("click", resetPosition);

  frame.addEventListener("pointerdown", (event) => {
    if (!preview.src || !preview.naturalWidth) return;
    dragging = true;
    startClientX = event.clientX;
    startClientY = event.clientY;
    startPanX = Number(x.value) || 0;
    startPanY = Number(y.value) || 0;
    frame.setPointerCapture?.(event.pointerId);
    preview.style.cursor = "grabbing";
    event.preventDefault();
  });

  frame.addEventListener("pointermove", (event) => {
    if (!dragging || !preview.naturalWidth || !preview.naturalHeight) return;

    const frameWidth = frame.clientWidth;
    const frameHeight = frame.clientHeight;
    const zoomValue = Math.max(1, Number(zoom.value) || 1);
    const baseScale = Math.max(
      frameWidth / preview.naturalWidth,
      frameHeight / preview.naturalHeight,
    );
    const drawWidth = preview.naturalWidth * baseScale * zoomValue;
    const drawHeight = preview.naturalHeight * baseScale * zoomValue;
    const halfOverflowX = Math.max(0, drawWidth - frameWidth) / 2;
    const halfOverflowY = Math.max(0, drawHeight - frameHeight) / 2;

    const deltaX = event.clientX - startClientX;
    const deltaY = event.clientY - startClientY;

    const nextX =
      halfOverflowX > 0 ? startPanX + (deltaX / halfOverflowX) * 100 : 0;
    const nextY =
      halfOverflowY > 0 ? startPanY + (deltaY / halfOverflowY) * 100 : 0;

    x.value = String(clamp(nextX, -100, 100));
    y.value = String(clamp(nextY, -100, 100));
    apply();
    event.preventDefault();
  });

  const stopDragging = (event) => {
    if (!dragging) return;
    dragging = false;
    frame.releasePointerCapture?.(event.pointerId);
    apply();
  };

  frame.addEventListener("pointerup", stopDragging);
  frame.addEventListener("pointercancel", stopDragging);
  window.addEventListener("resize", apply);
};

const imageEditorMarkup = (key, title, subtitle, required = true) => `
  <div class="tl-image-card">
    <div class="tl-image-title">${escapeHtml(title)}</div>
    <div class="tl-image-subtitle">${escapeHtml(subtitle)}</div>
    <input data-${key}-file type="file" accept="image/*" ${required ? "required" : ""} />
    <div class="tl-preview-frame ${key === "owner" ? "tl-preview-owner" : "tl-preview-party"}" data-${key}-frame>
      <img data-${key}-preview alt="${escapeHtml(title)} preview" draggable="false" />
      <div class="tl-preview-placeholder">Upload an image, then drag it to position</div>
    </div>
    <div class="tl-editor-controls">
      <label>Zoom <input data-${key}-zoom type="range" min="1" max="3" step="0.05" value="1" /></label>
      <button data-${key}-reset type="button" class="tl-reset-photo">Reset position</button>
    </div>
    <input data-${key}-x type="hidden" value="0" />
    <input data-${key}-y type="hidden" value="0" />
    <div class="tl-drag-hint">Drag the photo directly inside the box to move it. You can choose another image at any time.</div>
  </div>
`;

const collectTransferLetterData = (details) =>
  new Promise((resolve) => {
    const previous = document.getElementById("ruda-transfer-letter-modal");
    if (previous) previous.remove();

    const overlay = document.createElement("div");
    overlay.id = "ruda-transfer-letter-modal";
    overlay.innerHTML = `
      <style>
        #ruda-transfer-letter-modal {
          position: fixed;
          inset: 0;
          z-index: 999999;
          background: rgba(15, 23, 42, 0.68); backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          font-family: Arial, sans-serif;
        }
        #ruda-transfer-letter-modal * { box-sizing: border-box; }
        #ruda-transfer-letter-modal .tl-modal {
          width: min(1160px, 96vw);
          max-height: 94vh;
          overflow: auto;
          background: #ffffff;
          border-radius: 14px;
          box-shadow: 0 28px 90px rgba(15,23,42,.36); border: 1px solid rgba(30,58,95,.12);
        }
        #ruda-transfer-letter-modal .tl-header {
          position: sticky;
          top: 0;
          z-index: 2;
          background: linear-gradient(135deg, #1e3a5f 0%, #294d78 100%);
          border-bottom: 0;
          padding: 18px 22px;
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: center;
        }
        #ruda-transfer-letter-modal .tl-header h2 {
          margin: 0;
          font-size: 18px;
          color: #ffffff;
        }
        #ruda-transfer-letter-modal .tl-header p {
          margin: 4px 0 0;
          font-size: 12px;
          color: #dbe7f5;
        }
        #ruda-transfer-letter-modal .tl-close {
          width: 34px;
          height: 34px;
          border: 0;
          border-radius: 8px;
          background: rgba(255,255,255,.14);
          font-size: 22px;
          color: #fff;
          cursor: pointer;
        }
        #ruda-transfer-letter-modal form { padding: 20px 22px 22px; background: #f5f7fa; }
        #ruda-transfer-letter-modal .tl-section {
          margin-bottom: 16px;
          padding: 16px;
          border: 1px solid #d9e1ea;
          border-radius: 10px;
          background: #ffffff;
          box-shadow: 0 2px 10px rgba(15,23,42,.04);
        }
        #ruda-transfer-letter-modal .tl-section h3 {
          margin: -16px -16px 14px;
          padding: 9px 12px;
          font-size: 13px;
          letter-spacing: .25px;
          color: #ffffff;
          background: #1e3a5f;
          border-radius: 9px 9px 0 0;
        }
        #ruda-transfer-letter-modal .tl-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }
        #ruda-transfer-letter-modal .tl-grid.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        #ruda-transfer-letter-modal label.tl-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
          font-size: 11px;
          font-weight: 700;
          color: #475569;
        }
        #ruda-transfer-letter-modal input[type="text"],
        #ruda-transfer-letter-modal input[type="date"],
        #ruda-transfer-letter-modal select {
          width: 100%;
          height: 38px;
          border: 1px solid #c7d2df;
          border-radius: 6px;
          padding: 0 10px;
          background: #ffffff;
          color: #172033;
          outline: none;
        }
        #ruda-transfer-letter-modal input:focus,
        #ruda-transfer-letter-modal select:focus {
          border-color: #1e3a5f;
          box-shadow: 0 0 0 2px rgba(30,58,95,.09);
        }
        #ruda-transfer-letter-modal .tl-images {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }
        #ruda-transfer-letter-modal .tl-image-card {
          padding: 12px;
          border: 1px solid #d6dee8;
          border-radius: 8px;
          background: #ffffff;
        }
        #ruda-transfer-letter-modal .tl-image-title {
          font-size: 12px;
          font-weight: 800;
          color: #1e3a5f;
        }
        #ruda-transfer-letter-modal .tl-image-subtitle {
          min-height: 30px;
          margin: 3px 0 8px;
          font-size: 10px;
          line-height: 1.4;
          color: #64748b;
        }
        #ruda-transfer-letter-modal .tl-image-card input[type="file"] {
          width: 100%;
          margin-bottom: 8px;
          font-size: 11px;
        }
        #ruda-transfer-letter-modal .tl-preview-frame {
          position: relative;
          overflow: hidden;
          border: 1px dashed #94a3b8;
          border-radius: 6px;
          background: #f8fafc;
          touch-action: none;
          user-select: none;
        }
        /* Match the actual report photo proportions as closely as possible. */
        #ruda-transfer-letter-modal .tl-preview-party { aspect-ratio: 2.28 / 1; }
        #ruda-transfer-letter-modal .tl-preview-owner { aspect-ratio: 1.4 / 1; }
        #ruda-transfer-letter-modal .tl-preview-frame img {
          position: absolute;
          z-index: 1;
          max-width: none;
          max-height: none;
          object-fit: fill;
          transform-origin: center center;
          cursor: grab;
          user-select: none;
          -webkit-user-drag: none;
        }
        #ruda-transfer-letter-modal .tl-preview-frame img:not([src]) { display: none; }
        #ruda-transfer-letter-modal .tl-preview-placeholder {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          padding: 10px;
          text-align: center;
          color: #94a3b8;
          font-size: 10px;
        }
        #ruda-transfer-letter-modal .tl-editor-controls {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 10px;
          margin-top: 9px;
        }
        #ruda-transfer-letter-modal .tl-editor-controls label {
          display: grid;
          grid-template-columns: 42px 1fr;
          align-items: center;
          gap: 7px;
          font-size: 10px;
          color: #475569;
        }
        #ruda-transfer-letter-modal .tl-reset-photo {
          height: 28px;
          padding: 0 9px;
          border: 1px solid #cbd5e1;
          border-radius: 5px;
          background: #f8fafc;
          color: #334155;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
        }
        #ruda-transfer-letter-modal .tl-drag-hint {
          margin-top: 6px;
          font-size: 9.5px;
          line-height: 1.35;
          color: #64748b;
        }
        #ruda-transfer-letter-modal .tl-actions {
          position: sticky;
          bottom: 0;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding-top: 10px;
          background: linear-gradient(to top, #f5f7fa 72%, rgba(245,247,250,0));
        }
        #ruda-transfer-letter-modal .tl-btn {
          height: 40px;
          padding: 0 17px;
          border: 0;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }
        #ruda-transfer-letter-modal .tl-btn.cancel { background: #e5eaf0; color: #334155; }
        #ruda-transfer-letter-modal .tl-btn.primary { background: #1e3a5f; color: #fff; box-shadow: 0 5px 14px rgba(30,58,95,.2); }
        @media (max-width: 850px) {
          #ruda-transfer-letter-modal .tl-grid,
          #ruda-transfer-letter-modal .tl-grid.two,
          #ruda-transfer-letter-modal .tl-images { grid-template-columns: 1fr; }
        }
      </style>
      <div class="tl-modal" role="dialog" aria-modal="true" aria-label="Transfer Letter Details">
        <div class="tl-header">
          <div>
            <h2>RUDA Transfer Letter</h2>
            <p>Plot ${escapeHtml(valueOrDash(details.plotNo))} · ${escapeHtml(valueOrDash(details.block))}. Enter transfer-party details and adjust all three photos before generating the PDF.</p>
          </div>
          <button type="button" class="tl-close" aria-label="Close">×</button>
        </div>

        <form>
          <section class="tl-section">
            <h3>Document / Transfer Details</h3>
            <div class="tl-grid">
              <label class="tl-field">Transfer Letter No.
                <input name="letterNo" type="text" placeholder="Enter transfer letter number" required />
              </label>
              <label class="tl-field">OWC No.
                <input name="owcNo" type="text" placeholder="Enter OWC number" required />
              </label>
              <label class="tl-field">Transfer No.
                <input name="transferNo" type="text" value="${escapeHtml(details.transferSrNo)}" placeholder="Enter transfer number" required />
              </label>
              <label class="tl-field">Transfer Mode
                <input name="transferMode" type="text" value="Normal" placeholder="e.g. Normal" required />
              </label>
              <label class="tl-field">Building Period
                <input name="buildingPeriod" type="text" placeholder="e.g. 3 Years" />
              </label>
              <label class="tl-field">Building Expiry Date
                <input name="buildingExpiryDate" type="date" />
              </label>
              <label class="tl-field">Building Completion Date
                <input name="buildingCompletionDate" type="date" />
              </label>
              <label class="tl-field">Previous Allotment / Exemption Ref. No.
                <input name="previousRefNo" type="text" placeholder="Optional reference number" />
              </label>
            </div>
          </section>

          <section class="tl-section">
            <h3>Original Allottee / Previous Title Holder</h3>
            <div class="tl-grid">
              <label class="tl-field">Name
                <input name="originalAllotteeName" type="text" value="${escapeHtml(details.owner)}" required />
              </label>
              <label class="tl-field">Relation
                <select name="originalRelationType">
                  <option value="S/O">S/O</option>
                  <option value="D/O">D/O</option>
                  <option value="W/O">W/O</option>
                </select>
              </label>
              <label class="tl-field">Father / Husband Name
                <input name="originalRelationName" type="text" required />
              </label>
            </div>
          </section>

          <section class="tl-section">
            <h3>Seller Information</h3>
            <div class="tl-grid">
              <label class="tl-field">Seller Name
                <input name="sellerName" type="text" value="${escapeHtml(details.owner)}" required />
              </label>
              <label class="tl-field">Relation
                <select name="sellerRelationType">
                  <option value="S/O">S/O</option>
                  <option value="D/O">D/O</option>
                  <option value="W/O">W/O</option>
                </select>
              </label>
              <label class="tl-field">Father / Husband Name
                <input name="sellerRelationName" type="text" required />
              </label>
              <label class="tl-field">CNIC No.
                <input name="sellerCnic" type="text" placeholder="XXXXX-XXXXXXX-X" required />
              </label>
              <label class="tl-field">Multiple Seller
                <select name="multipleSeller">
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </label>
            </div>
          </section>

          <section class="tl-section">
            <h3>Buyer / New Owner Information</h3>
            <div class="tl-grid">
              <label class="tl-field">Buyer Name
                <input name="buyerName" type="text" required />
              </label>
              <label class="tl-field">Relation
                <select name="buyerRelationType">
                  <option value="S/O">S/O</option>
                  <option value="D/O">D/O</option>
                  <option value="W/O">W/O</option>
                </select>
              </label>
              <label class="tl-field">Father / Husband Name
                <input name="buyerRelationName" type="text" required />
              </label>
              <label class="tl-field">CNIC No.
                <input name="buyerCnic" type="text" placeholder="XXXXX-XXXXXXX-X" required />
              </label>
              <label class="tl-field">Multiple Buyer
                <select name="multipleBuyer">
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </label>
            </div>
          </section>

          <section class="tl-section">
            <h3>Photo Uploads & Placement</h3>
            <div class="tl-images">
              ${imageEditorMarkup(
                "seller",
                "Seller + Identification Officer",
                "Upload the single photo containing both persons. Zoom if needed, then drag the image directly inside the preview to align both faces under their headings.",
              )}
              ${imageEditorMarkup(
                "buyer",
                "Buyer + Identification Officer",
                "Upload the single photo containing both persons. Zoom if needed, then drag it inside the preview until both faces fit the printed box.",
              )}
              ${imageEditorMarkup(
                "owner",
                "New Owner Photograph",
                "Upload the new owner's single photograph, then drag it inside the preview to place the face correctly in the new-owner box.",
              )}
            </div>
          </section>

          <div class="tl-actions">
            <button type="button" class="tl-btn cancel">Cancel</button>
            <button type="submit" class="tl-btn primary">Generate Transfer Letter</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    wireImageEditor(overlay, "seller");
    wireImageEditor(overlay, "buyer");
    wireImageEditor(overlay, "owner");

    const close = () => {
      overlay.remove();
      document.body.style.overflow = "";
      resolve(null);
    };

    overlay.querySelector(".tl-close")?.addEventListener("click", close);
    overlay.querySelector(".tl-btn.cancel")?.addEventListener("click", close);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close();
    });

    overlay.querySelector("form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = new FormData(form);

      const sellerImage =
        overlay.querySelector("[data-seller-file]")?.files?.[0];
      const buyerImage = overlay.querySelector("[data-buyer-file]")?.files?.[0];
      const ownerImage = overlay.querySelector("[data-owner-file]")?.files?.[0];

      if (!sellerImage || !buyerImage || !ownerImage) {
        alert("Please upload all three required photographs.");
        return;
      }

      const previewWindow = createPdfPreviewWindow("Transfer Letter");
      if (!previewWindow) return;

      const payload = {
        letterNo: normalizeText(data.get("letterNo")),
        owcNo: normalizeText(data.get("owcNo")),
        transferNo: normalizeText(data.get("transferNo")),
        transferMode: normalizeText(data.get("transferMode"), "Normal"),
        buildingPeriod: normalizeText(data.get("buildingPeriod")),
        buildingExpiryDate: normalizeText(data.get("buildingExpiryDate")),
        buildingCompletionDate: normalizeText(
          data.get("buildingCompletionDate"),
        ),
        previousRefNo: normalizeText(data.get("previousRefNo")),
        originalAllotteeName: normalizeText(data.get("originalAllotteeName")),
        originalRelationType: normalizeText(data.get("originalRelationType")),
        originalRelationName: normalizeText(data.get("originalRelationName")),
        sellerName: normalizeText(data.get("sellerName")),
        sellerRelationType: normalizeText(data.get("sellerRelationType")),
        sellerRelationName: normalizeText(data.get("sellerRelationName")),
        sellerCnic: normalizeText(data.get("sellerCnic")),
        multipleSeller: normalizeText(data.get("multipleSeller"), "No"),
        buyerName: normalizeText(data.get("buyerName")),
        buyerRelationType: normalizeText(data.get("buyerRelationType")),
        buyerRelationName: normalizeText(data.get("buyerRelationName")),
        buyerCnic: normalizeText(data.get("buyerCnic")),
        multipleBuyer: normalizeText(data.get("multipleBuyer"), "No"),
        sellerImage,
        buyerImage,
        ownerImage,
        sellerCrop: getCropSettings(overlay, "seller"),
        buyerCrop: getCropSettings(overlay, "buyer"),
        ownerCrop: getCropSettings(overlay, "owner"),
        previewWindow,
      };

      overlay.remove();
      document.body.style.overflow = "";
      resolve(payload);
    });
  });

const formatInputDate = (value) => {
  const raw = normalizeText(value);
  if (!raw) return "-";
  const [year, month, day] = raw.split("-");
  if (!year || !month || !day) return raw;
  return `${day}-${month}-${year}`;
};

const drawPhotoBox = (
  doc,
  image,
  x,
  y,
  width,
  height,
  leftTitle,
  rightTitle,
) => {
  const headerHeight = 6;
  const imageTop = y + headerHeight;
  const imageHeight = height - headerHeight;

  doc.setDrawColor(72, 72, 72);
  doc.setLineWidth(0.3);
  doc.rect(x, y, width, height);
  doc.line(x + width / 2, y, x + width / 2, y + headerHeight);
  doc.line(x, imageTop, x + width, imageTop);

  doc.setFillColor(238, 242, 247);
  doc.rect(x, y, width, headerHeight, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.1);
  doc.setTextColor(...THEME);
  doc.text(leftTitle, x + width / 4, y + 4.1, { align: "center" });
  doc.text(rightTitle, x + (width * 3) / 4, y + 4.1, { align: "center" });

  if (image) {
    doc.addImage(
      image,
      "JPEG",
      x + 0.45,
      imageTop + 0.45,
      width - 0.9,
      imageHeight - 0.9,
      undefined,
      "FAST",
    );
  }
};

const drawThumbSignatureBox = (doc, x, y, width, roleLabel) => {
  const thumbWidth = 31;
  const height = 15;

  doc.setDrawColor(72, 72, 72);
  doc.setLineWidth(0.3);
  doc.rect(x, y, width, height);
  doc.line(x + thumbWidth, y, x + thumbWidth, y + height);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.3);
  doc.setTextColor(...MUTED);
  doc.text("Thumb Impression", x + thumbWidth / 2, y + height - 2, {
    align: "center",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.4);
  doc.setTextColor(...TEXT);
  doc.text(
    `Signature of ${roleLabel}`,
    x + thumbWidth + (width - thumbWidth) / 2,
    y + height - 2,
    {
      align: "center",
    },
  );
};

const drawPartyInfo = (doc, x, y, width, party, title) => {
  // Keep every value in the party card on the exact same vertical start line.
  const innerX = x + 2.5;
  const innerWidth = width - 5;
  const valueStart = 28;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.4);
  doc.setTextColor(...THEME);
  doc.text(title, innerX, y);

  drawKeyValue(doc, "Mr./Ms:", party.name, innerX, y + 5.3, innerWidth, {
    labelWidth: valueStart,
    fontSize: 6.9,
  });
  drawKeyValue(
    doc,
    "S/O,D/O,W/O:",
    relationText(party.relationType, party.relationName),
    innerX,
    y + 10,
    innerWidth,
    { labelWidth: valueStart, fontSize: 6.9 },
  );
  drawKeyValue(doc, "CNIC NO:", party.cnic, innerX, y + 14.7, innerWidth, {
    labelWidth: valueStart,
    fontSize: 6.9,
  });
  drawKeyValue(
    doc,
    `Multiple ${title}:`,
    party.multiple,
    innerX,
    y + 19.4,
    innerWidth,
    {
      labelWidth: valueStart,
      fontSize: 6.9,
    },
  );
};

export const printTransferLetter = async ({ parcel, filters = {} }) => {
  if (!parcel) {
    alert("Please select a plot first.");
    return;
  }

  const details = buildPlotDetails(parcel, filters);
  const transferData = await collectTransferLetterData(details);
  if (!transferData) return;

  const previewWindow = transferData.previewWindow;

  try {
    const [{ gopLogo, rudaLogo }, sellerPhoto, buyerPhoto, ownerPhoto] =
      await Promise.all([
        loadPrintAssets(),
        cropImageForPdf(
          transferData.sellerImage,
          transferData.sellerCrop,
          1600,
          700,
        ),
        cropImageForPdf(
          transferData.buyerImage,
          transferData.buyerCrop,
          1600,
          700,
        ),
        cropImageForPdf(
          transferData.ownerImage,
          transferData.ownerCrop,
          980,
          700,
        ),
      ]);

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;
    const rightEdge = pageWidth - margin;
    const dateText = todayDisplay();

    doc.setFillColor(...THEME);
    doc.rect(0, 0, pageWidth, 1.8, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.2);
    doc.setTextColor(...MUTED);
    doc.text("ORIGINAL COPY", pageWidth / 2, 5.1, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.6);
    doc.text(
      `Serial No: ${valueOrDash(transferData.letterNo)}`,
      rightEdge,
      5.2,
      {
        align: "right",
      },
    );

    const logoY = 17.3;
    drawCircularLogo(doc, gopLogo, margin + 11.5, logoY, 22.5);
    drawCircularLogo(doc, rudaLogo, rightEdge - 11, logoY, 21.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14.8);
    doc.setTextColor(...THEME);
    doc.text("RAVI URBAN DEVELOPMENT AUTHORITY", pageWidth / 2, 11.2, {
      align: "center",
    });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.7);
    doc.setTextColor(...MUTED);
    // doc.text("Government of the Punjab", pageWidth / 2, 15.8, {
    //   align: "center",
    // });

    drawFittedText(
      doc,
      valueOrDash(details.project),
      pageWidth / 2,
      20.8,
      115,
      { fontSize: 9.6, minFontSize: 7.2, align: "center", fontStyle: "bold" },
    );

    const badgeW = 50;
    const badgeH = 7.5;
    const badgeX = (pageWidth - badgeW) / 2;
    const badgeY = 24.0;
    doc.setFillColor(...THEME);
    doc.setDrawColor(...THEME);
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.8);
    doc.setTextColor(255, 255, 255);
    doc.text("TRANSFER LETTER", pageWidth / 2, badgeY + 5.1, {
      align: "center",
    });
    doc.setTextColor(...TEXT);

    const metaY = 36.6;
    doc.setFontSize(7.4);
    drawKeyValue(
      doc,
      "Transfer Letter No:",
      transferData.letterNo,
      margin,
      metaY,
      108,
      {
        labelWidth: 34,
        fontSize: 7.4,
      },
    );
    drawKeyValue(doc, "DATE:", dateText, 156, metaY, rightEdge - 156, {
      labelWidth: 12,
      fontSize: 7.4,
    });

    const detailsHeaderY = 40.2;
    const detailsHeaderH = 6.5;
    doc.setFillColor(...THEME);
    doc.setDrawColor(...THEME);
    doc.rect(margin, detailsHeaderY, contentWidth, detailsHeaderH, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.2);
    doc.setTextColor(255, 255, 255);
    doc.text("TRANSFER & PLOT INFORMATION", margin + 2.5, detailsHeaderY + 4.5);
    doc.setTextColor(...TEXT);

    const boxTop = detailsHeaderY + detailsHeaderH;
    const boxHeight = 39.5;
    doc.setDrawColor(168, 177, 188);
    doc.setLineWidth(0.25);
    doc.rect(margin, boxTop, contentWidth, boxHeight);

    const rows = [
      [
        ["Transfer No.", transferData.transferNo],
        ["OWC No.", transferData.owcNo],
      ],
      [
        ["Scheme / Project", details.project],
        ["Block", details.block],
      ],
      [
        ["Phase", details.phase],
        ["Plot No.", details.plotNo],
      ],
      [
        ["Plot Area", details.plotArea],
        ["Plot Type", details.landUse],
      ],
      [
        ["Road Facing", details.roadFacing],
        ["TR Plot No.", details.transferPlotNo],
      ],
      [
        ["TR Category", details.transferCategory],
        ["Transfer Mode", transferData.transferMode],
      ],
      [
        ["Building Period", transferData.buildingPeriod],
        ["Expiry Date", formatInputDate(transferData.buildingExpiryDate)],
      ],
      [
        [
          "Completion Date",
          formatInputDate(transferData.buildingCompletionDate),
        ],
        ["Unique ID", details.uniqueId],
      ],
    ];

    const rowHeight = boxHeight / rows.length;
    rows.forEach((row, index) => {
      const rowTop = boxTop + index * rowHeight;
      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, rowTop, contentWidth, rowHeight, "F");
      }
      doc.setDrawColor(190, 198, 208);
      if (index > 0) doc.line(margin, rowTop, rightEdge, rowTop);
      doc.line(pageWidth / 2, rowTop, pageWidth / 2, rowTop + rowHeight);
      const textY = rowTop + 3.35;
      drawTableKeyValue(
        doc,
        row[0][0],
        row[0][1],
        margin + 2,
        textY,
        contentWidth / 2 - 4,
        {
          labelWidth: 29,
          fontSize: 6.9,
        },
      );
      drawTableKeyValue(
        doc,
        row[1][0],
        row[1][1],
        pageWidth / 2 + 2,
        textY,
        contentWidth / 2 - 4,
        {
          labelWidth: 26,
          fontSize: 6.9,
        },
      );
    });

    const paraY = boxTop + boxHeight + 6;
    doc.setDrawColor(...THEME);
    doc.setLineWidth(0.45);
    doc.line(margin, paraY - 3.2, rightEdge, paraY - 3.2);
    const originalRelation = relationText(
      transferData.originalRelationType,
      transferData.originalRelationName,
    );
    const previousRef = transferData.previousRefNo
      ? ` vide allotment / exemption letter / recovery memo No. ${transferData.previousRefNo}.`
      : ".";
    const paragraph = `The title of the plot cited above is hereby transferred in the name of the buyer below, in view of verification of record, on the same terms & conditions as it was held by original allottee / exemptee ${transferData.originalAllotteeName} ${originalRelation}${previousRef}`;

    const paragraphEnd = drawWrapped(
      doc,
      paragraph,
      margin,
      paraY,
      contentWidth,
      {
        fontSize: 7.5,
        lineHeight: 3.45,
      },
    );

    // Start the verification photos directly after the transfer paragraph.
    // The extra blue "TRANSFER PARTY VERIFICATION" heading is intentionally removed.
    const photosY = paragraphEnd + 4.8;
    const photoGap = 4;
    const photoWidth = (contentWidth - photoGap) / 2;
    const photoHeight = 52;

    drawPhotoBox(
      doc,
      sellerPhoto,
      margin,
      photosY,
      photoWidth,
      photoHeight,
      "Seller",
      "Identification Officer",
    );
    drawPhotoBox(
      doc,
      buyerPhoto,
      margin + photoWidth + photoGap,
      photosY,
      photoWidth,
      photoHeight,
      "Buyer",
      "Identification Officer",
    );

    const thumbY = photosY + photoHeight;
    drawThumbSignatureBox(doc, margin, thumbY, photoWidth, "Seller");
    drawThumbSignatureBox(
      doc,
      margin + photoWidth + photoGap,
      thumbY,
      photoWidth,
      "Buyer",
    );

    const partyInfoY = thumbY + 20.5;
    const partyWidth = (contentWidth - 6) / 2;
    const partyCardHeight = 25;
    doc.setDrawColor(187, 195, 205);
    doc.setLineWidth(0.25);
    doc.rect(margin, partyInfoY - 3.8, partyWidth, partyCardHeight);
    doc.rect(
      margin + partyWidth + 6,
      partyInfoY - 3.8,
      partyWidth,
      partyCardHeight,
    );
    drawPartyInfo(
      doc,
      margin,
      partyInfoY,
      partyWidth,
      {
        name: transferData.sellerName,
        relationType: transferData.sellerRelationType,
        relationName: transferData.sellerRelationName,
        cnic: transferData.sellerCnic,
        multiple: transferData.multipleSeller,
      },
      "Seller",
    );
    drawPartyInfo(
      doc,
      margin + partyWidth + 6,
      partyInfoY,
      partyWidth,
      {
        name: transferData.buyerName,
        relationType: transferData.buyerRelationType,
        relationName: transferData.buyerRelationName,
        cnic: transferData.buyerCnic,
        multiple: transferData.multipleBuyer,
      },
      "Buyer",
    );

    const ownerY = partyInfoY + 24.5;
    const ownerHeight = 42;
    doc.setFillColor(247, 249, 252);
    doc.rect(margin, ownerY, contentWidth, ownerHeight, "F");
    doc.setDrawColor(145, 156, 170);
    doc.setLineWidth(0.3);
    doc.rect(margin, ownerY, contentWidth, ownerHeight);
    doc.setFillColor(...THEME);
    doc.rect(margin, ownerY, contentWidth, 6.2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.2);
    doc.setTextColor(255, 255, 255);
    doc.text("NEW OWNER", margin + 2.2, ownerY + 4.3);
    doc.setTextColor(...TEXT);

    const ownerPhotoX = margin + 3;
    const ownerPhotoY = ownerY + 8.3;
    const ownerPhotoW = 42;
    const ownerPhotoH = 31;
    doc.setDrawColor(110, 110, 110);
    doc.rect(ownerPhotoX, ownerPhotoY, ownerPhotoW, ownerPhotoH);
    if (ownerPhoto) {
      doc.addImage(
        ownerPhoto,
        "JPEG",
        ownerPhotoX + 0.45,
        ownerPhotoY + 0.45,
        ownerPhotoW - 0.9,
        ownerPhotoH - 0.9,
        undefined,
        "FAST",
      );
    }

    // Compact two-column owner information block so the section does not leave
    // a large empty area on the right. Only existing transfer/plot data is reused.
    const ownerInfoX = ownerPhotoX + ownerPhotoW + 6;
    const ownerInfoWidth = rightEdge - ownerInfoX - 4;
    const ownerColGap = 5;
    const ownerColWidth = (ownerInfoWidth - ownerColGap) / 2;
    const ownerRightX = ownerInfoX + ownerColWidth + ownerColGap;
    const ownerInfoTop = ownerY + 14.2;
    const ownerLabelWidth = 23;

    drawKeyValue(
      doc,
      "Mr./Ms:",
      transferData.buyerName,
      ownerInfoX,
      ownerInfoTop,
      ownerColWidth,
      {
        labelWidth: ownerLabelWidth,
        fontSize: 7.0,
      },
    );
    drawKeyValue(
      doc,
      "CNIC No:",
      transferData.buyerCnic,
      ownerRightX,
      ownerInfoTop,
      ownerColWidth,
      {
        labelWidth: 20,
        fontSize: 7.0,
      },
    );
    drawKeyValue(
      doc,
      "Relation:",
      relationText(
        transferData.buyerRelationType,
        transferData.buyerRelationName,
      ),
      ownerInfoX,
      ownerInfoTop + 7,
      ownerColWidth,
      { labelWidth: ownerLabelWidth, fontSize: 7.0 },
    );
    drawKeyValue(
      doc,
      "Transfer No:",
      transferData.transferNo,
      ownerRightX,
      ownerInfoTop + 7,
      ownerColWidth,
      {
        labelWidth: 24,
        fontSize: 7.0,
      },
    );
    drawKeyValue(
      doc,
      "Plot No:",
      details.plotNo,
      ownerInfoX,
      ownerInfoTop + 14,
      ownerColWidth,
      {
        labelWidth: ownerLabelWidth,
        fontSize: 7.0,
      },
    );
    drawKeyValue(
      doc,
      "Transfer Mode:",
      transferData.transferMode,
      ownerRightX,
      ownerInfoTop + 14,
      ownerColWidth,
      {
        labelWidth: 27,
        fontSize: 7.0,
      },
    );

    const footerY = ownerY + ownerHeight + 7;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.2);
    doc.setTextColor(...TEXT);
    doc.text("Copies forwarded to:", margin + 1, footerY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.9);
    doc.text("1. Director Town Planning.", margin + 6, footerY + 5);
    doc.text("2. Director Land / Estate Officer.", margin + 6, footerY + 10);
    doc.text("3. Seller.", margin + 6, footerY + 15);

    const signatureX = 111;
    const signatureY = footerY - 1;
    const signatureW = rightEdge - signatureX;
    const signatureH = 24;
    doc.setDrawColor(...THEME);
    doc.setLineWidth(0.35);
    doc.rect(signatureX, signatureY, signatureW, signatureH);
    doc.setFillColor(247, 249, 252);
    doc.rect(signatureX, signatureY, signatureW, 6, "F");
    doc.line(
      signatureX,
      signatureY + 6,
      signatureX + signatureW,
      signatureY + 6,
    );
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(...THEME);
    doc.text(
      "Signature of Transfer Officer",
      signatureX + signatureW / 2,
      signatureY + 4.2,
      {
        align: "center",
      },
    );
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.1);
    doc.setTextColor(...THEME);
    doc.text(
      "Deputy Director Land / Authorized Officer",
      signatureX + signatureW / 2,
      signatureY + signatureH + 5,
      {
        align: "center",
      },
    );

    doc.setDrawColor(...THEME);
    doc.setLineWidth(0.5);
    doc.line(margin, 286, rightEdge, 286);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Generated: ${new Date().toLocaleDateString("en-GB")} | RUDA Transfer Letter System | This is a computer-generated document.`,
      pageWidth / 2,
      290,
      { align: "center" },
    );

    openPdfPreview(
      doc,
      `Transfer Letter - Plot ${details.plotNo || ""}`,
      previewWindow,
    );
  } catch (error) {
    if (previewWindow && !previewWindow.closed) previewWindow.close();
    console.error("Transfer letter generation failed", error);
    alert(
      "Failed to generate the transfer letter. Please check the entered details and uploaded photographs and try again.",
    );
  }
};

export default printTransferLetter;

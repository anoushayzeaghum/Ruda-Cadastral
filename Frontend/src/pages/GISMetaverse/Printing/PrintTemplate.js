import { escapeHtml } from "./PrintUtils";

const northArrowSvg = `
  <svg viewBox="0 0 100 100" role="img" aria-label="North arrow">
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
  </svg>`;

const legendSymbol = (item) => {
  const color = escapeHtml(item.color || "#111827");
  const fillColor = escapeHtml(item.fillColor || "transparent");
  const kind = item.kind || "line";

  if (kind === "point") {
    return `<span class="legend-point" style="background:${color}"></span>`;
  }
  if (kind === "polygon") {
    return `<span class="legend-polygon" style="border-color:${color};background:${fillColor}"></span>`;
  }
  if (kind === "line-dash") {
    return `<span class="legend-line dashed" style="border-color:${color}"></span>`;
  }
  if (kind === "line-wide") {
    return `<span class="legend-line wide" style="border-color:${color}"></span>`;
  }
  if (kind === "gradient") {
    return `<span class="legend-gradient"></span>`;
  }
  return `<span class="legend-line" style="border-color:${color}"></span>`;
};

export const makePrintableHtml = ({
  title,
  subtitle = "",
  mapImage,
  insetImage,
  legendRows = [],
  logoUrl,
  metadata = {},
  insetTitle = "RUDA / LP Principle Boundary Overview",
}) => {
  const legendHtml = legendRows.length
    ? legendRows
        .map(
          (item) => `
            <div class="legend-row">
              <span class="legend-symbol">${legendSymbol(item)}</span>
              <span>${escapeHtml(item.label)}</span>
            </div>`,
        )
        .join("")
    : '<div class="legend-empty">No operational GIS layer is currently enabled.</div>';

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
    .sheet { position: relative; width: 420mm; height: 297mm; overflow: hidden; border: 3px solid #1f2937; background: #f8fafc; }
    .map { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center; display: block; }
    .title { position: absolute; top: 16px; left: 50%; transform: translateX(-50%); min-width: 38%; max-width: 65%; padding: 10px 20px; background: rgba(255,255,255,.94); border: 1px solid #334155; text-align: center; font-size: 28px; font-weight: 800; letter-spacing: .02em; box-shadow: 0 8px 22px rgba(0,0,0,.18); }
    .subtitle { margin-top: 4px; font-size: 12px; font-weight: 600; color: #475569; }
    .logo-box { position: absolute; left: 16px; top: 16px; width: 108px; height: 108px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,.96); border: 1px solid #334155; padding: 8px; }
    .logo-box img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .north { position: absolute; right: 18px; top: 16px; width: 108px; height: 108px; border: 1px solid #334155; background: rgba(255,255,255,.96); display: flex; align-items: center; justify-content: center; padding: 5px; }
    .north svg { width: 96px; height: 96px; display: block; }
    .inset { position: absolute; left: 18px; bottom: 18px; width: 300px; background: rgba(255,255,255,.96); border: 2px solid #334155; padding: 8px; }
    .inset-title { font-size: 12px; font-weight: 800; margin-bottom: 6px; }
    .inset img { width: 100%; height: 165px; object-fit: cover; background: #eef2f7; border: 1px solid #64748b; }
    .legend { position: absolute; right: 18px; bottom: 18px; width: 285px; max-height: 405px; overflow: hidden; background: rgba(255,255,255,.96); border: 2px solid #334155; padding: 12px; }
    .legend h3 { margin: 0 0 8px; font-size: 18px; }
    .legend-grid { display: grid; grid-template-columns: 1fr; gap: 3px; }
    .legend-row { display: flex; align-items: center; gap: 9px; min-height: 23px; font-size: 11px; }
    .legend-symbol { width: 36px; height: 18px; flex: 0 0 36px; display: flex; align-items: center; justify-content: center; }
    .legend-line { width: 34px; border-top: 3px solid #111827; }
    .legend-line.dashed { border-top-style: dashed; }
    .legend-line.wide { border-top-width: 7px; }
    .legend-point { width: 13px; height: 13px; border: 2px solid #fff; outline: 1px solid #334155; border-radius: 999px; }
    .legend-polygon { width: 34px; height: 17px; border: 3px solid #111827; }
    .legend-gradient { width: 34px; height: 17px; border: 1px solid #334155; background: linear-gradient(90deg,#166534,#eab308,#dc2626); }
    .legend-empty { font-size: 11px; color: #64748b; }
    .scale { position: absolute; left: 50%; bottom: 18px; transform: translateX(-50%); min-width: 245px; background: rgba(255,255,255,.94); border: 1px solid #334155; padding: 7px 12px; text-align: center; font-size: 12px; font-weight: 700; }
    .scale-bar { width: 210px; height: 10px; margin: 5px auto 0; border: 1px solid #111827; background: linear-gradient(90deg,#111827 0 25%,#fff 25% 50%,#111827 50% 75%,#fff 75% 100%); }
    .credit { position: absolute; left: 18px; bottom: 203px; padding: 5px 8px; background: rgba(255,255,255,.92); border: 1px solid #334155; font-size: 10px; font-weight: 700; }
    .metadata { position: absolute; left: 334px; bottom: 18px; width: 270px; padding: 8px 10px; background: rgba(255,255,255,.94); border: 1px solid #334155; font-size: 10px; line-height: 1.5; }
    .metadata strong { display: inline-block; min-width: 70px; }
    @media print { html, body, .sheet { width: 420mm; height: 297mm; } }
  </style>
</head>
<body>
  <div class="sheet">
    <img class="map" src="${mapImage}" alt="Printed map" />
    <div class="logo-box"><img src="${logoUrl}" alt="RUDA Logo" /></div>
    <div class="title">${escapeHtml(title)}${subtitle ? `<div class="subtitle">${escapeHtml(subtitle)}</div>` : ""}</div>
    <div class="north">${northArrowSvg}</div>
    <div class="inset"><div class="inset-title">${escapeHtml(insetTitle)}</div><img src="${insetImage || mapImage}" alt="Overview map" /></div>
    <div class="credit">Prepared by: GIS Section, LA&amp;EM Department — RUDA</div>
    <div class="metadata">
      <div><strong>Center:</strong> ${escapeHtml(metadata.centerText || "-")}</div>
      <div><strong>Zoom:</strong> ${escapeHtml(metadata.zoomText || "-")}</div>
      <div><strong>Bearing:</strong> ${escapeHtml(metadata.bearingText || "-")}</div>
      <div><strong>Pitch:</strong> ${escapeHtml(metadata.pitchText || "-")}</div>
      <div><strong>Printed:</strong> ${escapeHtml(metadata.printedAt || "-")}</div>
    </div>
    <div class="legend"><h3>Legend</h3><div class="legend-grid">${legendHtml}</div></div>
    <div class="scale">Approximate scale: ${escapeHtml(metadata.scaleText || "-")}<div class="scale-bar"></div></div>
  </div>
  <script>
    const waitForImages = () => Promise.all(Array.from(document.images).map((image) => {
      if (image.complete) return Promise.resolve();
      return new Promise((resolve) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      });
    }));
    const returnToApplication = () => {
      try { if (window.opener && !window.opener.closed) window.opener.focus(); } catch (error) {}
      setTimeout(() => { try { window.close(); } catch (error) {} }, 100);
    };
    window.addEventListener("afterprint", returnToApplication, { once: true });
    window.addEventListener("load", async () => {
      await waitForImages();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.focus();
        window.print();
        setTimeout(returnToApplication, 1500);
      }));
    });
  </script>
</body>
</html>`;
};

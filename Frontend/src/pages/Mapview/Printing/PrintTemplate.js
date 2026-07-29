import { escapeHtml } from "./PrintUtils";

const northArrowSvg = `
<svg viewBox="0 0 120 120" role="img" aria-label="North arrow">
  <circle cx="60" cy="60" r="45" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
  <circle cx="60" cy="60" r="34" fill="none" stroke="#64748b" stroke-width="1"/>
  <path d="M60 8 L72 57 L60 48 L48 57 Z" fill="#0f3d2e"/>
  <path d="M60 112 L48 63 L60 72 L72 63 Z" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/>
  <path d="M8 60 L57 48 L48 60 L57 72 Z" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/>
  <path d="M112 60 L63 72 L72 60 L63 48 Z" fill="#0f172a"/>
  <circle cx="60" cy="60" r="5" fill="#0f172a"/>
  <text x="60" y="15" text-anchor="middle" font-size="13" font-family="Arial" font-weight="800">N</text>
  <text x="60" y="117" text-anchor="middle" font-size="11" font-family="Arial" font-weight="700">S</text>
  <text x="8" y="64" text-anchor="middle" font-size="11" font-family="Arial" font-weight="700">W</text>
  <text x="112" y="64" text-anchor="middle" font-size="11" font-family="Arial" font-weight="700">E</text>
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

  if (kind === "raster") {
    return `<span class="legend-raster" style="border-color:${color}"></span>`;
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
  insetTitle = "Map Overview",
}) => {
  const legendHtml = legendRows.length
    ? legendRows
        .map(
          (item) => `
            <div class="legend-row">
              <span class="legend-symbol">${legendSymbol(item)}</span>
              <span class="legend-label">${escapeHtml(item.label)}</span>
            </div>`,
        )
        .join("")
    : `
      <div class="legend-empty">
        No operational layer is currently enabled.
      </div>`;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A3 landscape; margin: 0; }

    * { box-sizing: border-box; }

    html, body {
      margin: 0;
      width: 100%;
      height: 100%;
      font-family: Arial, Helvetica, sans-serif;
      color: #0f172a;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .sheet {
      position: relative;
      width: 420mm;
      height: 297mm;
      overflow: hidden;
      background: #e2e8f0;
      border: 3px solid #0f172a;
    }

    .map-frame {
      position: absolute;
      inset: 10px;
      overflow: hidden;
      border: 1px solid #475569;
      background: #e2e8f0;
    }

    .map {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .glass {
      background: rgba(255,255,255,.96);
      border: 1px solid #334155;
      box-shadow: 0 8px 24px rgba(15,23,42,.16);
    }

    .title-box {
      position: absolute;
      z-index: 4;
      top: 18px;
      left: 50%;
      transform: translateX(-50%);
      min-width: 390px;
      max-width: 720px;
      padding: 11px 24px 10px;
      text-align: center;
      border-top: 5px solid #0f3d2e;
    }

    .title {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: .025em;
    }

    .subtitle {
      margin-top: 4px;
      font-size: 11px;
      font-weight: 700;
      color: #475569;
      letter-spacing: .08em;
      text-transform: uppercase;
    }

    .logo-box {
      position: absolute;
      z-index: 4;
      left: 20px;
      top: 20px;
      width: 102px;
      height: 102px;
      padding: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-top: 5px solid #0f3d2e;
    }

    .logo-box img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .north-box {
      position: absolute;
      z-index: 4;
      right: 20px;
      top: 20px;
      width: 102px;
      height: 102px;
      padding: 4px;
      border-top: 5px solid #0f3d2e;
    }

    .north-box svg {
      width: 100%;
      height: 100%;
    }

    .bottom-strip {
      position: absolute;
      z-index: 4;
      left: 20px;
      right: 20px;
      bottom: 20px;
      display: grid;
      grid-template-columns: 300px 290px minmax(250px, 1fr) 310px;
      gap: 10px;
      align-items: end;
      pointer-events: none;
    }

    .panel {
      overflow: hidden;
      border-top: 5px solid #0f3d2e;
    }

    .panel-heading {
      padding: 7px 10px;
      border-bottom: 1px solid #cbd5e1;
      background: #f8fafc;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: .045em;
      text-transform: uppercase;
    }

    .overview-content {
      padding: 7px;
    }

    .overview-content img {
      display: block;
      width: 100%;
      height: 130px;
      object-fit: cover;
      border: 1px solid #94a3b8;
      background: #e2e8f0;
    }

    .credit {
      margin-top: 6px;
      font-size: 9px;
      font-weight: 700;
      color: #334155;
    }

    .metadata-grid {
      display: grid;
      grid-template-columns: 74px 1fr;
      gap: 4px 8px;
      padding: 9px 10px 10px;
      font-size: 10px;
      line-height: 1.35;
    }

    .metadata-label {
      font-weight: 800;
      color: #334155;
    }

    .metadata-value {
      overflow-wrap: anywhere;
    }

    .scale-panel {
      padding: 11px 14px;
      text-align: center;
    }

    .scale-title {
      font-size: 11px;
      font-weight: 800;
    }

    .scale-bar {
      position: relative;
      width: 250px;
      max-width: 100%;
      height: 12px;
      margin: 7px auto 0;
      border: 1px solid #0f172a;
      background:
        linear-gradient(
          90deg,
          #0f172a 0 25%,
          #ffffff 25% 50%,
          #0f172a 50% 75%,
          #ffffff 75% 100%
        );
    }

    .scale-ticks {
      display: flex;
      justify-content: space-between;
      margin-top: 3px;
      font-size: 8px;
      color: #334155;
    }

    .legend-panel {
      max-height: 236px;
    }

    .legend-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2px;
      max-height: 195px;
      overflow: hidden;
      padding: 7px 10px 9px;
    }

    .legend-row {
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 22px;
      font-size: 10px;
    }

    .legend-label {
      line-height: 1.2;
    }

    .legend-symbol {
      width: 34px;
      min-width: 34px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .legend-line {
      width: 32px;
      border-top: 3px solid #111827;
    }

    .legend-line.dashed {
      border-top-style: dashed;
    }

    .legend-line.wide {
      border-top-width: 7px;
    }

    .legend-point {
      width: 12px;
      height: 12px;
      border: 2px solid #ffffff;
      outline: 1px solid #334155;
      border-radius: 999px;
    }

    .legend-polygon {
      width: 32px;
      height: 16px;
      border: 3px solid #111827;
    }

    .legend-gradient {
      width: 32px;
      height: 16px;
      border: 1px solid #334155;
      background: linear-gradient(90deg,#166534,#eab308,#dc2626);
    }

    .legend-raster {
      width: 32px;
      height: 16px;
      border: 1px solid #334155;
      background:
        repeating-linear-gradient(
          45deg,
          #cbd5e1 0 4px,
          #f8fafc 4px 8px
        );
    }

    .legend-empty {
      padding: 8px 0;
      font-size: 10px;
      color: #64748b;
    }

    @media print {
      html, body, .sheet {
        width: 420mm;
        height: 297mm;
      }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="map-frame">
      <img class="map" src="${mapImage}" alt="Printed GIS map" />
    </div>

    <div class="logo-box glass">
      <img src="${logoUrl}" alt="RUDA Logo" />
    </div>

    <div class="title-box glass">
      <div class="title">${escapeHtml(title)}</div>
      ${
        subtitle
          ? `<div class="subtitle">${escapeHtml(subtitle)}</div>`
          : ""
      }
    </div>

    <div class="north-box glass">
      ${northArrowSvg}
    </div>

    <div class="bottom-strip">
      <section class="panel glass">
        <div class="panel-heading">${escapeHtml(insetTitle)}</div>
        <div class="overview-content">
          <img src="${insetImage || mapImage}" alt="Map overview" />
          <div class="credit">
            Prepared by GIS Section, LA&amp;EM Department — RUDA
          </div>
        </div>
      </section>

      <section class="panel glass">
        <div class="panel-heading">Map Information</div>
        <div class="metadata-grid">
          <div class="metadata-label">Center</div>
          <div class="metadata-value">${escapeHtml(metadata.centerText || "-")}</div>

          <div class="metadata-label">Zoom</div>
          <div class="metadata-value">${escapeHtml(metadata.zoomText || "-")}</div>

          <div class="metadata-label">Bearing</div>
          <div class="metadata-value">${escapeHtml(metadata.bearingText || "-")}</div>

          <div class="metadata-label">Pitch</div>
          <div class="metadata-value">${escapeHtml(metadata.pitchText || "-")}</div>

          <div class="metadata-label">Basemap</div>
          <div class="metadata-value">${escapeHtml(metadata.basemap || "-")}</div>

          <div class="metadata-label">Status</div>
          <div class="metadata-value">${escapeHtml(metadata.boundaryStatus || "-")}</div>

          <div class="metadata-label">Layers</div>
          <div class="metadata-value">${escapeHtml(metadata.visibleLayerCount ?? legendRows.length)}</div>

          <div class="metadata-label">Printed</div>
          <div class="metadata-value">${escapeHtml(metadata.printedAt || "-")}</div>
        </div>
      </section>

      <section class="panel glass scale-panel">
        <div class="scale-title">
          Approximate Scale: ${escapeHtml(metadata.scaleText || "-")}
        </div>
        <div class="scale-bar"></div>
        <div class="scale-ticks">
          <span>0</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </section>

      <section class="panel glass legend-panel">
        <div class="panel-heading">
          Dynamic Legend (${legendRows.length})
        </div>
        <div class="legend-grid">${legendHtml}</div>
      </section>
    </div>
  </div>

  <script>
    const waitForImages = () =>
      Promise.all(
        Array.from(document.images).map((image) => {
          if (image.complete) return Promise.resolve();

          return new Promise((resolve) => {
            image.addEventListener("load", resolve, { once: true });
            image.addEventListener("error", resolve, { once: true });
          });
        }),
      );

    const returnToApplication = () => {
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.focus();
        }
      } catch (error) {}

      setTimeout(() => {
        try {
          window.close();
        } catch (error) {}
      }, 100);
    };

    window.addEventListener("afterprint", returnToApplication, {
      once: true,
    });

    window.addEventListener("load", async () => {
      await waitForImages();

      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          window.focus();
          window.print();
          setTimeout(returnToApplication, 1800);
        }),
      );
    });
  </script>
</body>
</html>`;
};

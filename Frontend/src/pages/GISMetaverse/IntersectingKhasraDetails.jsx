import { getPlotIntersectingKhasras } from "../../services/metaverseApi";

const THEME = {
  dark: "#06291f",
  muted: "#6b7280",
  border: "rgba(0,0,0,0.08)",
  softBorder: "rgba(0,0,0,0.06)",
  softGreen: "#edf2f1",
  accent: "#2ecc71",
  surface: "#fff",
  page: "#f8fafc",
};

const getPlotGid = (props = {}) =>
  props.gid ??
  props.GID ??
  props.plot_gid ??
  props.plot_gid_id ??
  props._mapboxFeatureId ??
  props.feature_id ??
  props.id ??
  null;

const formatSqft = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });

const escapeHTML = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const formatPercent = (value) => {
  const percent = Math.max(0, Math.min(100, Number(value || 0)));
  return {
    raw: percent,
    label: `${percent.toFixed(percent % 1 ? 2 : 0)}%`,
  };
};

const buildStatHTML = (label, value) => `
  <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid ${THEME.softBorder};padding:8px 0;">
    <span style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;color:${THEME.muted};">
      ${escapeHTML(label)}:
    </span>
    <span style="word-break:break-word;text-align:right;font-size:12px;font-weight:700;line-height:1.4;color:${THEME.dark};">
      ${value}
    </span>
  </div>
`;

const buildRowsHTML = (features = []) =>
  features
    .map((item, index) => {
      const percent = formatPercent(item.percentage);
      const khasraNo = escapeHTML(item.khasra_no || "N/A");
      const mauza = escapeHTML(item.mauza || "N/A");

      return `
        <div style="overflow:hidden;border:1px solid ${THEME.border};border-radius:10px;background:${THEME.surface};box-shadow:0 10px 28px rgba(0,0,0,0.06);margin-bottom:12px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;background:${THEME.page};border-bottom:1px solid ${THEME.softBorder};padding:10px 12px;">
            <div style="min-width:0;flex:1;display:flex;align-items:center;justify-content:space-between;gap:14px;font-size:13px;font-weight:700;line-height:1.25;color:${THEME.dark};">
              <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                Khasra No: ${khasraNo}
              </span>
              <span style="flex-shrink:0;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:48%;">
                Mauza: ${mauza}
              </span>
            </div>

            <div style="flex-shrink:0;width:26px;height:26px;border-radius:50%;background:${THEME.dark};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff;">
              ${index + 1}
            </div>
          </div>

          <div style="padding:12px;">
            <div style="height:8px;background:${THEME.softGreen};border-radius:999px;overflow:hidden;margin-bottom:9px;">
              <div style="height:100%;width:${percent.raw}%;background:${THEME.accent};border-radius:999px;"></div>
            </div>

            <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:11px;font-weight:700;color:${THEME.muted};">
              <span>${formatSqft(item.area_sqft)} sq ft</span>
              <span style="color:${THEME.dark};">${percent.label} of plot</span>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

const buildModalHTML = ({ title, body }) => `
  <div
    data-khasra-details-overlay="true"
    style="position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;"
  >
    <div style="width:min(620px,96vw);max-height:88vh;overflow:hidden;border-radius:12px;background:${THEME.surface};color:${THEME.dark};box-shadow:0 24px 80px rgba(0,0,0,0.35);outline:1px solid ${THEME.border};">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;background:${THEME.dark};padding:12px 16px;">
        <div style="min-width:0;display:flex;align-items:center;gap:9px;">
          <span style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,0.1);font-size:14px;line-height:1;color:#fff;">
            📎
          </span>
          <div style="min-width:0;font-size:15px;font-weight:700;letter-spacing:0.3px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${title}
          </div>
        </div>

        <button
          type="button"
          data-khasra-details-close="true"
          aria-label="Close intersecting khasra details"
          style="display:flex;flex-shrink:0;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,0.1);font-size:18px;line-height:1;color:#fff;border:none;cursor:pointer;"
        >
          ×
        </button>
      </div>

      <div style="max-height:calc(88vh - 48px);overflow-y:auto;padding:14px;scrollbar-width:none;background:#fff;">
        ${body}
      </div>
    </div>
  </div>
`;

export const openIntersectingKhasraDetails = async (plotProps = {}) => {
  const plotGid = getPlotGid(plotProps);

  const existing = document.querySelector(
    '[data-khasra-details-overlay="true"]',
  );
  if (existing) existing.remove();

  const loadingWrapper = document.createElement("div");
  loadingWrapper.innerHTML = buildModalHTML({
    title: "Intersecting Khasra Details",
    body: `<div style="padding:24px;text-align:center;font-size:12px;font-weight:700;color:${THEME.muted};">Loading intersecting khasras...</div>`,
  });

  document.body.appendChild(loadingWrapper.firstElementChild);

  const bindClose = () => {
    document
      .querySelector('[data-khasra-details-close="true"]')
      ?.addEventListener("click", () => {
        document
          .querySelector('[data-khasra-details-overlay="true"]')
          ?.remove();
      });
  };

  bindClose();

  try {
    const data = await getPlotIntersectingKhasras(plotGid);

    const body = `
      <div style="overflow:hidden;border-radius:10px;background:${THEME.surface};border:1px solid ${THEME.border};box-shadow:0 10px 28px rgba(0,0,0,0.06);margin-bottom:14px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:14px;background:${THEME.page};border-bottom:1px solid ${THEME.softBorder};padding:10px 12px;">
          <span style="font-size:13px;font-weight:700;line-height:1.25;color:${THEME.dark};">
            Selected Plot
          </span>
          <span style="word-break:break-word;text-align:right;font-size:13px;font-weight:700;line-height:1.25;color:${THEME.dark};">
            ${escapeHTML(data.plot_no || plotProps.plot_no || "N/A")}
          </span>
        </div>

        <div style="padding:4px 12px 10px;">
          ${buildStatHTML("Plot Area", `${formatSqft(data.plot_area_sqft)} sq ft`)}
          ${buildStatHTML("Intersected Khasra Features", escapeHTML(data.intersected_count || 0))}
        </div>
      </div>

      ${
        data.features?.length
          ? buildRowsHTML(data.features)
          : `<div style="padding:24px;text-align:center;font-size:12px;font-weight:700;color:#9ca3af;">No intersecting khasra found.</div>`
      }
    `;

    document.querySelector('[data-khasra-details-overlay="true"]')?.remove();

    const wrapper = document.createElement("div");
    wrapper.innerHTML = buildModalHTML({
      title: "Intersecting Khasra Details",
      body,
    });

    document.body.appendChild(wrapper.firstElementChild);
    bindClose();
  } catch (error) {
    console.error("[IntersectingKhasraDetails] API failed:", error);

    document.querySelector('[data-khasra-details-overlay="true"]')?.remove();

    const wrapper = document.createElement("div");
    wrapper.innerHTML = buildModalHTML({
      title: "Intersecting Khasra Details",
      body: `<div style="padding:24px;text-align:center;font-size:12px;font-weight:700;color:#dc2626;">Failed to load intersecting khasra details.</div>`,
    });

    document.body.appendChild(wrapper.firstElementChild);
    bindClose();
  }
};

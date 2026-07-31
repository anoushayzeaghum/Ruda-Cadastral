import mapboxgl from "mapbox-gl";
import {
  VECTOR_POPUP_GROUPS,
  buildLayerPopupLookup,
  getAllPopupLayerIds,
} from "./vectorLayerPopupConfig";
import { openIntersectingKhasraDetails } from "./IntersectingKhasraDetails";

const escapeHTML = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const stripHtml = (value = "") =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const formatValue = (value, { stripHtml: shouldStripHtml = false } = {}) => {
  if (value === null || value === undefined) return "";
  if (shouldStripHtml) return stripHtml(value);
  if (typeof value === "number") return value.toFixed(2);
  return String(value);
};

const getFieldValue = (props, field) => {
  if (field.key) {
    return props[field.key];
  }

  if (Array.isArray(field.keys)) {
    for (const key of field.keys) {
      const value = props[key];
      if (value !== null && value !== undefined && value !== "") {
        return value;
      }
    }
  }

  return null;
};

const resolveTitle = (props, group) => {
  if (group.titleKeys) {
    for (const key of group.titleKeys) {
      const value = props[key];
      if (value !== null && value !== undefined && value !== "") {
        const formatted = formatValue(value, {
          stripHtml: key === "popupinfo" || key === "snippet",
        });
        if (group.titlePrefix) {
          return `${group.titlePrefix}: ${formatted}`;
        }
        return formatted;
      }
    }
  }

  return group.label || "Feature Details";
};

/**
 * Returns size tokens scaled to the current zoom level.
 * zoom 13–14  → small
 * zoom 14–15  → medium
 * zoom 15–16  → normal
 * zoom 16+    → large (original)
 */
const getPopupSizeTokens = (zoom = 16) => {
  if (zoom < 14) {
    // Small — compact, condensed
    return {
      containerWidth: "180px",
      titleFontSize: "11px",
      labelFontSize: "9px",
      valueFontSize: "9px",
      headerPx: "8px",
      headerPy: "6px",
      bodyPx: "8px",
      bodyPy: "6px",
      rowPy: "4px",
      maxBodyHeight: "160px",
      labelMinWidth: "64px",
      btnSize: "18px",
      btnFontSize: "14px",
      borderRadius: "7px",
    };
  }
  if (zoom < 15) {
    // Medium
    return {
      containerWidth: "220px",
      titleFontSize: "12px",
      labelFontSize: "10px",
      valueFontSize: "10px",
      headerPx: "10px",
      headerPy: "8px",
      bodyPx: "10px",
      bodyPy: "8px",
      rowPy: "5px",
      maxBodyHeight: "200px",
      labelMinWidth: "74px",
      btnSize: "20px",
      btnFontSize: "15px",
      borderRadius: "8px",
    };
  }
  if (zoom < 16) {
    // Normal
    return {
      containerWidth: "250px",
      titleFontSize: "13px",
      labelFontSize: "10.5px",
      valueFontSize: "11px",
      headerPx: "12px",
      headerPy: "10px",
      bodyPx: "12px",
      bodyPy: "10px",
      rowPy: "6px",
      maxBodyHeight: "240px",
      labelMinWidth: "82px",
      btnSize: "22px",
      btnFontSize: "16px",
      borderRadius: "9px",
    };
  }
  // Large (zoom 16+) — original size
  return {
    containerWidth: "280px",
    titleFontSize: "15px",
    labelFontSize: "11px",
    valueFontSize: "12px",
    headerPx: "16px",
    headerPy: "12px",
    bodyPx: "14px",
    bodyPy: "10px",
    rowPy: "7px",
    maxBodyHeight: "272px",
    labelMinWidth: "90px",
    btnSize: "24px",
    btnFontSize: "18px",
    borderRadius: "10px",
  };
};


const HUMAN_LABEL_OVERRIDES = {
  gid: "Feature ID",
  id: "ID",
  objectid: "Object ID",
  shape_leng: "Length",
  shape_area: "Area",
};

const humanizePropertyKey = (key = "") => {
  const normalized = String(key).trim();
  const override = HUMAN_LABEL_OVERRIDES[normalized.toLowerCase()];
  if (override) return override;

  return normalized
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const isDisplayableProperty = (key, value) => {
  if (!key || key.startsWith("_")) return false;
  if (value === null || value === undefined || value === "") return false;
  if (typeof value === "object") return false;
  return true;
};

const getPopupFields = (props = {}, group = {}) => {
  const configuredFields = Array.isArray(group.fields) ? group.fields : [];
  const configuredKeys = new Set(
    configuredFields.flatMap((field) =>
      field.key ? [field.key] : Array.isArray(field.keys) ? field.keys : [],
    ),
  );

  const fallbackFields = Object.entries(props)
    .filter(([key, value]) =>
      !configuredKeys.has(key) && isDisplayableProperty(key, value),
    )
    .slice(0, group.maxFallbackFields ?? 20)
    .map(([key]) => ({ key, label: humanizePropertyKey(key) }));

  // Configured fields are shown first. Remaining real feature properties are
  // appended automatically, so newly added vector datasets still get useful
  // popup information without requiring another popup-code change.
  return [...configuredFields, ...fallbackFields];
};

const buildFeaturePopupHTML = (props = {}, group, zoom = 16) => {
  const title = escapeHTML(resolveTitle(props, group));
  const s = getPopupSizeTokens(zoom);
  const showKhasraButton = group?.id === "masterPlan";

  const rows = getPopupFields(props, group)
    .map((field) => {
      const rawValue = getFieldValue(props, field);
      if (rawValue === null || rawValue === undefined || rawValue === "") {
        return null;
      }

      const displayValue = escapeHTML(
        formatValue(rawValue, { stripHtml: field.stripHtml }),
      );

      return `
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;border-bottom:1px solid rgba(0,0,0,0.06);padding:${s.rowPy} 0;">
          <span style="min-width:${s.labelMinWidth};flex-shrink:0;font-size:${s.labelFontSize};font-weight:500;text-transform:uppercase;letter-spacing:0.4px;color:#6b7280;">
            ${escapeHTML(field.label)}:
          </span>
          <span style="word-break:break-word;text-align:right;font-size:${s.valueFontSize};font-weight:500;line-height:1.4;color:#06291f;">
            ${displayValue}
          </span>
        </div>
      `;
    })
    .filter(Boolean)
    .join("");

  return `
    <div style="width:${s.containerWidth};overflow:hidden;border-radius:${s.borderRadius};background:#fff;color:#06291f;box-shadow:0 20px 60px rgba(0,0,0,0.25);outline:1px solid rgba(0,0,0,0.08);">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;border-radius:${s.borderRadius} ${s.borderRadius} 0 0;background:#06291f;padding:${s.headerPy} ${s.headerPx};">
        <div style="font-size:${s.titleFontSize};font-weight:700;letter-spacing:0.3px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          ${title}
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
          ${showKhasraButton
      ? `
                <button
                  type="button"
                  data-khasra-details-open="true"
                  aria-label="Open intersecting khasra details"
                  style="display:flex;flex-shrink:0;align-items:center;justify-content:center;width:${s.btnSize};height:${s.btnSize};border-radius:50%;background:rgba(255,255,255,0.1);font-size:${s.btnFontSize};line-height:1;color:#fff;border:none;cursor:pointer;"
                >
                  📎
                </button>
              `
      : ""
    }

          <button
            type="button"
            data-vector-popup-close="true"
            aria-label="Close feature info"
            style="display:flex;flex-shrink:0;align-items:center;justify-content:center;width:${s.btnSize};height:${s.btnSize};border-radius:50%;background:rgba(255,255,255,0.1);font-size:${s.btnFontSize};line-height:1;color:#fff;border:none;cursor:pointer;"
          >
            ×
          </button>
        </div>
      </div>

      <div style="max-height:${s.maxBodyHeight};overflow-y:auto;padding:${s.bodyPy} ${s.bodyPx};scrollbar-width:none;">
        ${rows ||
    `<div style="padding:12px 0;text-align:center;font-size:${s.labelFontSize};font-weight:500;color:#9ca3af;">
            No additional details available.
          </div>`
    }
      </div>
    </div>
  `;
};

const isUsableMap = (map) => {
  if (!map) return false;
  if (typeof map.getStyle !== "function") return false;
  if (typeof map.getLayer !== "function") return false;
  if (typeof map.on !== "function") return false;
  if (typeof map.off !== "function") return false;

  try {
    return Boolean(map.getStyle());
  } catch {
    return false;
  }
};

const safeMapCall = (map, callback, fallback = undefined) => {
  if (!isUsableMap(map)) return fallback;

  try {
    return callback();
  } catch {
    return fallback;
  }
};

const safeHasLayer = (map, layerId) => {
  if (!layerId) return false;
  return Boolean(safeMapCall(map, () => map.getLayer(layerId), false));
};

const safeSetFilter = (map, layerId, filter) => {
  if (!safeHasLayer(map, layerId)) return;
  safeMapCall(map, () => map.setFilter(layerId, filter));
};

const safeSetPaintProperty = (map, layerId, property, value) => {
  if (!safeHasLayer(map, layerId)) return;
  safeMapCall(map, () => map.setPaintProperty(layerId, property, value));
};

const applyTailwindToMapboxPopupShell = (popup) => {
  const el = popup.getElement();
  if (!el) return;

  const content = el.querySelector(".mapboxgl-popup-content");
  if (content) {
    content.className =
      "mapboxgl-popup-content !rounded-[10px] !bg-transparent !p-0 !shadow-none";
  }

  const tip = el.querySelector(".mapboxgl-popup-tip");
  if (tip) {
    tip.style.borderTopColor = "#06291f";
  }
};

/**
 * Wire up click-only popups for all configured vector layers.
 */
export function setupVectorClickPopups({
  map,
  groups = VECTOR_POPUP_GROUPS,
  autoCloseMs = 10000,
  clickTolerance = 6,
  minZoom = 0,
  maxZoom = 24,
}) {
  if (!isUsableMap(map)) return () => { };

  const layerIdToGroup = buildLayerPopupLookup(groups);
  const allLayerIds = getAllPopupLayerIds(groups);

  let popup = null;
  let closeTimer = null;
  let isDestroyed = false;
  let activeHighlightGroup = null;
  // Track the last clicked feature so we can rebuild the popup on zoom
  let lastClickedFeature = null;
  let lastClickedGroup = null;
  let lastClickedLngLat = null;

  const isZoomInPopupRange = () => {
    const zoom = safeMapCall(map, () => map.getZoom(), null);
    if (zoom === null) return false;
    return zoom >= minZoom && zoom <= maxZoom;
  };

  const clearCloseTimer = () => {
    if (closeTimer) {
      window.clearTimeout(closeTimer);
      closeTimer = null;
    }
  };

  const getExistingClickableLayers = () =>
    allLayerIds.filter((id) => safeHasLayer(map, id));

  const clearHighlight = () => {
    if (!activeHighlightGroup?.highlightLayerId) return;

    safeSetPaintProperty(
      map,
      activeHighlightGroup.highlightLayerId,
      "line-opacity",
      0,
    );
    safeSetFilter(map, activeHighlightGroup.highlightLayerId, [
      "==",
      ["to-string", ["get", activeHighlightGroup.highlightFilterKey || "gid"]],
      "__none__",
    ]);

    activeHighlightGroup = null;
  };

  const getFeatureId = (feature, filterKey = "gid") => {
    const props = feature?.properties || {};
    return props[filterKey] ?? props.gid ?? props.id ?? feature?.id ?? "";
  };

  const highlightFeature = (feature, group) => {
    if (!group?.highlightLayerId || !safeHasLayer(map, group.highlightLayerId)) {
      return;
    }

    const filterKey = group.highlightFilterKey || "gid";
    const featureId = String(getFeatureId(feature, filterKey));

    activeHighlightGroup = group;
    safeSetFilter(map, group.highlightLayerId, [
      "==",
      ["to-string", ["get", filterKey]],
      featureId,
    ]);
    safeSetPaintProperty(map, group.highlightLayerId, "line-opacity", 1);
  };

  const closePopup = ({ clearSelected = true } = {}) => {
    clearCloseTimer();

    try {
      popup?.remove();
    } catch {
      // Map may already be disposed.
    }

    popup = null;
    lastClickedFeature = null;
    lastClickedGroup = null;
    lastClickedLngLat = null;

    if (clearSelected) {
      clearHighlight();
    }
  };

  const findClickedFeature = (event) => {
    const existingLayers = getExistingClickableLayers();
    if (!existingLayers.length) return null;

    const pt = event?.point;
    if (!pt) return null;

    const bbox = [
      [pt.x - clickTolerance, pt.y - clickTolerance],
      [pt.x + clickTolerance, pt.y + clickTolerance],
    ];

    const features = safeMapCall(
      map,
      () => map.queryRenderedFeatures(bbox, { layers: existingLayers }),
      [],
    );

    const feature = features?.[0];
    if (!feature?.layer?.id) return null;

    const group = layerIdToGroup.get(feature.layer.id);
    if (!group) return null;

    return { feature, group };
  };

  const attachKhasraButtonListener = (feature, group) => {
    const khasraBtn = popup
      ?.getElement()
      ?.querySelector('[data-khasra-details-open="true"]');

    if (khasraBtn) {
      khasraBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        clearCloseTimer();

        const props = feature?.properties || {};
        const popupPayload = {
          ...props,
          gid: props.gid ?? props.GID ?? props.id ?? feature?.id ?? null,
          id: props.id ?? feature?.id ?? props.gid ?? null,
          _mapboxFeatureId: feature?.id ?? null,
          _layerId: feature?.layer?.id ?? null,
          _popupGroupId: group?.id ?? null,
        };

        console.log("[PlotPopup] Khasra details clicked", {
          featureId: feature?.id,
          layerId: feature?.layer?.id,
          groupId: group?.id,
          props,
          popupPayload,
        });

        openIntersectingKhasraDetails(popupPayload);
      });
    } else {
      console.warn("[PlotPopup] Khasra button not found in popup DOM", {
        feature,
        group,
      });
    }
  };

  const showPopup = (event, feature, group) => {
    if (isDestroyed || !isUsableMap(map) || !feature || !group) return;
    if (!isZoomInPopupRange()) return;

    clearHighlight();
    highlightFeature(feature, group);
    clearCloseTimer();

    // Store for zoom-driven resize
    lastClickedFeature = feature;
    lastClickedGroup = group;
    lastClickedLngLat = event.lngLat;

    const currentZoom = safeMapCall(map, () => map.getZoom(), 16);

    try {
      popup?.remove();

      popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 15,
        maxWidth: "none",
        className: "vector-feature-popup",
      })
        .setLngLat(event.lngLat)
        .setHTML(buildFeaturePopupHTML(feature.properties || {}, group, currentZoom))
        .addTo(map);
    } catch (error) {
      console.error("[VectorPopup] Failed to create popup:", error);
      popup = null;
      return;
    }

    applyTailwindToMapboxPopupShell(popup);

    const closeBtn = popup
      .getElement()
      ?.querySelector('[data-vector-popup-close="true"]');

    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        closePopup();
      });
    }

    attachKhasraButtonListener(feature, group);

    closeTimer = window.setTimeout(() => closePopup(), autoCloseMs);
  };

  const handleMapClick = (event) => {
    if (!isZoomInPopupRange()) {
      if (popup) closePopup();
      return;
    }

    const hit = findClickedFeature(event);

    if (!hit) {
      if (popup) closePopup();
      return;
    }

    console.log("[PlotPopup] Vector feature clicked", {
      layerId: hit.feature?.layer?.id,
      featureId: hit.feature?.id,
      groupId: hit.group?.id,
      properties: hit.feature?.properties,
    });

    event.preventDefault?.();
    showPopup(event, hit.feature, hit.group);
  };

  const handleZoomChange = () => {
    if (!isZoomInPopupRange()) {
      if (popup) closePopup();
      return;
    }

    // Resize the open popup to match the new zoom level
    if (popup && lastClickedFeature && lastClickedGroup) {
      const currentZoom = safeMapCall(map, () => map.getZoom(), 16);
      const newHTML = buildFeaturePopupHTML(
        lastClickedFeature.properties || {},
        lastClickedGroup,
        currentZoom,
      );
      try {
        popup.setHTML(newHTML);
        applyTailwindToMapboxPopupShell(popup);

        // Re-attach close button listener after setHTML replaces the DOM
        const closeBtn = popup
          .getElement()
          ?.querySelector('[data-vector-popup-close="true"]');
        if (closeBtn) {
          closeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            closePopup();
          });
        }

        attachKhasraButtonListener(lastClickedFeature, lastClickedGroup);
      } catch {
        // popup may have been removed
      }
    }
  };

  safeMapCall(map, () => {
    map.on("click", handleMapClick);
    map.on("zoom", handleZoomChange);
    map.on("zoomend", handleZoomChange);
  });

  clearHighlight();

  return () => {
    isDestroyed = true;
    clearCloseTimer();

    safeMapCall(map, () => {
      map.off("click", handleMapClick);
      map.off("zoom", handleZoomChange);
      map.off("zoomend", handleZoomChange);
    });

    try {
      popup?.remove();
    } catch {
      // ignore
    }

    popup = null;
    lastClickedFeature = null;
    lastClickedGroup = null;
    lastClickedLngLat = null;
    clearHighlight();
  };
}

/** @deprecated Use setupVectorClickPopups instead. */
export function setupPlotClickPopup(options) {
  return setupVectorClickPopups(options);
}
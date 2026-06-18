import mapboxgl from "mapbox-gl";
import {
  VECTOR_POPUP_GROUPS,
  buildLayerPopupLookup,
  getAllPopupLayerIds,
} from "./vectorLayerPopupConfig";

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

const buildFeaturePopupHTML = (props = {}, group) => {
  const title = escapeHTML(resolveTitle(props, group));

  const rows = (group.fields || [])
    .map((field) => {
      const rawValue = getFieldValue(props, field);
      if (rawValue === null || rawValue === undefined || rawValue === "") {
        return null;
      }

      const displayValue = escapeHTML(
        formatValue(rawValue, { stripHtml: field.stripHtml }),
      );

      return `
        <div class="flex items-start justify-between gap-3 border-b border-black/5 py-[7px] last:border-b-0">
          <span class="min-w-[90px] shrink-0 text-[11px] font-medium uppercase tracking-[0.4px] text-gray-500">
            ${escapeHTML(field.label)}:
          </span>
          <span class="break-words text-right text-xs font-medium leading-[1.4] text-black">
            ${displayValue}
          </span>
        </div>
      `;
    })
    .filter(Boolean)
    .join("");

  return `
    <div class="w-[280px] overflow-hidden rounded-[10px] bg-white text-gray-900 shadow-2xl ring-1 ring-black/10">
      <div class="flex items-center justify-between gap-3 rounded-t-[10px] bg-gray-900 px-4 py-3">
        <div class="text-[15px] font-bold tracking-[0.3px] text-white">
          ${title}
        </div>
        <button
          type="button"
          data-vector-popup-close="true"
          aria-label="Close feature info"
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg leading-none text-white transition hover:bg-white/20"
        >
          ×
        </button>
      </div>

      <div class="max-h-[272px] overflow-y-auto px-3.5 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        ${
          rows ||
          `
          <div class="py-4 text-center text-xs font-medium text-gray-500">
            No additional details available.
          </div>
        `
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
    tip.style.borderTopColor = "#111827";
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
  minZoom = 16,
  maxZoom = 18,
}) {
  if (!isUsableMap(map)) return () => {};

  const layerIdToGroup = buildLayerPopupLookup(groups);
  const allLayerIds = getAllPopupLayerIds(groups);

  let popup = null;
  let closeTimer = null;
  let isDestroyed = false;
  let activeHighlightGroup = null;

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

  const showPopup = (event, feature, group) => {
    if (isDestroyed || !isUsableMap(map) || !feature || !group) return;
    if (!isZoomInPopupRange()) return;

    clearHighlight();
    highlightFeature(feature, group);
    clearCloseTimer();

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
        .setHTML(buildFeaturePopupHTML(feature.properties || {}, group))
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

    event.preventDefault?.();
    showPopup(event, hit.feature, hit.group);
  };

  const handleZoomChange = () => {
    if (!isZoomInPopupRange() && popup) {
      closePopup();
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
    clearHighlight();
  };
}

/** @deprecated Use setupVectorClickPopups instead. */
export function setupPlotClickPopup(options) {
  return setupVectorClickPopups(options);
}

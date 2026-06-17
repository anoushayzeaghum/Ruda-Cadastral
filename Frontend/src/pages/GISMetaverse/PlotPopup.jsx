import mapboxgl from "mapbox-gl";

const PLOT_POPUP_FIELDS = [
  { key: "name", label: "Name" },
  { key: "type", label: "Type" },
  { key: "remarks", label: "Remarks" },
  { key: "block", label: "Block" },
  { key: "plot_area", label: "Plot Area" },
  { key: "dimension", label: "Dimension" },
  { key: "parkfront", label: "Park Front" },
  { key: "rd_ft", label: "Road Front" },
  { key: "storey", label: "Storey" },
  { key: "rd_facing", label: "Road Facing" },
  { key: "h", label: "Height" },
  { key: "demar", label: "Demarcation" },
  { key: "possession", label: "Possession" },
  { key: "poss_st", label: "Possession Status" },
  { key: "canceled", label: "Status" },
  { key: "site_plan", label: "Site Plan" },
  { key: "tr_own", label: "Owner" },
  { key: "tr_cate", label: "Category" },
  { key: "tr_p_no", label: "Transfer Plot No" },
  { key: "shape_leng", label: "Shape Length" },
  { key: "shape_area", label: "Shape Area" },
];

const escapeHTML = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const formatValue = (value) => {
  if (typeof value === "number") return value.toFixed(2);
  return String(value);
};

const buildPlotPopupHTML = (props = {}) => {
  const plotNo = escapeHTML(props.plot_no || props.gid || "N/A");

  const rows = PLOT_POPUP_FIELDS.filter(
    (field) =>
      props[field.key] !== null &&
      props[field.key] !== undefined &&
      props[field.key] !== "",
  )
    .map((field) => {
      const displayValue = escapeHTML(formatValue(props[field.key]));

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
    .join("");

  return `
    <div class="w-[280px] overflow-hidden rounded-[10px] bg-white text-gray-900 shadow-2xl ring-1 ring-black/10">
      <div class="flex items-center justify-between gap-3 rounded-t-[10px] bg-gray-900 px-4 py-3">
        <div class="text-[15px] font-bold tracking-[0.3px] text-white">
          Plot No: ${plotNo}
        </div>
        <button
          type="button"
          data-plot-popup-close="true"
          aria-label="Close plot popup"
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg leading-none text-white transition hover:bg-white/20"
        >
          ×
        </button>
      </div>

      <div class="max-h-[272px] overflow-y-auto px-3.5 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        ${
          rows ||
          `<div class="py-2 text-center text-xs font-medium text-gray-700">
            No additional details
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

const safeSetCursor = (map, cursor = "") => {
  safeMapCall(map, () => {
    const canvas = map.getCanvas?.();
    if (canvas?.style) canvas.style.cursor = cursor;
  });
};

const applyTailwindToMapboxPopupShell = (popup) => {
  const popupElement = popup.getElement();
  if (!popupElement) return;

  const content = popupElement.querySelector(".mapboxgl-popup-content");
  if (content) {
    content.className =
      "mapboxgl-popup-content !rounded-[10px] !bg-transparent !p-0 !shadow-none";
  }

  const tip = popupElement.querySelector(".mapboxgl-popup-tip");
  if (tip) {
    tip.className = `${tip.className} !border-t-white`;
  }
};

export function setupPlotClickPopup({
  map,
  plotLayerId,
  plotLayerIds,
  highlightLayerId,
  highlightFilterKey = "gid",
  autoCloseMs = 10000,
}) {
  if (!isUsableMap(map)) return () => {};

  const clickableLayerIds = Array.from(
    new Set(
      [
        ...(Array.isArray(plotLayerIds) ? plotLayerIds : []),
        ...(plotLayerId ? [plotLayerId] : []),
      ].filter(Boolean),
    ),
  );

  if (!clickableLayerIds.length) return () => {};

  let popup = null;
  let closeTimer = null;
  let selectedFeatureId = null;
  let isDestroyed = false;

  const clearCloseTimer = () => {
    if (closeTimer) {
      window.clearTimeout(closeTimer);
      closeTimer = null;
    }
  };

  const getExistingClickableLayers = () =>
    clickableLayerIds.filter((layerId) => safeHasLayer(map, layerId));

  const clearHighlight = () => {
    if (isDestroyed || !highlightLayerId) return;

    safeSetPaintProperty(map, highlightLayerId, "line-opacity", 0);
    safeSetFilter(map, highlightLayerId, [
      "==",
      ["to-string", ["get", highlightFilterKey]],
      "",
    ]);
    selectedFeatureId = null;
  };

  const closePopup = ({ clearSelected = true } = {}) => {
    clearCloseTimer();

    try {
      popup?.remove();
    } catch {
      // Ignore popup removal errors during React fast refresh / map destroy.
    }

    popup = null;

    if (clearSelected) {
      clearHighlight();
    }
  };

  const getFeatureId = (feature) => {
    const props = feature?.properties || {};
    return props[highlightFilterKey] ?? props.gid ?? props.id ?? feature?.id ?? "";
  };

  const highlightFeature = (feature) => {
    if (!highlightLayerId || !safeHasLayer(map, highlightLayerId)) return;

    const featureId = getFeatureId(feature);
    selectedFeatureId = featureId;

    safeSetFilter(map, highlightLayerId, [
      "==",
      ["to-string", ["get", highlightFilterKey]],
      String(featureId),
    ]);
    safeSetPaintProperty(map, highlightLayerId, "line-opacity", 1);
  };

  const findClickedPlotFeature = (event) => {
    const existingLayers = getExistingClickableLayers();
    if (!existingLayers.length) return null;

    const clickPoint = event?.point;
    if (!clickPoint) return null;

    // A small click box makes thin plot boundaries much easier to click.
    const tolerance = 6;
    const bbox = [
      [clickPoint.x - tolerance, clickPoint.y - tolerance],
      [clickPoint.x + tolerance, clickPoint.y + tolerance],
    ];

    const features = safeMapCall(
      map,
      () =>
        map.queryRenderedFeatures(bbox, {
          layers: existingLayers,
        }),
      [],
    );

    return features?.[0] || null;
  };

  const showPopup = (event, feature) => {
    if (isDestroyed || !isUsableMap(map) || !feature) return;

    const props = feature.properties || {};
    highlightFeature(feature);
    clearCloseTimer();

    try {
      popup?.remove();
      popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 15,
        maxWidth: "none",
      })
        .setLngLat(event.lngLat)
        .setHTML(buildPlotPopupHTML(props))
        .addTo(map);
    } catch (error) {
      console.error("Plot popup error:", error);
      popup = null;
      return;
    }

    applyTailwindToMapboxPopupShell(popup);

    const closeButton = popup
      .getElement()
      ?.querySelector('[data-plot-popup-close="true"]');

    closeButton?.addEventListener("click", (closeEvent) => {
      closeEvent.stopPropagation();
      closePopup();
    });

    closeTimer = window.setTimeout(() => closePopup(), autoCloseMs);
  };

  const handleMapClick = (event) => {
    const feature = findClickedPlotFeature(event);
    if (!feature) return;

    event.preventDefault?.();
    showPopup(event, feature);
  };

  const handleMouseMove = (event) => {
    const feature = findClickedPlotFeature(event);
    safeSetCursor(map, feature ? "pointer" : "");
  };

  const handleMouseLeave = () => {
    safeSetCursor(map, "");
  };

  safeMapCall(map, () => {
    map.on("click", handleMapClick);
    map.on("mousemove", handleMouseMove);
    map.on("mouseleave", handleMouseLeave);
  });

  return () => {
    isDestroyed = true;
    clearCloseTimer();

    safeMapCall(map, () => {
      map.off("click", handleMapClick);
      map.off("mousemove", handleMouseMove);
      map.off("mouseleave", handleMouseLeave);
    });

    try {
      popup?.remove();
    } catch {
      // Ignore cleanup errors when Mapbox is already disposing.
    }

    popup = null;
    safeSetCursor(map, "");
  };
}

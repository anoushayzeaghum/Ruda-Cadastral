import mapboxgl from "mapbox-gl";

// ---------------------------------------------------------------------------
// Field definitions
// These map directly to the Plot model fields returned by the GeoJSON API.
// Fields that are null / undefined / "" are automatically hidden.
// ---------------------------------------------------------------------------
const PLOT_POPUP_FIELDS = [
  { key: "plot_no",   label: "Plot No"          },
  { key: "name",      label: "Name"             },
  { key: "type",      label: "Type"             },
  { key: "block",     label: "Block"            },
  { key: "plot_area", label: "Plot Area"        },
  { key: "dimension", label: "Dimension"        },
  { key: "parkfront", label: "Park Front"       },
  { key: "rd_ft",     label: "Road Front"       },
  { key: "storey",    label: "Storey"           },
  { key: "rd_facing", label: "Road Facing"      },
  { key: "h",         label: "Height"           },
  { key: "demar",     label: "Demarcation"      },
  { key: "possession",label: "Possession"       },
  { key: "poss_st",   label: "Possession Status"},
  { key: "canceled",  label: "Status"           },
  { key: "site_plan", label: "Site Plan"        },
  { key: "tr_own",    label: "Owner"            },
  { key: "tr_cate",   label: "Category"         },
  { key: "tr_p_no",   label: "Transfer Plot No" },
  { key: "remarks",   label: "Remarks"          },
  { key: "shape_leng",label: "Shape Length"     },
  { key: "shape_area",label: "Shape Area"       },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Prevent XSS when injecting values into raw HTML strings. */
const escapeHTML = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

/**
 * Format a raw property value for display.
 * Numbers are rounded to 2 decimal places; everything else is a plain string.
 */
const formatValue = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return value.toFixed(2);
  return String(value);
};

/**
 * Build the complete HTML string for the plot popup content.
 * All user-data is escaped before insertion.
 */
const buildPlotPopupHTML = (props = {}) => {
  // The header title prefers plot_no, then gid, then a fallback.
  const plotNo = escapeHTML(props.plot_no || props.gid || "N/A");

  const rows = PLOT_POPUP_FIELDS
    .filter((field) => {
      const v = props[field.key];
      return v !== null && v !== undefined && v !== "";
    })
    .map((field) => {
      // plot_no is already shown in the header — skip it in the body rows
      // unless there is genuinely useful data beyond what's in the header.
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

      <!-- Header -->
      <div class="flex items-center justify-between gap-3 rounded-t-[10px] bg-gray-900 px-4 py-3">
        <div class="text-[15px] font-bold tracking-[0.3px] text-white">
          Plot No: ${plotNo}
        </div>
        <button
          type="button"
          data-plot-popup-close="true"
          aria-label="Close plot info"
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg leading-none text-white transition hover:bg-white/20"
        >
          ×
        </button>
      </div>

      <!-- Body -->
      <div class="max-h-[272px] overflow-y-auto px-3.5 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        ${rows || `
          <div class="py-4 text-center text-xs font-medium text-gray-500">
            No additional details available.
          </div>
        `}
      </div>
    </div>
  `;
};

// ---------------------------------------------------------------------------
// Safe Mapbox helpers
// All operations are guarded so that unmount / hot-reload never throws.
// ---------------------------------------------------------------------------

/** Returns true only when the map instance is alive and its style is loaded. */
const isUsableMap = (map) => {
  if (!map) return false;
  if (typeof map.getStyle  !== "function") return false;
  if (typeof map.getLayer  !== "function") return false;
  if (typeof map.on        !== "function") return false;
  if (typeof map.off       !== "function") return false;
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

/**
 * Strip Mapbox's default popup shell styling so our Tailwind card renders
 * cleanly without any conflicting border / padding / shadow.
 */
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
    // Keep the existing positioning classes and just override the border colour
    // so the tip arrow matches our dark header.
    tip.style.borderTopColor = "#111827";
  }
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Wire up click-to-inspect popup behaviour on plot layers.
 *
 * @param {object} options
 * @param {mapboxgl.Map}   options.map              - Live Mapbox GL map instance.
 * @param {string}        [options.plotLayerId]     - Single clickable layer ID (legacy).
 * @param {string[]}      [options.plotLayerIds]    - Multiple clickable layer IDs (preferred).
 * @param {string}        [options.highlightLayerId]- Layer ID used to draw the selection outline.
 * @param {string}        [options.highlightFilterKey="gid"] - Feature property used to identify a plot.
 * @param {number}        [options.autoCloseMs=10000] - Auto-close delay in milliseconds.
 *
 * @returns {() => void} Cleanup function — call it from a useEffect return to tear down.
 */
export function setupPlotClickPopup({
  map,
  plotLayerId,
  plotLayerIds,
  highlightLayerId,
  highlightFilterKey = "gid",
  autoCloseMs = 10000,
}) {
  if (!isUsableMap(map)) return () => {};

  // Deduplicate and merge both the single and array forms.
  const clickableLayerIds = Array.from(
    new Set(
      [
        ...(Array.isArray(plotLayerIds) ? plotLayerIds : []),
        ...(plotLayerId ? [plotLayerId] : []),
      ].filter(Boolean),
    ),
  );

  if (!clickableLayerIds.length) return () => {};

  // ── State ───────────────────────────────────────────────────────────────
  let popup       = null;
  let closeTimer  = null;
  let isDestroyed = false;

  // ── Timer helpers ────────────────────────────────────────────────────────
  const clearCloseTimer = () => {
    if (closeTimer) {
      window.clearTimeout(closeTimer);
      closeTimer = null;
    }
  };

  // ── Layer query helpers ──────────────────────────────────────────────────

  /** Only query layers that are actually present on the map right now. */
  const getExistingClickableLayers = () =>
    clickableLayerIds.filter((id) => safeHasLayer(map, id));

  // ── Highlight helpers ────────────────────────────────────────────────────

  /**
   * Reset the highlight layer to an invisible / empty-match state.
   * Uses the same filter syntax as highlightFeature so Mapbox never sees a
   * mismatched filter type between the initial paint and runtime updates.
   */
  const clearHighlight = () => {
    if (isDestroyed || !highlightLayerId) return;
    safeSetPaintProperty(map, highlightLayerId, "line-opacity", 0);
    safeSetFilter(map, highlightLayerId, [
      "==",
      ["to-string", ["get", highlightFilterKey]],
      "__none__",
    ]);
  };

  /** Extract the identifying value from a clicked feature. */
  const getFeatureId = (feature) => {
    const props = feature?.properties || {};
    return (
      props[highlightFilterKey] ??
      props.gid ??
      props.id ??
      feature?.id ??
      ""
    );
  };

  /** Apply a white outline to the clicked plot by matching its feature ID. */
  const highlightFeature = (feature) => {
    if (!highlightLayerId || !safeHasLayer(map, highlightLayerId)) return;

    const featureId = String(getFeatureId(feature));

    safeSetFilter(map, highlightLayerId, [
      "==",
      ["to-string", ["get", highlightFilterKey]],
      featureId,
    ]);
    safeSetPaintProperty(map, highlightLayerId, "line-opacity", 1);
  };

  // ── Popup lifecycle ──────────────────────────────────────────────────────

  const closePopup = ({ clearSelected = true } = {}) => {
    clearCloseTimer();

    try {
      popup?.remove();
    } catch {
      // Silently ignore errors thrown when the map is already being destroyed
      // (e.g. during React fast-refresh or component unmount).
    }

    popup = null;

    if (clearSelected) {
      clearHighlight();
    }
  };

  /**
   * Query rendered features within a small bounding box around the click point.
   * A bbox query makes thin plot boundary lines much easier to click than a
   * single-pixel point query.
   */
  const findClickedPlotFeature = (event) => {
    const existingLayers = getExistingClickableLayers();
    if (!existingLayers.length) return null;

    const pt = event?.point;
    if (!pt) return null;

    const tolerance = 6; // px
    const bbox = [
      [pt.x - tolerance, pt.y - tolerance],
      [pt.x + tolerance, pt.y + tolerance],
    ];

    const features = safeMapCall(
      map,
      () => map.queryRenderedFeatures(bbox, { layers: existingLayers }),
      [],
    );

    return features?.[0] ?? null;
  };

  /**
   * Show the popup for a given feature at the click location.
   * Any previously open popup is removed first.
   */
  const showPopup = (event, feature) => {
    if (isDestroyed || !isUsableMap(map) || !feature) return;

    const props = feature.properties || {};

    // Highlight the clicked plot before the popup appears.
    highlightFeature(feature);

    // Cancel any existing auto-close timer from a previous popup.
    clearCloseTimer();

    try {
      popup?.remove();

      popup = new mapboxgl.Popup({
        closeButton:  false,
        closeOnClick: false,
        offset:       15,
        maxWidth:     "none",
        className:    "plot-popup",
      })
        .setLngLat(event.lngLat)
        .setHTML(buildPlotPopupHTML(props))
        .addTo(map);
    } catch (error) {
      console.error("[PlotPopup] Failed to create popup:", error);
      popup = null;
      return;
    }

    // Strip conflicting Mapbox shell styles and patch the tip colour.
    applyTailwindToMapboxPopupShell(popup);

    // Wire up the close button inside the popup HTML.
    const closeBtn = popup
      .getElement()
      ?.querySelector('[data-plot-popup-close="true"]');

    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        closePopup();
      });
    }

    // Auto-close after the configured delay.
    closeTimer = window.setTimeout(() => closePopup(), autoCloseMs);
  };

  // ── Map event handlers ───────────────────────────────────────────────────

  const handleMapClick = (event) => {
    const feature = findClickedPlotFeature(event);
    if (!feature) {
      // Click was on empty space — close any open popup.
      if (popup) closePopup();
      return;
    }

    // Prevent other click handlers (e.g. measurement tool) from firing
    // if the map instance supports stopPropagation.
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

  // ── Register handlers ────────────────────────────────────────────────────

  safeMapCall(map, () => {
    map.on("click",      handleMapClick);
    map.on("mousemove",  handleMouseMove);
    map.on("mouseleave", handleMouseLeave);
  });

  // Initialise the highlight layer to the cleared state so its filter
  // expression type already matches what highlightFeature will set later.
  clearHighlight();

  // ── Cleanup / teardown ───────────────────────────────────────────────────

  return () => {
    isDestroyed = true;
    clearCloseTimer();

    safeMapCall(map, () => {
      map.off("click",      handleMapClick);
      map.off("mousemove",  handleMouseMove);
      map.off("mouseleave", handleMouseLeave);
    });

    try {
      popup?.remove();
    } catch {
      // Map may already be disposed.
    }

    popup = null;
    safeSetCursor(map, "");
  };
}

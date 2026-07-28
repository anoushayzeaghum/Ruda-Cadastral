const EARTH_RADIUS_METERS = 6378137;

export const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export const waitForMapRender = (map, timeoutMs = 5000) =>
  new Promise((resolve) => {
    if (!map) {
      resolve();
      return;
    }

    let finished = false;
    let timeoutId;

    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timeoutId);
      map.off("idle", finish);
      map.off("render", onRender);
      resolve();
    };

    const onRender = () => {
      requestAnimationFrame(() => requestAnimationFrame(finish));
    };

    timeoutId = setTimeout(finish, timeoutMs);

    if (!map.isStyleLoaded?.()) {
      map.once("load", () => {
        map.once("idle", finish);
        map.once("render", onRender);
        map.triggerRepaint?.();
      });
      return;
    }

    map.once("idle", finish);
    map.once("render", onRender);
    map.triggerRepaint?.();
  });

export const openPreparingPrintWindow = () => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return null;

  printWindow.document.open();
  printWindow.document.write(`<!doctype html>
    <html>
      <head><title>Preparing map…</title></head>
      <body style="font-family:Arial,sans-serif;padding:24px">
        Preparing printable map…
      </body>
    </html>`);
  printWindow.document.close();
  return printWindow;
};

export const captureMapCanvas = async (map) => {
  await waitForMapRender(map);
  const image = map?.getCanvas?.().toDataURL("image/png", 1);

  if (!image || image === "data:," || image.length < 1000) {
    throw new Error(
      "The map canvas could not be captured. Make sure preserveDrawingBuffer is enabled on the Mapbox map.",
    );
  }

  return image;
};

const niceDistance = (meters) => {
  const safeMeters = Math.max(1, meters);
  const exponent = Math.floor(Math.log10(safeMeters));
  const fraction = safeMeters / 10 ** exponent;
  const niceFraction =
    fraction >= 5 ? 5 : fraction >= 2 ? 2 : fraction >= 1 ? 1 : 0.5;
  return niceFraction * 10 ** exponent;
};

export const getScaleInfo = (map, targetPixels = 210) => {
  if (!map) return { label: "Scale unavailable", segmentCount: 4 };

  const latitude = map.getCenter().lat;
  const zoom = map.getZoom();
  const metersPerPixel =
    (Math.cos((latitude * Math.PI) / 180) * 2 * Math.PI * EARTH_RADIUS_METERS) /
    (512 * 2 ** zoom);
  const distance = niceDistance(metersPerPixel * targetPixels);

  return {
    label:
      distance >= 1000
        ? `${Number((distance / 1000).toFixed(distance >= 10000 ? 0 : 1))} km`
        : `${Math.round(distance)} m`,
    segmentCount: 4,
  };
};

export const getMapMetadata = (map) => {
  const center = map.getCenter();
  const scale = getScaleInfo(map);

  return {
    centerText: `${center.lat.toFixed(5)}, ${center.lng.toFixed(5)}`,
    zoomText: map.getZoom().toFixed(1),
    bearingText: `${map.getBearing().toFixed(1)}°`,
    pitchText: `${map.getPitch().toFixed(1)}°`,
    scaleText: scale.label,
    printedAt: new Date().toLocaleString(),
  };
};

export const getSelectedProjectTitle = (filters = {}) => {
  const directName =
    filters.projectName ||
    filters.projectLabel ||
    filters.selectedProjectName ||
    filters.project_title;

  if (directName) return String(directName);
  if (filters.projectId) return `Project ${filters.projectId}`;
  return "RUDA GIS Metaverse Map";
};

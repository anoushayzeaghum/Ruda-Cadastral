/**
 * Shared geographic safety checks for RUDA's KMZ / zipped-shapefile import
 * and deterministic map printing. All coordinates must be WGS84 longitude,
 * latitude in degrees before they are handed to Mapbox GL.
 */

const MAX_WEB_MERCATOR_LAT = 85.05112878;

/**
 * Reject invalid / non-geographic coordinates rather than allowing a bogus
 * bounding box (e.g. projected Easting/Northing without a .prj) to drive a
 * map camera hundreds of kilometres away from the parcel.
 *
 * The original geometry is NEVER modified or silently reprojected.
 */
export function inspectImportedGeoJSON(geojson, sourceType = "geojson") {
  const features = geojson?.features || [];
  if (!features.length) {
    return { error: "The imported file contains no features.", warning: null };
  }

  let west = Infinity;
  let east = -Infinity;
  let south = Infinity;
  let north = -Infinity;
  let coordinateCount = 0;
  let error = null;

  const scanGeometry = (geometry, featureIndex) => {
    if (!geometry || error) return;
    if (geometry.type === "GeometryCollection") {
      (geometry.geometries || []).forEach((child) => scanGeometry(child, featureIndex));
      return;
    }
    if (!Array.isArray(geometry.coordinates)) {
      error = `Feature ${featureIndex + 1} has missing or invalid coordinates.`;
      return;
    }

    const stack = [geometry.coordinates];
    while (stack.length && !error) {
      const item = stack.pop();
      if (!Array.isArray(item) || !item.length) continue;
      if (typeof item[0] !== "number" && !Array.isArray(item[0])) {
        error = `Feature ${featureIndex + 1} has a non-numeric coordinate.`;
        break;
      }
      if (typeof item[0] === "number") {
        const [lon, lat] = item;
        if (
          !Number.isFinite(lon) ||
          !Number.isFinite(lat) ||
          lon < -180 || lon > 180 ||
          lat < -90 || lat > 90
        ) {
          const originHint = sourceType === "shapefile"
            ? " Include the correct .prj file with the zipped shapefile so shpjs can reproject it to EPSG:4326."
            : " Confirm the coordinates are WGS84 longitude/latitude (EPSG:4326).";
          error = `Feature ${featureIndex + 1} has coordinates outside the WGS84 longitude/latitude range (${lon}, ${lat}).${originHint}`;
          break;
        }
        west = Math.min(west, lon);
        east = Math.max(east, lon);
        south = Math.min(south, lat);
        north = Math.max(north, lat);
        coordinateCount += 1;
      } else {
        for (const child of item) stack.push(child);
      }
    }
  };

  features.forEach((feature, index) => scanGeometry(feature?.geometry, index));
  if (error) return { error, warning: null };
  if (!coordinateCount) {
    return { error: "No usable geographic coordinates were found in the imported dataset.", warning: null };
  }

  const lngSpan = east - west;
  const latSpan = north - south;
  const warning = lngSpan > 5 || latSpan > 5
    ? `The imported boundary spans ${lngSpan.toFixed(2)}° longitude × ${latSpan.toFixed(2)}° latitude. If this is a local RUDA parcel, check the source CRS and stray/outlier features before printing. The geometry has not been altered.`
    : null;

  return { error: null, warning, bounds: [west, south, east, north], coordinateCount };
}

/**
 * The print map's high-resolution canvas has a DIFFERENT pixel size from the
 * interactive map. Matching zoom levels changes geographic coverage. Instead,
 * copy the currently visible GEOGRAPHIC bounds and fit them into the new
 * landscape viewport (preserving all content, without non-uniform scaling).
 */
export function getLiveGeographicPrintBounds(liveMap) {
  const bounds = liveMap?.getBounds?.();
  if (!bounds) throw new Error("The map's geographic view could not be read.");

  const west = Number(bounds.getWest());
  const east = Number(bounds.getEast());
  const south = Math.max(-MAX_WEB_MERCATOR_LAT, Number(bounds.getSouth()));
  const north = Math.min(MAX_WEB_MERCATOR_LAT, Number(bounds.getNorth()));
  if (
    ![west, east, south, north].every(Number.isFinite) ||
    east <= west || north <= south
  ) {
    throw new Error("The map has invalid geographic bounds. Zoom to the imported parcel and try again.");
  }
  if (east - west >= 350) {
    throw new Error("The visible map spans nearly the whole world. Zoom to the imported parcel before printing.");
  }
  return [[west, south], [east, north]];
}

export function fitPrintMapToVisibleGeography(printMap, liveMap) {
  const bounds = getLiveGeographicPrintBounds(liveMap);
  // zero padding keeps the complete live extent, even when the print aspect
  // ratio differs; Mapbox zooms uniformly in Web Mercator, with no stretch.
  printMap.fitBounds(bounds, { padding: 0, duration: 0 });
  return bounds;
}

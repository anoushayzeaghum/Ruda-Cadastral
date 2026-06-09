/**
 * routingUtils.js
 *
 * Provides the `fetchRoute` utility for fetching road-network routes from
 * the OpenRouteService (ORS) Directions API v2.
 *
 * Requirements: 9.2, 9.3, 9.7
 */

const ORS_DIRECTIONS_URL =
  "https://api.openrouteservice.org/v2/directions/driving-car/geojson";

/**
 * Fetch a driving route from origin to destination via OpenRouteService.
 *
 * @param {[number, number]} origin         - [lng, lat] of activeParcel.centroid
 * @param {[number, number]} destination    - [lng, lat] of selected amenity
 * @param {string}           destinationName - Display name of the destination
 * @returns {Promise<RouteData>}
 *   RouteData: { geometry, distanceKm, durationMinutes, destinationName }
 * @throws {Error} on non-2xx response or when the API returns no route features
 */
export async function fetchRoute(origin, destination, destinationName) {
  const orsKey = import.meta.env.VITE_ORS_API_KEY;

  if (orsKey && orsKey.trim() !== "") {
    try {
      const body = {
        coordinates: [origin, destination],
      };

      const response = await fetch(ORS_DIRECTIONS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: orsKey,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        const route = data.features?.[0];

        if (route) {
          const summary = route.properties?.summary;
          return {
            geometry: route, // GeoJSON Feature<LineString>
            distanceKm: Math.round((summary.distance / 1000) * 100) / 100, // metres → km
            durationMinutes: Math.round(summary.duration / 60), // seconds → minutes
            destinationName,
          };
        }
      }
    } catch (e) {
      console.warn("ORS routing failed, falling back to OSRM", e);
    }
  }

  // Fallback to OSRM (free, no auth key required)
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?overview=full&geometries=geojson`;

  const response = await fetch(osrmUrl);
  if (!response.ok) {
    throw new Error(`OSRM Routing API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const route = data.routes?.[0];

  if (!route || !route.geometry) {
    throw new Error("No route returned from OSRM");
  }

  const routeFeature = {
    type: "Feature",
    geometry: route.geometry, // GeoJSON LineString geometry
    properties: {
      summary: {
        distance: route.distance,
        duration: route.duration,
      },
    },
  };

  return {
    geometry: routeFeature,
    distanceKm: Math.round((route.distance / 1000) * 100) / 100, // metres → km
    durationMinutes: Math.round(route.duration / 60), // seconds → minutes
    destinationName,
  };
}

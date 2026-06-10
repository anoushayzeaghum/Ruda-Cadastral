/**
 * useGisAnalysis.js
 *
 * Custom React hook — GIS analysis backed by Django/PostGIS APIs.
 * All heavy computation is done server-side. This hook manages async
 * API call state and exposes the same interface as the previous Turf.js version
 * so MapPage.jsx and ParcelPanel.jsx require minimal changes.
 *
 * activeParcel must have:
 *   { id: string, type: "KHASRA"|"MURABBA", centroid: GeoJSON.Point, ... }
 */

import { useState, useCallback } from "react";
import {
  runNearestFacility,
  runBufferAnalysis,
  runProximityAnalysis,
  runSuitabilityAnalysis,
} from "../services/gisApi";
import { fetchRoute } from "../utils/routingUtils";

function parcelTypeParam(activeParcel) {
  return activeParcel?.type === "MURABBA" ? "murabba" : "khasra";
}

export function useGisAnalysis({ activeParcel }) {
  const [bufferResults, setBufferResults] = useState(null);
  const [proximityResults, setProximityResults] = useState([]);
  const [nearestResults, setNearestResults] = useState({});
  const [suitabilityResult, setSuitabilityResult] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [isComputing, setIsComputing] = useState(false);
  const [error, setError] = useState(null);

  const reset = useCallback(() => {
    setBufferResults(null);
    setProximityResults([]);
    setNearestResults({});
    setSuitabilityResult(null);
    setRouteData(null);
    setError(null);
  }, []);

  // -------------------------------------------------------------------------
  // BUFFER
  // -------------------------------------------------------------------------
  const runBuffer = useCallback(
    async (radiusKm) => {
      if (!activeParcel) return;
      setIsComputing(true);
      setError(null);
      try {
        const data = await runBufferAnalysis(
          activeParcel.id,
          radiusKm,
          parcelTypeParam(activeParcel)
        );
        // Normalise to the shape MapPage/MapView/ParcelPanel already expect:
        // bufferResults = { polygon, counts, amenitiesInBuffer }
        // The backend returns: { buffer (Feature<Polygon>), counts, amenities (FeatureCollection) }
        const amenitiesInBuffer = {};
        const allCategories = ["hospitals", "schools", "parks", "mosques", "transport"];
        // backend counts keys are singular; build FeatureCollections keyed by plural name
        const categoryKeyMap = {
          hospital: "hospitals",
          school: "schools",
          park: "parks",
          mosque: "mosques",
          transport: "transport",
        };
        allCategories.forEach((pluralKey) => {
          amenitiesInBuffer[pluralKey] = { type: "FeatureCollection", features: [] };
        });
        (data.amenities?.features || []).forEach((f) => {
          const plural = categoryKeyMap[f.properties?.category];
          if (plural) amenitiesInBuffer[plural].features.push(f);
        });

        // Remap counts from singular → plural
        const counts = {};
        Object.entries(data.counts || {}).forEach(([singular, n]) => {
          counts[categoryKeyMap[singular] || singular] = n;
        });

        setBufferResults({
          polygon: data.buffer,       // Feature<Polygon>
          counts,
          amenitiesInBuffer,
        });
      } catch (e) {
        setError(e.message);
      } finally {
        setIsComputing(false);
      }
    },
    [activeParcel]
  );

  // -------------------------------------------------------------------------
  // PROXIMITY
  // -------------------------------------------------------------------------
  const runProximity = useCallback(async () => {
    if (!activeParcel) return;
    setIsComputing(true);
    setError(null);
    try {
      const data = await runProximityAnalysis(
        activeParcel.id,
        parcelTypeParam(activeParcel)
      );
      // Normalise to ProximityResult[] = [{ category, name, distance, feature }]
      // backend returns results[].{ category, name, distance_km, feature }
      const categoryKeyMap = {
        hospital: "hospitals",
        school: "schools",
        park: "parks",
        mosque: "mosques",
        transport: "transport",
      };
      const results = (data.results || []).map((r) => ({
        category: categoryKeyMap[r.category] || r.category,
        name: r.name,
        distance: r.distance_km,
        feature: r.feature,
      }));
      setProximityResults(results);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsComputing(false);
    }
  }, [activeParcel]);

  // -------------------------------------------------------------------------
  // NEAREST
  // -------------------------------------------------------------------------
  const runNearest = useCallback(async () => {
    if (!activeParcel) return;
    setIsComputing(true);
    setError(null);
    try {
      const data = await runNearestFacility(
        activeParcel.id,
        parcelTypeParam(activeParcel)
      );
      // Normalise to NearestResults = { [category]: { name, distance, feature, lineString } }
      // backend returns nearest.{ hospital: { name, distance_km, facility, line } | null }
      const categoryKeyMap = {
        hospital: "hospitals",
        school: "schools",
        park: "parks",
        mosque: "mosques",
        transport: "transport",
      };
      const results = {};
      Object.entries(data.nearest || {}).forEach(([singular, info]) => {
        if (!info) return;
        const plural = categoryKeyMap[singular] || singular;
        results[plural] = {
          name: info.name,
          distance: info.distance_km,
          feature: info.facility,
          lineString: info.line,
        };
      });
      setNearestResults(results);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsComputing(false);
    }
  }, [activeParcel]);

  // -------------------------------------------------------------------------
  // SUITABILITY
  // -------------------------------------------------------------------------
  const runSuitability = useCallback(
    async (weights) => {
      if (!activeParcel) return;
      setIsComputing(true);
      setError(null);

      // Validate weights client-side first (same UX as before)
      const weightSum = Object.values(weights).reduce((a, b) => a + b, 0);
      if (Math.abs(weightSum - 1.0) > 0.001) {
        setSuitabilityResult({
          error: `Weights must sum to 1.0 (currently ${weightSum.toFixed(3)})`,
        });
        setIsComputing(false);
        return;
      }

      // Backend expects singular category keys; suitabilityWeights state uses singular keys already
      try {
        const data = await runSuitabilityAnalysis(
          activeParcel.id,
          weights,
          parcelTypeParam(activeParcel)
        );
        const r = data.selected_result;
        setSuitabilityResult({
          score: r.score,
          label: r.label,
          categoryScores: r.category_scores,
        });
      } catch (e) {
        setError(e.message);
        setSuitabilityResult({ error: e.message });
      } finally {
        setIsComputing(false);
      }
    },
    [activeParcel]
  );

  // -------------------------------------------------------------------------
  // ROUTING (still uses ORS/OSRM directly — no backend needed)
  // -------------------------------------------------------------------------
  const runRouting = useCallback(
    async (destinationFeature, destinationName) => {
      if (!activeParcel) return;
      setIsComputing(true);
      setError(null);
      try {
        const origin = activeParcel.centroid.coordinates;
        const destination = destinationFeature.geometry.coordinates;
        const result = await fetchRoute(origin, destination, destinationName);
        setRouteData(result);
      } catch (e) {
        setError(e.message);
        setRouteData(null);
      } finally {
        setIsComputing(false);
      }
    },
    [activeParcel]
  );

  return {
    bufferResults,
    proximityResults,
    nearestResults,
    suitabilityResult,
    routeData,
    isComputing,
    error,
    reset,
    runBuffer,
    runProximity,
    runNearest,
    runSuitability,
    runRouting,
  };
}

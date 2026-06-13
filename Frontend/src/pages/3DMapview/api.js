import axios from "axios";
import {
  getDistricts as baseGetDistricts,
  getTehsils as baseGetTehsils,
  getMauzas as baseGetMauzas,
  getSocieties as baseGetSocieties,
  getDistrictBoundary as baseGetDistrictBoundary,
  getTehsilBoundary as baseGetTehsilBoundary,
  getMauzaBoundary as baseGetMauzaBoundary,
  getSocietyGeoJSON as baseGetSocietyGeoJSON,
  getSocietyBoundaryGeoJSONBySocietyId as baseGetSocietyBoundaryGeoJSONBySocietyId,
  getMasterPlanGeoJSON as baseGetMasterPlanGeoJSON,
  getSpotLevelGeoJSON as baseGetSpotLevelGeoJSON,
  getContourGeoJSON as baseGetContourGeoJSON,
} from "../../services/api";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
});

export const emptyFeatureCollection = () => ({
  type: "FeatureCollection",
  features: [],
});

export function normalizeFeatureCollection(data) {
  const payload = data?.data?.data ?? data?.data ?? data ?? emptyFeatureCollection();

  if (payload?.type === "FeatureCollection") return payload;

  if (payload?.type === "Feature") {
    return {
      type: "FeatureCollection",
      features: [payload],
    };
  }

  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.results)
      ? payload.results
      : Array.isArray(payload?.features)
        ? payload.features
        : [];

  const features = rows
    .map((item) => {
      if (item?.type === "Feature") return item;

      const properties = { ...(item || {}) };
      const geometry = properties.geometry || properties.geom || properties.the_geom || null;

      delete properties.geometry;
      delete properties.geom;
      delete properties.the_geom;

      if (!geometry) return null;

      return {
        type: "Feature",
        id: item?.id ?? item?.gid ?? item?.objectid ?? item?.mauza_id ?? item?.society_id,
        geometry,
        properties,
      };
    })
    .filter(Boolean);

  return {
    type: "FeatureCollection",
    features,
  };
}

export function collectionToItems(data) {
  const payload = data?.data?.data ?? data?.data ?? data ?? [];

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;

  if (payload?.type === "FeatureCollection" && Array.isArray(payload.features)) {
    return payload.features.map((feature) => ({
      id:
        feature.id ??
        feature.properties?.id ??
        feature.properties?.gid ??
        feature.properties?.objectid ??
        feature.properties?.mauza_id ??
        feature.properties?.society_id,
      geometry: feature.geometry ?? null,
      ...(feature.properties || {}),
      properties: feature.properties || {},
    }));
  }

  if (payload?.type === "Feature") {
    return [
      {
        id: payload.id ?? payload.properties?.id,
        geometry: payload.geometry ?? null,
        ...(payload.properties || {}),
        properties: payload.properties || {},
      },
    ];
  }

  return [];
}

export function getItemId(item) {
  return (
    item?.id ??
    item?.gid ??
    item?.objectid ??
    item?.district_i ??
    item?.district_id ??
    item?.dist_id ??
    item?.tehsil_id ??
    item?.mauza_id ??
    item?.society_id ??
    item?.properties?.id ??
    item?.properties?.gid ??
    item?.properties?.objectid ??
    item?.properties?.district_i ??
    item?.properties?.district_id ??
    item?.properties?.dist_id ??
    item?.properties?.tehsil_id ??
    item?.properties?.mauza_id ??
    item?.properties?.society_id
  );
}

export function getMauzaId(mauza) {
  return (
    mauza?.mauza_id ??
    mauza?.properties?.mauza_id ??
    mauza?.id ??
    mauza?.gid ??
    mauza?.objectid ??
    mauza?.properties?.id ??
    mauza?.properties?.gid ??
    mauza?.properties?.objectid
  );
}

export function getSocietyId(society) {
  return (
    society?.society_id ??
    society?.properties?.society_id ??
    society?.gid ??
    society?.id ??
    society?.objectid ??
    society?.properties?.gid ??
    society?.properties?.id ??
    society?.properties?.objectid
  );
}

export function getSocietyPk(society) {
  return society?.gid ?? society?.id ?? society?.objectid ?? society?.properties?.gid;
}

export function getLabel(item, keys = [], fallback = "N/A") {
  if (!item) return fallback;

  for (const key of keys) {
    const value = item?.[key] ?? item?.properties?.[key];
    if (value !== undefined && value !== null && value !== "") return String(value);
  }

  return fallback;
}

const sortByLabel = (items, keys) =>
  [...items].sort((a, b) => getLabel(a, keys, "").localeCompare(getLabel(b, keys, ""), undefined, { numeric: true }));

async function tryOptionalGeoJson(requests = []) {
  for (const request of requests) {
    try {
      const res = await API.get(request.url, { params: request.params || {} });
      const geojson = normalizeFeatureCollection(res);
      if (geojson.features.length) return geojson;
    } catch (error) {
      // Keep trying fallback endpoints silently.
    }
  }

  return emptyFeatureCollection();
}

// ---------------------------
// Admin dropdown APIs
// These call your existing working API file.
// ---------------------------

export async function getDistricts() {
  const data = await baseGetDistricts();
  return sortByLabel(collectionToItems(data), ["name", "district", "district_name"]);
}

export async function getTehsils(districtId) {
  // Your backend expects district_i, and your existing api.js already sends it correctly.
  const data = await baseGetTehsils(districtId);
  return sortByLabel(collectionToItems(data), ["name", "tehsil", "tehsil_name"]);
}

export async function getMauzas(tehsilId) {
  // Your backend expects tehsil, and your existing api.js already sends it correctly.
  const data = await baseGetMauzas(tehsilId);
  return sortByLabel(collectionToItems(data), ["mauza", "name", "mauza_name"]);
}

export async function getSocieties(filters = {}) {
  let data = await baseGetSocieties(filters);
  let items = collectionToItems(data);

  // Fallback: if combined mauza_id + mauza returns nothing, try only mauza name.
  if (!items.length && filters?.mauza) {
    data = await baseGetSocieties({ mauza: filters.mauza });
    items = collectionToItems(data);
  }

  return sortByLabel(items, ["society", "name", "society_name"]);
}

// ---------------------------
// Boundary APIs
// ---------------------------

export async function getDistrictBoundary(id) {
  return normalizeFeatureCollection(await baseGetDistrictBoundary(id));
}

export async function getTehsilBoundary(id) {
  return normalizeFeatureCollection(await baseGetTehsilBoundary(id));
}

export async function getMauzaBoundary(id) {
  return normalizeFeatureCollection(await baseGetMauzaBoundary(id));
}

export async function getSocietyBoundaryGeoJSON(societyId, society = null) {
  // Prefer society_id because your requirement is society-based fetching.
  let geojson = await baseGetSocietyBoundaryGeoJSONBySocietyId(societyId);
  geojson = normalizeFeatureCollection(geojson);

  if (geojson.features.length) return geojson;

  // Fallback only when society_id returns empty and gid/objectid is available.
  const gid = society?.gid ?? society?.id ?? society?.objectid ?? society?.properties?.gid;
  if (gid) {
    return normalizeFeatureCollection(await baseGetSocietyGeoJSON(gid));
  }

  return emptyFeatureCollection();
}

// ---------------------------
// Society 3D layer APIs
// Existing backend layers are fetched by society_id.
// ---------------------------

export async function getMasterPlanGeoJSON(societyId) {
  return normalizeFeatureCollection(await baseGetMasterPlanGeoJSON({ society_id: societyId }));
}

export async function getSpotLevelGeoJSON(societyId) {
  return normalizeFeatureCollection(await baseGetSpotLevelGeoJSON({ society_id: societyId }));
}

export async function getContourGeoJSON(societyId) {
  return normalizeFeatureCollection(await baseGetContourGeoJSON({ society_id: societyId }));
}

// If you do not have separate plot/building/road/green-space APIs yet,
// these will safely return empty data instead of breaking the whole dashboard.
// For now, 3D plots fall back to masterplan, because your current society data
// appears to store the parcel layout inside masterplan.

export async function getPlotGeoJSON(societyId) {
  const plots = await tryOptionalGeoJson([
    { url: "/plots/", params: { society_id: societyId } },
    { url: "/plot/", params: { society_id: societyId } },
    { url: "/parcels/", params: { society_id: societyId } },
  ]);

  if (plots.features.length) return plots;

  return getMasterPlanGeoJSON(societyId);
}

export async function getBuildingGeoJSON(societyId) {
  return tryOptionalGeoJson([
    { url: "/buildings/", params: { society_id: societyId } },
    { url: "/building/", params: { society_id: societyId } },
    { url: "/building-footprints/", params: { society_id: societyId } },
  ]);
}

export async function getRoadGeoJSON(societyId) {
  return tryOptionalGeoJson([
    { url: "/roads/", params: { society_id: societyId } },
    { url: "/road/", params: { society_id: societyId } },
    { url: "/road-centerline/", params: { society_id: societyId } },
  ]);
}

export async function getGreenSpaceGeoJSON(societyId) {
  return tryOptionalGeoJson([
    { url: "/green-spaces/", params: { society_id: societyId } },
    { url: "/greenspaces/", params: { society_id: societyId } },
    { url: "/green-space/", params: { society_id: societyId } },
  ]);
}

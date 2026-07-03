import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "https://rudametaverse.nespakprogresscenter.com/api/",
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
      : Array.isArray(payload?.data)
        ? payload.data
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
        id: item?.gid ?? item?.id ?? item?.objectid ?? item?.project_id,
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
        feature.properties?.gid ??
        feature.properties?.id ??
        feature.properties?.project_id,
      geometry: feature.geometry ?? null,
      ...(feature.properties || {}),
      properties: feature.properties || {},
    }));
  }

  if (payload?.type === "Feature") {
    return [
      {
        id: payload.id ?? payload.properties?.gid ?? payload.properties?.id,
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
    item?.project_id ??
    item?.gid ??
    item?.id ??
    item?.objectid ??
    item?.properties?.project_id ??
    item?.properties?.gid ??
    item?.properties?.id ??
    item?.properties?.objectid
  );
}

export function getProjectId(project) {
  return getItemId(project);
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
  [...items].sort((a, b) =>
    getLabel(a, keys, "").localeCompare(getLabel(b, keys, ""), undefined, {
      numeric: true,
    }),
  );

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

export async function getProjects() {
  const requests = [
    { url: "/project/" },
    { url: "/projects/" },
  ];

  for (const request of requests) {
    try {
      const res = await API.get(request.url);
      const items = collectionToItems(res);
      if (items.length) return sortByLabel(items, ["name", "brief_name", "project", "title"]);
    } catch (error) {
      // Try next fallback endpoint.
    }
  }

  return [];
}

export async function getProjectBoundaryGeoJSON(projectId) {
  return tryOptionalGeoJson([
    { url: `/project/${projectId}/` },
    { url: "/project/", params: { id: projectId } },
    { url: "/project/", params: { gid: projectId } },
    { url: "/project/", params: { project_id: projectId } },
    { url: "/projects/", params: { id: projectId } },
    { url: "/projects/", params: { gid: projectId } },
    { url: "/projects/", params: { project_id: projectId } },
  ]);
}

export async function getMasterPlanGeoJSON(projectId) {
  const masterPlan = await tryOptionalGeoJson([
    { url: "/masterplan/", params: { project_id: projectId } },
    { url: "/master-plan/", params: { project_id: projectId } },
    { url: "/masterplans/", params: { project_id: projectId } },
  ]);

  if (masterPlan.features.length) return masterPlan;

  // Fallback for your current project database where the actual master plan polygons are in plot.
  return getPlotGeoJSON(projectId, false);
}

export async function getPlotGeoJSON(projectId, allowMasterPlanFallback = true) {
  const plots = await tryOptionalGeoJson([
    { url: "/plot/", params: { project_id: projectId } },
    { url: "/plots/", params: { project_id: projectId } },
    { url: "/parcels/", params: { project_id: projectId } },
  ]);

  if (plots.features.length) return plots;

  if (allowMasterPlanFallback) {
    return tryOptionalGeoJson([
      { url: "/masterplan/", params: { project_id: projectId } },
      { url: "/master-plan/", params: { project_id: projectId } },
      { url: "/masterplans/", params: { project_id: projectId } },
    ]);
  }

  return emptyFeatureCollection();
}

export async function getBuildingGeoJSON(projectId) {
  const buildings = await tryOptionalGeoJson([
    { url: "/buildings/", params: { project_id: projectId } },
    { url: "/building/", params: { project_id: projectId } },
    { url: "/building-footprints/", params: { project_id: projectId } },
  ]);

  if (buildings.features.length) return buildings;

  // If you do not have a separate building table, use plot polygons for 3D buildings.
  return getPlotGeoJSON(projectId, true);
}

export async function getRoadGeoJSON(projectId) {
  return tryOptionalGeoJson([
    { url: "/road/", params: { project_id: projectId } },
    { url: "/roads/", params: { project_id: projectId } },
    { url: "/road-centerline/", params: { project_id: projectId } },
  ]);
}

export async function getGreenSpaceGeoJSON(projectId) {
  return tryOptionalGeoJson([
    { url: "/green-spaces/", params: { project_id: projectId } },
    { url: "/greenspaces/", params: { project_id: projectId } },
    { url: "/green-space/", params: { project_id: projectId } },
    { url: "/parks/", params: { project_id: projectId } },
  ]);
}

export async function getSpotLevelGeoJSON(projectId) {
  return tryOptionalGeoJson([
    { url: "/spot-level/", params: { project_id: projectId } },
    { url: "/spotlevel/", params: { project_id: projectId } },
    { url: "/spot-levels/", params: { project_id: projectId } },
  ]);
}

export async function getContourGeoJSON(projectId) {
  return tryOptionalGeoJson([
    { url: "/contour/", params: { project_id: projectId } },
    { url: "/contours/", params: { project_id: projectId } },
  ]);
}

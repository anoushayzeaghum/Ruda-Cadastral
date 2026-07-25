import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || 
  "http://localhost:8000/api";

const unwrapApiData = (data) => data?.data || data?.results || data;

export const normalizeFeatures = (data) => {
  const raw = unwrapApiData(data);
  if (Array.isArray(raw)) return raw;

  const features = raw?.features || raw?.data?.features || [];

  return features.map((f) => ({
    id: f.id,
    gid: f.properties?.gid ?? f.id,
    ...f.properties,
    geometry: f.geometry,
    feature: f,
  }));
};

const emptyFC = () => ({ type: "FeatureCollection", features: [] });

const compactParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );

const unwrapGeoJSON = (data) => {
  const raw = unwrapApiData(data);
  if (raw?.type === "FeatureCollection") return raw;
  if (raw?.features) return raw;
  if (Array.isArray(raw)) return { type: "FeatureCollection", features: raw };
  return emptyFC();
};

// Tries the backend route first and only falls back when that route returns 404.
// This keeps the frontend compatible with the currently registered DRF routes
// while also supporting route names that match the PostGIS table names.
const getGeoJSONFromEndpoints = async (endpoints) => {
  const routes = Array.isArray(endpoints) ? endpoints : [endpoints];
  let lastError = null;

  for (const endpoint of routes) {
    try {
      const res = await axios.get(`${API_BASE}${endpoint}`);
      return unwrapGeoJSON(res.data);
    } catch (error) {
      lastError = error;

      // Do not hide authentication, permission, server, or network errors.
      if (error?.response?.status !== 404) {
        throw error;
      }
    }
  }

  throw lastError;
};

// Exact model/table mappings supplied by the backend.
// The first route in each list matches the uploaded urls.py.
// "Bridgess" is retained as the first Bridges route because that is the
// currently registered backend path; /bridges/ remains as a safe fallback.
const RUDA_INFRASTRUCTURE_ENDPOINTS = Object.freeze({
  bridges: ["/Bridgess/", "/bridges/"],
  ganjakalantruckstand: ["/ganja-kalan-truck-stand/", "/ganjakalantruckstand/"],
  lahorerapidmasstransit: [
    "/lahore-rapid-mass-transit/",
    "/lahorerapidmasstransit/",
  ],
  orangetrack: ["/orange-track/", "/orangetrack/"],
  railwayline: ["/railway-line/", "/railwayline/"],
  railwaystations: ["/railway-stations/", "/railwaystations/"],
  hudiaradrain: ["/hudiara-drain/", "/hudiaradrain/"],
});

export const getProjects = async () => {
  const res = await axios.get(`${API_BASE}/project/`);
  return normalizeFeatures(res.data);
};

export const getProjectGeoJSON = async (projectId) => {
  if (!projectId) return emptyFC();

  const res = await axios.get(`${API_BASE}/project/`, {
    params: { gid: projectId },
  });

  return unwrapGeoJSON(res.data);
};

export const getProjectsByPhase = async (phase) => {
  if (!phase) return emptyFC();
  const res = await axios.get(`${API_BASE}/project/`, {
    params: { phase },
  });
  return unwrapGeoJSON(res.data);
};

export const getProjectsByPhaseAndType = async (phase, type) => {
  if (!phase || !type) return emptyFC();
  const res = await axios.get(`${API_BASE}/project/`, {
    params: { phase, type },
  });
  return unwrapGeoJSON(res.data);
};
export const getBlocks = async (projectId) => {
  const res = await axios.get(`${API_BASE}/block/`, {
    params: { project_id: projectId },
  });

  return normalizeFeatures(res.data);
};

export const getBlocksGeoJSON = async (projectId, block) => {
  if (!projectId) return emptyFC();

  const res = await axios.get(`${API_BASE}/block/`, {
    params: {
      project_id: projectId,
      block: block || undefined,
    },
  });

  return unwrapGeoJSON(res.data);
};

export const getPlotsGeoJSON = async (filters = {}) => {
  const res = await axios.get(`${API_BASE}/plot/`, {
    params: filters,
  });

  return unwrapGeoJSON(res.data);
};
const naturalSort = (a, b) => {
  const ax = String(a).trim();
  const bx = String(b).trim();

  // extract numbers from strings (Plot-12 → 12)
  const numA = ax.match(/\d+/)?.[0];
  const numB = bx.match(/\d+/)?.[0];

  if (numA && numB) {
    return Number(numA) - Number(numB);
  }

  return ax.localeCompare(bx, undefined, {
    numeric: true,
    sensitivity: "base",
  });
};
// export const getPlotOptions = async (filters = {}) => {
//   const geojson = await getPlotsGeoJSON(filters);
//   const plots = normalizeFeatures(geojson);

//   return {
//     plotTypes: [...new Set(plots.map((p) => p.type).filter(Boolean))],
//     plotNos: [...new Set(plots.map((p) => p.plot_no).filter(Boolean))],
//     areas: [...new Set(plots.map((p) => p.plot_area).filter(Boolean))],

//   };
// };

export const getPlotOptionsAll = async (filters = {}) => {
  const geojson = await getPlotsGeoJSON(filters);
  const plots = normalizeFeatures(geojson);

  return {
    plotTypes: [...new Set(plots.map((p) => p.type).filter(Boolean))],
    plotNos: [...new Set(plots.map((p) => p.plot_no).filter(Boolean))],

    // NEW (ADD ALL MISSING FIELDS)
    parkFronts: [...new Set(plots.map((p) => p.parkfront).filter(Boolean))],
    roadFacing: [...new Set(plots.map((p) => p.rd_facing).filter(Boolean))],
    possessionStatus: [...new Set(plots.map((p) => p.poss_st).filter(Boolean))],
    plotStatus: [...new Set(plots.map((p) => p.canceled).filter(Boolean))],
    categories: [...new Set(plots.map((p) => p.tr_cate).filter(Boolean))],
    owners: [...new Set(plots.map((p) => p.tr_own).filter(Boolean))],
    sitePlans: [...new Set(plots.map((p) => p.site_plan).filter(Boolean))],
  };
};

export const getPlotIntersectingKhasras = async (plotGid) => {
  console.log("[metaverseApi] getPlotIntersectingKhasras called", {
    API_BASE,
    plotGid,
    url: `${API_BASE}/plot/${plotGid}/intersecting-khasras/`,
  });

  if (!plotGid) {
    console.error("[metaverseApi] Missing plotGid. Returning empty response.");
    return {
      plot_no: null,
      plot_area: null,
      plot_area_sqft: 0,
      intersected_count: 0,
      features: [],
    };
  }

  const res = await axios.get(
    `${API_BASE}/plot/${plotGid}/intersecting-khasras/`,
  );
  const data = unwrapApiData(res.data);

  console.log("[metaverseApi] getPlotIntersectingKhasras response", {
    status: res.status,
    raw: res.data,
    unwrapped: data,
  });

  return data;
};

export const getSpotLevelGeoJSON = async (projectId) => {
  if (!projectId) return emptyFC();

  const res = await axios.get(`${API_BASE}/spot-level/`, {
    params: { project_id: projectId },
  });

  return unwrapGeoJSON(res.data);
};

export const getContourGeoJSON = async (projectId) => {
  if (!projectId) return emptyFC();

  const res = await axios.get(`${API_BASE}/contour/`, {
    params: { project_id: projectId },
  });

  return unwrapGeoJSON(res.data);
};

export const getRoadsGeoJSON = async (filters = {}) => {
  const params =
    typeof filters === "object" && filters !== null
      ? filters
      : { project_id: filters };

  if (!params.project_id) return emptyFC();

  const requestParams = compactParams({
    project_id: params.project_id,
    block_id: params.block_id,
    block: params.block,

    // Use this only when you intentionally pass a ROAD type
    // such as "Secondary Road". Do not pass plot type here.
    type: params.road_type ?? params.type,
  });

  try {
    const res = await axios.get(`${API_BASE}/road/`, {
      params: requestParams,
    });

    return unwrapGeoJSON(res.data);
  } catch (error) {
    const status = error?.response?.status;

    // If an optional road filter breaks the backend, retry with only project_id.
    // This keeps the map usable and confirms whether the issue is filter-related.
    if (
      status === 500 &&
      (requestParams.block_id || requestParams.block || requestParams.type)
    ) {
      console.warn(
        "[metaverseApi] /road/ failed with filters. Retrying with project_id only.",
        {
          status,
          requestParams,
          response: error?.response?.data,
        },
      );

      const retry = await axios.get(`${API_BASE}/road/`, {
        params: { project_id: params.project_id },
      });

      return unwrapGeoJSON(retry.data);
    }

    throw error;
  }
};

export const getWaterSupplyPointsGeoJSON = async (projectId) => {
  if (!projectId) return emptyFC();

  const res = await axios.get(`${API_BASE}/wspoint-features-cb1/`, {
    params: { project_id: projectId },
  });

  return unwrapGeoJSON(res.data);
};

export const getWaterSupplyLinesGeoJSON = async (projectId) => {
  if (!projectId) return emptyFC();

  const res = await axios.get(`${API_BASE}/wsl-cb1/`, {
    params: { project_id: projectId },
  });

  return unwrapGeoJSON(res.data);
};

export const getSewagePointsGeoJSON = async (projectId) => {
  if (!projectId) return emptyFC();

  const res = await axios.get(`${API_BASE}/swpoint-cb1/`, {
    params: { project_id: projectId },
  });

  return unwrapGeoJSON(res.data);
};

export const getCameraLocationsGeoJSON = async (projectId) => {
  if (!projectId) return emptyFC();

  const res = await axios.get(`${API_BASE}/camera-location/`, {
    params: { project_id: projectId },
  });

  return unwrapGeoJSON(res.data);
};

export const getRudaGeoJSON = async () => {
  const res = await axios.get(`${API_BASE}/ruda/`);
  return unwrapGeoJSON(res.data);
};

export const getRudaProposedRoadsGeoJSON = async () => {
  const res = await axios.get(`${API_BASE}/ruda-proposed-roads/`);
  return unwrapGeoJSON(res.data);
};

export const getGeodeticNetworkGeoJSON = async () => {
  const res = await axios.get(`${API_BASE}/geodeticnetwork/`);
  return unwrapGeoJSON(res.data);
};

export const getPlotLandUseBreakdown = async (filters = {}) => {
  const geojson = await getPlotsGeoJSON(filters);
  const counts = new Map();

  (geojson.features || []).forEach((feature) => {
    const props = feature.properties || {};
    const label = props.type || props.land_use || props.name || "Other";
    counts.set(label, (counts.get(label) || 0) + 1);
  });

  const total = [...counts.values()].reduce((sum, value) => sum + value, 0);

  return [...counts.entries()]
    .map(([label, count]) => ({
      label,
      count,
      percentage: total ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
};

////////////////////// Project Mauzas / Land Revenue Record //////////////////////////////

const toFeatureCollection = (features = []) => ({
  type: "FeatureCollection",
  features: features.filter(Boolean),
});

const normalizeFeatureFromProjectMauza = (row) => {
  const detail = row?.mauza_detail || row?.mauzaDetail || row?.mauza;

  if (detail?.type === "Feature") {
    return {
      ...detail,
      properties: {
        ...(detail.properties || {}),
        project_mauza_id: row?.id,
        project_id: row?.project,
      },
    };
  }

  if (detail?.geometry && detail?.properties) {
    return {
      type: "Feature",
      id: detail.id ?? detail.properties?.gid ?? detail.properties?.mauza_id,
      geometry: detail.geometry,
      properties: {
        ...(detail.properties || {}),
        project_mauza_id: row?.id,
        project_id: row?.project,
      },
    };
  }

  if (detail?.geom || detail?.geometry) {
    const { geom, geometry, ...properties } = detail;

    return {
      type: "Feature",
      id: detail.gid ?? detail.id ?? detail.mauza_id,
      geometry: geometry || geom,
      properties: {
        ...properties,
        project_mauza_id: row?.id,
        project_id: row?.project,
      },
    };
  }

  return null;
};

export const getProjectMauzas = async (projectId) => {
  if (!projectId) return [];

  const res = await axios.get(`${API_BASE}/project-mauza/`, {
    params: { project_id: projectId },
  });

  const raw = unwrapApiData(res.data);
  return Array.isArray(raw) ? raw : raw?.results || [];
};

export const getProjectMauzasGeoJSON = async (projectId) => {
  if (!projectId) return emptyFC();

  const rows = await getProjectMauzas(projectId);
  const features = rows.map(normalizeFeatureFromProjectMauza).filter(Boolean);

  return toFeatureCollection(features);
};

export const getMauzasGeoJSON = async (filters = {}) => {
  const res = await axios.get(`${API_BASE}/mauza/`, { params: filters });
  return unwrapGeoJSON(res.data);
};

export const getMurabbasGeoJSON = async (filters = {}) => {
  const params = {
    ...filters,
    mauza_ids: Array.isArray(filters.mauza_ids)
      ? filters.mauza_ids.join(",")
      : filters.mauza_ids,
  };

  const res = await axios.get(`${API_BASE}/murabba/`, { params });
  return unwrapGeoJSON(res.data);
};

export const getKhasrasGeoJSON = async (filters = {}) => {
  const params = {
    ...filters,
    mauza_ids: Array.isArray(filters.mauza_ids)
      ? filters.mauza_ids.join(",")
      : filters.mauza_ids,
  };

  const res = await axios.get(`${API_BASE}/khasra/`, { params });
  return unwrapGeoJSON(res.data);
};

export const saveProjectMauzas = async (
  projectId,
  mauzaIds,
  khasraIds,
  murabbaIds,
) => {
  const res = await axios.post(`${API_BASE}/project-mauza/create/`, {
    project_id: projectId,
    mauza_ids: mauzaIds,
    khasra_ids: khasraIds,
    murabba_ids: murabbaIds,
  });

  return res.data;
};

export const getPlotOptions = async (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      query.append(k, v);
    }
  });

  const response = await fetch(`${API_BASE}/plot-options/?${query.toString()}`);

  return response.json();
};

// ------------------------------ RUDA Master Plan Layers ------------------------------
export const getCityLevelServiceGeoJSON = async () => {
  const res = await axios.get(`${API_BASE}/city-level-service/`);
  return unwrapGeoJSON(res.data);
};

export const getForestBoundaryGeoJSON = async () => {
  const res = await axios.get(`${API_BASE}/forest-boundary/`);
  return unwrapGeoJSON(res.data);
};

export const getPrecientBoundaryGeoJSON = async () => {
  const res = await axios.get(`${API_BASE}/precient-boundary/`);
  return unwrapGeoJSON(res.data);
};

export const getRiverGeoJSON = async () => {
  const res = await axios.get(`${API_BASE}/river/`);
  return unwrapGeoJSON(res.data);
};

export const getRiverRaviGeoJSON = async () => {
  const res = await axios.get(`${API_BASE}/river-ravi/`);
  return unwrapGeoJSON(res.data);
};

export const getRudaJurisdictionGeoJSON = async () => {
  const res = await axios.get(`${API_BASE}/ruda-jurisdiction/`);
  return unwrapGeoJSON(res.data);
};

export const getCityLevelServicePointsGeoJSON = async () => {
  const res = await axios.get(`${API_BASE}/city-level-service-points/`);
  return unwrapGeoJSON(res.data);
};

export const getMpPrincipleZoningGeoJSON = async () => {
  const res = await axios.get(`${API_BASE}/mp-principle-zoning/`);
  return unwrapGeoJSON(res.data);
};

export const getExistingForestGeoJSON = async () => {
  const res = await axios.get(`${API_BASE}/existing-forest/`);
  return unwrapGeoJSON(res.data);
};

export const getRudaPlanningBoundaryGeoJSON = async () => {
  const res = await axios.get(`${API_BASE}/ruda-planning-boundary/`);
  return unwrapGeoJSON(res.data);
};

export const getRudaNotifiedPhasesBoundaryGeoJSON = async () => {
  const res = await axios.get(`${API_BASE}/ruda-notified-phases-boundary/`);
  return unwrapGeoJSON(res.data);
};

export const getProposedRoadNetworkGeoJSON = async () => {
  const res = await axios.get(`${API_BASE}/proposed-road-network/`);
  return unwrapGeoJSON(res.data);
};

export const getLahoreTransportationRoadsGeoJSON = async () => {
  const res = await axios.get(`${API_BASE}/lahore-transportation-roads/`);
  return unwrapGeoJSON(res.data);
};

// ------------------------------ WWTP Layers ------------------------------
export const getProposedWWTPGeoJSON = async () => {
  const res = await axios.get(`${API_BASE}/proposed-wwtp/`);
  return unwrapGeoJSON(res.data);
};

export const getWWTPSitesGeoJSON = async () => {
  const res = await axios.get(`${API_BASE}/wwtp-sites/`);
  return unwrapGeoJSON(res.data);
};

export const getSWTPSiteGeoJSON = async () => {
  const res = await axios.get(`${API_BASE}/swtp-site/`);
  return unwrapGeoJSON(res.data);
};

// ------------------------------ Imported Administrative Boundary Layers ------------------------------
export const getRtwPackageGeoJSON = async () => {
  const res = await axios.get(`${API_BASE}/rtwpackage/`);
  return unwrapGeoJSON(res.data);
};

export const getRtwAlignmentGeoJSON = async () => {
  const res = await axios.get(`${API_BASE}/rtwalignment/`);
  return unwrapGeoJSON(res.data);
};

export const getStateLandGeoJSON = async () => {
  const res = await axios.get(`${API_BASE}/stateland/`);
  return unwrapGeoJSON(res.data);
};

export const getAwardedLandGeoJSON = async () => {
  const res = await axios.get(`${API_BASE}/awardedland/`);
  return unwrapGeoJSON(res.data);
};

export const getPossessionLandGeoJSON = async () => {
  const res = await axios.get(`${API_BASE}/possessionland/`);
  return unwrapGeoJSON(res.data);
};

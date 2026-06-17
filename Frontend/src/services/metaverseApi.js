import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

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

const unwrapGeoJSON = (data) => {
  const raw = unwrapApiData(data);
  if (raw?.type === "FeatureCollection") return raw;
  if (raw?.features) return raw;
  if (Array.isArray(raw)) return { type: "FeatureCollection", features: raw };
  return emptyFC();
};

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

export const getPlotOptions = async (filters = {}) => {
  const geojson = await getPlotsGeoJSON(filters);
  const plots = normalizeFeatures(geojson);

  return {
    plotTypes: [...new Set(plots.map((p) => p.type).filter(Boolean))],
    plotNos: [...new Set(plots.map((p) => p.plot_no).filter(Boolean))],
    areas: [...new Set(plots.map((p) => p.plot_area).filter(Boolean))],
  };
};

export const getPlotOptionsAll = async () => {
  const geojson = await getPlotsGeoJSON({});
  const plots = normalizeFeatures(geojson);

  return {
    plotTypes: [...new Set(plots.map((p) => p.type).filter(Boolean))],
    plotNos: [...new Set(plots.map((p) => p.plot_no).filter(Boolean))],

    // NEW (ADD ALL MISSING FIELDS)
    parkFronts: [...new Set(plots.map((p) => p.parkfront).filter(Boolean))],
    roadFacing: [...new Set(plots.map((p) => p.rd_facing).filter(Boolean))],
    possessionStatus: [
      ...new Set(plots.map((p) => p.poss_st || p.possession).filter(Boolean)),
    ],
    plotStatus: [...new Set(plots.map((p) => p.canceled).filter(Boolean))],
    categories: [...new Set(plots.map((p) => p.tr_cate).filter(Boolean))],
    owners: [...new Set(plots.map((p) => p.tr_own).filter(Boolean))],
    sitePlans: [...new Set(plots.map((p) => p.site_plan).filter(Boolean))],
  };
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

  const res = await axios.get(`${API_BASE}/road/`, {
    params: {
      project_id: params.project_id,
      block_id: params.block_id || undefined,
      block: params.block || undefined,
      type: params.type || undefined,
    },
  });

  return unwrapGeoJSON(res.data);
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

export const saveProjectMauzas = async (projectId, mauzaIds) => {
  const res = await axios.post(`${API_BASE}/project-mauza/create/`, {
    project_id: projectId,
    mauza_ids: mauzaIds,
  });

  return res.data;
};

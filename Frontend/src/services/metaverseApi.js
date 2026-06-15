import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const unwrapApiData = (data) => {
  return data?.data || data?.results || data;
};

const normalizeFeatures = (data) => {
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

export const getProjects = async () => {
  const res = await axios.get(`${API_BASE}/project/`);
  return normalizeFeatures(res.data);
};

export const getBlocks = async (projectId) => {
  const res = await axios.get(`${API_BASE}/block/`, {
    params: { project_id: projectId },
  });
  return normalizeFeatures(res.data);
};

export const getPlotsGeoJSON = async (filters = {}) => {
  const res = await axios.get(`${API_BASE}/plot/`, {
    params: filters,
  });

  return unwrapApiData(res.data);
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
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000/api",
});

const extractPayload = (res) => res?.data?.data ?? res?.data ?? [];

const extractCollection = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.features)) return payload.features;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const normalizeData = (res) => {
  const rawItems = extractCollection(extractPayload(res));

  return rawItems.map((item) => {
    if (!item?.properties) return item;

    return {
      id: item.id ?? item.properties?.id,
      geometry: item.geometry ?? null,
      ...item.properties,
    };
  });
};

const normalizeGeoJson = (res) => {
  const payload = extractPayload(res);

  // Handle FeatureCollection
  if (payload?.type === "FeatureCollection") {
    return payload;
  }

  // Handle single Feature
  if (payload?.type === "Feature") {
    return {
      type: "FeatureCollection",
      features: [payload],
    };
  }

  // Handle array of features
  if (Array.isArray(payload)) {
    return {
      type: "FeatureCollection",
      features: payload,
    };
  }

  // Fallback: empty collection
  return {
    type: "FeatureCollection",
    features: [],
  };
};

///////////////////////////////////////////////////////
//////////////// ADMIN FILTER APIs ////////////////////
///////////////////////////////////////////////////////

export const getDivisions = async () => {
  const res = await API.get("/division/");
  return normalizeData(res);
};

export const getDistricts = async (division_i) => {
  const res = await API.get("/district/", {
    params: { division_i },
  });
  return normalizeData(res);
};

export const getTehsils = async (district_i) => {
  const res = await API.get("/tehsil/", {
    params: { district_i },
  });
  return normalizeData(res);
};

export const getMouzas = async (tehsil_id) => {
  const res = await API.get("/mouza/", {
    params: { tehsil_id },
  });
  console.log("Raw response for getMouzas:", res);
  return normalizeGeoJson(res);
};

export const getKhasras = async (mouza_id) => {
  const res = await API.get("/khasra/", {
    params: { mouza_id },
  });
  return normalizeGeoJson(res);
};

export const getMurabbas = async (mouza_id) => {
  const res = await API.get("/murabba/", {
    params: { mouza_id },
  });
  return normalizeGeoJson(res);
};

///////////////////////////////////////////////////////
//////////////// BOUNDARY APIs ////////////////////////
///////////////////////////////////////////////////////

export const getDivisionBoundary = async (id) => {
  const res = await API.get(`/division/${id}/geojson`);
  return normalizeGeoJson(res);
};

export const getDistrictBoundary = async (id) => {
  const res = await API.get(`/district/${id}/geojson`);
  return normalizeGeoJson(res);
};

export const getTehsilBoundary = async (id) => {
  const res = await API.get(`/tehsil/${id}/geojson`);
  return normalizeGeoJson(res);
};

export const getMouzaBoundary = async (id) => {
  const res = await API.get(`/mouza/${id}/geojson`);
  return normalizeGeoJson(res);
};

export const getKhasraBoundary = async (id) => {
  const res = await API.get(`/khasra/${id}/geojson`);
  return normalizeGeoJson(res);
};

export const getMurabbaBoundary = async (id) => {
  const res = await API.get(`/murabba/${id}/geojson`);
  return normalizeGeoJson(res);
};

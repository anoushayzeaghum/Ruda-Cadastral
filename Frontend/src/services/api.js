import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});

const extractPayload = (res) => res?.data?.data ?? res?.data ?? [];

const extractCollection = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.features)) return payload.features;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

// Normalize GeoJSON/ApiResponse → plain objects while preserving ids.
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

  if (
    payload?.type === "FeatureCollection" &&
    Array.isArray(payload.features)
  ) {
    return payload;
  }

  if (Array.isArray(payload)) {
    return {
      type: "FeatureCollection",
      features: payload,
    };
  }

  return {
    type: "FeatureCollection",
    features: [],
  };
};

// ---------------- DIVISIONS ----------------

export const getDivisions = async () => {
  const res = await API.get("/division/");
  return normalizeData(res);
};

// ---------------- DISTRICTS ----------------

export const getDistricts = async (division_i) => {
  const res = await API.get("/district/", {
    params: { division_i },
  });
  return normalizeData(res);
};

// ---------------- TEHSILS ----------------

export const getTehsils = async (district_i) => {
  const res = await API.get("/tehsil/", {
    params: { district_i },
  });
  return normalizeData(res);
};

// ---------------- MOUZAS ----------------

export const getMouzas = async (tehsil_id) => {
  const res = await API.get("/mouza/", {
    params: { tehsil_id },
  });
  return normalizeData(res);
};

// ---------------- KHASRAS ----------------

export const getKhasras = async (mouza_id) => {
  const res = await API.get("/khasra/", {
    params: { mouza_id },
  });
  return normalizeGeoJson(res);
};

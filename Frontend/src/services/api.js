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
    // If array contains GeoJSON features already, use as-is
    if (payload.length > 0 && payload[0]?.type === "Feature") {
      return {
        type: "FeatureCollection",
        features: payload,
      };
    }

    // If array contains plain model objects (fields at top-level), convert to features
    const features = payload.map((item) => {
      const properties = { ...item };
      // if geometry exists as 'geom' or 'geometry', move it to geometry
      let geometry = null;
      if (properties.geom) {
        geometry = properties.geom;
        delete properties.geom;
      } else if (properties.geometry) {
        geometry = properties.geometry;
        delete properties.geometry;
      }

      return {
        type: "Feature",
        id: item.mauza_id ?? item.gid ?? undefined,
        geometry: geometry || null,
        properties,
      };
    });

    return {
      type: "FeatureCollection",
      features,
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

export const getDistricts = async () => {
  const res = await API.get("/district/");
  return normalizeData(res);
};

export const getTehsils = async (district_i) => {
  const res = await API.get("/tehsil/", {
    params: { district_i },
  });
  return normalizeData(res);
};

export const getMauzas = async (tehsil) => {
  const params = {};
  if (tehsil !== undefined && tehsil !== null && tehsil !== "") {
    params.tehsil = tehsil;
  }

  const res = await API.get("/mauza/", {
    params,
  });
  console.log("Raw response for getMauzas:", res);
  return normalizeGeoJson(res);
};

export const getKhasras = async (mauza_id) => {
  const res = await API.get("/khasra/", {
    params: { mauza_id },
  });
  return normalizeGeoJson(res);
};

export const getMurabbas = async (mauza_id) => {
  const res = await API.get("/murabba/", {
    params: { mauza_id },
  });
  return normalizeGeoJson(res);
};

///////////////////////////////////////////////////////
//////////////// BOUNDARY APIs ////////////////////////
///////////////////////////////////////////////////////

export const getDistrictBoundary = async (id) => {
  const res = await API.get(`/district/${id}/geojson`);
  return normalizeGeoJson(res);
};

export const getTehsilBoundary = async (id) => {
  const res = await API.get(`/tehsil/${id}/geojson`);
  return normalizeGeoJson(res);
};

export const getMauzaBoundary = async (id) => {
  const res = await API.get(`/mauza/${id}/geojson`);
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

///////////////////////////////////////////////////////
///////////////////// RUDA APIs ///////////////////////
///////////////////////////////////////////////////////

export const getRudaList = async () => {
  const res = await API.get(`/ruda/`);
  return normalizeData(res);
};

export const getRudaGeoJSON = async (gid) => {
  const res = await API.get(`/ruda/${gid}/geojson`);
  return normalizeGeoJson(res);
};

///////////////////////////////////////////////////////
///////////////////// TRIJUNCTION APIs ///////////////////////
///////////////////////////////////////////////////////

export const getTrijunctionPoints = async ({ mauza, type }) => {
  const params = { type };

  if (mauza) {
    params.mauza = mauza;
  }

  const res = await API.get("/trijunction/", { params });
  return normalizeGeoJson(res);
};

// Import Mauza ZIP (shapefile inside)
export const importMauza = async ({ file, tehsil, mauza }) => {
  const fd = new FormData();
  fd.append("file", file);
  if (tehsil) fd.append("tehsil", tehsil);
  if (mauza) fd.append("mauza", mauza);

  const res = await API.post("/mauza/import/", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
};

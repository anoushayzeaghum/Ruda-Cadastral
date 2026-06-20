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

export const importDistrict = ({ file }) => {
  const formData = new FormData();
  formData.append("file", file);

  return API.post("/import/district/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  }).then((res) => res.data);
};

export const importTehsil = async ({ file }) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await API.post("/import/tehsil/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
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

export const importKhasra = async ({ file }) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await API.post("/import/khasra/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

export const getMurabbas = async (mauza_id) => {
  const res = await API.get("/murabba/", {
    params: { mauza_id },
  });
  return normalizeGeoJson(res);
};

export const getSquares = async (mauza_id) => {
  const params = {};
  if (mauza_id !== undefined && mauza_id !== null && mauza_id !== "") {
    params.mauza_id = mauza_id;
  }

  const res = await API.get("/square/", { params });
  const geojson = normalizeGeoJson(res);

  // Safety filter: if the backend ignores mauza_id and returns all squares,
  // draw only the squares that belong to the selected Mauza.
  return filterGeoJSONByMauzaIds(geojson, mauza_id);
};

export const getAcres = async (mauza_id) => {
  const params = {};
  if (mauza_id !== undefined && mauza_id !== null && mauza_id !== "") {
    params.mauza_id = mauza_id;
  }

  const res = await API.get("/acre/", { params });
  const geojson = normalizeGeoJson(res);

  // Safety filter: if the backend ignores mauza_id and returns all acres,
  // draw only the acres that belong to the selected Mauza.
  return filterGeoJSONByMauzaIds(geojson, mauza_id);
};

export const getFieldPoints = async (mauza_id) => {
  const params = {};
  if (mauza_id !== undefined && mauza_id !== null && mauza_id !== "") {
    params.mauza_id = mauza_id;
  }

  const res = await API.get("/fieldpoints/", { params });
  const geojson = normalizeGeoJson(res);

  // FieldPoints has mauza_id in the model/serializer, so keep the map
  // restricted to the selected Mauza even if the API returns extra records.
  return filterGeoJSONByMauzaIds(geojson, mauza_id);
};

export const importMurabba = async ({ file }) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await API.post("/import/murabba/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
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
//////////////// SOCIETY LAYER APIs ///////////////////
///////////////////////////////////////////////////////

export const getSocieties = async (filters = {}) => {
  const params = {};

  // Backward compatible: old calls like getSocieties(mauza_id) still work.
  if (
    typeof filters !== "object" ||
    filters === null ||
    Array.isArray(filters)
  ) {
    if (filters !== undefined && filters !== null && filters !== "") {
      params.mauza_id = filters;
    }
  } else {
    const allowedKeys = [
      "mauza_id",
      "mauza",
      "society_id",
      "dist_id",
      "district",
      "tehsil_id",
      "tehsil",
    ];

    allowedKeys.forEach((key) => {
      const value = filters[key];
      if (value !== undefined && value !== null && value !== "") {
        params[key] = value;
      }
    });
  }

  const res = await API.get("/society/", { params });
  return normalizeData(res);
};

export const getSocietyGeoJSON = async (gid) => {
  const res = await API.get(`/society/${gid}/geojson`);
  return normalizeGeoJson(res);
};

export const getSocietyBoundaryGeoJSONBySocietyId = async (society_id) => {
  const res = await API.get("/society/", {
    params: { society_id },
  });
  return normalizeGeoJson(res);
};

export const getMasterPlanGeoJSON = async ({ society_id, mauza_id } = {}) => {
  const params = {};
  if (society_id) params.society_id = society_id;
  if (mauza_id) params.mauza_id = mauza_id;

  const res = await API.get("/masterplan/", { params });
  return normalizeGeoJson(res);
};

export const getSpotLevelGeoJSON = async ({ society_id, mauza_id } = {}) => {
  const params = {};
  if (society_id) params.society_id = society_id;
  if (mauza_id) params.mauza_id = mauza_id;

  const res = await API.get("/spot-level/", { params });
  return normalizeGeoJson(res);
};

export const getContourGeoJSON = async ({ society_id, mauza_id } = {}) => {
  const params = {};
  if (society_id) params.society_id = society_id;
  if (mauza_id) params.mauza_id = mauza_id;

  const res = await API.get("/contour/", { params });
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
///////////////////// RUDA PROPOSED ROADS APIs ///////////////////////
///////////////////////////////////////////////////////

export const getRudaProposedRoadsList = async () => {
  const res = await API.get(`/ruda-proposed-roads/`);
  return normalizeData(res);
};

export const getRudaProposedRoadsGeoJSON = async (gid = null) => {
  // The router exposes the proposed roads GeoJSON on the list endpoint.
  // There is no /ruda-proposed-roads/:gid/geojson route, so using that URL
  // causes 404 and the road layer never draws.
  const res = await API.get(`/ruda-proposed-roads/`);
  const geojson = normalizeGeoJson(res);

  if (gid === null || gid === undefined || gid === "") {
    return geojson;
  }

  const selectedId = String(gid);

  return {
    type: "FeatureCollection",
    features: (geojson.features || []).filter((feature) => {
      const props = feature?.properties || {};
      const featureId =
        props.gid ?? feature?.id ?? props.id ?? props.oid ?? props.fid;

      return String(featureId) === selectedId;
    }),
  };
};

///////////////////////////////////////////////////////
///////////////////// TRIJUNCTION APIs ///////////////////////
///////////////////////////////////////////////////////

export const getTrijunctionPoints = async () => {
  // Trijunction table has no mauza_id/type filter fields in the DB.
  // Fetch all points and let Mapview spatially clip/filter them to the open Mauza/Khasra area.
  const res = await API.get("/trijunction/");
  return normalizeGeoJson(res);
};

export const getGeodeticNetworkGeoJSON = async () => {
  const res = await API.get("/geodeticnetwork/");
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

export const importMauzaShapefile = async ({ file }) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await API.post("/import/mauza/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

const normalizeIdValue = (value) => {
  if (value === null || value === undefined || value === "") return "";

  const text = String(value).trim().toLowerCase();
  if (!text) return "";

  const numericValue = Number(text);
  if (Number.isFinite(numericValue)) return String(numericValue);

  return text;
};

const normalizeIdList = (value) => {
  if (Array.isArray(value)) return value.map(normalizeIdValue).filter(Boolean);

  if (typeof value === "string") {
    return value.split(",").map(normalizeIdValue).filter(Boolean);
  }

  const single = normalizeIdValue(value);
  return single ? [single] : [];
};

const getFeatureMauzaValues = (feature = {}) => {
  const props = feature.properties || feature || {};

  return [
    props.mauza_id,
    props.MAUZA_ID,
    props.moza_id,
    props.mouza_id,
    props.mauza_gid,
    props.mauza,
    props.Mauza,
    props.moza,
    props.Moza,
    props.mouza,
    props.Mouza,
  ]
    .map(normalizeIdValue)
    .filter(Boolean);
};

const filterGeoJSONByMauzaIds = (geojson, mauzaIds = []) => {
  const allowedMauzas = new Set(normalizeIdList(mauzaIds));

  if (!allowedMauzas.size) return geojson;

  return {
    type: "FeatureCollection",
    features: (geojson.features || []).filter((feature) =>
      getFeatureMauzaValues(feature).some((value) => allowedMauzas.has(value)),
    ),
  };
};

export const getProjectMauzas = async (projectId) => {
  if (!projectId) return [];

  const res = await API.get("/project-mauza/", {
    params: { project_id: projectId },
  });

  return extractPayload(res);
};

export const getProjectMauzasGeoJSON = async (projectId) => {
  if (!projectId) {
    return { type: "FeatureCollection", features: [] };
  }

  const rows = await getProjectMauzas(projectId);

  return {
    type: "FeatureCollection",
    features: (rows || [])
      .map((row) => row?.mauza_detail)
      .filter(Boolean)
      .map((feature) => ({
        ...feature,
        properties: feature.properties || {},
      })),
  };
};

export const getMurabbasGeoJSON = async (filters = {}) => {
  const mauzaIds = filters.mauza_ids ?? filters.mauza_id;

  const params = {
    ...filters,
    mauza_ids: Array.isArray(filters.mauza_ids)
      ? filters.mauza_ids.join(",")
      : filters.mauza_ids,
    mauza_id: Array.isArray(filters.mauza_id)
      ? filters.mauza_id.join(",")
      : filters.mauza_id,
  };

  const res = await API.get("/murabba/", { params });
  const geojson = normalizeGeoJson(res);

  // Safety filter: if backend ignores mauza_ids and returns all records,
  // keep only Murabbas belonging to the selected project Mauzas.
  return filterGeoJSONByMauzaIds(geojson, mauzaIds);
};

export const getKhasrasGeoJSON = async (filters = {}) => {
  const mauzaIds = filters.mauza_ids ?? filters.mauza_id;

  const params = {
    ...filters,
    mauza_ids: Array.isArray(filters.mauza_ids)
      ? filters.mauza_ids.join(",")
      : filters.mauza_ids,
    mauza_id: Array.isArray(filters.mauza_id)
      ? filters.mauza_id.join(",")
      : filters.mauza_id,
  };

  const res = await API.get("/khasra/", { params });
  const geojson = normalizeGeoJson(res);

  // Safety filter: if backend ignores mauza_ids and returns all Khasras,
  // keep only Khasras belonging to the selected project Mauzas.
  return filterGeoJSONByMauzaIds(geojson, mauzaIds);
};

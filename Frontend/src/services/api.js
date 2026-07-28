import axios from "axios";
import { useParams } from "react-router-dom";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});
const extractPayload = (res) => res?.data?.data ?? res?.data ?? [];

const extractCollection = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.features)) return payload.features;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.features)) return payload.data.features;
  if (Array.isArray(payload?.data?.results)) return payload.data.results;
  return [];
};

const isGeoJSONGeometry = (value) =>
  Boolean(
    value?.type &&
    [
      "Point",
      "MultiPoint",
      "LineString",
      "MultiLineString",
      "Polygon",
      "MultiPolygon",
      "GeometryCollection",
    ].includes(value.type),
  );

const toGeoJSONFeature = (item, fallbackProperties = {}) => {
  if (!item) return null;

  if (item.type === "Feature") {
    return {
      ...item,
      properties: {
        ...fallbackProperties,
        ...(item.properties || {}),
      },
    };
  }

  const properties = {
    ...fallbackProperties,
    ...item,
  };

  let geometry = null;

  if (isGeoJSONGeometry(properties.geom)) {
    geometry = properties.geom;
    delete properties.geom;
  } else if (isGeoJSONGeometry(properties.geometry)) {
    geometry = properties.geometry;
    delete properties.geometry;
  }

  if (!geometry) return null;

  return {
    type: "Feature",
    id:
      item.id ??
      item.gid ??
      item.mauza_id ??
      item.khasra_id ??
      item.sq ??
      undefined,
    geometry,
    properties,
  };
};

const toGeoJSONFeatures = (value, fallbackProperties = {}) => {
  if (!value) return [];

  if (value.type === "FeatureCollection") {
    return (value.features || [])
      .map((feature) => toGeoJSONFeature(feature, fallbackProperties))
      .filter(Boolean);
  }

  if (value.type === "Feature") {
    const feature = toGeoJSONFeature(value, fallbackProperties);
    return feature ? [feature] : [];
  }

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => toGeoJSONFeatures(item, fallbackProperties))
      .filter(Boolean);
  }

  if (Array.isArray(value.features)) {
    return toGeoJSONFeatures(
      { type: "FeatureCollection", features: value.features },
      fallbackProperties,
    );
  }

  if (Array.isArray(value.results)) {
    return toGeoJSONFeatures(value.results, fallbackProperties);
  }

  if (Array.isArray(value.data)) {
    return toGeoJSONFeatures(value.data, fallbackProperties);
  }

  const feature = toGeoJSONFeature(value, fallbackProperties);
  return feature ? [feature] : [];
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

const firstMeaningfulValue = (...values) =>
  values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      value !== "" &&
      !(typeof value === "number" && value === 0) &&
      String(value).trim() !== "0",
  );

const normalizeCadastralProperties = (properties = {}) => {
  const normalized = { ...properties };

  const khasraNumber = firstMeaningfulValue(
    properties.kh,
    properties.KH,
    properties.k,
    properties.K,
    properties.khasra,
    properties.khasra_no,
    properties.khasra_id,
    properties.join_shp,
  );

  if (khasraNumber !== undefined) normalized.kh = khasraNumber;

  const mauzaId = firstMeaningfulValue(
    properties.mauza_id,
    properties.moza_id,
    properties.mouza_id,
    properties.mauza_gid,
  );
  if (mauzaId !== undefined) normalized.mauza_id = mauzaId;

  return normalized;
};

const normalizeGeoJson = (res) => {
  const payload = extractPayload(res);
  const geojson = {
    type: "FeatureCollection",
    features: toGeoJSONFeatures(payload).map((feature) => ({
      ...feature,
      properties: normalizeCadastralProperties(feature?.properties || {}),
    })),
  };

  // Preserve an API-provided bbox so map screens can fit the layer without
  // recursively walking every coordinate of a large cadastral geometry.
  if (Array.isArray(payload?.bbox)) {
    geojson.bbox = payload.bbox;
  }

  return geojson;
};

///////////////////////////////////////////////////////
//////////////// ADMIN FILTER APIs ////////////////////
///////////////////////////////////////////////////////

export const getDistricts = async () => {
  const start = performance.now();

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

export const getMauzas = async (tehsil_id) => {
  const params = {};

  if (tehsil_id !== undefined && tehsil_id !== null && tehsil_id !== "") {
    params.tehsil_id = tehsil_id;
  }

  const res = await API.get("/mauza/", {
    params,
  });
  // console.log("Raw response for getMauzas:", res);
  return normalizeGeoJson(res);
};

export const getKhasras = async (mauza_id) => {
  const res = await API.get("/khasra/", {
    params: { mauza_id },
  });
  console.log(res);
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
  return getSquaresGeoJSON({ mauza_id });
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
  const start = performance.now();

  const res = await API.get(`/district/${id}/geojson`);

  const apiTime = performance.now() - start;

  const normalizeStart = performance.now();

  const geojson = normalizeGeoJson(res);

  return geojson;
};

export const getTehsilBoundary = async (id) => {
  const start = performance.now();

  const res = await API.get(`/tehsil/${id}/geojson`);

  const normalizeStart = performance.now();

  const geojson = normalizeGeoJson(res);

  return geojson;
};

export const getMauzaBoundary = async (id) => {
  const start = performance.now();

  const res = await API.get(`/mauza/${id}/geojson`);

  const normalizeStart = performance.now();

  const geojson = normalizeGeoJson(res);

  return geojson;
};

export const getKhasraBoundary = async (id) => {
  const start = performance.now();

  const res = await API.get(`/khasra/${id}/geojson`, {
    headers: {
      "Accept-Encoding": "gzip",
    },
  });

  console.log("Khasra API:", (performance.now() - start).toFixed(2), "ms");

  return {
    type: "FeatureCollection",
    features: [res.data.data],
  };
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

export const getSpotLevelGeoJSON = async ({ project_id, mauza_id } = {}) => {
  const params = {};
  if (project_id) params.project_id = project_id;
  if (mauza_id) params.mauza_id = mauza_id;

  const res = await API.get("/spot-level/", { params });
  return normalizeGeoJson(res);
};

export const getContourGeoJSON = async ({ project_id, mauza_id } = {}) => {
  const params = {};
  if (project_id) params.project_id = project_id;
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
    feature.id,
    props.id,
    props.gid,
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

const buildMauzaFilterParams = (filters = {}) => ({
  ...filters,
  mauza_ids: Array.isArray(filters.mauza_ids)
    ? filters.mauza_ids.join(",")
    : filters.mauza_ids,
  mauza_id: Array.isArray(filters.mauza_id)
    ? filters.mauza_id.join(",")
    : filters.mauza_id,
});

const getRequestedMauzaIds = (filters = {}) =>
  filters.mauza_ids ?? filters.mauza_id;

const mergeGeoJSONCollections = (collections = []) => ({
  type: "FeatureCollection",
  features: collections.flatMap((collection) => collection?.features || []),
});

const buildSingleMauzaRequestParams = (filters = {}, mauzaId) => {
  const params = { ...filters };

  // The backend supports one mauza_id at a time. Do not send mauza_ids=1,2
  // because that can break the Django filter and return a 500 error.
  delete params.mauza_ids;
  delete params.mauza_id;

  if (mauzaId !== undefined && mauzaId !== null && mauzaId !== "") {
    params.mauza_id = mauzaId;
  }

  return params;
};

const getBoundaryGeoJSONByProjectMauzas = async (endpoint, filters = {}) => {
  const requestedMauzaIds = [
    ...new Set(normalizeIdList(getRequestedMauzaIds(filters))),
  ];

  if (!requestedMauzaIds.length) {
    const res = await API.get(endpoint, {
      params: buildSingleMauzaRequestParams(filters),
    });
    return normalizeGeoJson(res);
  }

  const collections = await Promise.all(
    requestedMauzaIds.map(async (mauzaId) => {
      const res = await API.get(endpoint, {
        params: buildSingleMauzaRequestParams(filters, mauzaId),
      });
      return normalizeGeoJson(res);
    }),
  );

  const mergedGeojson = mergeGeoJSONCollections(collections);

  // Safety filter: if any endpoint ignores mauza_id and returns extra records,
  // keep only records whose mauza_id belongs to the selected project Mauzas.
  return filterGeoJSONByMauzaIds(mergedGeojson, requestedMauzaIds);
};

export const getProjectMauzas = async (projectId) => {
  if (!projectId) return [];

  const res = await API.get("/project-mauza/", {
    params: { project_id: projectId },
  });

  return extractCollection(extractPayload(res));
};

export const getProjectMauzasGeoJSON = async (projectId) => {
  if (!projectId) return { type: "FeatureCollection", features: [] };

  const rows = await getProjectMauzas(projectId);

  const features = (rows || [])
    .flatMap((row) => {
      const rowProperties = {
        project_mauza_id: row?.id,
        project_id: row?.project ?? row?.project_id ?? projectId,
        linked_mauza_id: row?.mauza ?? row?.mauza_id,
        linked_khasra_id: row?.khasra ?? row?.khasra_id,
        linked_square_id: row?.square ?? row?.square_id,
      };

      const nestedMauza =
        row?.mauza_detail ??
        row?.mauza_geojson ??
        row?.mauza_feature ??
        row?.mauza_boundary;

      const nestedFeatures = toGeoJSONFeatures(nestedMauza, rowProperties);

      if (nestedFeatures.length) {
        return nestedFeatures.map((feature) => ({
          ...feature,
          properties: {
            ...rowProperties,
            ...(feature.properties || {}),
            mauza_id:
              feature.properties?.mauza_id ??
              feature.properties?.gid ??
              rowProperties.linked_mauza_id,
          },
        }));
      }

      // Backward-compatible fallback: some APIs may already return Mauza
      // features directly from /project-mauza/ instead of nested mauza_detail.
      return toGeoJSONFeatures(row, rowProperties).map((feature) => ({
        ...feature,
        properties: {
          ...rowProperties,
          ...(feature.properties || {}),
          mauza_id:
            feature.properties?.mauza_id ??
            feature.properties?.gid ??
            rowProperties.linked_mauza_id,
        },
      }));
    })
    .filter((feature) => feature?.geometry);

  return {
    type: "FeatureCollection",
    features,
  };
};

export const getSquaresGeoJSON = async (filters = {}) => {
  return getBoundaryGeoJSONByProjectMauzas("/square/", filters);
};

export const getMurabbasGeoJSON = async (filters = {}) => {
  return getBoundaryGeoJSONByProjectMauzas("/murabba/", filters);
};

export const getKhasrasGeoJSON = async (filters = {}) => {
  return getBoundaryGeoJSONByProjectMauzas("/khasra/", filters);
};

///////////////////////////////////////////////////////
//////////////// UNVERIFIED APIs //////////////////////
///////////////////////////////////////////////////////

const getRudaGeoJSONByMauza = async (endpoint, mauzaId) => {
  const params = {};

  if (mauzaId !== undefined && mauzaId !== null && mauzaId !== "") {
    params.mauza_id = mauzaId;
  }

  const res = await API.get(endpoint, { params });
  const geojson = normalizeGeoJson(res);

  // Some backend list endpoints may ignore the query parameter and return
  // every RUDA record. Keep a frontend safety filter so only the Mauza
  // selected in the subheader can reach the map or attribute table.
  return filterGeoJSONByMauzaIds(geojson, mauzaId);
};

export const getRudaMauzas = async (mauzaId) =>
  getRudaGeoJSONByMauza("/rudamauza/", mauzaId);

export const getRudaKhasras = async (mauzaId) =>
  getRudaGeoJSONByMauza("/rudakhasra/", mauzaId);

export const getRudaSquares = async (mauzaId) =>
  getRudaGeoJSONByMauza("/rudasquare/", mauzaId);

///////////////////////////////////////////////////////
//////////// THEMATIC KHASRA CHILD LAYERS ////////////
///////////////////////////////////////////////////////

export const getPossessionLandGeoJSON = async () => {
  const res = await API.get("/possessionland/");
  return normalizeGeoJson(res);
};

export const getAwardedLandGeoJSON = async () => {
  const res = await API.get("/awardedland/");
  return normalizeGeoJson(res);
};

export const getStateLandGeoJSON = async () => {
  const res = await API.get("/stateland/");
  return normalizeGeoJson(res);
};

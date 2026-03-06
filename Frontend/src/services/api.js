import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api"
});


export const getDivisions = async () => {
  const res = await API.get("/khasra/");
  
  const divisions = [
    ...new Map(res.data.map((item) => [item.division, item])).values(),
  ];

  return divisions.map((d) => ({
    id: d.division,
    name: d.division,
  }));
};


export const getDistricts = async (division) => {
  const res = await API.get("/khasra/");

  const filtered = res.data.filter((d) => d.division === division);

  const districts = [
    ...new Map(filtered.map((item) => [item.district, item])).values(),
  ];

  return districts.map((d) => ({
    id: d.district,
    name: d.district,
  }));
};


export const getTehsils = async (district) => {
  const res = await API.get("/khasra/");

  const filtered = res.data.filter((t) => t.district === district);

  const tehsils = [
    ...new Map(filtered.map((item) => [item.tehsil, item])).values(),
  ];

  return tehsils.map((t) => ({
    id: t.tehsil,
    name: t.tehsil,
  }));
};


export const getMouzas = async (tehsil) => {
  const res = await API.get("/khasra/");

  const filtered = res.data.filter((m) => m.tehsil === tehsil);

  const mouzas = [
    ...new Map(filtered.map((item) => [item.mouza, item])).values(),
  ];

  return mouzas.map((m) => ({
    id: m.mouza,
    name: m.mouza,
  }));
};


export const getKhasras = async (mouza) => {
  const res = await API.get("/khasra/");

  const filtered = res.data.filter((k) => k.mouza === mouza);

  return {
    type: "FeatureCollection",
    features: filtered.map((k) => ({
      type: "Feature",
      geometry: k.geom,
      properties: {
        label: k.label,
      },
    })),
  };
};
import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});

// ---------------- DIVISIONS ----------------

export const getDivisions = async () => {
  const res = await API.get("/division/");
  return res.data?.data ?? [];
};

// ---------------- DISTRICTS ----------------

export const getDistricts = async (division_i) => {
  const res = await API.get(`/district/?division_i=${division_i}`);
  return res.data?.data ?? [];
};

// ---------------- TEHSILS ----------------

export const getTehsils = async (district_i) => {
  const res = await API.get(`/tehsil/?district_i=${district_i}`);
  return res.data?.data ?? [];
};

// ---------------- MOUZAS ----------------

export const getMouzas = async (tehsil_id) => {
  const res = await API.get(`/mouza/?tehsil_id=${tehsil_id}`);
  return res.data?.data ?? [];
};

// ---------------- KHASRAS ----------------

export const getKhasras = async (mouza_id) => {
  const res = await API.get(`/khasra/?mouza_id=${mouza_id}`);
  return res.data?.data;
};

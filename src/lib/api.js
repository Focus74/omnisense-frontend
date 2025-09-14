import axios from "axios";

export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    console.error("[API ERROR]", err?.response?.data || err.message);
    return Promise.reject(err);
  }
);

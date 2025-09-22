// src/lib/api.js
import axios from "axios";

// '' = same-origin (เรียก /api/... ที่โดเมนเดียวกับหน้าเว็บ)
export const API_BASE = (import.meta.env.VITE_API_BASE ?? "").trim();

export const api = axios.create({
  baseURL: API_BASE,   // ตัวอย่าง: '' แล้วใช้ api.get('/api/health')
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const t = localStorage.getItem("omni_token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    console.error("[API ERROR]", err?.response?.status, err?.response?.data || err.message);
    return Promise.reject(err);
  }
);

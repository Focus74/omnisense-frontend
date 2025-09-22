// src/lib/auth.js
import { api } from "./api";

const KEY = "omni_token";
export const auth = {
  getToken() { return localStorage.getItem(KEY) || ""; },
  setToken(t) { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY); },
  isAuthed() { return !!localStorage.getItem(KEY); },
  async login(email, password) {
    const r = await api.post("/api/auth/login", { email, password });
    auth.setToken(r.data?.token || "");
    return r.data;
  },
  logout() { auth.setToken(""); },
};

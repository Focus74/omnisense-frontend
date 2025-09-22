// src/pages/AdminLogin.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../lib/auth";

export default function AdminLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      await auth.login(email, password);
      nav("/admin/devices");
    } catch (e) {
      setErr(e?.response?.data?.error || "login failed");
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white border rounded-xl shadow p-6 space-y-4">
        <h1 className="text-xl font-bold">Admin Login</h1>
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <div>
          <label className="block text-sm text-gray-600">Email</label>
          <input className="mt-1 w-full border rounded px-3 py-2" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username" />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Password</label>
          <input type="password" className="mt-1 w-full border rounded px-3 py-2" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" />
        </div>
        <button className="w-full bg-blue-600 text-white rounded py-2">Login</button>
      </form>
    </div>
  );
}

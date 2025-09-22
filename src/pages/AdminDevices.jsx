// src/pages/AdminDevices.jsx
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { auth } from "../lib/auth";

export default function AdminDevices() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ device_id: "", name: "", lat: "", lng: "" });
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    try {
      const r = await api.get("/api/admin/devices");
      setItems(r.data || []);
    } catch (e) {
      setErr(e?.response?.data?.error || "load failed");
    }
  }

  useEffect(() => { load(); }, []);

  async function createDevice(e) {
    e.preventDefault();
    setErr("");
    try {
      const payload = {
        device_id: form.device_id.trim(),
        name: form.name.trim(),
        lat: form.lat ? Number(form.lat) : null,
        lng: form.lng ? Number(form.lng) : null,
      };
      await api.post("/api/admin/devices", payload);
      setForm({ device_id: "", name: "", lat: "", lng: "" });
      load();
    } catch (e) {
      setErr(e?.response?.data?.error || "create failed");
    }
  }

  async function del(idOrKey) {
    if (!confirm("Delete this device?")) return;
    try {
      await api.delete(`/api/admin/devices/${idOrKey}`);
      load();
    } catch (e) {
      alert(e?.response?.data?.error || "delete failed");
    }
  }

  async function patch(idOrKey, data) {
    try {
      await api.patch(`/api/admin/devices/${idOrKey}`, data);
      load();
    } catch (e) {
      alert(e?.response?.data?.error || "update failed");
    }
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin — Devices</h1>
        <button className="text-sm text-red-600" onClick={() => (auth.logout(), window.location.href = "/admin/login")}>Logout</button>
      </div>

      {err && <div className="text-red-600">{err}</div>}

      <form onSubmit={createDevice} className="grid md:grid-cols-5 gap-2 bg-white border rounded-xl p-3">
        <input className="border rounded px-3 py-2" placeholder="device_id" value={form.device_id} onChange={e=>setForm(f=>({...f, device_id:e.target.value}))} required />
        <input className="border rounded px-3 py-2" placeholder="name" value={form.name} onChange={e=>setForm(f=>({...f, name:e.target.value}))} required />
        <input className="border rounded px-3 py-2" placeholder="lat" value={form.lat} onChange={e=>setForm(f=>({...f, lat:e.target.value}))} />
        <input className="border rounded px-3 py-2" placeholder="lng" value={form.lng} onChange={e=>setForm(f=>({...f, lng:e.target.value}))} />
        <button className="bg-blue-600 text-white rounded px-3 py-2">+ Create</button>
      </form>

      <div className="bg-white border rounded-xl overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-2 text-left">ID</th>
              <th className="p-2 text-left">device_id</th>
              <th className="p-2 text-left">name</th>
              <th className="p-2 text-left">lat</th>
              <th className="p-2 text-left">lng</th>
              <th className="p-2 text-left">online</th>
              <th className="p-2 text-left w-40">actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(d => (
              <tr key={d.id} className="border-t">
                <td className="p-2">{d.id}</td>
                <td className="p-2">{d.device_id}</td>
                <td className="p-2">
                  <input className="border rounded px-2 py-1 w-40" defaultValue={d.name}
                         onBlur={e => patch(d.id, { name: e.target.value })} />
                </td>
                <td className="p-2">
                  <input className="border rounded px-2 py-1 w-28" defaultValue={d.lat ?? ""} 
                         onBlur={e => patch(d.id, { lat: e.target.value ? Number(e.target.value) : null })} />
                </td>
                <td className="p-2">
                  <input className="border rounded px-2 py-1 w-28" defaultValue={d.lng ?? ""} 
                         onBlur={e => patch(d.id, { lng: e.target.value ? Number(e.target.value) : null })} />
                </td>
                <td className="p-2">{d.isOnline ? "✅" : "—"}</td>
                <td className="p-2">
                  <button className="px-2 py-1 border rounded text-red-600" onClick={() => del(d.id)}>delete</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td className="p-2 text-gray-500" colSpan={7}>no devices</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

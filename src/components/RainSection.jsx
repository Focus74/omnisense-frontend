import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { socket } from "../lib/socket";
import RainChart from "./RainChart";
const API = import.meta.env.VITE_API_BASE || "http://localhost:3000";

export default function RainSection({ deviceId }) {
  const [hours, setHours] = useState(24);
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(false);

  const summary = useMemo(() => {
    if (!points.length) return { total: 0, last: null, lastTs: null, count: 0 };
    const total = points.reduce((s, p) => s + Number(p.rainfall_mm || 0), 0);
    const last  = points.at(-1)?.rainfall_mm ?? null;
    const lastTs= points.at(-1)?.timestamp ?? null;
    return { total, last, lastTs, count: points.length };
  }, [points]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/api/devices/${deviceId}/rain`, { params: { hours } });
      setPoints(r.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [deviceId, hours]);
  useEffect(() => {
    const refresh = (msg) => { if (msg?.deviceId === deviceId) load(); };
    socket.on("rain:new", refresh);
    return () => socket.off("rain:new", refresh);
  }, [deviceId, hours]);

  return (
    <section className="mt-6 space-y-3">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">ปริมาณฝน</h2>
        <select className="border rounded px-2 py-1" value={hours} onChange={e => setHours(Number(e.target.value))}>
          <option value={6}>6 ชม.</option><option value={12}>12 ชม.</option>
          <option value={24}>24 ชม.</option><option value={48}>48 ชม.</option>
          <option value={72}>72 ชม.</option>
        </select>
        {loading && <span className="text-sm text-gray-500">กำลังโหลด…</span>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded border p-3">
          <div className="text-sm text-gray-500">ฝนรวม {hours} ชม.</div>
          <div className="text-2xl font-semibold">{summary.total.toFixed(1)} mm</div>
        </div>
        <div className="rounded border p-3">
          <div className="text-sm text-gray-500">ค่าล่าสุด</div>
          <div className="text-xl">{summary.last ?? "-" } mm</div>
          <div className="text-xs text-gray-500">{summary.lastTs ? new Date(summary.lastTs).toLocaleString() : ""}</div>
        </div>
        <div className="rounded border p-3">
          <div className="text-sm text-gray-500">จำนวนจุดข้อมูล</div>
          <div className="text-xl">{summary.count}</div>
        </div>
      </div>

      <RainChart points={points} />
    </section>
  );
}

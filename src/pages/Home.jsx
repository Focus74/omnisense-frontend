import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import WeatherBadge from '../components/WeatherBadge';
import DevicesMap from '../components/DevicesMap';
import { socket } from '../lib/socket';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export default function Home() {
  const [health, setHealth] = useState(null);
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    axios.get(`${API}/api/health`)
      .then(r => setHealth(!!r.data?.ok))
      .catch(() => setHealth(false));

    axios.get(`${API}/api/devices`)
      .then(r => setDevices(r.data || []))
      .catch(() => setDevices([]));

    // realtime: อัปเดตรายการอุปกรณ์ทันทีเมื่อ backend ส่ง device:update
    const onUpdate = (d) => {
      setDevices(prev => {
        const i = prev.findIndex(x => x.id === d.id);
        if (i === -1) return [...prev, d];
        const clone = prev.slice(); clone[i] = d; return clone;
      });
    };
    socket.on('device:update', onUpdate);
    return () => socket.off('device:update', onUpdate);
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">OmniSense — Dashboard</h1>

      <div className={`p-3 rounded ${health ? 'bg-green-100' : 'bg-red-100'}`}>
        Health: {String(!!health)}
      </div>

      <div className="rounded border p-3 bg-white">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold mb-2">อุปกรณ์ทั้งหมด</h2>
          <Link to="/map" className="text-blue-600 hover:underline text-sm">ดูแผนที่ทั้งหมด</Link>
        </div>

        <ul className="space-y-3">
          {devices.map(d => (
            <li key={d.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border-b last:border-b-0 pb-3">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  • <Link className="font-medium text-blue-600 hover:underline" to={`/devices/${d.id}`}>
                    {d.name}
                  </Link>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${d.isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                    {d.isOnline ? 'online' : 'offline'}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  id: {d.id} • lat: {d.lat} • lng: {d.lng}
                </div>
                {/* สรุปฝน 24 ชม. ต่ออุปกรณ์ (ไม่รวบภาพรวม) */}
                <div className="text-xs text-gray-500 mt-0.5">
                  <SmallRain24h id={d.id} />
                </div>

                {/* ปุ่มเข้าไปหน้ารายอุปกรณ์ชัด ๆ */}
                <div className="mt-1">
                  <Link
                    to={`/devices/${d.id}`}
                    className="inline-flex items-center text-sm px-3 py-1.5 rounded border hover:bg-gray-50"
                  >
                    ดูข้อมูลอุปกรณ์
                  </Link>
                </div>
              </div>

              {/* ป้ายสภาพอากาศสดของพิกัดอุปกรณ์ */}
              <div className="self-start md:self-auto">
                <WeatherBadge lat={d.lat} lng={d.lng} />
              </div>
            </li>
          ))}
          {devices.length === 0 && <li className="text-gray-500">ไม่มีอุปกรณ์</li>}
        </ul>

        {/* แผนที่รวมหมุดอุปกรณ์ทั้งหมด */}
        <div className="mt-4">
          <DevicesMap devices={devices} />
        </div>
      </div>
    </div>
  );
}

// คอมโพเนนต์เล็ก ๆ ดึง "ฝนรวม 24 ชม." ต่อท้ายชื่ออุปกรณ์ (ยังคงต่ออุปกรณ์ ไม่ใช่รวมทุกอุปกรณ์)
function SmallRain24h({ id }) {
  const [sum, setSum] = useState(null);
  useEffect(() => {
    axios.get(`${API}/api/devices/${id}/rain`, { params: { hours: 24 } })
      .then(r => {
        const total = (r.data || []).reduce((s, x) => s + Number(x.rainfall_mm || 0), 0);
        setSum(total);
      })
      .catch(() => setSum(null));
  }, [id]);
  return sum === null ? 'ฝน 24ชม: …' : `ฝน 24ชม: ${sum.toFixed(1)} mm`;
}

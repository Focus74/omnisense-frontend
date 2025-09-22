// src/pages/Home.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import WeatherBadge from '../components/WeatherBadge';
import DevicesMap from '../components/DevicesMap';
import { socket } from '../lib/socket';
import { api } from '../lib/api'; // ⬅️ ใช้ instance รวม (same-origin)

export default function Home() {
  const [health, setHealth] = useState(null);
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    // ✅ เรียกผ่าน /api/health (ให้ nginx ส่งต่อไป /health)
    api.get('/api/health')
      .then(r => setHealth(!!r.data?.ok))
      .catch(() => setHealth(false));

    // รายการอุปกรณ์
    api.get('/api/devices')
      .then(r => setDevices(r.data || []))
      .catch(() => setDevices([]));

    // realtime: อัปเดตเมื่อ backend ส่ง device:update
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
          <Link to="/map" className="text-blue-600 hover:underline text-sm">
            ดูแผนที่ทั้งหมด
          </Link>
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
              </div>

              <div className="text-right">
                <WeatherBadge lat={d.lat} lng={d.lng} />
              </div>
            </li>
          ))}

          {devices.length === 0 && (
            <li className="text-gray-500">ยังไม่มีอุปกรณ์</li>
          )}
        </ul>
      </div>

      <div className="rounded border p-3 bg-white">
        <h2 className="font-semibold mb-2">แผนที่</h2>
        <DevicesMap devices={devices} />
      </div>
    </div>
  );
}

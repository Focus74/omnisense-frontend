// src/pages/Device.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import WeatherBadge from "../components/WeatherBadge";
import RainChart from "../components/RainChart";
import { socket } from "../lib/socket";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const API = (import.meta.env.VITE_API_BASE ?? "");

const icon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function Device() {
  const { id } = useParams();          // /devices/:id
  const deviceId = Number(id);

  const [device, setDevice] = useState(null);
  const [rains, setRains] = useState([]);
  const [images, setImages] = useState([]);
  const [range, setRange] = useState(24); // 1 | 6 | 24 | 'today'

  const sumSelected = useMemo(
    () => rains.reduce((s, x) => s + (Number(x.rainfall_mm) || 0), 0),
    [rains]
  );
  const sum1h = useMemo(() => {
    const since = Date.now() - 60 * 60 * 1000;
    return rains
      .filter((x) => new Date(x.timestamp).getTime() >= since)
      .reduce((s, x) => s + (Number(x.rainfall_mm) || 0), 0);
  }, [rains]);
  const sumToday = useMemo(() => {
    const start = new Date(); start.setHours(0,0,0,0);
    return rains
      .filter((x) => new Date(x.timestamp) >= start)
      .reduce((s, x) => s + (Number(x.rainfall_mm) || 0), 0);
  }, [rains]);

  function currentCutoffDate() {
    if (range === "today") {
      const d = new Date(); d.setHours(0, 0, 0, 0);
      return d;
    }
    return new Date(Date.now() - Number(range) * 60 * 60 * 1000);
  }

  useEffect(() => {
    if (!deviceId) return;
    loadAll();
  }, [deviceId]);

  useEffect(() => {
    if (!deviceId) return;
    fetchRains(range);
  }, [range, deviceId]);

  useEffect(() => {
    if (!deviceId) return;
    const onRain = (payload) => {
      const cutoff = currentCutoffDate();
      if (payload?.deviceId === deviceId) {
        setRains((prev) => {
          const t = new Date(payload.timestamp);
          if (t < cutoff) return prev;
          return [...prev, { timestamp: payload.timestamp, rainfall_mm: payload.rainfall_mm }];
        });
      }
    };
    const onImage = (payload) => {
      if (payload?.deviceId === deviceId) {
        setImages((prev) => [{ id: payload.id, filePath: payload.filePath, timestamp: payload.timestamp, sizeKB: payload.sizeKB }, ...prev]);
      }
    };
    socket.on("rain:new", onRain);
    socket.on("image:new", onImage);
    return () => {
      socket.off("rain:new", onRain);
      socket.off("image:new", onImage);
    };
  }, [deviceId, range]);

  async function loadAll() {
    try {
      const [d, imgs] = await Promise.all([
        axios.get(`${API}/api/devices/${deviceId}`),
        axios.get(`${API}/api/devices/${deviceId}/images`),
      ]);
      setDevice(d.data || null);
      setImages(imgs.data || []);
    } catch (e) {
      console.error("loadDeviceAndImages error:", e);
      setDevice(null);
      setImages([]);
    }
  }

  async function fetchRains(r = range) {
    const params = r === "today" ? { today: true } : { hours: Number(r) || 24 };
    const res = await axios.get(`${API}/api/devices/${deviceId}/rain`, { params });
    setRains(res.data || []);
  }

  if (!device) return <div className="p-4">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{device.name}</h1>
          <div className="text-gray-600">
            id: {device.id} • device_id: {device.device_id} • lat: {device.lat} • lng: {device.lng} •{" "}
            <span className={device.isOnline ? "text-green-600" : "text-gray-600"}>{device.isOnline ? "online" : "offline"}</span>
          </div>
          <div className="mt-1">
            <WeatherBadge lat={device.lat} lng={device.lng} />
          </div>
        </div>

        <div className="flex gap-2">
          {["1", "6", "24", "today"].map((v) => (
            <button
              key={v}
              onClick={() => setRange(v === "today" ? "today" : Number(v))}
              className={`px-3 py-1 rounded border ${range === v || String(range) === v ? "bg-blue-600 text-white" : "bg-white"}`}
            >
              {v === "today" ? "วันนี้" : `${v} ชม.`}
            </button>
          ))}
        </div>
      </div>

      {/* แผนที่จุดนี้ */}
      <MapContainer center={[device.lat, device.lng]} zoom={15} className="h-72 rounded shadow">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[device.lat, device.lng]} icon={icon}>
          <Popup>
            <div className="font-semibold">{device.name}</div>
            <div className="text-sm text-gray-600">lat: {device.lat}, lng: {device.lng}</div>
            <div className="mt-1">
              <Link className="text-blue-600 underline" to="/map">ดูในแผนที่รวม</Link>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* กราฟฝน */}
      <div className="rounded border p-3 bg-white">
        <h2 className="font-semibold mb-2">ฝนช่วงที่เลือก</h2>
        <div className="text-sm text-gray-700 mb-2">
          1 ชม.: {sum1h.toFixed(2)} mm • วันนี้: {sumToday.toFixed(2)} mm • ช่วงที่เลือก: {sumSelected.toFixed(2)} mm
        </div>
        {/* ✅ ส่ง props ให้ถูกต้อง */}
        <RainChart rows={rains} />
      </div>

      {/* รูปภาพ */}
      <div className="rounded border p-3 bg-white">
        <h2 className="font-semibold mb-2">รูปภาพ</h2>
        {images.length === 0 ? (
          <div className="text-gray-500">ยังไม่มีรูป</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {images.map((img) => (
              <figure key={img.id} className="bg-white rounded shadow">
                <img
                  className="w-full aspect-square object-cover rounded"
                  src={`${API}/${img.filePath}`}
                  alt={img.timestamp}
                  loading="lazy"
                />
                <figcaption className="px-2 py-1 text-xs text-gray-600">
                  {new Date(img.timestamp).toLocaleString()} — {img.sizeKB ?? "–"} KB
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

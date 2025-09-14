// src/components/Device.jsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import WeatherBadge from "../components/WeatherBadge";
import RainChart from "../components/RainChart";
import { socket } from "../lib/socket";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const API = import.meta.env.VITE_API_BASE || "http://localhost:3000";

const icon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function Device({ id }) {
  const deviceId = Number(id);

  const [device, setDevice] = useState(null);
  const [rains, setRains] = useState([]);   // จุดข้อมูลฝน (โดยปกติ 24 ชม.)
  const [images, setImages] = useState([]);

  // ตัวเลือกช่วงเวลาแสดงผลกราฟ: 1 | 6 | 24 | 'today'
  const [range, setRange] = useState(24);

  // ===== สรุปตัวเลขฝน =====
  const sum24 = useMemo(
    () =>
      rains
        .filter((x) => Date.now() - new Date(x.timestamp).getTime() <= 24 * 3600 * 1000)
        .reduce((s, x) => s + (Number(x.rainfall_mm) || 0), 0),
    [rains]
  );

  const sum1h = useMemo(() => {
    const since = Date.now() - 1 * 3600 * 1000;
    return rains
      .filter((x) => new Date(x.timestamp).getTime() >= since)
      .reduce((s, x) => s + (Number(x.rainfall_mm) || 0), 0);
  }, [rains]);

  const sumToday = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return rains
      .filter((x) => new Date(x.timestamp) >= start)
      .reduce((s, x) => s + (Number(x.rainfall_mm) || 0), 0);
  }, [rains]);

  useEffect(() => {
    if (!deviceId) return;
    loadAll();          // โหลดข้อมูลเริ่มต้น
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  // โหลดฝนให้ตรงกับ range ทุกครั้งที่เปลี่ยนปุ่ม
  useEffect(() => {
    if (!deviceId) return;
    fetchRains(range);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, deviceId]);

  useEffect(() => {
    if (!deviceId) return;

    // ===== realtime: ฝนใหม่ / รูปใหม่ =====
    const onRain = (payload) => {
      if (payload?.deviceId === deviceId) {
        setRains((prev) => {
          const next = [payload.row, ...prev];
          return next.slice(0, 500); // กันล้น
        });
      }
    };

    const onImage = (payload) => {
      if (payload?.deviceId === deviceId) {
        setImages((prev) => [payload.row, ...prev]);
      }
    };

    socket.on("rain:new", onRain);
    socket.on("image:new", onImage);
    return () => {
      socket.off("rain:new", onRain);
      socket.off("image:new", onImage);
    };
  }, [deviceId]);

  async function loadAll() {
    try {
      const [d, imgs] = await Promise.all([
        axios.get(`${API}/api/devices/${deviceId}`),
        axios.get(`${API}/api/devices/${deviceId}/images`),
      ]);
      setDevice(d.data || null);
      setImages(imgs.data || []);
      // ฝนเริ่มต้น = 24 ชม.
      await fetchRains(24);
    } catch (e) {
      console.error("loadAll error", e);
      setDevice(null);
      setImages([]);
      setRains([]);
    }
  }

  async function fetchRains(r) {
    try {
      if (r === "today") {
        // ดึงเผื่อ 48 ชม. แล้วกรองตั้งแต่เที่ยงคืนวันนี้
        const rs = await axios.get(`${API}/api/devices/${deviceId}/rain`, {
          params: { hours: 48 },
        });
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const rows = (rs.data || []).filter((x) => new Date(x.timestamp) >= start);
        setRains(rows);
      } else {
        const rs = await axios.get(`${API}/api/devices/${deviceId}/rain`, {
          params: { hours: r || 24 },
        });
        setRains(rs.data || []);
      }
    } catch (e) {
      console.error("fetchRains error", e);
      setRains([]);
    }
  }

  if (!deviceId) {
    return <div className="p-4 text-red-600">ต้องระบุ device id ใน &lt;Device id="..." /&gt;</div>;
  }

  if (!device) {
    return <div className="p-4">กำลังโหลด / ไม่พบอุปกรณ์</div>;
  }

  const rangeLabel = range === "today" ? "วันนี้ (ตั้งแต่ 00:00)" : `${range} ชั่วโมง`;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{device.name}</h1>
          <div className="text-gray-600">
            id: {device.id} • lat: {device.lat}, lng: {device.lng} • online:{" "}
            {String(device.isOnline)}
          </div>
        </div>
      </div>

      {/* ป้ายอากาศ */}
      <div className="flex justify-end">
        <WeatherBadge lat={device.lat} lng={device.lng} />
      </div>

      {/* แผนที่ */}
      <div className="rounded border overflow-hidden">
        <MapContainer
          center={[device.lat, device.lng]}
          zoom={12}
          style={{ height: 300, width: "100%" }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[device.lat, device.lng]} icon={icon}>
            <Popup>
              <div className="space-y-1">
                <div className="font-semibold">{device.name}</div>
                <div className="text-xs text-gray-600">
                  lat {device.lat}, lng {device.lng}
                </div>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* กราฟฝน + ปุ่มช่วงเวลา + สรุป */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded border p-3 bg-white">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">ปริมาณฝน ({rangeLabel})</div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setRange(1)}
                className={`px-2 py-1 rounded border text-sm ${
                  range === 1
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                1 ชม.
              </button>
              <button
                onClick={() => setRange(6)}
                className={`px-2 py-1 rounded border text-sm ${
                  range === 6
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                6 ชม.
              </button>
              <button
                onClick={() => setRange(24)}
                className={`px-2 py-1 rounded border text-sm ${
                  range === 24
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                24 ชม.
              </button>
              <button
                onClick={() => setRange("today")}
                className={`px-2 py-1 rounded border text-sm ${
                  range === "today"
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                วันนี้
              </button>
            </div>
          </div>

          <RainChart rows={rains} />
        </div>

        <div className="rounded border p-3 bg-white">
          <div className="font-semibold mb-2">สรุปฝน</div>
          <div className="text-3xl font-bold">
            {sum24.toFixed(1)} <span className="text-base">มม.</span>
          </div>
          <div className="text-gray-600 mt-2 text-sm">รวมย้อนหลัง 24 ชั่วโมง</div>

          <div className="text-gray-700 mt-3 space-y-1 text-sm">
            <div>
              ย้อนหลัง 1 ชั่วโมง: <b>{sum1h.toFixed(1)} มม.</b>
            </div>
            <div>
              รวมวันนี้: <b>{sumToday.toFixed(1)} มม.</b>
            </div>
          </div>
        </div>
      </div>

      {/* รูปของอุปกรณ์นี้ */}
      <div className="rounded border p-3 bg-white">
        <div className="font-semibold mb-3">รูปจากอุปกรณ์นี้</div>
        {images.length === 0 ? (
          <div className="text-gray-500">ยังไม่มีภาพ</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((img) => (
              <figure key={img.id} className="border rounded overflow-hidden">
                <img
                  src={`${API}/${img.filePath}`}
                  alt={`img-${img.id}`}
                  className="w-full h-40 object-cover"
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

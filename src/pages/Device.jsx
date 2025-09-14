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

const API = import.meta.env.VITE_API_BASE || "http://localhost:3000";

const icon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function Device() {
  const { id } = useParams();              // /devices/:id
  const deviceId = Number(id);

  const [device, setDevice]   = useState(null);
  const [rains, setRains]     = useState([]);     // จุดข้อมูลฝนของ "ช่วงที่เลือก"
  const [images, setImages]   = useState([]);
  const [range, setRange]     = useState(24);     // 1 | 6 | 24 | 'today'

  // ===== สรุปจาก "ช่วงที่เลือก" =====
  const sumSelected = useMemo(
    () => rains.reduce((s, x) => s + (Number(x.rainfall_mm) || 0), 0),
    [rains]
  );

  // ยอด 1 ชั่วโมงล่าสุด (อิงจากข้อมูลที่โหลดมา)
  const sum1h = useMemo(() => {
    const since = Date.now() - 60 * 60 * 1000;
    return rains
      .filter((x) => new Date(x.timestamp).getTime() >= since)
      .reduce((s, x) => s + (Number(x.rainfall_mm) || 0), 0);
  }, [rains]);

  // ยอด "วันนี้" (ตั้งแต่ 00:00 – ตอนนี้) จากข้อมูลที่โหลดมา
  const sumToday = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return rains
      .filter((x) => new Date(x.timestamp) >= start)
      .reduce((s, x) => s + (Number(x.rainfall_mm) || 0), 0);
  }, [rains]);

  // ช่วยคำนวณ cutoff ของช่วงปัจจุบัน เพื่อใช้ filter ตอนรับ realtime
  function currentCutoffDate() {
    if (range === "today") {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d;
    }
    return new Date(Date.now() - Number(range) * 60 * 60 * 1000);
  }

  // แปลง range เป็นชั่วโมงเพื่อยิง API
  function hoursParamFromRange(rg) {
    if (rg === "today") {
      const sinceMidnightMs = Date.now() - new Date().setHours(0, 0, 0, 0);
      return Math.max(1, Math.ceil(sinceMidnightMs / 3600000)); // อย่างน้อย 1 ชม.
    }
    return Number(rg);
  }

  // โหลด device + images หนึ่งที และสมัคร socket
  useEffect(() => {
    loadDeviceAndImages();
    // ===== Realtime subscriptions =====
    const onRain = (payload) => {
      if (payload?.deviceId === deviceId) {
        const cutoff = currentCutoffDate().getTime();
        setRains((prev) => {
          const next = [payload.row, ...prev];
          // เก็บไม่เกิน 500 และกรองเฉพาะที่อยู่ในช่วงปัจจุบัน
          return next
            .filter((x) => new Date(x.timestamp).getTime() >= cutoff)
            .slice(0, 500);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, range]); // เปลี่ยน range จะทำให้ cutoff ใหม่มีผลกับ realtime append

  // โหลดข้อมูลฝนเมื่อ range เปลี่ยน
  useEffect(() => {
    fetchRains();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, range]);

  async function loadDeviceAndImages() {
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

  async function fetchRains() {
    try {
      const hours = hoursParamFromRange(range);
      const r = await axios.get(`${API}/api/devices/${deviceId}/rain`, {
        params: { hours },
      });
      setRains(r.data || []);
    } catch (e) {
      console.error("fetchRains error:", e);
      setRains([]);
    }
  }

  if (!device) {
    return (
      <div className="p-4">
        <div className="mb-4">
          <Link className="text-blue-600 underline" to="/">
            ← กลับ Dashboard
          </Link>
        </div>
        กำลังโหลด / ไม่พบอุปกรณ์
      </div>
    );
  }

  const rangeLabel =
    range === "today" ? "วันนี้ (ตั้งแต่ 00:00)" : `${range} ชั่วโมง`;

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
        <Link className="text-blue-600 underline" to="/">
          ← กลับ Dashboard
        </Link>
      </div>

      {/* ป้ายอากาศปัจจุบันของพิกัดนี้ */}
      <div className="flex justify-end">
        <WeatherBadge lat={device.lat} lng={device.lng} />
      </div>

      {/* แผนที่พิกัดอุปกรณ์ */}
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

      {/* กราฟฝน + ตัวเลือกช่วงเวลา + สรุป */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded border p-3 bg-white">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">ปริมาณฝน ({rangeLabel})</div>

            {/* ปุ่มเลือกช่วงเวลา */}
            <div className="flex gap-2 flex-wrap">
              {[
                { label: "1 ชม.", value: 1 },
                { label: "6 ชม.", value: 6 },
                { label: "24 ชม.", value: 24 },
                { label: "วันนี้", value: "today" },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setRange(opt.value)}
                  className={`px-2 py-1 rounded border text-sm ${
                    range === opt.value
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* กราฟ: ใช้ rows = rains (ช่วงที่เลือก) */}
          <RainChart rows={rains} />
        </div>

        <div className="rounded border p-3 bg-white">
          <div className="font-semibold mb-2">สรุปฝน</div>
          <div className="text-3xl font-bold">
            {sumSelected.toFixed(1)} <span className="text-base">มม.</span>
          </div>
          <div className="text-gray-600 mt-2 text-sm">
            รวมช่วงที่เลือก — {rangeLabel}
          </div>

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

      {/* รูปจากอุปกรณ์นี้เท่านั้น */}
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
                  {new Date(img.timestamp).toLocaleString()} —{" "}
                  {img.sizeKB ?? "–"} KB
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

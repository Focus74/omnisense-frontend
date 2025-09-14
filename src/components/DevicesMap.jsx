// src/components/DevicesMap.jsx
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";

// ไอคอนมาตรฐานของ Leaflet (กำหนดเองเพื่อกันปัญหารูปไม่ขึ้น)
const icon = new L.Icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
  shadowAnchor: [12, 41],
});

// คอมโพเนนต์ย่อย: ปรับมุมมองตามอุปกรณ์
function FitOnDevices({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;

    // อุปกรณ์เดียว → setView
    if (points.length === 1) {
      map.setView(points[0], 12); // ซูมเข้า 12
      return;
    }

    // หลายอุปกรณ์ → fitBounds
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [points, map]);

  return null;
}

export default function DevicesMap({ devices = [] }) {
  // เก็บเฉพาะอุปกรณ์ที่พิกัดเป็นตัวเลข
  const points = useMemo(
    () =>
      (devices || [])
        .filter(
          (d) =>
            Number.isFinite(d?.lat) &&
            Number.isFinite(d?.lng)
        )
        .map((d) => [d.lat, d.lng]),
    [devices]
  );

  const center = points.length ? points[0] : [13.7563, 100.5018]; // fallback: กรุงเทพฯ

  return (
    <div className="h-[420px] rounded border overflow-hidden">
      <MapContainer
        center={center}
        zoom={8}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* ปรับมุมมองอัตโนมัติให้พอดีกับตำแหน่งอุปกรณ์ */}
        <FitOnDevices points={points} />

        {(devices || []).map((d) => (
          <Marker
            key={d.id}
            position={[d.lat, d.lng]}
            icon={icon}
          >
            <Popup>
              <div className="space-y-1">
                <div className="font-semibold">{d.name}</div>
                <div className="text-xs text-gray-600">
                  lat {d.lat}, lng {d.lng}
                </div>
                <Link
                  className="underline text-blue-600 text-sm"
                  to={`/devices/${d.id}`}
                >
                  ไปหน้าอุปกรณ์
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

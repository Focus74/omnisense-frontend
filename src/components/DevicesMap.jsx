import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Link } from "react-router-dom";

const icon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function DevicesMap({ devices = [] }) {
  const center = devices.length ? [devices[0].lat, devices[0].lng] : [18.79, 98.98];
  return (
    <MapContainer center={center} zoom={devices.length ? 10 : 5} className="h-96 rounded shadow">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {devices.map((d) => (
        <Marker key={d.id} position={[d.lat, d.lng]} icon={icon}>
          <Popup>
            <div className="font-semibold">{d.name}</div>
            <div className="text-sm text-gray-600">lat: {d.lat}, lng: {d.lng}</div>
            <div className="mt-1">
              <Link className="text-blue-600 underline" to={`/devices/${d.id}`}>ดูรายละเอียด</Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

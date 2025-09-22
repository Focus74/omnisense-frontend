import { useEffect, useState } from "react";
import axios from "axios";
import DevicesMap from "../components/DevicesMap";

const API = (import.meta.env.VITE_API_BASE ?? "");

export default function MapPage() {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    axios.get(`${API}/api/devices`)
      .then(r => setDevices(r.data || []))
      .catch(() => setDevices([]));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">แผนที่ทั้งหมด</h1>
      <DevicesMap devices={devices} />
    </div>
  );
}

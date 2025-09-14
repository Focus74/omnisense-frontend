// D:/omnisense-frontend/src/components/WeatherBadge.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export default function WeatherBadge({ lat, lng }) {
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    let alive = true;
    axios
      .get(`${API}/api/weather`, { params: { lat, lng } })
      .then((res) => alive && setState({ loading: false, data: res.data }))
      .catch((err) => alive && setState({ loading: false, error: err.message }));
    return () => {
      alive = false;
    };
  }, [lat, lng]);

  if (state.loading) return <span className="text-gray-400">โหลดอากาศ…</span>;
  if (state.error) return <span className="text-red-500">อากาศ: ผิดพลาด</span>;

  const d = state.data || {};
  const temp = d?.main?.temp;
  const hum = d?.main?.humidity;
  const desc = d?.weather?.[0]?.description;
  const icon = d?.weather?.[0]?.icon;

  return (
    <div className="flex items-center gap-2 text-sm">
      {icon && (
        <img
          className="w-6 h-6"
          alt="wx"
          src={`https://openweathermap.org/img/wn/${icon}.png`}
        />
      )}
      <span>
        {desc || '—'} {typeof temp === 'number' ? `${temp.toFixed(1)}°C` : ''}
        {typeof hum === 'number' ? ` (RH ${hum}%)` : ''}
      </span>
    </div>
  );
}

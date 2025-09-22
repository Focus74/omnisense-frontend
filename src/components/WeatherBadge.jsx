// D:/omnisense-frontend/src/components/WeatherBadge.jsx
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

// แปลงข้อมูลให้เป็นรูปแบบเดียวกัน ไม่ว่าจะได้ "แบบย่อ" หรือ "แบบดิบ"
function normalizeWeather(data) {
  if (!data) return null;

  // แบบย่อ (ของเราเอง: temp, humidity, weather, icon, wind_speed)
  if (data.temp !== undefined || data.humidity !== undefined || typeof data.weather === 'string') {
    return {
      name: data.name ?? '',
      temp: data.temp ?? null,
      humidity: data.humidity ?? null,
      desc: typeof data.weather === 'string' ? data.weather : '',
      icon: data.icon ?? '',
      wind: data.wind_speed ?? null,
    };
  }

  // แบบดิบ (OpenWeather)
  return {
    name: data.name ?? '',
    temp: data.main?.temp ?? null,
    humidity: data.main?.humidity ?? null,
    desc: data.weather?.[0]?.description ?? '',
    icon: data.weather?.[0]?.icon ?? '',
    wind: data.wind?.speed ?? null,
  };
}

export default function WeatherBadge({ lat, lng }) {
  const [state, setState] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get('/api/weather', { params: { lat, lng } });
        if (!alive) return;
        setState({ loading: false, data: normalizeWeather(res.data), error: null });
      } catch (err) {
        if (!alive) return;
        setState({ loading: false, data: null, error: err?.message || 'fetch failed' });
      }
    })();
    return () => { alive = false; };
  }, [lat, lng]);

  if (state.loading) return <span className="text-gray-400">โหลดอากาศ…</span>;
  if (state.error) return <span className="text-red-500">อากาศ: ผิดพลาด</span>;

  const d = state.data || {};
  const hasTemp = typeof d.temp === 'number';
  const hasHum  = typeof d.humidity === 'number';

  return (
    <div className="flex items-center gap-2 text-sm">
      {d.icon ? (
        <img
          className="w-6 h-6"
          alt="wx"
          src={`https://openweathermap.org/img/wn/${d.icon}.png`}
          loading="lazy"
        />
      ) : null}
      <span>
        {d.desc || '—'} {hasTemp ? `${d.temp.toFixed(1)}°C` : ''}
        {hasHum ? ` (RH ${d.humidity}%)` : ''}
      </span>
    </div>
  );
}

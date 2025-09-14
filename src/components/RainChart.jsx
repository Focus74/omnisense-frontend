// src/components/RainChart.jsx
import { useMemo } from "react";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

/**
 * รองรับทั้ง props: rows และ items (เลือกอย่างใดอย่างหนึ่ง/หรือจะส่งทั้งคู่ก็ได้)
 * โครงสร้างข้อมูลแต่ละแถว: { timestamp: string|Date, rainfall_mm: number }
 */
export default function RainChart({ rows = [], items }) {
  const source = items ?? rows ?? [];

  const { labels, values } = useMemo(() => {
    // กราฟแสดงจากเก่า -> ใหม่ (อ่านง่าย)
    const rev = [...source].reverse();
    return {
      labels: rev.map((r) =>
        new Date(r.timestamp).toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
        })
      ),
      values: rev.map((r) => Number(r.rainfall_mm) || 0),
    };
  }, [source]);

  const data = {
    labels,
    datasets: [
      {
        label: "ฝน (มม.)",
        data: values,
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "มิลลิเมตร" },
      },
      x: {
        title: { display: true, text: "เวลา" },
        ticks: { autoSkip: true, maxTicksLimit: 10 },
      },
    },
  };

  return (
    <div style={{ height: 340 }}>
      <Bar data={data} options={options} />
    </div>
  );
}

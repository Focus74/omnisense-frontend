import React, { useEffect, useState } from "react";
import { api, API_BASE } from "../lib/api";

export default function Images() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.get("/api/devices/1/images")
      .then((r) => setRows(r.data))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Images (deviceId=1)</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {rows.map((x) => {
          const url = API_BASE + "/" + x.filePath;
          return (
            <figure key={x.id} className="bg-white rounded shadow p-2">
              <img
                className="w-full aspect-square object-cover rounded"
                src={url}
                alt={x.timestamp}
              />
              <figcaption className="text-xs text-gray-600 mt-1">
                {new Date(x.timestamp).toLocaleString()} — {x.sizeKB} KB
              </figcaption>
            </figure>
          );
        })}

        {rows.length === 0 && (
          <p className="text-gray-500">No images</p>
        )}
      </div>
    </div>
  );
}

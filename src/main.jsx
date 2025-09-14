// src/main.jsx (หรือไฟล์ entry ของคุณ)
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import "./index.css";
import "./lib/leafletFix";
import Home from "./pages/Home.jsx";
import MapPage from "./pages/MapPage.jsx"; // (ถ้ายังไม่มี เดี๋ยวเพิ่มทีหลัง)
import Device from "./pages/Device.jsx";   // ✅ หน้าใหม่: อุปกรณ์รายตัว

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <header className="p-4 border-b bg-white">
          <nav className="container mx-auto flex gap-4">
            <Link to="/" className="font-semibold">Dashboard</Link>
            <Link to="/map" className="font-semibold">Map</Link>
            {/* ❌ ตัด Images ออก */}
          </nav>
        </header>
        <main className="container mx-auto p-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/devices/:id" element={<Device />} /> {/* ✅ */}
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  </React.StrictMode>
);

// src/App.jsx
import { Routes, Route, Link, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import MapPage from "./pages/MapPage";
import Device from "./pages/Device";
import AdminLogin from "./pages/AdminLogin";
import AdminDevices from "./pages/AdminDevices";
import { auth } from "./lib/auth";

function Guard({ children }) {
  return auth.isAuthed() ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/" className="font-bold">OmniSense</Link>
          <nav className="text-sm flex items-center gap-3">
            <Link to="/" className="hover:underline">Dashboard</Link>
            <Link to="/map" className="hover:underline">Map</Link>
            <Link to="/admin/devices" className="hover:underline">Admin</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/devices/:id" element={<Device />} />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/devices" element={<Guard><AdminDevices /></Guard>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

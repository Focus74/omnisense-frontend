// src/lib/socket.js
import { io } from "socket.io-client";

// '' => ให้ socket.io ต่อไปที่ origin เดียวกับหน้าเว็บ
const BASE = (import.meta.env.VITE_API_BASE ?? "").trim();
export const socket = io(BASE || undefined, { transports: ["websocket"] });

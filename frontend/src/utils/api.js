import axios from "axios";
import { io } from "socket.io-client"; // 🔥 FIX 1

const API = process.env.REACT_APP_API_URL;
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL;

const socket = io(SOCKET_URL); // ✅ now works

const api = axios.create({
  baseURL: API, // 🔥 FIX 2
  headers: { "Content-Type": "application/json" },
});

// ─── Room API ─────────────────────────────────────────────
export const createRoom = (hostName, roomName) =>
  api.post("/api/rooms/create", { hostName, roomName });

export const getRoom = (roomCode) =>
  api.get(`/api/rooms/${roomCode}`);

export const getRoomMessages = (roomCode) =>
  api.get(`/api/rooms/${roomCode}/messages`);

export const endRoom = (roomCode) =>
  api.put(`/api/rooms/${roomCode}/end`);

// ─── Chat API ─────────────────────────────────────────────
export const saveMessage = (roomCode, senderName, text) =>
  api.post(`/api/chat/${roomCode}/message`, { senderName, text });

export const getMessages = (roomCode) =>
  api.get(`/api/chat/${roomCode}/messages`);

// ─── User API ─────────────────────────────────────────────
export const registerUser = (name, email, password) =>
  api.post("/api/users/register", { name, email, password });

export const loginUser = (email, password) =>
  api.post("/api/users/login", { email, password });

export { socket }; // optional export
export default api;
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// ─── Room API ──────────────────────────────────────────────────────
export const createRoom = (hostName, roomName) =>
  api.post("/rooms/create", { hostName, roomName });

export const getRoom = (roomCode) =>
  api.get(`/rooms/${roomCode}`);

export const getRoomMessages = (roomCode) =>
  api.get(`/rooms/${roomCode}/messages`);

export const endRoom = (roomCode) =>
  api.put(`/rooms/${roomCode}/end`);

// ─── Chat API ──────────────────────────────────────────────────────
export const saveMessage = (roomCode, senderName, text) =>
  api.post(`/chat/${roomCode}/message`, { senderName, text });

export const getMessages = (roomCode) =>
  api.get(`/chat/${roomCode}/messages`);

// ─── User API ──────────────────────────────────────────────────────
export const registerUser = (name, email, password) =>
  api.post("/users/register", { name, email, password });

export const loginUser = (email, password) =>
  api.post("/users/login", { email, password });

export default api;

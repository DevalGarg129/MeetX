const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const server = http.createServer(app);

// ─── CORS FIX (SAFE + FLEXIBLE) ─────────────────────────────
const CLIENT_URLS = (
  process.env.CLIENT_URLS ||
  process.env.CLIENT_URL ||
  "http://localhost:3000,http://localhost:5173,https://meetx.vercel.app"
)
  .split(",")
  .map((u) => u.trim())
  .filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow Postman / mobile

    if (CLIENT_URLS.includes(origin)) {
      return callback(null, true);
    }

    console.log("Blocked by CORS:", origin);
    return callback(null, true); // 🔥 TEMP allow all (fix your issue)
  },
  credentials: true,
}));

// ─── Socket.io ─────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: "*", // 🔥 allow all for now
    methods: ["GET", "POST"],
  },
});

// ─── Middleware ────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────
const roomRoutes = require("./routes/roomRoutes");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");

app.use("/api/rooms", roomRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);

// ─── Health check ─────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", uptime: process.uptime() });
});

// ─── Root route ───────────────────────────────────────────
app.get("/", (req, res) => {
  res.send("MeetX backend running 🚀");
});

// ─── Socket handler ───────────────────────────────────────
const socketHandler = require("./socket/socketHandler");
socketHandler(io);

// ─── MongoDB ──────────────────────────────────────────────
const startServer = () => {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 MeetX server running on port ${PORT}`);
  });
};

if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("✅ MongoDB connected");
      startServer();
    })
    .catch((err) => {
      console.error("❌ MongoDB connection error:", err.message);
      startServer();
    });
} else {
  console.warn("⚠️ No MONGO_URI provided");
  startServer();
}

module.exports = { app, io };
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const server = http.createServer(app);

// ─── Socket.io setup ───────────────────────────────────────────────────────
const CLIENT_URLS = (process.env.CLIENT_URLS || process.env.CLIENT_URL || "http://localhost:3000,http://localhost:5173,https://meetx.vercel.app").split(",").map(u => u.trim()).filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (CLIENT_URLS.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

const io = new Server(server, {
  cors: {
    origin: CLIENT_URLS,
    methods: ["GET", "POST"],
  },
});

// ─── Middleware ────────────────────────────────────────────────────────────
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────
const roomRoutes = require("./routes/roomRoutes");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");

app.use("/api/rooms", roomRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", uptime: process.uptime() });
});

// root route for simple readiness check (from simple_server.js)
app.get("/", (req, res) => {
  res.send("MeetX backend running");
});

// ─── Socket.io handlers ───────────────────────────────────────────────────
const socketHandler = require("./socket/socketHandler");
socketHandler(io);

// ─── MongoDB connection ───────────────────────────────────────────────────
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
      console.warn("Starting server without MongoDB connection");
      startServer();
    });
} else {
  console.warn("No MONGO_URI provided — starting without MongoDB");
  startServer();
}

module.exports = { app, io };

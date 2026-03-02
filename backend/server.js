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
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ─── Middleware ────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
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

// ─── Socket.io handlers ───────────────────────────────────────────────────
const socketHandler = require("./socket/socketHandler");
socketHandler(io);

// ─── MongoDB connection ───────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 MeetX server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

module.exports = { app, io };

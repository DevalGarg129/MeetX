const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

app.use(express.json());

app.use(
  cors({
    origin: ["http://localhost:5173", "https://meetx.vercel.app"],
    methods: ["GET", "POST"],
  })
);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://meetx.vercel.app"],
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  res.send("MeetX backend running");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`MeetX server running on port ${PORT}`);
});

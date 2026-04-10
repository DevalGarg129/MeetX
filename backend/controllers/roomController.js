const Room = require("../models/Room");
const redisClient = require("../config/redis");
const { v4: uuidv4 } = require("uuid");

// Generate short room code like "abc-xyz-123"
const generateRoomCode = () => {
  const seg = () => Math.random().toString(36).substr(2, 3);
  return `${seg()}-${seg()}-${seg()}`;
};

// POST /api/rooms/create
const createRoom = async (req, res) => {
  try {
    const { hostName, roomName } = req.body;
    if (!hostName) {
      return res.status(400).json({ message: "Host name is required" });
    }

    let roomCode = generateRoomCode();
    // Ensure uniqueness
    let exists = await Room.findOne({ roomCode });
    while (exists) {
      roomCode = generateRoomCode();
      exists = await Room.findOne({ roomCode });
    }

    const room = await Room.create({
      roomCode,
      roomName: roomName || `${hostName}'s Meeting`,
      hostName,
      isActive: true,
      messages: [
        {
          senderName: "System",
          text: `${hostName} created this room.`,
          type: "system",
        },
      ],
    });

    res.status(201).json({
      success: true,
      roomCode: room.roomCode,
      roomName: room.roomName,
      hostName: room.hostName,
      createdAt: room.createdAt,
    });
  } catch (err) {
    console.error("createRoom error:", err);
    res.status(500).json({ message: "Server error creating room" });
  }
};

// GET /api/rooms/:roomCode
const getRoom = async (req, res) => {
  const startTime = Date.now();

  const { roomCode } = req.params;
  const key = `room:${roomCode}`;

  try {
    // 1️⃣ Check Redis
    const cached = await redisClient.get(key);

    if (cached) {
      console.log("Cache HIT ⚡");
      return res.json({ success: true, ...JSON.parse(cached) });
    }

    // 2️⃣ Fetch from DB
    console.log("Cache MISS ❌");
    const room = await Room.findOne({ roomCode });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const responseData = {
      roomCode: room.roomCode,
      roomName: room.roomName,
      hostName: room.hostName,
      participantCount: room.participants.length,
      startedAt: room.startedAt,
    };

    // 3️⃣ Store in Redis (IMPORTANT)
    await redisClient.set(key, JSON.stringify(responseData), {
      EX: 60, // cache for 60 seconds
    });

    return res.json({ success: true, ...responseData });

  } catch (err) {
    console.error("getRoom error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/rooms/:roomCode/messages
const getRoomMessages = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const room = await Room.findOne({ roomCode });
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json({ success: true, messages: room.messages });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/rooms/:roomCode/end
const endRoom = async (req, res) => {
  try {
    const { roomCode } = req.params;
    await Room.findOneAndUpdate(
      { roomCode },
      { isActive: false, endedAt: new Date() }
    );
    res.json({ success: true, message: "Room ended" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { createRoom, getRoom, getRoomMessages, endRoom };

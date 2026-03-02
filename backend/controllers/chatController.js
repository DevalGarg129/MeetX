const Room = require("../models/Room");

// POST /api/chat/:roomCode/message
const saveMessage = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { senderName, text } = req.body;

    if (!senderName || !text) {
      return res.status(400).json({ message: "Sender and text are required" });
    }

    const room = await Room.findOneAndUpdate(
      { roomCode },
      {
        $push: {
          messages: { senderName, text, type: "text", sentAt: new Date() },
        },
      },
      { new: true }
    );

    if (!room) return res.status(404).json({ message: "Room not found" });

    const savedMsg = room.messages[room.messages.length - 1];
    res.status(201).json({ success: true, message: savedMsg });
  } catch (err) {
    res.status(500).json({ message: "Server error saving message" });
  }
};

// GET /api/chat/:roomCode/messages
const getMessages = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const room = await Room.findOne({ roomCode });
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json({ success: true, messages: room.messages });
  } catch (err) {
    res.status(500).json({ message: "Server error fetching messages" });
  }
};

module.exports = { saveMessage, getMessages };

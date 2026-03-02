const Room = require("../models/Room");

// In-memory map of active rooms: roomCode -> [{ socketId, name, micOn, camOn, handRaised }]
const activeRooms = new Map();

const socketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ─────────────────────────────────────────────────
    // FEATURE 1: Lobby — user can check who's in the room
    // ─────────────────────────────────────────────────
    socket.on("lobby:check", ({ roomCode }) => {
      const participants = activeRooms.get(roomCode) || [];
      socket.emit("lobby:info", {
        participantCount: participants.length,
        participants: participants.map((p) => ({ name: p.name })),
      });
    });

    // ─────────────────────────────────────────────────
    // JOIN ROOM
    // ─────────────────────────────────────────────────
    socket.on("room:join", async ({ roomCode, userName, micOn, camOn }) => {
      socket.join(roomCode);
      socket.data.roomCode = roomCode;
      socket.data.userName = userName;

      // Track participant in memory
      if (!activeRooms.has(roomCode)) activeRooms.set(roomCode, []);
      const room = activeRooms.get(roomCode);

      const participant = {
        socketId: socket.id,
        name: userName,
        micOn: micOn !== false,
        camOn: camOn !== false,
        handRaised: false,
      };
      room.push(participant);

      // Notify others of the new user joining
      socket.to(roomCode).emit("room:user-joined", {
        socketId: socket.id,
        name: userName,
        micOn: participant.micOn,
        camOn: participant.camOn,
      });

      // Send the new user the full participant list (excluding themselves)
      const others = room.filter((p) => p.socketId !== socket.id);
      socket.emit("room:existing-participants", { participants: others });

      // Persist to DB
      try {
        await Room.findOneAndUpdate(
          { roomCode },
          {
            $push: {
              participants: { socketId: socket.id, name: userName },
              messages: {
                senderName: "System",
                text: `${userName} joined the meeting.`,
                type: "system",
              },
            },
          }
        );
      } catch (e) {
        console.error("DB join error:", e.message);
      }

      // Broadcast system message to room
      io.to(roomCode).emit("chat:system", {
        text: `${userName} joined the meeting.`,
      });

      console.log(`👤 ${userName} joined room ${roomCode}`);
    });

    // ─────────────────────────────────────────────────
    // WebRTC SIGNALING — offer / answer / ice-candidate
    // ─────────────────────────────────────────────────
    socket.on("webrtc:offer", ({ offer, targetSocketId }) => {
      io.to(targetSocketId).emit("webrtc:offer", {
        offer,
        fromSocketId: socket.id,
        fromName: socket.data.userName,
      });
    });

    socket.on("webrtc:answer", ({ answer, targetSocketId }) => {
      io.to(targetSocketId).emit("webrtc:answer", {
        answer,
        fromSocketId: socket.id,
      });
    });

    socket.on("webrtc:ice-candidate", ({ candidate, targetSocketId }) => {
      io.to(targetSocketId).emit("webrtc:ice-candidate", {
        candidate,
        fromSocketId: socket.id,
      });
    });

    // ─────────────────────────────────────────────────
    // FEATURE 2: CHAT — real-time messages + persist to DB
    // ─────────────────────────────────────────────────
    socket.on("chat:message", async ({ roomCode, senderName, text }) => {
      if (!text || !text.trim()) return;

      const messagePayload = {
        senderName,
        text: text.trim(),
        sentAt: new Date().toISOString(),
      };

      // Broadcast to all in room
      io.to(roomCode).emit("chat:message", messagePayload);

      // Persist to MongoDB
      try {
        await Room.findOneAndUpdate(
          { roomCode },
          {
            $push: {
              messages: { senderName, text: text.trim(), type: "text" },
            },
          }
        );
      } catch (e) {
        console.error("Chat persist error:", e.message);
      }
    });

    // ─────────────────────────────────────────────────
    // MIC / CAM TOGGLE — broadcast state changes
    // ─────────────────────────────────────────────────
    socket.on("media:toggle-mic", ({ roomCode, micOn }) => {
      const room = activeRooms.get(roomCode) || [];
      const p = room.find((x) => x.socketId === socket.id);
      if (p) p.micOn = micOn;
      socket.to(roomCode).emit("media:user-toggled-mic", {
        socketId: socket.id,
        micOn,
      });
    });

    socket.on("media:toggle-cam", ({ roomCode, camOn }) => {
      const room = activeRooms.get(roomCode) || [];
      const p = room.find((x) => x.socketId === socket.id);
      if (p) p.camOn = camOn;
      socket.to(roomCode).emit("media:user-toggled-cam", {
        socketId: socket.id,
        camOn,
      });
    });

    // ─────────────────────────────────────────────────
    // FEATURE 3: SCREEN SHARE — notify peers
    // ─────────────────────────────────────────────────
    socket.on("screenshare:start", ({ roomCode }) => {
      socket.to(roomCode).emit("screenshare:started", {
        socketId: socket.id,
        name: socket.data.userName,
      });
      io.to(roomCode).emit("chat:system", {
        text: `${socket.data.userName} started screen sharing.`,
      });
    });

    socket.on("screenshare:stop", ({ roomCode }) => {
      socket.to(roomCode).emit("screenshare:stopped", {
        socketId: socket.id,
      });
      io.to(roomCode).emit("chat:system", {
        text: `${socket.data.userName} stopped screen sharing.`,
      });
    });

    // ─────────────────────────────────────────────────
    // FEATURE 4: REACTIONS + RAISE HAND
    // ─────────────────────────────────────────────────
    socket.on("reaction:send", async ({ roomCode, emoji }) => {
      io.to(roomCode).emit("reaction:received", {
        socketId: socket.id,
        name: socket.data.userName,
        emoji,
      });

      // Persist reaction
      try {
        await Room.findOneAndUpdate(
          { roomCode },
          {
            $push: {
              reactions: {
                senderName: socket.data.userName,
                emoji,
              },
            },
          }
        );
      } catch (e) {
        console.error("Reaction persist error:", e.message);
      }
    });

    socket.on("hand:raise", ({ roomCode, raised }) => {
      const room = activeRooms.get(roomCode) || [];
      const p = room.find((x) => x.socketId === socket.id);
      if (p) p.handRaised = raised;

      io.to(roomCode).emit("hand:changed", {
        socketId: socket.id,
        name: socket.data.userName,
        raised,
      });
    });

    // ─────────────────────────────────────────────────
    // FEATURE 5: AUDIO LEVEL — broadcast speaking status
    // ─────────────────────────────────────────────────
    socket.on("audio:speaking", ({ roomCode, isSpeaking }) => {
      socket.to(roomCode).emit("audio:user-speaking", {
        socketId: socket.id,
        isSpeaking,
      });
    });

    // ─────────────────────────────────────────────────
    // DISCONNECT
    // ─────────────────────────────────────────────────
    socket.on("disconnecting", () => {
      const roomCode = socket.data.roomCode;
      const userName = socket.data.userName;
      if (!roomCode) return;

      // Remove from in-memory map
      if (activeRooms.has(roomCode)) {
        const updated = activeRooms
          .get(roomCode)
          .filter((p) => p.socketId !== socket.id);
        if (updated.length === 0) {
          activeRooms.delete(roomCode);
        } else {
          activeRooms.set(roomCode, updated);
        }
      }

      // Notify others
      socket.to(roomCode).emit("room:user-left", {
        socketId: socket.id,
        name: userName,
      });

      io.to(roomCode).emit("chat:system", {
        text: `${userName} left the meeting.`,
      });
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = socketHandler;

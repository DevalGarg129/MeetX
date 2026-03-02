const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: false,
    },
    roomName: {
      type: String,
      default: "MeetX Room",
      trim: true,
      maxlength: 80,
    },
    hostName: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Feature: Participants tracking
    participants: [
      {
        socketId: String,
        name: String,
        joinedAt: { type: Date, default: Date.now },
        micOn: { type: Boolean, default: true },
        camOn: { type: Boolean, default: true },
        handRaised: { type: Boolean, default: false },
      },
    ],
    // Feature: Chat messages persisted to DB
    messages: [
      {
        senderName: String,
        text: String,
        sentAt: { type: Date, default: Date.now },
        type: { type: String, enum: ["text", "system"], default: "text" },
      },
    ],
    // Feature: Reactions log
    reactions: [
      {
        senderName: String,
        emoji: String,
        sentAt: { type: Date, default: Date.now },
      },
    ],
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);

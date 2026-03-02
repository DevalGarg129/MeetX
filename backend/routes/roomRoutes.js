const express = require("express");
const router = express.Router();
const {
  createRoom,
  getRoom,
  getRoomMessages,
  endRoom,
} = require("../controllers/roomController");

router.post("/create", createRoom);
router.get("/:roomCode", getRoom);
router.get("/:roomCode/messages", getRoomMessages);
router.put("/:roomCode/end", endRoom);

module.exports = router;

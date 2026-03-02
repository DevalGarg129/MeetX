const express = require("express");
const router = express.Router();
const { saveMessage, getMessages } = require("../controllers/chatController");

router.post("/:roomCode/message", saveMessage);
router.get("/:roomCode/messages", getMessages);

module.exports = router;

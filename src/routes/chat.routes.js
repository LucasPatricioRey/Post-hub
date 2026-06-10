const express = require("express");
const { getRecentChatMessages } = require("../controllers/chat.controller");

const router = express.Router();

router.get("/messages", getRecentChatMessages);

module.exports = router;
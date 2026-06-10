const ChatMessage = require("../models/ChatMessage");
const asyncHandler = require("../utils/asyncHandler");

const getRecentChatMessages = asyncHandler(async (req, res) => {
  const limit = 50;
  
  const messages = await ChatMessage.find()
    .populate("autor", "nombre email rol")
    .sort({ createdAt: -1 })
    .limit(limit);
    
  res.status(200).json({
    message: "Mensajes de chat obtenidos correctamente",
    total: messages.length,
    messages: messages.reverse(),
  });
});

module.exports = {
  getRecentChatMessages,
};
const asyncHandler = require("../utils/asyncHandler");
const chatService = require("../services/chat.service");

const getRecentChatMessages = asyncHandler(async (req, res) => {
  const messages = await chatService.getRecentMessages(50);

  res.status(200).json({
    message: "Mensajes de chat obtenidos correctamente",
    total: messages.length,
    messages,
  });
});

module.exports = {
  getRecentChatMessages,
};

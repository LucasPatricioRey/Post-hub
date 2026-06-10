const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ChatMessage = require("../models/ChatMessage");

const getTokenFromSocket = (socket) => {
  const authToken = socket.handshake.auth?.token;

  if (authToken) {
    return authToken;
  }

  const authorizationHeader = socket.handshake.headers?.authorization;

  if (
    authorizationHeader &&
    authorizationHeader.startsWith("Bearer ")
  ) {
    return authorizationHeader.split(" ")[1];
  }

  return null;
};

const configureSockets = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = getTokenFromSocket(socket);

      if (!token) {
        return next(new Error("No autorizado, falta token"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return next(new Error("No autorizado, usuario no encontrado"));
      }

      socket.user = user;

      return next();
    } catch (error) {
      return next(new Error("No autorizado, token inválido"));
    }
  });

  io.on("connection", (socket) => {
    console.log(
      `Usuario conectado por WebSocket: ${socket.user.nombre} (${socket.id})`
    );

    socket.on("chat:sendMessage", async (data) => {
      try {
        const contenido = data?.contenido?.trim();

        if (!contenido) {
          socket.emit("chat:error", {
            message: "El mensaje no puede estar vacío",
          });
          return;
        }

        if (contenido.length > 300) {
          socket.emit("chat:error", {
            message: "El mensaje no puede superar los 300 caracteres",
          });
          return;
        }

        const savedMessage = await ChatMessage.create({
          contenido,
          autor: socket.user._id,
          nombreAutor: socket.user.nombre,
        });

        const populatedMessage = await savedMessage.populate(
          "autor",
          "nombre email rol"
        );

        io.emit("chat:newMessage", populatedMessage);
      } catch (error) {
        socket.emit("chat:error", {
          message: "No se pudo enviar el mensaje",
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(
        `Usuario desconectado de WebSocket: ${socket.user.nombre} (${socket.id})`
      );
    });
  });

  return io;
};

module.exports = configureSockets;
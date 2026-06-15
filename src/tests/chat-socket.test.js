const http = require("http");
const { expect } = require("chai");
const { io: Client } = require("socket.io-client");

const app = require("../app");
const configureSockets = require("../sockets");
const ChatMessage = require("../models/ChatMessage");

const {
  registerUser,
} = require("./helpers/api");

let httpServer;
let ioServer;
let clientSocket;

const getServerUrl = () => {
  const address = httpServer.address();
  return `http://localhost:${address.port}`;
};

const connectSocketWithToken = (token) => {
  return new Promise((resolve, reject) => {
    const socket = Client(getServerUrl(), {
      auth: {
        token,
      },
      transports: ["websocket"],
      forceNew: true,
      reconnection: false,
    });

    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error("El socket no se conectó a tiempo"));
    }, 2000);

    socket.once("connect", () => {
      clearTimeout(timeout);
      resolve(socket);
    });

    socket.once("connect_error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
};

const waitForSocketEvent = (socket, eventName) => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`No llegó el evento ${eventName}`));
    }, 2000);

    socket.once(eventName, (payload) => {
      clearTimeout(timeout);
      resolve(payload);
    });
  });
};

const waitForConnectionError = (socket) => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error("No llegó el error de conexión"));
    }, 2000);

    socket.once("connect_error", (error) => {
      clearTimeout(timeout);
      resolve(error);
    });

    socket.once("connect", () => {
      clearTimeout(timeout);
      socket.disconnect();
      reject(new Error("El socket no debería conectarse sin token"));
    });
  });
};

describe("Chat por WebSocket", function () {
  beforeEach(function (done) {
    httpServer = http.createServer(app);
    ioServer = configureSockets(httpServer);

    httpServer.listen(() => {
      done();
    });
  });

  afterEach(async function () {
    if (clientSocket) {
      clientSocket.disconnect();
      clientSocket = null;
    }

    if (ioServer) {
      await new Promise((resolve) => {
        ioServer.close(() => resolve());
      });

      ioServer = null;
    }

    if (httpServer && httpServer.listening) {
      await new Promise((resolve) => {
        httpServer.close(() => resolve());
      });
    }

    httpServer = null;
  });

  it("debe permitir que un usuario autenticado envíe un mensaje de chat", async function () {
    const { token } = await registerUser({
      nombre: "Usuario Socket",
      email: "socket@test.com",
    });

    clientSocket = await connectSocketWithToken(token);

    const newMessagePromise = waitForSocketEvent(
      clientSocket,
      "chat:newMessage"
    );

    clientSocket.emit("chat:sendMessage", {
      contenido: "Hola desde Socket.IO",
    });

    const newMessage = await newMessagePromise;

    expect(newMessage).to.have.property("contenido", "Hola desde Socket.IO");
    expect(newMessage).to.have.property("nombreAutor", "Usuario Socket");
    expect(newMessage).to.have.property("autor");
    expect(newMessage.autor).to.have.property("email", "socket@test.com");

    const messagesInDB = await ChatMessage.find();

    expect(messagesInDB).to.have.lengthOf(1);
    expect(messagesInDB[0].contenido).to.equal("Hola desde Socket.IO");
  });

  it("debe rechazar mensajes vacíos", async function () {
    const { token } = await registerUser({
      nombre: "Usuario Mensaje Vacio",
      email: "vacio@test.com",
    });

    clientSocket = await connectSocketWithToken(token);

    const errorPromise = waitForSocketEvent(clientSocket, "chat:error");

    clientSocket.emit("chat:sendMessage", {
      contenido: "     ",
    });

    const error = await errorPromise;

    expect(error).to.have.property("message", "El mensaje no puede estar vacío");

    const totalMessages = await ChatMessage.countDocuments();

    expect(totalMessages).to.equal(0);
  });

  it("debe rechazar la conexión si no se envía token", async function () {
    const socketSinToken = Client(getServerUrl(), {
      transports: ["websocket"],
      forceNew: true,
      reconnection: false,
    });

    const error = await waitForConnectionError(socketSinToken);

    expect(error.message).to.equal("No autorizado, falta token");

    socketSinToken.disconnect();
  });
});
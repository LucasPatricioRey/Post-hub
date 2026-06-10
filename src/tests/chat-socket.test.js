const http = require("http");
const request = require("supertest");
const { io: Client } = require("socket.io-client");

const app = require("../app");
const configureSockets = require("../sockets");
const ChatMessage = require("../models/ChatMessage");

let httpServer;
let ioServer;
let clientSocket;

const crearUsuarioYObtenerToken = async (datosUsuario) => {
  const response = await request(app)
    .post("/api/auth/register")
    .send(datosUsuario);

  return response.body.token;
};

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

beforeEach((done) => {
  httpServer = http.createServer(app);
  ioServer = configureSockets(httpServer);

  httpServer.listen(() => {
    done();
  });
});

afterEach((done) => {
  if (clientSocket) {
    clientSocket.disconnect();
    clientSocket = null;
  }

  if (ioServer) {
    ioServer.close();
    ioServer = null;
  }

  if (httpServer && httpServer.listening) {
    httpServer.close(done);
  } else {
    done();
  }
});

describe("Chat por WebSocket", () => {
  test("debe permitir que un usuario autenticado envíe un mensaje de chat", async () => {
    const token = await crearUsuarioYObtenerToken({
      nombre: "Usuario Socket",
      email: "socket@test.com",
      password: "123456",
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

    expect(newMessage).toHaveProperty("contenido", "Hola desde Socket.IO");
    expect(newMessage).toHaveProperty("nombreAutor", "Usuario Socket");
    expect(newMessage).toHaveProperty("autor");
    expect(newMessage.autor).toHaveProperty("email", "socket@test.com");

    const messagesInDB = await ChatMessage.find();

    expect(messagesInDB.length).toBe(1);
    expect(messagesInDB[0]).toHaveProperty(
      "contenido",
      "Hola desde Socket.IO"
    );
  });

  test("debe rechazar mensajes vacíos", async () => {
    const token = await crearUsuarioYObtenerToken({
      nombre: "Usuario Mensaje Vacio",
      email: "vacio@test.com",
      password: "123456",
    });

    clientSocket = await connectSocketWithToken(token);

    const errorPromise = waitForSocketEvent(clientSocket, "chat:error");

    clientSocket.emit("chat:sendMessage", {
      contenido: "     ",
    });

    const error = await errorPromise;

    expect(error).toHaveProperty("message", "El mensaje no puede estar vacío");

    const totalMessages = await ChatMessage.countDocuments();

    expect(totalMessages).toBe(0);
  });

  test("debe rechazar la conexión si no se envía token", async () => {
    const socketSinToken = Client(getServerUrl(), {
      transports: ["websocket"],
      forceNew: true,
      reconnection: false,
    });

    const error = await waitForConnectionError(socketSinToken);

    expect(error.message).toBe("No autorizado, falta token");

    socketSinToken.disconnect();
  });
});
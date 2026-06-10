const request = require("supertest");
const app = require("../app");
const ChatMessage = require("../models/ChatMessage");

const crearUsuarioYObtenerDatos = async (datosUsuario) => {
  const response = await request(app)
    .post("/api/auth/register")
    .send(datosUsuario);

  return {
    token: response.body.token,
    user: response.body.user,
  };
};

describe("Chat endpoints", () => {
  test("GET /api/chat/messages debe devolver un historial público de mensajes", async () => {
    const { user } = await crearUsuarioYObtenerDatos({
      nombre: "Usuario Chat",
      email: "chat@test.com",
      password: "123456",
    });

    await ChatMessage.create({
      contenido: "Hola comunidad",
      autor: user.id,
      nombreAutor: user.nombre,
    });

    const response = await request(app).get("/api/chat/messages");

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("message");
    expect(response.body).toHaveProperty("messages");

    expect(Array.isArray(response.body.messages)).toBe(true);
    expect(response.body.messages.length).toBe(1);

    expect(response.body.messages[0]).toHaveProperty(
      "contenido",
      "Hola comunidad"
    );

    expect(response.body.messages[0]).toHaveProperty("autor");
    expect(response.body.messages[0]).toHaveProperty(
      "nombreAutor",
      "Usuario Chat"
    );
  });

  test("GET /api/chat/messages debe devolver como máximo 50 mensajes", async () => {
    const { user } = await crearUsuarioYObtenerDatos({
      nombre: "Usuario Limite",
      email: "limite@test.com",
      password: "123456",
    });

    const mensajes = [];

    for (let i = 1; i <= 55; i += 1) {
      mensajes.push({
        contenido: `Mensaje ${i}`,
        autor: user.id,
        nombreAutor: user.nombre,
      });
    }

    await ChatMessage.insertMany(mensajes);

    const response = await request(app).get("/api/chat/messages");

    expect(response.statusCode).toBe(200);
    expect(response.body.messages.length).toBe(50);
  });
});
const request = require("supertest");
const { expect } = require("chai");

const app = require("../app");
const ChatMessage = require("../models/ChatMessage");

const {
  registerUser,
} = require("./helpers/api");

describe("Chat HTTP endpoints", function () {
  it("GET /api/chat/messages debe devolver historial público de mensajes", async function () {
    const { user } = await registerUser({
      nombre: "Usuario Chat",
      email: "chat@test.com",
    });

    await ChatMessage.create({
      contenido: "Hola comunidad",
      autor: user.id,
      nombreAutor: user.nombre,
    });

    const response = await request(app).get("/api/chat/messages");

    expect(response.status).to.equal(200);
    expect(response.body).to.have.property("message");
    expect(response.body).to.have.property("messages");

    expect(response.body.messages).to.be.an("array");
    expect(response.body.messages).to.have.lengthOf(1);
    expect(response.body.messages[0].contenido).to.equal("Hola comunidad");
    expect(response.body.messages[0].nombreAutor).to.equal("Usuario Chat");
  });

  it("GET /api/chat/messages debe devolver como máximo 50 mensajes", async function () {
    const { user } = await registerUser({
      nombre: "Usuario Limite",
      email: "limite@test.com",
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

    expect(response.status).to.equal(200);
    expect(response.body.messages).to.have.lengthOf(50);
  });
});
const request = require("supertest");
const { expect } = require("chai");

const app = require("../app");

const {
  registerUser,
} = require("./helpers/api");

describe("Validaciones del backend", function () {
  it("POST /api/auth/register debe rechazar un email inválido", async function () {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        nombre: "Usuario Test",
        email: "email-invalido",
        password: "123456",
      });

    expect(response.status).to.equal(400);
    expect(response.body).to.have.property("message");
    expect(response.body.message).to.match(/email/i);
  });

  it("POST /api/auth/register debe rechazar una contraseña corta", async function () {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        nombre: "Usuario Test",
        email: "password@test.com",
        password: "123",
      });

    expect(response.status).to.equal(400);
    expect(response.body).to.have.property("message");
    expect(response.body.message).to.match(/contraseña/i);
  });

  it("POST /api/posts debe rechazar un título demasiado corto", async function () {
    const { token } = await registerUser();

    const response = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        titulo: "Hi",
        contenido: "Este contenido sí tiene más de diez caracteres.",
      });

    expect(response.status).to.equal(400);
    expect(response.body).to.have.property("message");
    expect(response.body.message).to.match(/título|titulo/i);
  });

  it("POST /api/posts debe rechazar contenido demasiado corto", async function () {
    const { token } = await registerUser();

    const response = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        titulo: "Título válido",
        contenido: "Corto",
      });

    expect(response.status).to.equal(400);
    expect(response.body).to.have.property("message");
    expect(response.body.message).to.match(/contenido/i);
  });

  it("GET /api/posts/:id debe rechazar un ID inválido", async function () {
    const response = await request(app).get("/api/posts/123");

    expect(response.status).to.equal(400);
    expect(response.body).to.have.property("message");
    expect(response.body.message).to.match(/id.*inv[aá]lido/i);
  });
});
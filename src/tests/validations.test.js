const request = require("supertest");
const app = require("../app");

const crearUsuarioYObtenerToken = async () => {
  const response = await request(app)
    .post("/api/auth/register")
    .send({
      nombre: "Usuario Validaciones",
      email: "validaciones@test.com",
      password: "123456",
    });

  return response.body.token;
};

describe("Validaciones del backend", () => {
  test("POST /api/auth/register debe rechazar un email inválido", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        nombre: "Usuario Test",
        email: "email-invalido",
        password: "123456",
      });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toMatch(/email v[aá]lido/i);
  });

  test("POST /api/auth/register debe rechazar una contraseña corta", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        nombre: "Usuario Test",
        email: "password@test.com",
        password: "123",
      });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toMatch(/contraseña/i);
  });

  test("POST /api/auth/register debe rechazar un email duplicado", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        nombre: "Usuario Original",
        email: "duplicado@test.com",
        password: "123456",
      });

    const response = await request(app)
      .post("/api/auth/register")
      .send({
        nombre: "Usuario Repetido",
        email: "duplicado@test.com",
        password: "123456",
      });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toMatch(/registrado|existe|duplicado/i);
  });

  test("POST /api/posts debe rechazar un título demasiado corto", async () => {
    const token = await crearUsuarioYObtenerToken();

    const response = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        titulo: "Hi",
        contenido: "Este contenido sí tiene más de diez caracteres.",
      });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toMatch(/título|titulo/i);
  });

  test("POST /api/posts debe rechazar contenido demasiado corto", async () => {
    const token = await crearUsuarioYObtenerToken();

    const response = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        titulo: "Título válido",
        contenido: "Corto",
      });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toMatch(/contenido/i);
  });

  test("GET /api/posts/:id debe rechazar un ID inválido", async () => {
    const response = await request(app).get("/api/posts/123");

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toMatch(/id.*inv[aá]lido/i);
  });
});
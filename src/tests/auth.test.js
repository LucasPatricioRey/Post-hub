const request = require("supertest");
const app = require("../app");

describe("Auth endpoints", () => {
  test("POST /api/auth/register debe registrar un usuario", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        nombre: "Usuario Test",
        email: "test@test.com",
        password: "123456",
      });

    expect(response.statusCode).toBe(201);

    expect(response.body).toHaveProperty("message");
    expect(response.body).toHaveProperty("user");
    expect(response.body).toHaveProperty("token");

    expect(response.body.user).toHaveProperty("nombre", "Usuario Test");
    expect(response.body.user).toHaveProperty("email", "test@test.com");
    expect(response.body.user).toHaveProperty("rol", "user");
    expect(response.body.user).not.toHaveProperty("password");
  });

  test("POST /api/auth/login debe iniciar sesión con credenciales correctas", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        nombre: "Usuario Login",
        email: "login@test.com",
        password: "123456",
      });

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "login@test.com",
        password: "123456",
      });

    expect(response.statusCode).toBe(200);

    expect(response.body).toHaveProperty("message");
    expect(response.body).toHaveProperty("user");
    expect(response.body).toHaveProperty("token");

    expect(response.body.user).toHaveProperty("email", "login@test.com");
    expect(response.body.user).toHaveProperty("rol", "user");
    expect(response.body.user).not.toHaveProperty("password");
  });
});
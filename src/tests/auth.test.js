const request = require("supertest");
const { expect } = require("chai");

const app = require("../app");
const User = require("../models/User");

const { fakeUser } = require("./helpers/testData");
const { registerUser } = require("./helpers/api");

describe("Auth endpoints", function () {
  it("POST /api/auth/register debe registrar un usuario", async function () {
    const data = fakeUser({
      nombre: "Usuario Test",
      email: "usuario-test@test.com",
    });

    const response = await request(app)
      .post("/api/auth/register")
      .send(data);

    expect(response.status).to.equal(201);
    expect(response.body).to.have.property("message");
    expect(response.body).to.have.property("user");
    expect(response.body).to.have.property("token");

    expect(response.body.user.nombre).to.equal(data.nombre);
    expect(response.body.user.email).to.equal(data.email);
    expect(response.body.user.rol).to.equal("user");
    expect(response.body.user).to.not.have.property("password");
  });

  it("POST /api/auth/register debe guardar la contraseña hasheada", async function () {
    const data = fakeUser({
      email: "password-hash@test.com",
      password: "123456",
    });

    await request(app)
      .post("/api/auth/register")
      .send(data);

    const userInDB = await User.findOne({ email: data.email }).select("+password");

    expect(userInDB).to.exist;
    expect(userInDB.password).to.be.a("string");
    expect(userInDB.password).to.not.equal(data.password);
  });

  it("POST /api/auth/login debe iniciar sesión con credenciales correctas", async function () {
    const data = fakeUser({
      email: "login@test.com",
      password: "123456",
    });

    await request(app)
      .post("/api/auth/register")
      .send(data);

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: data.email,
        password: data.password,
      });

    expect(response.status).to.equal(200);
    expect(response.body).to.have.property("message");
    expect(response.body).to.have.property("user");
    expect(response.body).to.have.property("token");

    expect(response.body.user.email).to.equal(data.email);
    expect(response.body.user.rol).to.equal("user");
    expect(response.body.user).to.not.have.property("password");
  });

  it("POST /api/auth/login debe rechazar contraseña incorrecta", async function () {
    const data = fakeUser({
      email: "login-mal@test.com",
      password: "123456",
    });

    await request(app)
      .post("/api/auth/register")
      .send(data);

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: data.email,
        password: "contraseñaIncorrecta",
      });

    expect(response.status).to.equal(401);
    expect(response.body).to.have.property("message");
  });

  it("GET /api/auth/me debe devolver el usuario autenticado", async function () {
    const { token, user } = await registerUser({
      email: "me@test.com",
    });

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).to.equal(200);
    expect(response.body).to.have.property("message");
    expect(response.body).to.have.property("user");
    expect(response.body.user.email).to.equal(user.email);
  });

  it("GET /api/auth/me debe bloquear acceso sin token", async function () {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).to.equal(401);
    expect(response.body).to.have.property("message");
  });

  it("POST /api/auth/register debe rechazar email duplicado", async function () {
    const data = fakeUser({
      email: "duplicado@test.com",
    });

    await request(app)
      .post("/api/auth/register")
      .send(data);

    const response = await request(app)
      .post("/api/auth/register")
      .send(data);

    expect(response.status).to.equal(400);
    expect(response.body).to.have.property("message");
  });
});
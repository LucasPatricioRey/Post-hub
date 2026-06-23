const request = require("supertest");
const { expect } = require("chai");

const app = require("../app");

const { registerUser, createPost } = require("./helpers/api");

describe("Posteos (integración)", function () {
  // Caso feliz: un usuario autenticado puede crear un posteo.
  it("POST /api/posts debe crear un posteo si el usuario está autenticado", async function () {
    const { token } = await registerUser();

    const { response, data } = await createPost(token, {
      titulo: "Mi primer posteo",
      contenido: "Este es el contenido del posteo.",
    });

    expect(response.status).to.equal(201);
    expect(response.body.post.titulo).to.equal(data.titulo);
    expect(response.body.post).to.have.property("autor");
  });

  // Caso no feliz: sin token la creación debe ser rechazada.
  it("POST /api/posts debe bloquear la creación sin token", async function () {
    const response = await request(app)
      .post("/api/posts")
      .send({
        titulo: "Post sin token",
        contenido: "Este post no debería poder crearse sin autenticación.",
      });

    expect(response.status).to.equal(401);
    expect(response.body).to.have.property("message");
  });
});

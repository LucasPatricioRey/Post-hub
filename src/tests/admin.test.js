const request = require("supertest");
const { expect } = require("chai");

const app = require("../app");

const {
  registerUser,
  createAdminAndToken,
  createPost,
  createComment,
} = require("./helpers/api");

describe("Admin endpoints", function () {
  it("GET /api/admin/stats debe bloquear acceso sin token", async function () {
    const response = await request(app).get("/api/admin/stats");

    expect(response.status).to.equal(401);
    expect(response.body).to.have.property("message");
  });

  it("GET /api/admin/stats debe bloquear acceso a usuario común", async function () {
    const { token } = await registerUser();

    const response = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).to.equal(403);
    expect(response.body).to.have.property("message");
  });

  it("GET /api/admin/stats debe devolver estadísticas si el usuario es admin", async function () {
    const { token: tokenUsuario } = await registerUser();

    const { token: tokenAdmin } = await createAdminAndToken();

    const { post } = await createPost(tokenUsuario);
    await createComment(tokenUsuario, post._id);

    const response = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(response.status).to.equal(200);
    expect(response.body).to.have.property("stats");

    expect(response.body.stats.totalUsuarios).to.equal(2);
    expect(response.body.stats.totalPosteos).to.equal(1);
    expect(response.body.stats.totalComentarios).to.equal(1);
    expect(response.body.stats.posteosPorUsuario).to.be.an("array");
    expect(response.body.stats.posteosPorUsuario).to.have.lengthOf(1);
  });

  it("GET /api/admin/posts debe listar posteos para moderación si el usuario es admin", async function () {
    const { token: tokenUsuario } = await registerUser();

    const { token: tokenAdmin } = await createAdminAndToken();

    await createPost(tokenUsuario, {
      titulo: "Posteo para panel admin",
      contenido: "Este posteo se usa para probar el panel de administración.",
    });

    const response = await request(app)
      .get("/api/admin/posts")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(response.status).to.equal(200);
    expect(response.body.total).to.equal(1);
    expect(response.body.posts).to.be.an("array");
    expect(response.body.posts).to.have.lengthOf(1);
    expect(response.body.posts[0].titulo).to.equal("Posteo para panel admin");
  });

  it("GET /api/admin/comments debe listar comentarios para moderación si el usuario es admin", async function () {
    const { token: tokenUsuario } = await registerUser();

    const { token: tokenAdmin } = await createAdminAndToken();

    const { post } = await createPost(tokenUsuario);
    await createComment(tokenUsuario, post._id, {
      contenido: "Comentario para panel admin.",
    });

    const response = await request(app)
      .get("/api/admin/comments")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(response.status).to.equal(200);
    expect(response.body.total).to.equal(1);
    expect(response.body.comments).to.be.an("array");
    expect(response.body.comments).to.have.lengthOf(1);
    expect(response.body.comments[0].contenido).to.equal("Comentario para panel admin.");
  });
});
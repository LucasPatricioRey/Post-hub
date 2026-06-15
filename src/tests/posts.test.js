const request = require("supertest");
const { expect } = require("chai");

const app = require("../app");

const {
  registerUser,
  createPost,
} = require("./helpers/api");

describe("Post endpoints", function () {
  it("POST /api/posts debe crear un posteo si el usuario está autenticado", async function () {
    const { token } = await registerUser();

    const { response, data } = await createPost(token, {
      titulo: "Mi primer posteo",
      contenido: "Este es el contenido del posteo.",
    });

    expect(response.status).to.equal(201);
    expect(response.body).to.have.property("message");
    expect(response.body).to.have.property("post");

    expect(response.body.post.titulo).to.equal(data.titulo);
    expect(response.body.post.contenido).to.equal(data.contenido);
    expect(response.body.post).to.have.property("autor");
  });

  it("POST /api/posts debe bloquear creación sin token", async function () {
    const response = await request(app)
      .post("/api/posts")
      .send({
        titulo: "Post sin token",
        contenido: "Este post no debería poder crearse sin autenticación.",
      });

    expect(response.status).to.equal(401);
    expect(response.body).to.have.property("message");
  });

  it("GET /api/posts debe listar posteos públicamente", async function () {
    const { token } = await registerUser();

    await createPost(token, {
      titulo: "Posteo para listar",
      contenido: "Contenido del posteo para listar.",
    });

    const response = await request(app).get("/api/posts");

    expect(response.status).to.equal(200);
    expect(response.body).to.have.property("message");
    expect(response.body).to.have.property("posts");

    expect(response.body.posts).to.be.an("array");
    expect(response.body.posts).to.have.lengthOf(1);
    expect(response.body.posts[0].titulo).to.equal("Posteo para listar");
  });

  it("GET /api/posts/:id debe obtener un posteo por ID", async function () {
    const { token } = await registerUser();

    const { post } = await createPost(token, {
      titulo: "Posteo por ID",
      contenido: "Contenido suficiente para buscar por ID.",
    });

    const response = await request(app).get(`/api/posts/${post._id}`);

    expect(response.status).to.equal(200);
    expect(response.body).to.have.property("post");
    expect(response.body.post._id).to.equal(post._id);
    expect(response.body.post.titulo).to.equal("Posteo por ID");
  });

  it("PUT /api/posts/:id debe editar un posteo propio", async function () {
    const { token } = await registerUser();

    const { post } = await createPost(token);

    const response = await request(app)
      .put(`/api/posts/${post._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        titulo: "Título actualizado",
        contenido: "Contenido actualizado correctamente.",
      });

    expect(response.status).to.equal(200);
    expect(response.body).to.have.property("post");
    expect(response.body.post.titulo).to.equal("Título actualizado");
    expect(response.body.post.contenido).to.equal("Contenido actualizado correctamente.");
  });

  it("PUT /api/posts/:id debe bloquear edición de posteo ajeno", async function () {
    const { token: tokenAutor } = await registerUser({
      email: "autor-post@test.com",
    });

    const { token: tokenOtroUsuario } = await registerUser({
      email: "otro-post@test.com",
    });

    const { post } = await createPost(tokenAutor);

    const response = await request(app)
      .put(`/api/posts/${post._id}`)
      .set("Authorization", `Bearer ${tokenOtroUsuario}`)
      .send({
        titulo: "Intento de edición ajena",
        contenido: "Este cambio no debería permitirse.",
      });

    expect(response.status).to.equal(403);
    expect(response.body).to.have.property("message");
  });

  it("DELETE /api/posts/:id debe eliminar un posteo propio", async function () {
    const { token } = await registerUser();

    const { post } = await createPost(token);

    const response = await request(app)
      .delete(`/api/posts/${post._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).to.equal(200);
    expect(response.body.message).to.equal("Posteo eliminado correctamente");

    const postEliminado = await request(app).get(`/api/posts/${post._id}`);

    expect(postEliminado.status).to.equal(404);
  });

  it("DELETE /api/posts/:id debe bloquear eliminación de posteo ajeno", async function () {
    const { token: tokenAutor } = await registerUser({
      email: "autor-delete@test.com",
    });

    const { token: tokenOtroUsuario } = await registerUser({
      email: "otro-delete@test.com",
    });

    const { post } = await createPost(tokenAutor);

    const response = await request(app)
      .delete(`/api/posts/${post._id}`)
      .set("Authorization", `Bearer ${tokenOtroUsuario}`);

    expect(response.status).to.equal(403);
    expect(response.body).to.have.property("message");
  });
});
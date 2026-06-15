const request = require("supertest");
const { expect } = require("chai");

const app = require("../app");

const {
  registerUser,
  createAdminAndToken,
  createPost,
  createComment,
} = require("./helpers/api");

describe("Comment endpoints", function () {
  it("POST /api/posts/:postId/comments debe crear un comentario autenticado", async function () {
    const { token } = await registerUser();

    const { post } = await createPost(token);

    const { response, data } = await createComment(token, post._id, {
      contenido: "Este es mi primer comentario.",
    });

    expect(response.status).to.equal(201);
    expect(response.body).to.have.property("message");
    expect(response.body).to.have.property("comment");

    expect(response.body.comment.contenido).to.equal(data.contenido);
    expect(response.body.comment).to.have.property("autor");
    expect(response.body.comment).to.have.property("post");
  });

  it("POST /api/posts/:postId/comments debe bloquear comentario sin token", async function () {
    const { token } = await registerUser();

    const { post } = await createPost(token);

    const response = await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .send({
        contenido: "Comentario sin token.",
      });

    expect(response.status).to.equal(401);
    expect(response.body).to.have.property("message");
  });

  it("GET /api/posts/:postId/comments debe listar comentarios de un posteo", async function () {
    const { token } = await registerUser();

    const { post } = await createPost(token);

    await createComment(token, post._id, {
      contenido: "Comentario para listar.",
    });

    const response = await request(app).get(`/api/posts/${post._id}/comments`);

    expect(response.status).to.equal(200);
    expect(response.body).to.have.property("comments");
    expect(response.body.comments).to.be.an("array");
    expect(response.body.comments).to.have.lengthOf(1);
    expect(response.body.comments[0].contenido).to.equal("Comentario para listar.");
  });

  it("PUT /api/comments/:id debe editar un comentario propio", async function () {
    const { token } = await registerUser();

    const { post } = await createPost(token);
    const { comment } = await createComment(token, post._id);

    const response = await request(app)
      .put(`/api/comments/${comment._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        contenido: "Comentario editado correctamente.",
      });

    expect(response.status).to.equal(200);
    expect(response.body).to.have.property("comment");
    expect(response.body.comment.contenido).to.equal("Comentario editado correctamente.");
  });

  it("PUT /api/comments/:id debe bloquear edición de comentario ajeno", async function () {
    const { token: tokenAutor } = await registerUser({
      email: "autor-comment@test.com",
    });

    const { token: tokenOtroUsuario } = await registerUser({
      email: "otro-comment@test.com",
    });

    const { post } = await createPost(tokenAutor);
    const { comment } = await createComment(tokenAutor, post._id);

    const response = await request(app)
      .put(`/api/comments/${comment._id}`)
      .set("Authorization", `Bearer ${tokenOtroUsuario}`)
      .send({
        contenido: "Intento de edición ajena.",
      });

    expect(response.status).to.equal(403);
    expect(response.body).to.have.property("message");
  });

  it("DELETE /api/comments/:id debe eliminar un comentario propio", async function () {
    const { token } = await registerUser();

    const { post } = await createPost(token);
    const { comment } = await createComment(token, post._id);

    const response = await request(app)
      .delete(`/api/comments/${comment._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).to.equal(200);
    expect(response.body.message).to.equal("Comentario eliminado correctamente");

    const comentariosDelPost = await request(app).get(`/api/posts/${post._id}/comments`);

    expect(comentariosDelPost.body.comments).to.have.lengthOf(0);
  });

  it("DELETE /api/comments/:id debe bloquear eliminación de comentario ajeno para usuario común", async function () {
    const { token: tokenAutor } = await registerUser({
      email: "autor-comment-delete@test.com",
    });

    const { token: tokenOtroUsuario } = await registerUser({
      email: "otro-comment-delete@test.com",
    });

    const { post } = await createPost(tokenAutor);
    const { comment } = await createComment(tokenAutor, post._id);

    const response = await request(app)
      .delete(`/api/comments/${comment._id}`)
      .set("Authorization", `Bearer ${tokenOtroUsuario}`);

    expect(response.status).to.equal(403);
    expect(response.body).to.have.property("message");

    const comentariosDelPost = await request(app).get(`/api/posts/${post._id}/comments`);

    expect(comentariosDelPost.body.comments).to.have.lengthOf(1);
  });

  it("DELETE /api/comments/:id debe permitir que admin elimine comentario ajeno", async function () {
    const { token: tokenUsuario } = await registerUser({
      email: "usuario-comentario-admin@test.com",
    });

    const { token: tokenAdmin } = await createAdminAndToken();

    const { post } = await createPost(tokenUsuario);
    const { comment } = await createComment(tokenUsuario, post._id);

    const response = await request(app)
      .delete(`/api/comments/${comment._id}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(response.status).to.equal(200);
    expect(response.body.message).to.equal("Comentario eliminado correctamente");

    const comentariosDelPost = await request(app).get(`/api/posts/${post._id}/comments`);

    expect(comentariosDelPost.body.comments).to.have.lengthOf(0);
  });
});
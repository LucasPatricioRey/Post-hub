const request = require("supertest");
const { expect } = require("chai");

const app = require("../app");
const Comment = require("../models/Comment");

const {
  registerUser,
  createAdminAndToken,
  createPost,
  createComment,
} = require("./helpers/api");

describe("Permisos admin y moderación", function () {
  it("DELETE /api/posts/:id debe permitir que admin elimine un posteo ajeno", async function () {
    const { token: tokenUsuario } = await registerUser({
      nombre: "Usuario Dueño Post",
      email: "duenio-post@test.com",
    });

    const { token: tokenAdmin } = await createAdminAndToken();

    const { post } = await createPost(tokenUsuario, {
      titulo: "Posteo para permisos admin",
      contenido: "Este posteo se usa para probar permisos de administrador.",
    });

    const response = await request(app)
      .delete(`/api/posts/${post._id}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(response.status).to.equal(200);
    expect(response.body).to.have.property(
      "message",
      "Posteo eliminado correctamente"
    );

    const postEliminado = await request(app).get(`/api/posts/${post._id}`);

    expect(postEliminado.status).to.equal(404);
  });

  it("PUT /api/posts/:id debe bloquear edición de posteo ajeno aunque el usuario sea admin", async function () {
    const { token: tokenUsuario } = await registerUser({
      nombre: "Usuario Autor Post",
      email: "autor-post@test.com",
    });

    const { token: tokenAdmin } = await createAdminAndToken();

    const { post } = await createPost(tokenUsuario, {
      titulo: "Posteo original",
      contenido: "Este contenido pertenece al autor original.",
    });

    const response = await request(app)
      .put(`/api/posts/${post._id}`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        titulo: "Título editado por admin",
        contenido: "Este contenido no debería poder modificarlo un admin.",
      });

    expect(response.status).to.equal(403);
    expect(response.body).to.have.property("message");
  });

  it("DELETE /api/posts/:id debe eliminar también los comentarios asociados al posteo", async function () {
    const { token: tokenUsuario } = await registerUser({
      nombre: "Usuario Con Comentarios",
      email: "usuario-con-comentarios@test.com",
    });

    const { token: tokenAdmin } = await createAdminAndToken();

    const { post } = await createPost(tokenUsuario, {
      titulo: "Posteo con comentarios",
      contenido: "Este posteo tiene comentarios asociados.",
    });

    await createComment(tokenUsuario, post._id, {
      contenido: "Comentario asociado al posteo.",
    });

    const comentariosAntes = await Comment.find({ post: post._id });
    expect(comentariosAntes).to.have.lengthOf(1);

    const response = await request(app)
      .delete(`/api/posts/${post._id}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(response.status).to.equal(200);

    const comentariosDespues = await Comment.find({ post: post._id });
    expect(comentariosDespues).to.have.lengthOf(0);
  });

  it("DELETE /api/comments/:id debe permitir que admin elimine un comentario ajeno", async function () {
    const { token: tokenUsuario } = await registerUser({
      nombre: "Usuario Comentado Admin",
      email: "usuario-comentado-admin@test.com",
    });

    const { token: tokenAdmin } = await createAdminAndToken();

    const { post } = await createPost(tokenUsuario);
    const { comment } = await createComment(tokenUsuario, post._id, {
      contenido: "Comentario que será eliminado por admin.",
    });

    const response = await request(app)
      .delete(`/api/comments/${comment._id}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(response.status).to.equal(200);
    expect(response.body).to.have.property(
      "message",
      "Comentario eliminado correctamente"
    );

    const comentariosDelPost = await request(app).get(
      `/api/posts/${post._id}/comments`
    );

    expect(comentariosDelPost.body.comments).to.have.lengthOf(0);
  });

  it("PUT /api/comments/:id debe bloquear edición de comentario ajeno aunque el usuario sea admin", async function () {
    const { token: tokenUsuario } = await registerUser({
      nombre: "Usuario Comentario Protegido",
      email: "usuario-comentario-protegido@test.com",
    });

    const { token: tokenAdmin } = await createAdminAndToken();

    const { post } = await createPost(tokenUsuario);
    const { comment } = await createComment(tokenUsuario, post._id, {
      contenido: "Comentario que el admin no debería editar.",
    });

    const response = await request(app)
      .put(`/api/comments/${comment._id}`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        contenido: "Intento de edición por admin.",
      });

    expect(response.status).to.equal(403);
    expect(response.body).to.have.property("message");
  });
});
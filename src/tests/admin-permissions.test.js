const request = require("supertest");
const app = require("../app");
const User = require("../models/User");
const Comment = require("../models/Comment");
const generateToken = require("../utils/generateToken");

const crearUsuarioYObtenerToken = async (datosUsuario) => {
  const response = await request(app)
    .post("/api/auth/register")
    .send(datosUsuario);

  return response.body.token;
};

const crearAdminYObtenerToken = async () => {
  const admin = await User.create({
    nombre: "Admin Permisos",
    email: "admin-permisos@test.com",
    password: "123456",
    rol: "admin",
  });

  return generateToken(admin._id);
};

const crearPostYObtenerId = async (token, datosPost = {}) => {
  const response = await request(app)
    .post("/api/posts")
    .set("Authorization", `Bearer ${token}`)
    .send({
      titulo: datosPost.titulo || "Posteo para permisos admin",
      contenido:
        datosPost.contenido ||
        "Este posteo se usa para probar permisos de administrador.",
    });

  return response.body.post._id;
};

const crearComentario = async (
  token,
  postId,
  contenido = "Comentario asociado al posteo."
) => {
  const response = await request(app)
    .post(`/api/posts/${postId}/comments`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      contenido,
    });

  return response.body.comment;
};

describe("Permisos admin y moderación", () => {
  test("DELETE /api/posts/:id debe permitir que admin elimine un posteo ajeno", async () => {
    const tokenUsuario = await crearUsuarioYObtenerToken({
      nombre: "Usuario Dueño Post",
      email: "duenio-post@test.com",
      password: "123456",
    });

    const tokenAdmin = await crearAdminYObtenerToken();

    const postId = await crearPostYObtenerId(tokenUsuario);

    const response = await request(app)
      .delete(`/api/posts/${postId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty(
      "message",
      "Posteo eliminado correctamente"
    );

    const postEliminado = await request(app).get(`/api/posts/${postId}`);

    expect(postEliminado.statusCode).toBe(404);
  });

  test("PUT /api/posts/:id debe bloquear edición de posteo ajeno aunque el usuario sea admin", async () => {
    const tokenUsuario = await crearUsuarioYObtenerToken({
      nombre: "Usuario Autor Post",
      email: "autor-post@test.com",
      password: "123456",
    });

    const tokenAdmin = await crearAdminYObtenerToken();

    const postId = await crearPostYObtenerId(tokenUsuario);

    const response = await request(app)
      .put(`/api/posts/${postId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        titulo: "Título editado por admin",
        contenido: "Este contenido no debería poder modificarlo un admin.",
      });

    expect(response.statusCode).toBe(403);
    expect(response.body).toHaveProperty("message");
  });

  test("DELETE /api/posts/:id debe eliminar también los comentarios asociados al posteo", async () => {
    const tokenUsuario = await crearUsuarioYObtenerToken({
      nombre: "Usuario Con Comentarios",
      email: "usuario-con-comentarios@test.com",
      password: "123456",
    });

    const tokenAdmin = await crearAdminYObtenerToken();

    const postId = await crearPostYObtenerId(tokenUsuario);

    await crearComentario(tokenUsuario, postId);

    const comentariosAntes = await Comment.find({ post: postId });
    expect(comentariosAntes.length).toBe(1);

    const response = await request(app)
      .delete(`/api/posts/${postId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(response.statusCode).toBe(200);

    const comentariosDespues = await Comment.find({ post: postId });
    expect(comentariosDespues.length).toBe(0);
  });

  test("DELETE /api/comments/:id debe permitir que admin elimine un comentario ajeno", async () => {
    const tokenUsuario = await crearUsuarioYObtenerToken({
      nombre: "Usuario Comentado Admin",
      email: "usuario-comentado-admin@test.com",
      password: "123456",
    });

    const tokenAdmin = await crearAdminYObtenerToken();

    const postId = await crearPostYObtenerId(tokenUsuario);

    const comentarioCreado = await crearComentario(
      tokenUsuario,
      postId,
      "Comentario que será eliminado por admin."
    );

    const commentId = comentarioCreado._id;

    const response = await request(app)
      .delete(`/api/comments/${commentId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty(
      "message",
      "Comentario eliminado correctamente"
    );

    const comentariosDelPost = await request(app).get(
      `/api/posts/${postId}/comments`
    );

    expect(comentariosDelPost.body.comments.length).toBe(0);
  });

  test("PUT /api/comments/:id debe bloquear edición de comentario ajeno aunque el usuario sea admin", async () => {
    const tokenUsuario = await crearUsuarioYObtenerToken({
      nombre: "Usuario Comentario Protegido",
      email: "usuario-comentario-protegido@test.com",
      password: "123456",
    });

    const tokenAdmin = await crearAdminYObtenerToken();

    const postId = await crearPostYObtenerId(tokenUsuario);

    const comentarioCreado = await crearComentario(
      tokenUsuario,
      postId,
      "Comentario que el admin no debería editar."
    );

    const commentId = comentarioCreado._id;

    const response = await request(app)
      .put(`/api/comments/${commentId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        contenido: "Intento de edición por admin.",
      });

    expect(response.statusCode).toBe(403);
    expect(response.body).toHaveProperty("message");
  });
});
const request = require("supertest");
const app = require("../app");

const crearUsuarioYObtenerToken = async (datosUsuario) => {
  const response = await request(app)
    .post("/api/auth/register")
    .send(datosUsuario);

  return response.body.token;
};

const crearPostYObtenerId = async (token) => {
  const response = await request(app)
    .post("/api/posts")
    .set("Authorization", `Bearer ${token}`)
    .send({
      titulo: "Posteo para comentarios",
      contenido: "Este posteo se usa para probar comentarios.",
    });

  return response.body.post._id;
};

const crearComentario = async (
  token,
  postId,
  contenido = "Comentario de prueba"
) => {
  const response = await request(app)
    .post(`/api/posts/${postId}/comments`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      contenido,
    });

  return response;
};

describe("Comment endpoints", () => {
  test("POST /api/posts/:postId/comments debe crear un comentario si el usuario está autenticado", async () => {
    const token = await crearUsuarioYObtenerToken({
      nombre: "Usuario Comentario",
      email: "comentario@test.com",
      password: "123456",
    });

    const postId = await crearPostYObtenerId(token);

    const response = await crearComentario(
      token,
      postId,
      "Este es mi primer comentario."
    );

    expect(response.statusCode).toBe(201);

    expect(response.body).toHaveProperty("message");
    expect(response.body).toHaveProperty("comment");

    expect(response.body.comment).toHaveProperty(
      "contenido",
      "Este es mi primer comentario."
    );

    expect(response.body.comment).toHaveProperty("autor");
    expect(response.body.comment).toHaveProperty("post");
  });

  test("GET /api/posts/:postId/comments debe listar comentarios de un posteo", async () => {
    const token = await crearUsuarioYObtenerToken({
      nombre: "Usuario Lista Comentarios",
      email: "lista-comentarios@test.com",
      password: "123456",
    });

    const postId = await crearPostYObtenerId(token);

    await crearComentario(token, postId, "Comentario para listar.");

    const response = await request(app).get(`/api/posts/${postId}/comments`);

    expect(response.statusCode).toBe(200);

    expect(response.body).toHaveProperty("message");
    expect(response.body).toHaveProperty("comments");

    expect(Array.isArray(response.body.comments)).toBe(true);
    expect(response.body.comments.length).toBe(1);
    expect(response.body.comments[0]).toHaveProperty(
      "contenido",
      "Comentario para listar."
    );
  });

  test("PUT /api/comments/:id debe editar un comentario propio", async () => {
    const token = await crearUsuarioYObtenerToken({
      nombre: "Usuario Edita Comentario",
      email: "edita-comentario@test.com",
      password: "123456",
    });

    const postId = await crearPostYObtenerId(token);

    const comentarioCreado = await crearComentario(
      token,
      postId,
      "Comentario original."
    );

    const commentId = comentarioCreado.body.comment._id;

    const response = await request(app)
      .put(`/api/comments/${commentId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        contenido: "Comentario editado correctamente.",
      });

    expect(response.statusCode).toBe(200);

    expect(response.body).toHaveProperty("message");
    expect(response.body).toHaveProperty("comment");

    expect(response.body.comment).toHaveProperty(
      "contenido",
      "Comentario editado correctamente."
    );
  });

  test("PUT /api/comments/:id debe bloquear edición de comentario ajeno", async () => {
    const tokenAutor = await crearUsuarioYObtenerToken({
      nombre: "Autor Comentario",
      email: "autor-comentario@test.com",
      password: "123456",
    });

    const tokenOtroUsuario = await crearUsuarioYObtenerToken({
      nombre: "Otro Usuario Comentario",
      email: "otro-comentario@test.com",
      password: "123456",
    });

    const postId = await crearPostYObtenerId(tokenAutor);

    const comentarioCreado = await crearComentario(
      tokenAutor,
      postId,
      "Comentario que no debería editar otro usuario."
    );

    const commentId = comentarioCreado.body.comment._id;

    const response = await request(app)
      .put(`/api/comments/${commentId}`)
      .set("Authorization", `Bearer ${tokenOtroUsuario}`)
      .send({
        contenido: "Intento de edición ajena.",
      });

    expect(response.statusCode).toBe(403);
    expect(response.body).toHaveProperty("message");
  });

  test("DELETE /api/comments/:id debe eliminar un comentario propio", async () => {
    const token = await crearUsuarioYObtenerToken({
      nombre: "Usuario Elimina Comentario",
      email: "elimina-comentario@test.com",
      password: "123456",
    });

    const postId = await crearPostYObtenerId(token);

    const comentarioCreado = await crearComentario(
      token,
      postId,
      "Comentario que será eliminado."
    );

    const commentId = comentarioCreado.body.comment._id;

    const response = await request(app)
      .delete(`/api/comments/${commentId}`)
      .set("Authorization", `Bearer ${token}`);

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

  test("DELETE /api/comments/:id debe bloquear eliminación de comentario ajeno para usuario común", async () => {
    const tokenAutor = await crearUsuarioYObtenerToken({
      nombre: "Autor Comentario Delete",
      email: "autor-delete-comentario@test.com",
      password: "123456",
    });

    const tokenOtroUsuario = await crearUsuarioYObtenerToken({
      nombre: "Otro Usuario Delete",
      email: "otro-delete-comentario@test.com",
      password: "123456",
    });

    const postId = await crearPostYObtenerId(tokenAutor);

    const comentarioCreado = await crearComentario(
      tokenAutor,
      postId,
      "Comentario que otro usuario no debería poder eliminar."
    );

    const commentId = comentarioCreado.body.comment._id;

    const response = await request(app)
      .delete(`/api/comments/${commentId}`)
      .set("Authorization", `Bearer ${tokenOtroUsuario}`);

    expect(response.statusCode).toBe(403);
    expect(response.body).toHaveProperty("message");

    const comentariosDelPost = await request(app).get(
      `/api/posts/${postId}/comments`
    );

    expect(comentariosDelPost.body.comments.length).toBe(1);
  });
});
const request = require("supertest");
const app = require("../app");

const crearUsuarioYObtenerToken = async (datosUsuario) => {
  const response = await request(app)
    .post("/api/auth/register")
    .send(datosUsuario);

  return response.body.token;
};

describe("Post endpoints", () => {
  test("POST /api/posts debe crear un posteo si el usuario está autenticado", async () => {
    const token = await crearUsuarioYObtenerToken({
      nombre: "Autor Test",
      email: "autor@test.com",
      password: "123456",
    });

    const response = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        titulo: "Mi primer posteo",
        contenido: "Este es el contenido del posteo.",
      });

    expect(response.statusCode).toBe(201);

    expect(response.body).toHaveProperty("message");
    expect(response.body).toHaveProperty("post");

    expect(response.body.post).toHaveProperty("titulo", "Mi primer posteo");
    expect(response.body.post).toHaveProperty(
      "contenido",
      "Este es el contenido del posteo."
    );
    expect(response.body.post).toHaveProperty("autor");
  });

  test("GET /api/posts debe listar posteos públicamente", async () => {
    const token = await crearUsuarioYObtenerToken({
      nombre: "Autor Lista",
      email: "lista@test.com",
      password: "123456",
    });

    await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        titulo: "Posteo para listar",
        contenido: "Contenido del posteo para listar.",
      });

    const response = await request(app).get("/api/posts");

    expect(response.statusCode).toBe(200);

    expect(response.body).toHaveProperty("message");
    expect(response.body).toHaveProperty("posts");

    expect(Array.isArray(response.body.posts)).toBe(true);
    expect(response.body.posts.length).toBe(1);
    expect(response.body.posts[0]).toHaveProperty("titulo", "Posteo para listar");
  });

  test("PUT /api/posts/:id debe bloquear edición de posteo ajeno", async () => {
    const tokenAutorOriginal = await crearUsuarioYObtenerToken({
      nombre: "Autor Original",
      email: "original@test.com",
      password: "123456",
    });

    const tokenOtroUsuario = await crearUsuarioYObtenerToken({
      nombre: "Otro Usuario",
      email: "otro@test.com",
      password: "123456",
    });

    const postCreado = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${tokenAutorOriginal}`)
      .send({
        titulo: "Posteo original",
        contenido: "Contenido original.",
      });

    const postId = postCreado.body.post._id;

    const response = await request(app)
      .put(`/api/posts/${postId}`)
      .set("Authorization", `Bearer ${tokenOtroUsuario}`)
      .send({
        titulo: "Posteo editado por otro",
        contenido: "Este cambio no debería permitirse.",
      });

    expect(response.statusCode).toBe(403);
  });

  test("DELETE /api/posts/:id debe bloquear eliminación de posteo ajeno", async () => {
    const tokenAutorOriginal = await crearUsuarioYObtenerToken({
      nombre: "Autor Delete",
      email: "delete@test.com",
      password: "123456",
    });

    const tokenOtroUsuario = await crearUsuarioYObtenerToken({
      nombre: "Usuario Intruso",
      email: "intruso@test.com",
      password: "123456",
    });

    const postCreado = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${tokenAutorOriginal}`)
      .send({
        titulo: "Posteo a proteger",
        contenido: "Este posteo no debería poder borrarlo otro usuario.",
      });

    const postId = postCreado.body.post._id;

    const response = await request(app)
      .delete(`/api/posts/${postId}`)
      .set("Authorization", `Bearer ${tokenOtroUsuario}`);

    expect(response.statusCode).toBe(403);
  });
});
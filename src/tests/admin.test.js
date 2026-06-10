const request = require("supertest");
const app = require("../app");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const crearUsuarioYObtenerToken = async (datosUsuario) => {
  const response = await request(app)
    .post("/api/auth/register")
    .send(datosUsuario);

  return response.body.token;
};

const crearAdminYObtenerToken = async () => {
  const admin = await User.create({
    nombre: "Admin Panel",
    email: "admin-panel@test.com",
    password: "123456",
    rol: "admin",
  });

  return generateToken(admin._id);
};

const crearPostYObtenerId = async (token) => {
  const response = await request(app)
    .post("/api/posts")
    .set("Authorization", `Bearer ${token}`)
    .send({
      titulo: "Posteo para panel admin",
      contenido: "Este posteo se usa para probar el panel de administración.",
    });

  return response.body.post._id;
};

const crearComentario = async (token, postId) => {
  const response = await request(app)
    .post(`/api/posts/${postId}/comments`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      contenido: "Comentario para panel admin.",
    });

  return response.body.comment;
};

describe("Admin endpoints", () => {
  test("GET /api/admin/stats debe bloquear acceso sin token", async () => {
    const response = await request(app).get("/api/admin/stats");

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("message");
  });

  test("GET /api/admin/stats debe bloquear acceso a usuario común", async () => {
    const tokenUsuario = await crearUsuarioYObtenerToken({
      nombre: "Usuario Comun Admin",
      email: "usuario-comun-admin@test.com",
      password: "123456",
    });

    const response = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${tokenUsuario}`);

    expect(response.statusCode).toBe(403);
    expect(response.body).toHaveProperty("message");
  });

  test("GET /api/admin/stats debe devolver estadísticas si el usuario es admin", async () => {
    const tokenUsuario = await crearUsuarioYObtenerToken({
      nombre: "Usuario Estadisticas",
      email: "usuario-estadisticas@test.com",
      password: "123456",
    });

    const tokenAdmin = await crearAdminYObtenerToken();

    const postId = await crearPostYObtenerId(tokenUsuario);

    await crearComentario(tokenUsuario, postId);

    const response = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(response.statusCode).toBe(200);

    expect(response.body).toHaveProperty("message");
    expect(response.body).toHaveProperty("stats");

    expect(response.body.stats).toHaveProperty("totalUsuarios", 2);
    expect(response.body.stats).toHaveProperty("totalPosteos", 1);
    expect(response.body.stats).toHaveProperty("totalComentarios", 1);

    expect(Array.isArray(response.body.stats.posteosPorUsuario)).toBe(true);
    expect(response.body.stats.posteosPorUsuario.length).toBe(1);
  });

  test("GET /api/admin/posts debe listar posteos para moderación si el usuario es admin", async () => {
    const tokenUsuario = await crearUsuarioYObtenerToken({
      nombre: "Usuario Post Moderacion",
      email: "usuario-post-moderacion@test.com",
      password: "123456",
    });

    const tokenAdmin = await crearAdminYObtenerToken();

    await crearPostYObtenerId(tokenUsuario);

    const response = await request(app)
      .get("/api/admin/posts")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(response.statusCode).toBe(200);

    expect(response.body).toHaveProperty("message");
    expect(response.body).toHaveProperty("total", 1);
    expect(response.body).toHaveProperty("posts");

    expect(Array.isArray(response.body.posts)).toBe(true);
    expect(response.body.posts.length).toBe(1);
    expect(response.body.posts[0]).toHaveProperty(
      "titulo",
      "Posteo para panel admin"
    );
    expect(response.body.posts[0]).toHaveProperty("autor");
  });

  test("GET /api/admin/comments debe listar comentarios para moderación si el usuario es admin", async () => {
    const tokenUsuario = await crearUsuarioYObtenerToken({
      nombre: "Usuario Comment Moderacion",
      email: "usuario-comment-moderacion@test.com",
      password: "123456",
    });

    const tokenAdmin = await crearAdminYObtenerToken();

    const postId = await crearPostYObtenerId(tokenUsuario);

    await crearComentario(tokenUsuario, postId);

    const response = await request(app)
      .get("/api/admin/comments")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(response.statusCode).toBe(200);

    expect(response.body).toHaveProperty("message");
    expect(response.body).toHaveProperty("total", 1);
    expect(response.body).toHaveProperty("comments");

    expect(Array.isArray(response.body.comments)).toBe(true);
    expect(response.body.comments.length).toBe(1);
    expect(response.body.comments[0]).toHaveProperty(
      "contenido",
      "Comentario para panel admin."
    );
    expect(response.body.comments[0]).toHaveProperty("autor");
    expect(response.body.comments[0]).toHaveProperty("post");
  });
});
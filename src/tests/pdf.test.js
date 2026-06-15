const request = require("supertest");
const { expect } = require("chai");
const mongoose = require("mongoose");

const app = require("../app");

const {
  registerUser,
  createPost,
  createComment,
} = require("./helpers/api");

describe("PDF endpoints", function () {
  it("GET /api/posts/:id/pdf debe exportar un posteo a PDF", async function () {
    const { token } = await registerUser();

    const { post } = await createPost(token, {
      titulo: "Posteo exportable",
      contenido: "Este contenido debería aparecer dentro del PDF generado.",
    });

    await createComment(token, post._id, {
      contenido: "Comentario incluido en el PDF.",
    });

    const response = await request(app).get(`/api/posts/${post._id}/pdf`);

    expect(response.status).to.equal(200);
    expect(response.headers["content-type"]).to.match(/application\/pdf/);
    expect(response.headers["content-disposition"]).to.match(/attachment/);
    expect(response.headers["content-disposition"]).to.match(/\.pdf/);
  });

  it("GET /api/posts/:id/pdf debe rechazar ID inválido", async function () {
    const response = await request(app).get("/api/posts/123/pdf");

    expect(response.status).to.equal(400);
    expect(response.body).to.have.property("message");
  });

  it("GET /api/posts/:id/pdf debe devolver 404 si el post no existe", async function () {
    const idInexistente = new mongoose.Types.ObjectId().toString();

    const response = await request(app).get(`/api/posts/${idInexistente}/pdf`);

    expect(response.status).to.equal(404);
    expect(response.body).to.have.property("message");
  });
});
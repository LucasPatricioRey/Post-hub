const { expect } = require("chai");

const { authorizeRoles } = require("../middlewares/role.middleware");

// Test unitario puro: prueba la función authorizeRoles de forma aislada,
// sin levantar el servidor HTTP ni usar la base de datos. Se simulan los
// objetos req, res y next que normalmente provee Express.

const crearMockRes = () => {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
};

describe("Unit: middleware authorizeRoles", function () {
  it("debe dejar pasar a un admin y bloquear con 403 a un usuario común", function () {
    // Caso permitido: el rol coincide -> debe llamar a next()
    const reqAdmin = { user: { rol: "admin" } };
    const resAdmin = crearMockRes();
    let nextLlamado = false;

    authorizeRoles("admin")(reqAdmin, resAdmin, () => {
      nextLlamado = true;
    });

    expect(nextLlamado).to.equal(true);
    expect(resAdmin.statusCode).to.equal(null);

    // Caso bloqueado: el rol no coincide -> debe responder 403
    const reqUser = { user: { rol: "user" } };
    const resUser = crearMockRes();

    authorizeRoles("admin")(reqUser, resUser, () => {});

    expect(resUser.statusCode).to.equal(403);
    expect(resUser.body).to.have.property("message");
  });
});

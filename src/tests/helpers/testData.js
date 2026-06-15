const { faker } = require("@faker-js/faker");

const crearEmailUnico = () => {
  const id = faker.string.uuid().slice(0, 8);
  return `user-${id}@test.com`;
};

const fakeUser = (overrides = {}) => {
  return {
    nombre: faker.person.fullName(),
    email: crearEmailUnico(),
    password: "123456",
    ...overrides,
  };
};

const fakeAdmin = (overrides = {}) => {
  return {
    ...fakeUser(),
    rol: "admin",
    ...overrides,
  };
};

const fakePost = (overrides = {}) => {
  return {
    titulo: faker.lorem.words(5),
    contenido: faker.lorem.paragraph(),
    ...overrides,
  };
};

const fakeComment = (overrides = {}) => {
  return {
    contenido: faker.lorem.sentence(),
    ...overrides,
  };
};

module.exports = {
  fakeUser,
  fakeAdmin,
  fakePost,
  fakeComment,
};
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

beforeAll(async () => {
  process.env.JWT_SECRET = "clave_secreta_para_tests";
  process.env.JWT_EXPIRES_IN = "7d";

  mongoServer = await MongoMemoryServer.create();

  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri);
  
});

afterEach(async () => {
  const collections = mongoose.connection.collections;

  for (const collectionName in collections) {
    await collections[collectionName].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.close();

  if (mongoServer) {
    await mongoServer.stop();
  }
});
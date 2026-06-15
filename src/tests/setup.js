const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

before(async function () {
  this.timeout(30000);

  process.env.JWT_SECRET = "clave_secreta_para_tests";
  process.env.JWT_EXPIRES_IN = "7d";
  process.env.CLIENT_URL = "http://localhost:5173";

  process.env.CLOUDINARY_CLOUD_NAME = "test";
  process.env.CLOUDINARY_API_KEY = "test";
  process.env.CLOUDINARY_API_SECRET = "test";
  process.env.CLOUDINARY_FOLDER = "posthub/tests";

  mongoServer = await MongoMemoryServer.create();

  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri);
});

afterEach(async function () {
  const collections = mongoose.connection.collections;

  for (const collectionName of Object.keys(collections)) {
    await collections[collectionName].deleteMany({});
  }
});

after(async function () {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }

  if (mongoServer) {
    await mongoServer.stop();
  }
});
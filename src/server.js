require("dotenv").config();

const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const configureSockets = require("./sockets");

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();

  const server = http.createServer(app);

  configureSockets(server);

  server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
};

startServer();
const https = require("https");
const http = require("http");

const getImageBufferFromUrl = (imageUrl) => {
  return new Promise((resolve, reject) => {
    if (!imageUrl) {
      return resolve(null);
    }

    const client = imageUrl.startsWith("https") ? https : http;

    client
      .get(imageUrl, (response) => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          return reject(
            new Error(`No se pudo obtener la imagen. Status: ${response.statusCode}`)
          );
        }

        const chunks = [];

        response.on("data", (chunk) => {
          chunks.push(chunk);
        });

        response.on("end", () => {
          resolve(Buffer.concat(chunks));
        });
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};

module.exports = getImageBufferFromUrl;
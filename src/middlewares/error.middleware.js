const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Error interno del servidor";

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((error) => error.message)
      .join(". ");
  }

  if (err.code === 11000) {
    statusCode = 400;

    const campoDuplicado = Object.keys(err.keyValue)[0];

    message = `El campo ${campoDuplicado} ya está registrado`;
  }

  if (err.name === "CastError") {
    statusCode = 400;
    message = "ID inválido";
  }

  if (err.code === "LIMIT_FILE_SIZE") {
  statusCode = 400;
  message = "La imagen no puede superar los 5 MB";
}

  res.status(statusCode).json({
    message,
  });
};

module.exports = errorMiddleware;
const multer = require("multer");
const createError = require("../utils/createError");

const storage = multer.memoryStorage();

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      createError("Formato de imagen no permitido. Usá JPG, PNG o WebP", 400),
      false
    );
  }
};

const uploadImage = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter,
});

module.exports = uploadImage;
const cloudinary = require("../config/cloudinary");

const deleteImageFromCloudinary = async (publicId) => {
  if (!publicId) {
    return null;
  }

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });

  return result;
};

module.exports = deleteImageFromCloudinary;
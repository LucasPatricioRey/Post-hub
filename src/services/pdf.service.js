const mongoose = require("mongoose");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const createError = require("../utils/createError");

const getPostForExport = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw createError("ID de posteo inválido", 400);
  }

  const post = await Post.findById(id).populate("autor", "nombre email rol");

  if (!post) {
    throw createError("Posteo no encontrado", 404);
  }

  const comments = await Comment.find({ post: post._id })
    .populate("autor", "nombre email rol")
    .sort({ createdAt: 1 });

  return { post, comments };
};

module.exports = {
  getPostForExport,
};

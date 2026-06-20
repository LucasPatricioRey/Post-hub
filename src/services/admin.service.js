const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comment");

const getStats = async () => {
  const totalUsuarios = await User.countDocuments();
  const totalPosteos = await Post.countDocuments();
  const totalComentarios = await Comment.countDocuments();

  const posteosPorUsuario = await Post.aggregate([
    {
      $group: {
        _id: "$autor",
        totalPosteos: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "usuario",
      },
    },
    {
      $unwind: {
        path: "$usuario",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 0,
        usuarioId: "$_id",
        nombre: "$usuario.nombre",
        email: "$usuario.email",
        totalPosteos: 1,
      },
    },
    {
      $sort: {
        totalPosteos: -1,
      },
    },
  ]);

  return {
    totalUsuarios,
    totalPosteos,
    totalComentarios,
    posteosPorUsuario,
  };
};

const getPostsForModeration = async () => {
  return Post.find()
    .populate("autor", "nombre email rol")
    .sort({ createdAt: -1 });
};

const getCommentsForModeration = async () => {
  return Comment.find()
    .populate("autor", "nombre email rol")
    .populate("post", "titulo")
    .sort({ createdAt: -1 });
};

module.exports = {
  getStats,
  getPostsForModeration,
  getCommentsForModeration,
};

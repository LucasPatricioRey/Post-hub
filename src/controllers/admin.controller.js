const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const asyncHandler = require("../utils/asyncHandler");

const getAdminStats = asyncHandler(async (req, res) => {
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

  res.status(200).json({
    message: "Estadísticas de administración obtenidas correctamente",
    stats: {
      totalUsuarios,
      totalPosteos,
      totalComentarios,
      posteosPorUsuario,
    },
  });
});

const getPostsForModeration = asyncHandler(async (req, res) => {
  const posts = await Post.find()
    .populate("autor", "nombre email rol")
    .sort({ createdAt: -1 });

  res.status(200).json({
    message: "Posteos para moderación obtenidos correctamente",
    total: posts.length,
    posts,
  });
});

const getCommentsForModeration = asyncHandler(async (req, res) => {
  const comments = await Comment.find()
    .populate("autor", "nombre email rol")
    .populate("post", "titulo")
    .sort({ createdAt: -1 });

  res.status(200).json({
    message: "Comentarios para moderación obtenidos correctamente",
    total: comments.length,
    comments,
  });
});

module.exports = {
  getAdminStats,
  getPostsForModeration,
  getCommentsForModeration,
};
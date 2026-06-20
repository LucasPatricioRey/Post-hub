const asyncHandler = require("../utils/asyncHandler");
const adminService = require("../services/admin.service");

const getAdminStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getStats();

  res.status(200).json({
    message: "Estadísticas de administración obtenidas correctamente",
    stats,
  });
});

const getPostsForModeration = asyncHandler(async (req, res) => {
  const posts = await adminService.getPostsForModeration();

  res.status(200).json({
    message: "Posteos para moderación obtenidos correctamente",
    total: posts.length,
    posts,
  });
});

const getCommentsForModeration = asyncHandler(async (req, res) => {
  const comments = await adminService.getCommentsForModeration();

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

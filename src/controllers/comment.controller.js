const asyncHandler = require("../utils/asyncHandler");
const commentService = require("../services/comment.service");

const createComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { contenido } = req.body;

  const comment = await commentService.createComment(
    postId,
    contenido,
    req.user._id
  );

  res.status(201).json({
    message: "Comentario creado correctamente",
    comment,
  });
});

const getCommentsByPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const comments = await commentService.getCommentsByPost(postId);

  res.status(200).json({
    message: "Comentarios obtenidos correctamente",
    total: comments.length,
    comments,
  });
});

const updateComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { contenido } = req.body;

  const comment = await commentService.updateComment(
    id,
    contenido,
    req.user._id
  );

  res.status(200).json({
    message: "Comentario actualizado correctamente",
    comment,
  });
});

const deleteComment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await commentService.deleteComment(id, req.user);

  res.status(200).json({
    message: "Comentario eliminado correctamente",
  });
});

module.exports = {
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
};

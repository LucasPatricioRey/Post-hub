const asyncHandler = require("../utils/asyncHandler");
const postService = require("../services/post.service");

const createPost = asyncHandler(async (req, res) => {
  const { titulo, contenido } = req.body;

  const post = await postService.createPost({
    titulo,
    contenido,
    file: req.file,
    autorId: req.user._id,
  });

  res.status(201).json({
    message: "Posteo creado correctamente",
    post,
  });
});

const getPosts = asyncHandler(async (req, res) => {
  const posts = await postService.getAllPosts();

  res.status(200).json({
    message: "Posteos obtenidos correctamente",
    total: posts.length,
    posts,
  });
});

const getPostById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const post = await postService.getPostById(id);

  res.status(200).json({
    message: "Posteo obtenido correctamente",
    post,
  });
});

const updatePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { titulo, contenido, imagen } = req.body;

  const post = await postService.updatePost(
    id,
    { titulo, contenido, imagen },
    req.user._id
  );

  res.status(200).json({
    message: "Posteo actualizado correctamente",
    post,
  });
});

const deletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await postService.deletePost(id, req.user);

  res.status(200).json({
    message: "Posteo eliminado correctamente",
  });
});

module.exports = {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
};

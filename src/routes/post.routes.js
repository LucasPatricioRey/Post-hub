const express = require("express");
const {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
} = require("../controllers/post.controller");

const { downloadPostPdf } = require("../controllers/pdf.controller");
const { protect } = require("../middlewares/auth.middleware");
const uploadImage = require("../middlewares/upload.middleware");

const router = express.Router();

router.post("/", protect, uploadImage.single("imagen"), createPost);
router.get("/", getPosts);

router.get("/:id/pdf", downloadPostPdf);

router.get("/:id", getPostById);
router.put("/:id", protect, updatePost);
router.delete("/:id", protect, deletePost);


module.exports = router;
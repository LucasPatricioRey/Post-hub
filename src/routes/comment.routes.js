const express = require("express");
const {
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
} = require("../controllers/comment.controller");

const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/posts/:postId/comments", protect, createComment);
router.get("/posts/:postId/comments", getCommentsByPost);

router.put("/comments/:id", protect, updateComment);
router.delete("/comments/:id", protect, deleteComment);

module.exports = router;
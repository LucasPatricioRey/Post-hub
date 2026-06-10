const express = require("express");
const {
  getAdminStats,
  getPostsForModeration,
  getCommentsForModeration,
} = require("../controllers/admin.controller");

const { protect } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");

const router = express.Router();

router.get("/stats", protect, authorizeRoles("admin"), getAdminStats);
router.get("/posts", protect, authorizeRoles("admin"), getPostsForModeration);
router.get(
  "/comments",
  protect,
  authorizeRoles("admin"),
  getCommentsForModeration
);

module.exports = router;
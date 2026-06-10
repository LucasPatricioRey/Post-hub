const express = require("express");
const {
  registerUser,
  loginUser,
  getMe,
  adminTest,
} = require("../controllers/auth.controller");

const { protect } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);
router.get("/admin-test", protect, authorizeRoles("admin"), adminTest);

module.exports = router;
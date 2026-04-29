const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const {
  getUsersController,
  userRoleController,
  userDeleteController,
} = require("../controllers/usersController");

const router = express.Router();

router.get("/", authMiddleware, adminMiddleware, getUsersController);
router.put(
  "/toggle-role/:id",
  authMiddleware,
  adminMiddleware,
  userRoleController,
);
router.delete("/:id", authMiddleware, adminMiddleware, userDeleteController);

module.exports = router;

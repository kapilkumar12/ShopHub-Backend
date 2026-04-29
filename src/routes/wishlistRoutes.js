const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");

const {
  toggleWishlistController,
  getUserWishlistController,
  checkWishlistController
} = require("../controllers/wishlistController");

const router = express.Router();

router.post("/toggle", authMiddleware, toggleWishlistController);
router.get("/", authMiddleware, getUserWishlistController);
router.get("/check/:productId", authMiddleware, checkWishlistController);

module.exports = router;
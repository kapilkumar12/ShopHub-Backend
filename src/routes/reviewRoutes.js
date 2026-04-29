const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");

const {
  addOrUpdateReviewController,
  getProductReviewsController,
  deleteReviewController
} = require("../controllers/reviewController");

const router = express.Router();

router.post("/", authMiddleware, addOrUpdateReviewController);
router.get("/:productId", getProductReviewsController);
router.delete("/:reviewId", authMiddleware, deleteReviewController);

module.exports = router;
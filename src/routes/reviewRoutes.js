const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const reviewLimiter = require("../middlewares/reviewSpamControl")
const reviewSpamControl = require("../middlewares/reviewSpamControl")

const {
  addOrUpdateReviewController,
  getProductReviewsController,
  deleteReviewController,
  getAllReviewsController
} = require("../controllers/reviewController");

const router = express.Router();

router.get("/", getAllReviewsController);
router.post("/add", authMiddleware, reviewLimiter, reviewSpamControl, addOrUpdateReviewController);
router.get("/:productId", getProductReviewsController);
router.delete("/:reviewId", authMiddleware, deleteReviewController);

module.exports = router;
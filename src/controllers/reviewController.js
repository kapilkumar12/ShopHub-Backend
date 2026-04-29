const reviewModel = require("../models/reviewModel");
const productModel = require("../models/productModel");

async function addOrUpdateReviewController(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const { productId, rating, comment } = req.body;

    if (!rating) {
      return res.status(400).json({
        message: "Rating is required",
      });
    }

    let review = await reviewModel.findOne({
      user: userId,
      product: productId,
    });

    if (review) {
      review.rating = rating;
      review.comment = comment;
      await review.save();
    } else {
      review = await reviewModel.create({
        user: userId,
        product: productId,
        rating,
        comment,
      });
    }

    const stats = await reviewModel.aggregate([
      { $match: { product: review.product } },
      {
        $group: {
          _id: "$product",
          avgRating: { $avg: "$rating" },
          total: { $sum: 1 },
        },
      },
    ]);

    await productModel.findByIdAndUpdate(productId, {
      averageRating: stats[0]?.avgRating || 0,
      totalReviews: stats[0]?.total || 0,
    });

    res.status(200).json({
      message: "Review submitted successfully",
      review,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Review failed",
      error: error.message,
    });
  }
}

// GET PRODUCT REVIEWS

async function getProductReviewsController(req, res) {
  try {
    const { productId } = req.params;

    const reviews = await reviewModel
      .find({ product: productId })
      .populate("user", "name");

    res.status(200).json({
      message: "Reviews fetched",
      reviewCount: reviews.length,
      reviews,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
}

// DELETE REVIEW

async function deleteReviewController(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const { reviewId } = req.params;

    const review = await reviewModel.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        message: "Review not found",
      });
    }

    if (review.user.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    await review.deleteOne();

    const stats = await reviewModel.aggregate([
      { $match: { product: review.product } },
      {
        $group: {
          _id: "$product",
          avgRating: { $avg: "$rating" },
          total: { $sum: 1 },
        },
      },
    ]);

    await productModel.findByIdAndUpdate(review.product, {
      averageRating: stats[0]?.avgRating || 0,
      totalReviews: stats[0]?.total || 0,
    });

    res.status(200).json({
      message: "Review deleted",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Delete failed",
      error: error.message,
    });
  }
}

module.exports = {
  addOrUpdateReviewController,
  getProductReviewsController,
  deleteReviewController,
};

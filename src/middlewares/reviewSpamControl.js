const reviewModel = require("../models/reviewModel");

const bannedWords = ["spam", "fake", "test"];

const reviewSpamControl = async (req, res, next) => {
  try {
    const { comment, productId } = req.body;
    const userId = req.user._id;

    // ❌ Basic validation
    if (!comment || !productId) {
      return res.status(400).json({
        message: "Comment and productId required",
      });
    }

    // 🚫 1. BANNED WORD CHECK
    if (
      bannedWords.some((word) =>
        comment.toLowerCase().includes(word)
      )
    ) {
      return res.status(400).json({
        message: "Invalid review content",
      });
    }

    // ⏱️ 2. TIME GAP CHECK (1 min)
    const lastReview = await reviewModel
      .findOne({ user: userId })
      .sort({ createdAt: -1 });

    if (lastReview) {
      const diff =
        Date.now() - new Date(lastReview.createdAt).getTime();

      if (diff < 60 * 1000) {
        return res.status(429).json({
          message: "Wait 1 minute before posting another review",
        });
      }
    }

    // 📅 3. DAILY LIMIT (max 3)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayReviewsCount = await reviewModel.countDocuments({
      user: userId,
      createdAt: { $gte: startOfDay },
    });

    if (todayReviewsCount >= 3) {
      return res.status(429).json({
        message: "Daily review limit reached (max 3)",
      });
    }

    // 🔁 4. ONE REVIEW PER PRODUCT
    const existingReview = await reviewModel.findOne({
      user: userId,
      product: productId,
    });

    if (existingReview) {
      return res.status(400).json({
        message: "You already reviewed this product",
      });
    }

    // ✅ All checks passed
    next();

  } catch (error) {
    return res.status(500).json({
      message: "Spam check failed",
      error: error.message,
    });
  }
};

module.exports = reviewSpamControl;
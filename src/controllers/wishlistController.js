const wishlistModel = require("../models/wishlistModel");
const productModel = require("../models/productModel");
const mongoose = require("mongoose");

// toggle wishlist controller

async function toggleWishlistController(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        message: "productId is required",
      });
    }

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const existing = await wishlistModel.findOne({
      user: userId,
      product: productId,
    });

    if (existing) {
      await wishlistModel.deleteOne({ _id: existing._id });

      await productModel.updateOne(
        { _id: productId, wishlistCount: { $gt: 0 } },
        { $inc: { wishlistCount: -1 } },
      );

      return res.status(200).json({
        message: "Removed from wishlist",
        wishlisted: false,
      });
    }

    await wishlistModel.create({
      user: userId,
      product: productId,
    });

    await productModel.updateOne(
      { _id: productId },
      { $inc: { wishlistCount: 1 } },
    );

    res.status(200).json({
      message: "Added to wishlist",
      wishlisted: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Wishlist toggle failed",
      error: error.message,
    });
  }
}

// GET USER WISHLIST

async function getUserWishlistController(req, res) {
  try {
    const userId = req.user._id || req.user.id;

    const wishlist = await wishlistModel
      .find({ user: userId })
      .populate("product")
      .lean();

    res.status(200).json({
      message: "Wishlist fetched",
      products: wishlist.map((item) => item.product),
      count: wishlist.length,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch wishlist",
      error: error.message,
    });
  }
}

// CHECK SINGLE PRODUCT (❤️ filled or not)

async function checkWishlistController(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const { productId } = req.params;

    const exists = await wishlistModel.exists({
      user: userId,
      product: productId,
    });

    res.status(200).json({
      wishlisted: !!exists,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to check wishlist",
      error: error.message,
    });
  }
}

module.exports = {
  toggleWishlistController,
  getUserWishlistController,
  checkWishlistController,
};

const productModel = require("../models/productModel");

async function getAllAnalyticsController(req, res) {
  try {
    // 🔥 Parallel queries (fast)
    const [
      wishlistResult,
      viewsResult,
      salesResult,
      topWishlist,
      topViewed,
      topSelling
    ] = await Promise.all([

      // ❤️ total wishlist
      productModel.aggregate([
        {
          $group: {
            _id: null,
            totalWishlist: { $sum: "$wishlistCount" },
          },
        },
      ]),

      // 👁️ total views
      productModel.aggregate([
        {
          $group: {
            _id: null,
            totalViews: { $sum: "$views" },
          },
        },
      ]),

      // 🔥 total sales
      productModel.aggregate([
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$soldCount" },
          },
        },
      ]),

      // ❤️ top wishlist
      productModel
        .find()
        .sort({ wishlistCount: -1 })
        .limit(5)
        .select("name wishlistCount image"),

      // 👁️ top viewed
      productModel
        .find()
        .sort({ views: -1 })
        .limit(5)
        .select("name views image"),

      // 🔥 top selling
      productModel
        .find()
        .sort({ soldCount: -1 })
        .limit(5)
        .select("name soldCount image"),
    ]);

    res.status(200).json({
      // totals
      totalWishlist: wishlistResult[0]?.totalWishlist || 0,
      totalViews: viewsResult[0]?.totalViews || 0,
      totalSales: salesResult[0]?.totalSales || 0,

      // top lists
      topWishlist,
      topViewed,
      topSelling,
    });

  } catch (error) {
    res.status(500).json({
      message: "Analytics fetch failed",
      error: error.message,
    });
  }
}

module.exports = { getAllAnalyticsController };
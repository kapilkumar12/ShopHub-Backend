const orderModel = require("../models/orderModel");
const productModel = require("../models/productModel");

async function getAdminDashboardController(req, res) {
  try {
    //////////////////////////////////////////////////////////////
    // 🔥 ORDER STATS
    //////////////////////////////////////////////////////////////

    const totalOrders = await orderModel.countDocuments();

    const pendingOrders = await orderModel.countDocuments({
      status: "pending",
    });

    const cancelledOrders = await orderModel.countDocuments({
      status: "cancelled",
    });

    const revenueResult = await orderModel.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    //////////////////////////////////////////////////////////////
    // 🔥 SALES (DAILY / WEEKLY / MONTHLY)
    //////////////////////////////////////////////////////////////

    const dailySales = await orderModel.aggregate([
      {
        $group: {
          _id: { $dayOfMonth: "$createdAt" },
          total: { $sum: "$totalPrice" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const monthlySales = await orderModel.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          total: { $sum: "$totalPrice" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const weeklySales = await orderModel.aggregate([
      {
        $group: {
          _id: { $week: "$createdAt" },
          total: { $sum: "$totalPrice" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    //////////////////////////////////////////////////////////////
    // 🔥 PRODUCT ANALYTICS
    //////////////////////////////////////////////////////////////

    const totals = await productModel.aggregate([
      {
        $group: {
          _id: null,
          totalWishlist: { $sum: "$wishlistCount" },
          totalViews: { $sum: "$views" },
          totalSales: { $sum: "$soldCount" },
        },
      },
    ]);

    const stats = totals[0] || {
      totalWishlist: 0,
      totalViews: 0,
      totalSales: 0,
    };

    const topWishlist = await productModel
      .find()
      .sort({ wishlistCount: -1 })
      .limit(5);

    const topViewed = await productModel.find().sort({ views: -1 }).limit(5);

    const topSelling = await productModel
      .find()
      .sort({ soldCount: -1 })
      .limit(5);

    //////////////////////////////////////////////////////////////
    // 🔥 RECENT ORDERS
    //////////////////////////////////////////////////////////////

    const recentOrders = await orderModel
      .find()
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    //////////////////////////////////////////////////////////////

    res.json({
      // orders
      totalOrders,
      pendingOrders,
      cancelledOrders,
      totalRevenue,

      // sales
      dailySales,
      monthlySales,
      weeklySales,

      // product analytics
      stats,
      topWishlist,
      topViewed,
      topSelling,

      // orders list
      recentOrders,
    });
  } catch (error) {
    res.status(500).json({
      message: "Dashboard failed",
      error: error.message,
    });
  }
}

// Orders Filter API

async function getFilteredOrders(req, res) {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only access" });
    }

    let {
      status,
      startDate,
      endDate,
      search,
      category,
      page = 1,
      limit = 20,
    } = req.query;

    page = Math.max(1, Number(page));
    limit = Math.min(50, Number(limit)); // max 50 limit

    const skip = (page - 1) * limit;

    let filter = {};

    // 📦 Status filter
    if (status) {
      filter.status = status;
    }

    // 📅 Date filter
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const matchStage = {
      ...filter,
      ...(search
        ? {
            $or: [
              { "user.name": { $regex: search, $options: "i" } },
              { "user.email": { $regex: search, $options: "i" } },
            ],
          }
        : {}),
      ...(category
        ? {
            "products.category": category,
          }
        : {}),
    };

    const pipeline = [
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },

      // 🔥 join products
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "products",
        },
      },

      { $match: matchStage },

      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    const orders = await orderModel.aggregate(pipeline);

    const totalData = await orderModel.aggregate([
      ...pipeline.slice(0, -3), // remove skip/limit
      { $count: "total" },
    ]);

    const total = totalData[0]?.total || 0;

    res.status(200).json({
      total,
      page,
      totalPages: Math.ceil(total / limit),
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Fetch orders failed",
      error: error.message,
    });
  }
}

// Products Filter API

async function getFilteredProducts(req, res) {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only access" });
    }

    let {
      search,
      category,
      sort,
      minPrice,
      maxPrice,
      page = 1,
      limit = 5,
    } = req.query;

    page = Math.max(1, Number(page));
    limit = Math.min(50, Number(limit));

    const skip = (page - 1) * limit;

    let filter = {};

    // 🔍 SEARCH
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    // 📦 CATEGORY
    if (category) {
      filter.category = category;
    }

    // 💰 PRICE
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // 🔄 SORT
    let sortOption = { createdAt: -1 };

    if (sort === "price_asc") sortOption = { price: 1 };
    if (sort === "price_desc") sortOption = { price: -1 };
    if (sort === "latest") sortOption = { createdAt: -1 };

    const products = await productModel
      .find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const total = await productModel.countDocuments(filter);
    const categories = await productModel.distinct("category");

    res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      products,
      categories,
    });
  } catch (error) {
    res.status(500).json({
      message: "Fetch products failed",
      error: error.message,
    });
  }
}

module.exports = {
  getAdminDashboardController,
  getFilteredOrders,
  getFilteredProducts,
};

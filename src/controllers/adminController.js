const orderModel = require("../models/orderModel");
const productModel = require("../models/productModel");

async function getAdminDashboardController(req, res) {
  try {
    //////////////////////////////////////////////////////////////
    // 🔥 PARALLEL EXECUTION (FAST)
    //////////////////////////////////////////////////////////////

    const [
      orderStats,
      revenueResult,
      dailySales,
      monthlySales,
      weeklySales,
      productStats,
      topWishlist,
      topViewed,
      topSelling,
      recentOrders,
    ] = await Promise.all([
      ////////////////////////////////////////////////////////////
      // 📦 ORDER COUNTS
      ////////////////////////////////////////////////////////////

      orderModel.aggregate([
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            pendingOrders: {
              $sum: {
                $cond: [{ $eq: ["$status", "pending"] }, 1, 0],
              },
            },
            cancelledOrders: {
              $sum: {
                $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0],
              },
            },
          },
        },
      ]),

      ////////////////////////////////////////////////////////////
      // 💰 REVENUE
      ////////////////////////////////////////////////////////////

      orderModel.aggregate([
        {
          $match: {
            status: "delivered",
            paymentStatus: "paid",
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalPrice" },
          },
        },
      ]),

      ////////////////////////////////////////////////////////////
      // 📊 DAILY SALES
      ////////////////////////////////////////////////////////////

      orderModel.aggregate([
        { $match: { status: "delivered", paymentStatus: "paid" } },
        {
          $group: {
            _id: {
              day: { $dayOfMonth: "$createdAt" },
              month: { $month: "$createdAt" },
              year: { $year: "$createdAt" },
            },
            total: { $sum: "$totalPrice" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
      ]),

      ////////////////////////////////////////////////////////////
      // 📊 MONTHLY SALES
      ////////////////////////////////////////////////////////////

      orderModel.aggregate([
        { $match: { status: "delivered", paymentStatus: "paid" } },
        {
          $group: {
            _id: {
              month: { $month: "$createdAt" },
              year: { $year: "$createdAt" },
            },
            total: { $sum: "$totalPrice" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      ////////////////////////////////////////////////////////////
      // 📊 WEEKLY SALES
      ////////////////////////////////////////////////////////////

      orderModel.aggregate([
        { $match: { status: "delivered", paymentStatus: "paid" } },
        {
          $group: {
            _id: {
              week: { $isoWeek: "$createdAt" },
              year: { $isoWeekYear: "$createdAt" },
            },
            total: { $sum: "$totalPrice" },
          },
        },
        { $sort: { "_id.year": 1, "_id.week": 1 } },
      ]),

      ////////////////////////////////////////////////////////////
      // 📦 PRODUCT STATS
      ////////////////////////////////////////////////////////////

      productModel.aggregate([
        {
          $group: {
            _id: null,
            totalWishlist: { $sum: "$wishlistCount" },
            totalViews: { $sum: "$views" },
            totalSales: { $sum: "$salesCount" }, // ✅ FIXED
          },
        },
      ]),

      ////////////////////////////////////////////////////////////
      // 🔥 TOP PRODUCTS
      ////////////////////////////////////////////////////////////

      productModel.find().sort({ wishlistCount: -1 }).limit(5),
      productModel.find().sort({ views: -1 }).limit(5),
      productModel.find().sort({ salesCount: -1 }).limit(5), // ✅ FIXED

      ////////////////////////////////////////////////////////////
      // 🕒 RECENT ORDERS
      ////////////////////////////////////////////////////////////

      orderModel
        .find()
        .populate("user", "name")
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    //////////////////////////////////////////////////////////////
    // 🧠 FINAL RESPONSE
    //////////////////////////////////////////////////////////////

    const orderData = orderStats[0] || {};
    const revenueData = revenueResult[0] || {};
    const productData = productStats[0] || {};

    res.json({
      // orders
      totalOrders: orderData.totalOrders || 0,
      pendingOrders: orderData.pendingOrders || 0,
      cancelledOrders: orderData.cancelledOrders || 0,
      totalRevenue: revenueData.totalRevenue || 0,

      // sales
      dailySales,
      monthlySales,
      weeklySales,

      // product
      stats: productData,

      topWishlist,
      topViewed,
      topSelling,

      // recent
      recentOrders,
    });
  } catch (error) {
    console.error("Dashboard Error:", error.message);
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
      minPrice,
      maxPrice,
      sort,
      page = 1,
      limit = 20,
    } = req.query;

    page = Math.max(1, Number(page));
    limit = Math.min(50, Number(limit));
    const skip = (page - 1) * limit;

    let filter = {};

    // 📦 STATUS
    if (status) {
      filter.status = status;
    }

    // 📅 DATE
    if (startDate && endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: end,
      };
    }

    // 📦 CATEGORY (from items)
    if (category || minPrice || maxPrice) {
      filter.items = {
        $elemMatch: {
          ...(category && {
            category: { $regex: `^${category}$`, $options: "i" },
          }),
          ...(minPrice && { price: { $gte: Number(minPrice) } }),
          ...(maxPrice && { price: { $lte: Number(maxPrice) } }),
        },
      };
    }

    let sortOption = { createdAt: -1 };

    if (sort === "price_asc") sortOption = { totalPrice: 1 };
    if (sort === "price_desc") sortOption = { totalPrice: -1 };
    if (sort === "latest") sortOption = { createdAt: -1 };

    // 🔥 MAIN QUERY
    const orders = await orderModel
      .find(filter)
      .populate("user", "name email")
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    if (search) {
      const keyword = search.toLowerCase();

      orders = orders.filter((o) => {
        const name = o.user?.name?.toLowerCase() || "";
        const email = o.user?.email?.toLowerCase() || "";

        return name.includes(keyword) || email.includes(keyword);
      });
    }

    // 🔢 TOTAL COUNT
    const total = await orderModel.countDocuments(filter);

    const categories = await orderModel.distinct("items.category");

    res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      orders,
      categories,
    });
  } catch (error) {
    res.status(500).json({
      message: "Fetch orders failed",
      error: error.message,
    });
  }
}

// Products Filter API

async function getFilteredProducts(req, res) {
  try {

    let {
      search = "",
      category = "",
      sort = "",
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
    } = req.query;

    page = Math.max(1, Number(page));
    limit = Math.min(50, Number(limit));

    const skip = (page - 1) * limit;

    let filter = {};

    // 🔍 SEARCH
    const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    if (search && search.trim() !== "") {
      const keyword = escapeRegex(search);

      filter.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
        { category: { $regex: keyword, $options: "i" } },
      ];
    }

    // 📦 CATEGORY
    if (category) {
      filter.category = { $regex: `^${category}$`, $options: "i" };
    }

    // 💰 PRICE
    if (minPrice || maxPrice) {
      filter.sellingPrice = {
        ...(minPrice && { $gte: Number(minPrice) }),
        ...(maxPrice && { $lte: Number(maxPrice) }),
      };
    }

    // 🔄 SORT
    let sortOption = { createdAt: -1 };

    if (sort === "price_asc") sortOption = { finalPrice: 1 };
    if (sort === "price_desc") sortOption = { finalPrice: -1 };
    if (sort === "latest") sortOption = { createdAt: -1 };

    const [products, total] = await Promise.all([
      productModel.find(filter).sort(sortOption).skip(skip).limit(limit),

      productModel.countDocuments(filter),
    ]);

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
